import { useState, useEffect } from "react";
import { useGlobalConfig } from "@/hooks/useGlobalConfig";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload, Image, MapPin, Phone, Building, Loader2, Save, Trash2 } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function LayoutConfigPanel() {
  const { config, isLoading, updateConfig } = useGlobalConfig();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nome_instituicao: "",
    endereco_rodape_global: "",
    telefone_rodape_global: "",
  });

  useEffect(() => {
    if (config) {
      setForm({
        nome_instituicao: config.nome_instituicao || "",
        endereco_rodape_global: config.endereco_rodape_global || "",
        telefone_rodape_global: config.telefone_rodape_global || "",
      });
      setLogoPreview(config.logo_institucional_url || null);
    }
  }, [config]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo-institucional-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("institucional")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("institucional")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;
      setLogoPreview(publicUrl);

      await updateConfig.mutateAsync({ logo_institucional_url: publicUrl });
      toast.success("Logo institucional atualizada!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    await updateConfig.mutateAsync({ logo_institucional_url: null });
    setLogoPreview(null);
    toast.success("Logo removida");
  };

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        nome_instituicao: form.nome_instituicao || null,
        endereco_rodape_global: form.endereco_rodape_global || null,
        telefone_rodape_global: form.telefone_rodape_global || null,
      });
      toast.success("Configurações de layout salvas!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err?.message || ""));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium uppercase tracking-tight">Configurações de Layout Global</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina a identidade institucional que será herdada por todos os gabinetes da plataforma.
        </p>
      </div>

      {/* Logo Institucional */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Image className="h-4 w-4 text-qg-blue-500" /> Logo Institucional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Esta logo será usada como fallback nos ofícios PDF quando o gabinete não tiver logo própria.
            Prioridade: 1º Logo do Gabinete → 2º Logo Institucional → 3º Texto fallback.
          </p>

          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo Institucional"
                  className="h-20 w-20 rounded-xl object-contain border border-border bg-muted/30 p-1"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveLogo}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
                <Building className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}

            <div>
              <Label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-qg-blue-500/10 text-qg-blue-600 dark:text-qg-blue-400 text-xs font-medium cursor-pointer hover:bg-qg-blue-500/20 transition-colors"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {uploading ? "Enviando..." : "Enviar Logo"}
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <p className="text-[10px] text-muted-foreground mt-1">PNG ou JPG, max 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Dados do Rodapé Global */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-qg-blue-500" /> Rodapé Global dos Ofícios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Estes dados aparecerão no rodapé de <strong>todos os ofícios</strong> gerados na plataforma,
            independente do gabinete. A assinatura "{BRAND.footerCredit}" permanece fixa ao final.
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="nome-inst" className="text-xs font-medium text-muted-foreground">
                Nome da Instituição
              </Label>
              <Input
                id="nome-inst"
                placeholder="Ex: Câmara Municipal de Teixeira de Freitas"
                value={form.nome_instituicao}
                onChange={(e) => setForm({ ...form, nome_instituicao: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endereco-global" className="text-xs font-medium text-muted-foreground">
                Endereço Institucional
              </Label>
              <Input
                id="endereco-global"
                placeholder="Ex: Av. Principal, 100 - Centro, Teixeira de Freitas - BA"
                value={form.endereco_rodape_global}
                onChange={(e) => setForm({ ...form, endereco_rodape_global: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tel-global" className="text-xs font-medium text-muted-foreground">
                Telefone Institucional
              </Label>
              <Input
                id="tel-global"
                placeholder="Ex: (73) 3011-0000"
                value={form.telefone_rodape_global}
                onChange={(e) => setForm({ ...form, telefone_rodape_global: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateConfig.isPending}
            className="w-full gap-2 font-medium"
          >
            {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Configurações de Layout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
