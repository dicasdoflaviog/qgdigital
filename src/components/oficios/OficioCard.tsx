import { useState } from "react";
import { FileText, AlertTriangle, Clock, ArrowUpRight, CalendarDays, User, MapPin, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Oficio, OficioStatus, OFICIO_STATUS_CONFIG, diasDesdeProtocolo, isAtrasado, getProgressPercent } from "@/data/oficiosData";
import { assessores } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const STEPS: OficioStatus[] = ["elaborado", "protocolado", "em_cobranca", "respondido", "resolvido"];
const NEXT_STATUSES: Record<OficioStatus, OficioStatus[]> = {
  elaborado: ["protocolado"], protocolado: ["em_cobranca", "respondido"],
  em_cobranca: ["respondido"], respondido: ["resolvido"], resolvido: [],
};

interface OficioCardProps { oficio: Oficio; onStatusChange: (oficio: Oficio, newStatus: OficioStatus) => void; }

export function OficioCard({ oficio, onStatusChange }: OficioCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const dias = diasDesdeProtocolo(oficio);
  const atrasado = isAtrasado(oficio);
  const progress = getProgressPercent(oficio.status);
  const statusCfg = OFICIO_STATUS_CONFIG[oficio.status];
  const assessor = assessores.find((a) => a.id === oficio.assessorId);
  const nextStatuses = NEXT_STATUSES[oficio.status];
  const { toast } = useToast();

  const handleGerarCobranca = () => {
    const msg = encodeURIComponent(
      `Prezado(a),\n\nVenho cobrar retorno referente ao Ofício nº ${oficio.numero} — "${oficio.titulo}", referente ao bairro ${oficio.bairro}.\n\nA demanda encontra-se sem resposta há ${dias} dias.\n\nAguardamos providências.`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    toast({ title: "Cobrança gerada", description: "Mensagem aberta no WhatsApp." });
  };

  return (
    <>
      <Card className={`${atrasado ? "border-destructive" : ""}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">Nº {oficio.numero}</span>
                <Badge variant="outline" className="text-xs">{oficio.bairro}</Badge>
                {atrasado && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Atrasado</Badge>}
              </div>
              <h3 className="font-medium text-sm mt-1 leading-tight">{oficio.titulo}</h3>
            </div>
            <Badge className="shrink-0 text-xs" style={{ backgroundColor: statusCfg.color, color: "#fff" }}>{statusCfg.label}</Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">{oficio.pauta}</p>

          <div className="space-y-1.5">
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground gap-1 min-w-0">
                {STEPS.map((s) => (
                  <span key={s} className={`shrink-0 text-center leading-tight ${OFICIO_STATUS_CONFIG[s].step <= OFICIO_STATUS_CONFIG[oficio.status].step ? "font-medium text-foreground" : ""}`}>
                    {OFICIO_STATUS_CONFIG[s].label}
                  </span>
                ))}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex flex-col gap-2 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-3 flex-wrap">
              {dias !== null && <span className={`flex items-center gap-1 ${atrasado ? "text-destructive font-medium" : ""}`}><Clock className="h-3 w-3 shrink-0" />Protocolado há {dias} dias</span>}
              {assessor && <span>📋 {assessor.nome}</span>}
            </div>
            <div className="flex gap-1.5 items-center flex-wrap">
              {atrasado && <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={handleGerarCobranca}><AlertTriangle className="h-3 w-3" />Cobrança</Button>}
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setDetailOpen(true)}><FileText className="h-3 w-3" />Ver</Button>
              {nextStatuses.length > 0 && (
                <Select onValueChange={(v) => onStatusChange(oficio, v as OficioStatus)}>
                  <SelectTrigger className="h-7 text-xs w-auto min-w-[110px] gap-1"><ArrowUpRight className="h-3 w-3" /><SelectValue placeholder="Avançar" /></SelectTrigger>
                  <SelectContent>{nextStatuses.map((s) => <SelectItem key={s} value={s} className="text-xs">{OFICIO_STATUS_CONFIG[s].label}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </div>

          {oficio.resposta && (
            <div className="bg-muted p-2.5 rounded-lg text-xs border">
              <span className="font-medium text-foreground">Resposta: </span>
              <span className="text-muted-foreground">{oficio.resposta}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-primary" />Ofício Nº {oficio.numero}</DialogTitle>
            <DialogDescription className="text-xs">Resumo completo do ofício legislativo</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Badge className="text-xs" style={{ backgroundColor: statusCfg.color, color: "#fff" }}>{statusCfg.label}</Badge>
            {atrasado && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Atrasado ({dias} dias)</Badge>}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-foreground leading-tight">{oficio.titulo}</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem icon={<MapPin className="h-3.5 w-3.5" />} label="Bairro" value={oficio.bairro} />
              <InfoItem icon={<Hash className="h-3.5 w-3.5" />} label="Protocolo" value={oficio.protocolo || "Não protocolado"} />
              <InfoItem icon={<User className="h-3.5 w-3.5" />} label="Assessor" value={assessor?.nome || "—"} />
              <InfoItem icon={<CalendarDays className="h-3.5 w-3.5" />} label="Criado em" value={oficio.criadoEm} />
            </div>
            {oficio.protocoladoEm && <InfoItem icon={<CalendarDays className="h-3.5 w-3.5" />} label="Protocolado em" value={oficio.protocoladoEm} />}
            {oficio.respondidoEm && <InfoItem icon={<CalendarDays className="h-3.5 w-3.5" />} label="Respondido em" value={oficio.respondidoEm} />}
            {oficio.resolvidoEm && <InfoItem icon={<CalendarDays className="h-3.5 w-3.5" />} label="Resolvido em" value={oficio.resolvidoEm} />}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Pauta</p>
            <div className="bg-muted/50 border rounded-lg p-3"><p className="text-sm text-foreground leading-relaxed">{oficio.pauta}</p></div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Progresso</p>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              {STEPS.map((s) => <span key={s} className={`text-center ${OFICIO_STATUS_CONFIG[s].step <= OFICIO_STATUS_CONFIG[oficio.status].step ? "font-medium text-foreground" : ""}`}>{OFICIO_STATUS_CONFIG[s].label}</span>)}
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>

          {oficio.resposta && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Resposta</p>
              <div className="bg-muted/50 border rounded-lg p-3"><p className="text-sm text-foreground leading-relaxed">{oficio.resposta}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
