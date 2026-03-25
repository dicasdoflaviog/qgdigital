import { useState, useMemo } from "react";
import { reunioes as initialReunioes, assessores, BAIRROS, LIMITE_DIARIO, Reuniao, ReuniaoStatus, ReuniaoVisibilidade } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Plus, Check, Pencil, AlertTriangle, Clock, MapPin, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function hasConflict(a: Reuniao, b: Reuniao) {
  if (a.data !== b.data || a.id === b.id) return false;
  const aStart = timeToMin(a.horaInicio);
  const aEnd = aStart + a.duracao;
  const bStart = timeToMin(b.horaInicio);
  const bEnd = bStart + b.duracao;
  return aStart < bEnd && bStart < aEnd;
}

const HORARIOS = Array.from({ length: 13 }, (_, i) => {
  const h = 7 + i;
  return `${String(h).padStart(2, "0")}:00`;
});

export default function Agenda() {
  const { role } = useAuth();
  const [items, setItems] = useState<Reuniao[]>(initialReunioes);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-03-02"));
  const [showForm, setShowForm] = useState(false);

  const canSchedule = role === "admin" || role === "super_admin" || role === "secretaria" || role === "assessor";
  const canApprove = role === "admin" || role === "super_admin" || role === "secretaria";
  const canSeeOff = role === "admin" || role === "super_admin" || role === "secretaria";

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dayItems = useMemo(() =>
    items
      .filter((r) => r.data === dateStr)
      .filter((r) => canSeeOff || r.visibilidade !== "off")
      .sort((a, b) => timeToMin(a.horaInicio) - timeToMin(b.horaInicio)),
    [items, dateStr, canSeeOff]
  );

  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    dayItems.forEach((a) => {
      dayItems.forEach((b) => {
        if (hasConflict(a, b)) { ids.add(a.id); ids.add(b.id); }
      });
    });
    return ids;
  }, [dayItems]);

  const confirmedCount = dayItems.filter((r) => r.status === "confirmada").length;
  const pendingItems = dayItems.filter((r) => r.status === "pendente");
  const limitReached = confirmedCount >= LIMITE_DIARIO;

  const getAssessorNome = (id: string) => assessores.find((a) => a.id === id)?.nome || "—";

  const handleApprove = (id: string) => {
    if (limitReached) {
      toast({ title: "Limite diário atingido", description: `Máximo de ${LIMITE_DIARIO} reuniões confirmadas por dia.`, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: "confirmada" as ReuniaoStatus } : r));
    toast({ title: "Reunião confirmada!" });
  };

  const handleAdd = (reuniao: Omit<Reuniao, "id" | "status">) => {
    const newR: Reuniao = { ...reuniao, id: `r${Date.now()}`, status: "pendente" };
    const conflicts = items.filter((r) => hasConflict(newR, r));
    if (conflicts.length > 0) {
      toast({ title: "Conflito de horário detectado!", description: "A reunião foi salva como pendente com alerta de conflito.", variant: "destructive" });
    }
    setItems((prev) => [...prev, newR]);
    setShowForm(false);
    toast({ title: "Reunião solicitada!", description: "Aguardando aprovação da secretária." });
  };

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
              <CalendarIcon className="h-4 w-4" />
            </div>
            Agenda de Gabinete
          </h1>
          <p className="label-ui mt-1">
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={limitReached ? "destructive" : "secondary"} className="text-xs px-2.5 py-1 font-medium">
            <Clock className="h-3 w-3 mr-1" />
            {confirmedCount} de {LIMITE_DIARIO} reuniões
          </Badge>
          {canSchedule && (
            <Button size="sm" className="font-medium text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Agendar
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Sidebar: Calendar + Pending */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                className="p-0 pointer-events-auto"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          {/* Painel da Secretária */}
          {canApprove && pendingItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Pendentes ({pendingItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingItems.map((r) => (
                  <div key={r.id} className={cn(
                    "border border-dashed border-muted-foreground/30 p-2.5 space-y-1.5",
                    r.visibilidade === "off" && "bg-muted/60"
                  )}>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium truncate flex-1">{r.titulo}</p>
                      {r.visibilidade === "off" && (
                        <Badge variant="outline" className="text-[9px] gap-0.5 shrink-0 border-amber-500/50 text-amber-600">
                          <EyeOff className="h-2.5 w-2.5" /> OFF
                        </Badge>
                      )}
                    </div>
                    <p className="label-ui">
                      {r.horaInicio} · {getAssessorNome(r.solicitanteId)}
                    </p>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="default" className="h-7 text-xs flex-1 font-medium" onClick={() => handleApprove(r.id)}>
                        <Check className="h-3 w-3 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Timeline do dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-1">
              {HORARIOS.map((hora) => {
                const exactItems = dayItems.filter((r) => {
                  const rMin = timeToMin(r.horaInicio);
                  const hMin = timeToMin(hora);
                  const nextH = HORARIOS[HORARIOS.indexOf(hora) + 1];
                  const nextMin = nextH ? timeToMin(nextH) : hMin + 60;
                  return rMin >= hMin && rMin < nextMin;
                });

                return (
                  <div key={hora} className="flex gap-3 min-h-[3.5rem]">
                    <div className="w-12 shrink-0 text-xs text-muted-foreground pt-1 font-mono text-right">
                      {hora}
                    </div>
                    <div className="flex-1 border-l-2 border-border pl-3 space-y-1.5 pb-2">
                      {exactItems.length === 0 && (
                        <div className="h-8" />
                      )}
                      {exactItems.map((r) => {
                        const isConflict = conflictIds.has(r.id);
                        const isConfirmed = r.status === "confirmada";
                        const isOff = r.visibilidade === "off";
                        return (
                          <div
                            key={r.id}
                            className={cn(
                              "p-3 transition-all border",
                              isConflict && "border-2 border-destructive",
                              isOff && "bg-muted/40 border-dashed border-amber-500/40",
                              !isOff && isConfirmed
                                ? "bg-primary/10 border-primary/30"
                                : !isOff && !isConfirmed
                                  ? "bg-muted/40 border-dashed border-muted-foreground/30"
                                  : "",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium truncate">{r.titulo}</p>
                                  {isOff && (
                                    <Badge variant="outline" className="text-[9px] gap-0.5 shrink-0 border-amber-500/50 text-amber-600">
                                      <EyeOff className="h-2.5 w-2.5" /> OFF
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 label-ui">
                                  <span>{r.horaInicio} · {r.duracao}min</span>
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="h-3 w-3" /> {r.bairro}
                                  </span>
                                </div>
                                <p className="label-ui">
                                  Solicitante: {getAssessorNome(r.solicitanteId)}
                                </p>
                              </div>
                              <Badge
                                variant={isConfirmed ? "default" : "secondary"}
                                className={cn("text-[10px] font-medium", isConflict && "bg-destructive text-destructive-foreground")}
                              >
                                {isConflict ? "Conflito!" : isConfirmed ? "Confirmada" : "Pendente"}
                              </Badge>
                            </div>
                            {r.pauta && (
                              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                                📋 {r.pauta}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <AgendaForm
        open={showForm}
        onOpenChange={setShowForm}
        selectedDate={dateStr}
        onSubmit={handleAdd}
        canSetOff={canApprove}
      />
    </div>
  );
}

function AgendaForm({
  open, onOpenChange, selectedDate, onSubmit, canSetOff,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedDate: string;
  onSubmit: (r: Omit<Reuniao, "id" | "status">) => void;
  canSetOff: boolean;
}) {
  const [titulo, setTitulo] = useState("");
  const [hora, setHora] = useState("09:00");
  const [duracao, setDuracao] = useState("60");
  const [bairro, setBairro] = useState("");
  const [pauta, setPauta] = useState("");
  const [solicitante, setSolicitante] = useState(assessores[0].id);
  const [isOff, setIsOff] = useState(false);

  const handleSubmit = () => {
    if (!titulo || !bairro) return;
    onSubmit({
      titulo,
      data: selectedDate,
      horaInicio: hora,
      duracao: Number(duracao),
      bairro,
      pauta,
      solicitanteId: solicitante,
      visibilidade: isOff ? "off" : "publica",
    });
    setTitulo(""); setPauta(""); setIsOff(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium">Nova reunião</DialogTitle>
          <DialogDescription className="text-xs">Agende uma reunião para {selectedDate}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="label-ui">Título da Reunião</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Visita ao Posto de Saúde" className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="label-ui">Hora de Início</Label>
              <Select value={hora} onValueChange={setHora}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HORARIOS.map((h) => <SelectItem key={h} value={h} className="text-sm">{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="label-ui">Duração (min)</Label>
              <Select value={duracao} onValueChange={setDuracao}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["30", "45", "60", "90", "120"].map((d) => <SelectItem key={d} value={d} className="text-sm">{d} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="label-ui">Bairro</Label>
            <Select value={bairro} onValueChange={setBairro}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione o bairro" /></SelectTrigger>
              <SelectContent>
                {BAIRROS.map((b) => <SelectItem key={b} value={b} className="text-sm">{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="label-ui">Assessor Solicitante</Label>
            <Select value={solicitante} onValueChange={setSolicitante}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {assessores.map((a) => <SelectItem key={a.id} value={a.id} className="text-sm">{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="label-ui">Pauta Principal</Label>
            <Textarea value={pauta} onChange={(e) => setPauta(e.target.value)} placeholder="Descreva a pauta..." rows={2} className="text-sm resize-none" />
          </div>

          {/* OFF Toggle - only for admin/secretaria */}
          {canSetOff && (
            <div className="flex items-center justify-between rounded-2xl border border-border p-3 bg-muted/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                  <Label className="text-xs font-medium">Modo OFF</Label>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Oculta dos assessores. Apenas admin e secretária visualizam.
                </p>
              </div>
              <Switch checked={isOff} onCheckedChange={setIsOff} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-medium text-xs">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!titulo || !bairro} className="font-medium text-xs">Solicitar Agendamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
