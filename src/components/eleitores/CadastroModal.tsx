import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BAIRROS } from "@/data/mockData";
import { Plus, Loader2, AlertTriangle, Crown, Sparkles, CloudOff, Building2, User, MapPin, Navigation } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateVoter } from "@/hooks/useVoters";
import { useCreateInstituicao } from "@/hooks/useInstituicoes";
import { useCreateDemanda } from "@/hooks/useCreateDemanda";
import { categorizeDemanda } from "@/lib/categorizeDemanda";
import { supabase } from "@/integrations/supabase/client";
import { geocodeAddress, reverseGeocode, getCurrentPosition } from "@/lib/geocode";
import { VoiceInput } from "./VoiceInput";
import { PhotoCapture } from "./PhotoCapture";
import { savePending } from "@/lib/offlineQueue";
import { useOffline } from "@/contexts/OfflineContext";
import { useAuth } from "@/contexts/AuthContext";

function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function rawDigits(masked: string): string {
  return masked.replace(/\D/g, "");
}

interface CadastroModalProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  fullWidth?: boolean;
}

const TIPOS_INST = ["Igreja", "Associação", "Escola", "ONG", "Órgão Público", "Outros"];

export function CadastroModal({ externalOpen, onExternalOpenChange, hideTrigger, fullWidth }: CadastroModalProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;
  const { user } = useAuth();
  const [mode, setMode] = useState<"pf" | "inst">("pf");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bairro, setBairro] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "O" | "">("");
  const [situacao, setSituacao] = useState("");
  const [isLeader, setIsLeader] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gpsLat, setGpsLat] = useState<number | undefined>();
  const [gpsLng, setGpsLng] = useState<number | undefined>();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAddress, setGpsAddress] = useState("");
  const [gpsBairro, setGpsBairro] = useState("");

  // Institution-specific fields
  const [instTipo, setInstTipo] = useState("Associação");
  const [instCnpj, setInstCnpj] = useState("");
  const [instResponsavel, setInstResponsavel] = useState("");
  const [instContato, setInstContato] = useState("");

  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);
  const [checkingDup, setCheckingDup] = useState(false);

  const createVoter = useCreateVoter();
  const createInst = useCreateInstituicao();
  const createDemanda = useCreateDemanda();
  const { refreshCount } = useOffline();

  const isBusy = createVoter.isPending || createInst.isPending || createDemanda.isPending || uploading || processingVoice;

  const checkDuplicate = useCallback(async (digits: string) => {
    if (digits.length < 10) {
      setDuplicateMsg(null);
      return;
    }
    setCheckingDup(true);
    try {
      const { data } = await supabase
        .from("eleitores")
        .select("id, nome")
        .eq("whatsapp", digits)
        .limit(1);
      if (data && data.length > 0) {
        setDuplicateMsg(`Atenção: "${data[0].nome}" já foi cadastrado com este número!`);
      } else {
        setDuplicateMsg(null);
      }
    } catch {
      setDuplicateMsg(null);
    } finally {
      setCheckingDup(false);
    }
  }, []);

  useEffect(() => {
    const digits = rawDigits(whatsapp);
    const timer = setTimeout(() => checkDuplicate(digits), 500);
    return () => clearTimeout(timer);
  }, [whatsapp, checkDuplicate]);

  const resetForm = () => {
    setNome("");
    setWhatsapp("");
    setBairro("");
    setDataNascimento("");
    setSexo("");
    setSituacao("");
    setIsLeader(false);
    setDuplicateMsg(null);
    setVoiceTranscript("");
    setPhotos([]);
    setSubmitted(false);
    setMode("pf");
    setInstTipo("Associação");
    setInstCnpj("");
    setInstResponsavel("");
    setInstContato("");
    setGpsLat(undefined);
    setGpsLng(undefined);
    setGpsAddress("");
    setGpsBairro("");
  };

  const handleGpsCapture = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      setGpsLat(pos.lat);
      setGpsLng(pos.lng);

      // Reverse geocode to fill bairro
      const addr = await reverseGeocode(pos.lat, pos.lng);
      if (addr) {
        const displayParts = [addr.rua, addr.bairro, addr.cidade].filter(Boolean);
        setGpsAddress(displayParts.join(" — "));

      // Try to match bairro from the list, or add it as custom option
        if (addr.bairro) {
          const match = BAIRROS.find(
            (b) => b.toLowerCase() === addr.bairro.toLowerCase() ||
                   b.toLowerCase().includes(addr.bairro.toLowerCase()) ||
                   addr.bairro.toLowerCase().includes(b.toLowerCase())
          );
          if (match) {
            setBairro(match);
          } else {
            // Add GPS bairro as a custom option and select it
            setGpsBairro(addr.bairro);
            setBairro(addr.bairro);
          }
        }

        toast({
          title: "Localização capturada",
          description: `${displayParts.join(", ")}`,
        });
      } else {
        toast({
          title: "Coordenadas salvas",
          description: `Lat: ${pos.lat.toFixed(6)}, Lng: ${pos.lng.toFixed(6)}. Bairro não identificado automaticamente.`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro no GPS",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setGpsLoading(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setVoiceTranscript(text);
    setSituacao(text);
  };

  const processWithAI = async () => {
    if (!situacao.trim()) {
      toast({ title: "Sem texto", description: "Grave uma mensagem de voz ou digite a situação primeiro.", variant: "destructive" });
      return;
    }

    setProcessingVoice(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-voice", {
        body: { transcription: situacao.trim() },
      });

      if (error) throw error;

      if (data.nome) setNome(data.nome);
      if (data.bairro) {
        const match = BAIRROS.find(
          (b) => b.toLowerCase() === data.bairro.toLowerCase() ||
                 b.toLowerCase().includes(data.bairro.toLowerCase()) ||
                 data.bairro.toLowerCase().includes(b.toLowerCase())
        );
        if (match) setBairro(match);
      }
      if (data.demanda) setSituacao(data.demanda);

      toast({
        title: "Dados extraídos pela IA ✨",
        description: `Prioridade: ${data.prioridade}/5. Confirme os campos antes de salvar.`,
      });
    } catch (err: any) {
      toast({
        title: "Erro ao processar voz",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessingVoice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Institution mode
    if (mode === "inst") {
      if (!nome.trim() || !bairro) {
        toast({ title: "Campos obrigatórios", description: "Preencha Nome e Bairro.", variant: "destructive" });
        return;
      }
      try {
        await createInst.mutateAsync({
          nome: nome.trim(),
          tipo: instTipo,
          cnpj: instCnpj || undefined,
          responsavel_nome: instResponsavel || undefined,
          responsavel_contato: instContato || undefined,
          bairro,
          historico_apoio: situacao.trim() || undefined,
          gabinete_id: user?.id ?? "",
        });
        toast({ title: "Instituição cadastrada! ✅", description: `${nome} foi adicionada.` });
        resetForm();
        setOpen(false);
      } catch (err: any) {
        toast({ title: "Erro ao cadastrar", description: err?.message || "Tente novamente.", variant: "destructive" });
      }
      return;
    }

    // PF mode (original logic)
    const digits = rawDigits(whatsapp);

    if (!nome.trim() || digits.length < 10 || !bairro) {
      toast({ title: "Campos obrigatórios", description: "Preencha Nome, WhatsApp e Bairro.", variant: "destructive" });
      return;
    }

    try {
      // Use GPS coords if available, otherwise geocode from bairro
      let lat: number | undefined = gpsLat;
      let lng: number | undefined = gpsLng;
      if (!lat || !lng) {
        try {
          const geo = await geocodeAddress(bairro, "Teixeira de Freitas", "BA");
          if (geo) {
            lat = geo.lat;
            lng = geo.lng;
          }
        } catch { /* geocode failure shouldn't block save */ }
      }

      const voter = await createVoter.mutateAsync({
        nome: nome.trim(),
        whatsapp: digits,
        bairro,
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        situacao: situacao.trim() || "Novo Cadastro",
        is_leader: isLeader,
        latitude: lat,
        longitude: lng,
      });

      // Create linked demanda if there's a description
      if (voter?.id && situacao.trim()) {
        const categoria = categorizeDemanda(situacao.trim());
        try {
          await createDemanda.mutateAsync({
            eleitor_id: voter.id,
            bairro,
            descricao: situacao.trim(),
            categoria,
            status: "Pendente",
            gabinete_id: user?.id ?? undefined,
          });
        } catch (demandaErr: any) {
          console.warn("Demanda não criada:", demandaErr?.message);
        }
      }

      if (photos.length > 0 && voter?.id) {
        try {
          await supabase
            .from("eleitores")
            .update({ image_urls: photos } as any)
            .eq("id", voter.id);
        } catch (photoErr: any) {
          toast({ title: "Eleitor salvo, mas erro nas fotos", description: photoErr?.message || "Tente editar o perfil.", variant: "destructive" });
        }
      }

      toast({ title: "Eleitor cadastrado! ✅", description: `${nome} foi adicionado com sucesso. Categoria da demanda: ${situacao.trim() ? categorizeDemanda(situacao.trim()) : "—"}` });

      const welcomeMsg = encodeURIComponent(`Olá ${nome.split(" ")[0]}, aqui é do gabinete do Vereador. É um prazer ter o seu contato! 🤝`);
      window.open(`https://wa.me/55${digits}?text=${welcomeMsg}`, "_blank");

      resetForm();
      setOpen(false);
    } catch (err: any) {
      if (!navigator.onLine || err?.message?.includes("fetch") || err?.message?.includes("network") || err?.message?.includes("Failed")) {
        try {
          await savePending({
            id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            nome: nome.trim(), whatsapp: digits, bairro,
            data_nascimento: dataNascimento || null,
            situacao: situacao.trim() || "Novo Cadastro",
            is_leader: isLeader, photos, createdAt: Date.now(),
          });
          refreshCount();
          toast({ title: "📱 Salvo offline!", description: "Será enviado automaticamente quando a conexão voltar." });
          resetForm();
          setOpen(false);
          return;
        } catch {
          // IndexedDB also failed
        }
      }

      toast({ title: "Erro ao cadastrar", description: err?.message || "Verifique sua conexão e tente novamente.", variant: "destructive" });
    }
  };

  // Validation helpers
  const nomeError = submitted && !nome.trim();
  const whatsappError = submitted && rawDigits(whatsapp).length < 10;
  const bairroError = submitted && !bairro;

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <Button className={`gap-2 min-h-[48px] font-medium text-sm ${fullWidth ? "w-full h-12" : ""}`}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo cadastro</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-safe">
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 mt-1" />
        <SheetHeader>
          <SheetTitle className="text-lg font-medium">Novo cadastro</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode toggle */}
          <div className="flex bg-muted rounded-full p-1 gap-1">
            <button
              type="button"
              onClick={() => setMode("pf")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-colors ${
                mode === "pf" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" /> Pessoa Física
            </button>
            <button
              type="button"
              onClick={() => setMode("inst")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-colors ${
                mode === "inst" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" /> Instituição
            </button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cad-nome" className="label-ui">Nome Completo *</Label>
            <Input
              id="cad-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome Completo"
              autoComplete="name"
              inputMode="text"
              className={`min-h-[44px] ${nomeError ? "border-destructive ring-1 ring-destructive" : ""}`}
              required
            />
            {nomeError && <p className="text-[11px] text-destructive font-medium">Nome é obrigatório</p>}
          </div>

          {mode === "pf" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="cad-whatsapp" className="label-ui">WhatsApp *</Label>
                <Input
                  id="cad-whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  placeholder="(73) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                  className={`min-h-[44px] ${whatsappError ? "border-destructive ring-1 ring-destructive" : ""}`}
                  required
                />
                {whatsappError && <p className="text-[11px] text-destructive font-medium">Informe um número com DDD</p>}
                {checkingDup && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Verificando...
                  </p>
                )}
                {duplicateMsg && (
                  <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {duplicateMsg}
                  </p>
                )}
              </div>
            </>
          )}

          {mode === "inst" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="label-ui">Tipo</Label>
                  <Select value={instTipo} onValueChange={setInstTipo}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_INST.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="label-ui">CNPJ</Label>
                  <Input value={instCnpj} onChange={(e) => setInstCnpj(e.target.value)} className="min-h-[44px]" placeholder="00.000.000/0001-00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="label-ui">Responsável</Label>
                  <Input value={instResponsavel} onChange={(e) => setInstResponsavel(e.target.value)} className="min-h-[44px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="label-ui">Contato</Label>
                  <Input value={instContato} onChange={(e) => setInstContato(e.target.value)} className="min-h-[44px]" placeholder="(73) 99999-9999" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="label-ui">Bairro *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-[10px] font-medium border-primary/30 text-primary hover:bg-primary/10"
                onClick={handleGpsCapture}
                disabled={gpsLoading || isBusy}
              >
                {gpsLoading ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Localizando...</>
                ) : (
                  <><Navigation className="h-3 w-3" /> Usar GPS</>
                )}
              </Button>
            </div>
            <Select value={bairro} onValueChange={setBairro} required>
              <SelectTrigger className={`min-h-[44px] ${bairroError ? "border-destructive ring-1 ring-destructive" : ""}`}>
                <SelectValue placeholder="Selecione o bairro" />
              </SelectTrigger>
              <SelectContent>
                {gpsBairro && !BAIRROS.includes(gpsBairro) && (
                  <SelectItem key={gpsBairro} value={gpsBairro}>📍 {gpsBairro} (GPS)</SelectItem>
                )}
                {BAIRROS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bairroError && <p className="text-[11px] text-destructive font-medium">Bairro é obrigatório</p>}
            {gpsAddress && (
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-medium text-foreground">{gpsAddress}</p>
                  {gpsLat && gpsLng && (
                    <p className="text-[10px] text-muted-foreground">
                      {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {mode === "pf" && (
            <div className="space-y-1.5">
              <Label htmlFor="cad-nascimento" className="label-ui">Data de Nascimento</Label>
              <Input id="cad-nascimento" type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="min-h-[44px]" />
            </div>
          )}

          {mode === "pf" && (
            <div className="space-y-1.5">
              <Label className="label-ui">Sexo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Select value={sexo} onValueChange={(v) => setSexo(v as "M" | "F" | "O" | "")}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="O">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cad-situacao" className="label-ui">{mode === "inst" ? "Observações / Histórico" : "Situação / Demanda"}</Label>
              <VoiceInput onTranscript={handleVoiceTranscript} disabled={isBusy} />
            </div>
            <Textarea
              id="cad-situacao"
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              placeholder={mode === "inst" ? "Histórico de apoio, observações..." : "Ex: Precisa de atendimento médico, rua sem asfalto... ou use o microfone 🎙️"}
              rows={3}
              className="min-h-[80px]"
            />
            {mode === "pf" && situacao.trim().length > 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                onClick={processWithAI}
                disabled={isBusy}
              >
                {processingVoice ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando com IA...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> Extrair dados com IA</>
                )}
              </Button>
            )}
          </div>

          {mode === "pf" && (
            <>
              <div className="space-y-1.5">
                <Label className="label-ui">Fotos da Demanda</Label>
                <PhotoCapture photos={photos} onPhotosChange={setPhotos} disabled={isBusy} onUploadingChange={setUploading} />
              </div>

              <div className="flex items-center justify-between border border-border p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-sm font-medium">É uma Liderança?</p>
                    <p className="text-xs text-muted-foreground">Contato influente na comunidade</p>
                  </div>
                </div>
                <Switch checked={isLeader} onCheckedChange={setIsLeader} />
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full min-h-[48px] text-sm font-medium rounded-full"
            disabled={isBusy || (mode === "pf" && !!duplicateMsg)}
          >
            {isBusy ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {uploading ? "Enviando foto..." : processingVoice ? "Processando IA..." : "Salvando..."}</>
            ) : (
              mode === "inst" ? "Cadastrar Instituição" : "Salvar e Notificar via WhatsApp"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
