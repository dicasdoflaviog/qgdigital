import { useState, useRef, useEffect } from "react";
import { Camera, X, Loader2, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

const MAX_PHOTOS = 3;
const MAX_SIZE_MB = 0.8;
const MAX_WIDTH_PX = 1920;

interface PhotoCaptureProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

async function getGeoLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!("geolocation" in navigator)) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

export function PhotoCapture({ photos, onPhotosChange, disabled, onUploadingChange }: PhotoCaptureProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobile = isMobile();

  // Notify parent of uploading state
  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast({ title: "Limite atingido", description: `Máximo de ${MAX_PHOTOS} arquivos.`, variant: "destructive" });
      return;
    }

    const toProcess = files.slice(0, remaining);
    setUploading(true);

    let coords: { lat: number; lng: number } | null = null;
    if (mobile) {
      coords = await getGeoLocation();
    }

    try {
      const urls: string[] = [];
      for (const file of toProcess) {
        const isImage = file.type.startsWith("image/");
        let uploadFile: File | Blob = file;
        let contentType = file.type || "application/octet-stream";

        if (isImage) {
          try {
            uploadFile = await imageCompression(file, {
              maxSizeMB: MAX_SIZE_MB,
              maxWidthOrHeight: MAX_WIDTH_PX,
              useWebWorker: true,
            });
            contentType = "image/jpeg";
          } catch {
            toast({ title: "Erro na compressão", description: "Usando imagem original.", variant: "destructive" });
            // Continue with original file
          }
        }

        const ext = isImage ? "jpg" : file.name.split(".").pop() || "bin";
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = coords
          ? `demandas/${fileName}__geo_${coords.lat}_${coords.lng}`
          : `demandas/${fileName}`;

        const { data, error } = await supabase.storage
          .from("demandas-fotos")
          .upload(path, uploadFile, { contentType });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("demandas-fotos")
          .getPublicUrl(data.path);

        urls.push(urlData.publicUrl);
      }

      onPhotosChange([...photos, ...urls]);
      const gpsMsg = coords ? ` 📍 GPS registrado` : "";
      toast({ title: `${urls.length} arquivo(s) adicionado(s) 📸${gpsMsg}` });
    } catch (err: any) {
      toast({
        title: "Erro no upload",
        description: err?.message || "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const isPdf = (url: string) => url.toLowerCase().includes(".pdf");

  return (
    <div className="space-y-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-bold uppercase tracking-wider min-h-[44px]"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || photos.length >= MAX_PHOTOS}
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
          ) : (
            <><Camera className="h-4 w-4" /> {mobile ? "Câmera" : "Anexar"} ({photos.length}/{MAX_PHOTOS})</>
          )}
        </Button>
        {mobile && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <MapPin className="h-3 w-3" /> GPS auto
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={mobile ? "image/*" : "image/*,.pdf"}
          capture={mobile ? "environment" : undefined}
          multiple
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((url, i) => (
            <div key={i} className="relative shrink-0 group">
              {isPdf(url) ? (
                <div className="w-20 h-20 flex flex-col items-center justify-center rounded-2xl border border-border bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground mt-1">PDF</span>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  loading="lazy"
                  className="w-20 h-20 object-cover rounded-2xl border border-border"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
