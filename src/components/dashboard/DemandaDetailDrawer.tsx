import { useState, useEffect } from "react";
import { generateOficioPDF } from "@/lib/generateOficioPDF";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { useGlobalConfig } from "@/hooks/useGlobalConfig";
import {
  MessageCircle, FileText, Clock, User, MapPin, CheckCircle2,
  AlertTriangle, Loader2, Camera, X, ChevronRight, Calendar,
  PenLine, ExternalLink, ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface DemandaItem {
  id: string;
  descricao: string | null;
  bairro: string | null;
  categoria: string | null;
  status: string | null;
  created_at: string;
  eleitor_nome?: string | null;
  eleitor_whatsapp?: string | null;
  assessor_nome?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface TimelineEvent {
  label: string;
  detail?: string;
  date: string | null;
  icon: React.ReactNode;
  color: string;
}

interface Props {
  demanda: DemandaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged?: () => void;
}

const STATUS_OPTIONS = ["Pendente", "Em Andamento", "Ofício Gerado", "Resolvida", "Cancelada"];

const statusConfig: Record<string, { variant: string; color: string }> = {
  Pendente: { variant: "destructive", color: "bg-destructive/15 text-destructive border-destructive/30" },
  "Em Andamento": { variant: "secondary", color: "bg-warning/15 text-warning border-warning/30" },
  "Ofício Gerado": { variant: "outline", color: "bg-info/15 text-info border-info/30" },
  Resolvida: { variant: "default", color: "bg-success/15 text-success border-success/30" },
  Cancelada: { variant: "outline", color: "bg-muted text-muted-foreground border-border" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.Pendente;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
      {status}
    </span>
  );
}

export function DemandaDetailDrawer({ demanda, open, onOpenChange, onStatusChanged }: Props) {
  const { user, profile } = useAuth();
  const { config: gabConfig } = useGabineteConfig();
  const { config: globalConfig } = useGlobalConfig();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Reset status when demanda changes
  useEffect(() => {
    setNewStatus(null);
  }, [demanda?.id]);

  // Fetch audit logs for timeline
  useEffect(() => {
    if (!demanda?.id || !open) return;
    setLoadingTimeline(true);

    supabase
      .from("audit_logs")
      .select("action, acao, details, created_at, usuario_nome")
      .or(`details->>demanda_id.eq.${demanda.id}`)
      .order("created_at", { ascending: true })
      .limit(20)
      .then(({ data }) => {
        const events: TimelineEvent[] = [
          {
            label: "Demanda criada",
            detail: demanda.assessor_nome ? `por ${demanda.assessor_nome}` : undefined,
            date: demanda.created_at,
            icon: <Calendar className="h-3.5 w-3.5" />,
            color: "bg-primary/15 text-primary",
          },
        ];

        if (data && data.length > 0) {
          for (const log of data) {
            const details = log.details as any;
            if (log.action === "ALTERAR_STATUS_DEMANDA" || log.action === "EDITAR_DEMANDA") {
              events.push({
                label: details?.status_anterior && details?.status_novo
                  ? `${details.status_anterior} → ${details.status_novo}`
                  : log.acao || log.action,
                detail: log.usuario_nome ? `por ${log.usuario_nome}` : undefined,
                date: log.created_at,
                icon: <PenLine className="h-3.5 w-3.5" />,
                color: "bg-warning/15 text-warning",
              });
            } else if (log.action === "CRIAR_DEMANDA") {
              // Already covered by the initial event
            } else {
              events.push({
                label: log.acao || log.action,
                detail: log.usuario_nome ? `por ${log.usuario_nome}` : undefined,
                date: log.created_at,
                icon: <Clock className="h-3.5 w-3.5" />,
                color: "bg-muted text-muted-foreground",
              });
            }
          }
        }

        setAuditEvents(events);
        setLoadingTimeline(false);
      });
  }, [demanda?.id, open, demanda?.created_at, demanda?.assessor_nome]);

  if (!demanda) return null;

  const currentStatus = newStatus ?? demanda.status ?? "Pendente";

  const handleStatusChange = async (status: string) => {
    setNewStatus(status);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("demandas")
        .update({ status } as any)
        .eq("id", demanda.id);
      if (error) throw error;

      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "ALTERAR_STATUS_DEMANDA",
          details: {
            demanda_id: demanda.id,
            status_anterior: demanda.status,
            status_novo: status,
            origem: "painel_vereador",
          },
        } as any);

        // Notify assessor (L1) about status change
        if (demanda.assessor_nome) {
          const { data: assessorData } = await supabase
            .from("assessores")
            .select("user_id")
            .eq("nome", demanda.assessor_nome)
            .limit(1)
            .single();
          if (assessorData?.user_id) {
            await createNotification({
              userId: assessorData.user_id,
              title: "📋 Status da Demanda Alterado",
              message: `A demanda "${demanda.categoria || "Geral"}" mudou para "${status}".`,
              type: "status_demanda",
              metadata: { demanda_id: demanda.id },
            });
          }
        }
      }

      toast.success(`Status alterado para "${status}"`);
      onStatusChanged?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status");
      setNewStatus(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAttachPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const ext = file.name.split(".").pop();
      const path = `${demanda.id}/${Date.now()}.${ext}`;

      toast.loading("Enviando foto...", { id: "upload" });
      const { error } = await supabase.storage
        .from("demandas-arquivos")
        .upload(path, file, { upsert: true });

      if (error) {
        toast.error("Erro ao enviar foto", { id: "upload" });
        console.error(error);
      } else {
        toast.success("Foto anexada com sucesso!", { id: "upload" });
      }
    };
    input.click();
  };

  const handleGenerateOficio = async () => {
    try {
      toast.loading("Gerando ofício...", { id: "oficio" });
      const { protocolo, blob } = await generateOficioPDF({
        categoria: demanda.categoria || "Geral",
        bairro: demanda.bairro || "",
        descricao: demanda.descricao || "",
        eleitorNome: demanda.eleitor_nome || null,
        status: currentStatus,
        criadoEm: demanda.created_at,
        daysOpen,
        logoUrl: gabConfig?.logo_url || null,
        nomeVereador: gabConfig?.nome_mandato || profile?.full_name || null,
        cidadeEstado: gabConfig?.cidade_estado || null,
        enderecoSede: gabConfig?.endereco_sede || null,
        telefoneContato: gabConfig?.telefone_contato || null,
        nomeMandato: gabConfig?.nome_mandato || null,
        // Global config (L5)
        logoInstitucionalUrl: globalConfig?.logo_institucional_url || null,
        nomeInstituicao: globalConfig?.nome_instituicao || null,
        enderecoRodapeGlobal: globalConfig?.endereco_rodape_global || null,
        telefoneRodapeGlobal: globalConfig?.telefone_rodape_global || null,
      });

      // Upload to Supabase Storage
      const path = `oficios/${demanda.id}/${protocolo}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("oficios-documentos")
        .upload(path, blob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.warning("PDF baixado, mas falha ao salvar no servidor.", {
          id: "oficio",
          description: uploadError.message,
        });
      } else {
        toast.success("Ofício gerado e salvo!", {
          id: "oficio",
          description: `Protocolo: ${protocolo}`,
        });

        // Notify assessor about ofício generation
        if (demanda.assessor_nome) {
          const { data: assessorData } = await supabase
            .from("assessores")
            .select("user_id")
            .eq("nome", demanda.assessor_nome)
            .limit(1)
            .single();
          if (assessorData?.user_id) {
            await createNotification({
              userId: assessorData.user_id,
              title: "📄 Ofício Gerado",
              message: `O Vereador gerou um ofício para a demanda "${demanda.categoria || "Geral"}" (${protocolo}).`,
              type: "oficio_assinado",
              metadata: { demanda_id: demanda.id, protocolo },
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar ofício PDF", { id: "oficio" });
    }
  };

  const handleViewOnMap = () => {
    onOpenChange(false);
    navigate("/mapa");
  };

  const whatsappNumber = (demanda.eleitor_whatsapp || "").replace(/\D/g, "");
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  const daysOpen = Math.floor((Date.now() - new Date(demanda.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] sm:max-w-[420px] p-0 bg-slate-900 text-slate-100 border-l border-slate-700/50 flex flex-col z-detail-sheet [&>button]:bg-slate-700 [&>button]:text-slate-200 [&>button]:opacity-100"
      >
        {/* ── Header ── */}
        <SheetHeader className="p-4 pb-3 border-b border-slate-700/50 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-medium text-slate-100 leading-tight">
                {demanda.categoria || "Demanda"}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-400 mt-0.5">
                {demanda.bairro || "Local não informado"} • Aberta há {daysOpen}d
              </SheetDescription>
            </div>
            <StatusBadge status={currentStatus} />
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Solicitante */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Solicitante</h4>
            <div className="bg-slate-800/60 rounded-xl p-3 space-y-2">
              {demanda.eleitor_nome ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-200">{demanda.eleitor_nome}</span>
                  </div>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Solicitante não vinculado</p>
              )}
            </div>
          </section>

          {/* Localização */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Localização</h4>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{demanda.bairro || "Endereço não informado"}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10 h-7 px-2"
                onClick={handleViewOnMap}
              >
                <ExternalLink className="h-3 w-3" /> Ver no Mapa Principal
              </Button>
            </div>
          </section>

          {/* Descrição */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Descrição</h4>
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-sm text-slate-300 leading-relaxed">
                {demanda.descricao || "Sem descrição registrada."}
              </p>
            </div>
          </section>

          <Separator className="bg-slate-700/50" />

          {/* Alterar Status */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Alterar Status</h4>
            <div className="flex items-center gap-2">
              <Select value={currentStatus} onValueChange={handleStatusChange} disabled={saving}>
                <SelectTrigger className="flex-1 h-9 text-xs bg-slate-800 border-slate-700 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-modal-elevated bg-slate-800 border-slate-700">
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-slate-200 focus:bg-slate-700 focus:text-slate-100">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
          </section>

          <Separator className="bg-slate-700/50" />

          {/* Linha do Tempo */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Linha do Tempo</h4>
            {loadingTimeline ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="relative pl-4 space-y-4">
                {/* Vertical connector line */}
                <div className="absolute left-[15px] top-3 bottom-3 w-px bg-slate-700/60" />
                {auditEvents.map((evt, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${evt.color} shrink-0 z-10 ring-2 ring-slate-900`}>
                      {evt.icon}
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <p className="text-sm font-medium text-slate-200 leading-tight">{evt.label}</p>
                      {evt.detail && (
                        <p className="text-[11px] text-slate-500">{evt.detail}</p>
                      )}
                      {evt.date && (
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {new Date(evt.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {auditEvents.length === 0 && (
                  <p className="text-xs text-slate-600 italic pl-3">Nenhuma movimentação registrada.</p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ── Footer Actions ── */}
        <div className="border-t border-slate-700/50 p-4 space-y-2 bg-slate-900">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5 text-white font-medium"
              style={{ backgroundColor: gabConfig?.cor_primaria || '#4F46E5' }}
              onClick={handleGenerateOficio}
            >
              📄 Gerar Ofício PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
              onClick={handleAttachPhoto}
            >
              <Camera className="h-4 w-4" /> Anexar Foto
            </Button>
          </div>
          {whatsappUrl && (
            <Button
              size="sm"
              className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              asChild
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Contatar Eleitor via WhatsApp
              </a>
            </Button>
          )}
          {demanda.assessor_nome && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                onClick={async () => {
                  const { data: assessorData } = await supabase
                    .from("assessores")
                    .select("user_id")
                    .eq("nome", demanda.assessor_nome!)
                    .limit(1)
                    .single();
                  if (assessorData?.user_id) {
                    await createNotification({
                      userId: assessorData.user_id,
                      title: "👏 Feedback do Vereador",
                      message: `Bom trabalho na demanda "${demanda.categoria || "Geral"}" em ${demanda.bairro || "—"}!`,
                      type: "geral",
                      metadata: { demanda_id: demanda.id },
                    });
                    toast.success("Feedback enviado ao assessor!");
                  } else {
                    toast.error("Assessor não encontrado");
                  }
                }}
              >
                <ThumbsUp className="h-4 w-4" /> Feedback In-App
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                asChild
              >
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Olá ${demanda.assessor_nome}! Parabéns pelo trabalho na demanda "${demanda.categoria || "Geral"}" em ${demanda.bairro || "—"}. Continue assim! 💪`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Feedback WhatsApp
                </a>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
