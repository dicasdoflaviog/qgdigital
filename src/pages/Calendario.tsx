import { useState, useMemo } from "react";
import {
  eventosPoliticos,
  EventoPolitico,
  EventoCategoria,
  CATEGORIA_CONFIG,
  assessores,
} from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  MapPin,
  User,
  FileText,
  Sparkles,
  AlertTriangle,
  CalendarIcon,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  differenceInDays,
  isSameMonth,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BAIRROS } from "@/data/mockData";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pendente: <Clock className="h-3 w-3" />,
  confirmado: <CheckCircle2 className="h-3 w-3" />,
  concluido: <Circle className="h-3 w-3 fill-current" />,
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function oficioExpirado(ev: EventoPolitico) {
  if (ev.categoria !== "oficio" || !ev.oficioEnviadoEm || ev.status === "concluido") return false;
  return differenceInDays(new Date(), new Date(ev.oficioEnviadoEm)) >= 15;
}

export default function Calendario() {
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-03-01"));
  const [filtros, setFiltros] = useState<Record<EventoCategoria, boolean>>({
    visita: true,
    demanda: true,
    reuniao: true,
    sazonal: true,
    oficio: true,
  });
  const [showForm, setShowForm] = useState(false);

  const toggleFiltro = (cat: EventoCategoria) =>
    setFiltros((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const filteredEvents = useMemo(
    () => eventosPoliticos.filter((ev) => filtros[ev.categoria]),
    [filtros]
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventoPolitico[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.data]) map[ev.data] = [];
      map[ev.data].push(ev);
    });
    return map;
  }, [filteredEvents]);

  const getAssessor = (id?: string) => assessores.find((a) => a.id === id)?.nome || "—";

  return (
    <div className="p-4 md:p-6 space-y-4 pb-28 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
              <CalendarIcon className="h-4 w-4" />
            </div>
            Calendário Político
          </h1>
          <p className="label-ui mt-1">Gestão completa de atividades e prazos</p>
        </div>
        <Button className="font-medium text-xs" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Evento
        </Button>
      </div>

      <div className="border-t border-border" />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* Sidebar Filtros */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(CATEGORIA_CONFIG) as EventoCategoria[]).map((cat) => {
              const cfg = CATEGORIA_CONFIG[cat];
              return (
                <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                  <Checkbox
                    checked={filtros[cat]}
                    onCheckedChange={() => toggleFiltro(cat)}
                  />
                  <span
                    className="h-3 w-3 shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-sm group-hover:text-foreground text-muted-foreground transition-colors duration-300">
                    {cfg.label}
                  </span>
                </label>
              );
            })}

            <div className="border-t border-border pt-3 mt-3">
              <p className="label-ui mb-2">Legenda de Status</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Pendente</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Confirmado</div>
                <div className="flex items-center gap-1.5"><Circle className="h-3 w-3 fill-current" /> Concluído</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendário Grid */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base font-medium capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center label-ui py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[5rem] border border-border/30 bg-muted/20" />
              ))}

              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate[dateStr] || [];
                const hasExpiredOficio = dayEvents.some(oficioExpirado);

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "min-h-[5rem] border border-border/40 p-1 transition-colors duration-300 relative",
                      isToday(day) && "bg-primary/5 border-primary/40",
                      hasExpiredOficio && "bg-destructive/5"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-medium leading-none",
                        isToday(day) && "text-primary",
                        !isSameMonth(day, currentMonth) && "text-muted-foreground/40"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <EventChip key={ev.id} evento={ev} getAssessor={getAssessor} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-muted-foreground pl-0.5">
                          +{dayEvents.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form BottomSheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-safe">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 mt-1" />
          <SheetHeader>
            <SheetTitle className="font-medium">Novo evento</SheetTitle>
            <SheetDescription className="text-xs">Adicione uma atividade ao calendário</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 mt-4">
            <div>
              <Label className="label-ui">Título</Label>
              <Input placeholder="Ex: Visita à Escola Municipal" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="label-ui">Data</Label>
                <Input type="date" defaultValue="2026-03-02" className="text-sm" />
              </div>
              <div>
                <Label className="label-ui">Hora</Label>
                <Input type="time" defaultValue="09:00" className="text-sm" />
              </div>
            </div>
            <div>
              <Label className="label-ui">Categoria</Label>
              <Select defaultValue="visita">
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_CONFIG) as EventoCategoria[]).map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-sm">
                      {CATEGORIA_CONFIG[cat].emoji} {CATEGORIA_CONFIG[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="label-ui">Bairro</Label>
              <Select>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {BAIRROS.map((b) => <SelectItem key={b} value={b} className="text-sm">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="label-ui">Pauta / Observação</Label>
              <Textarea rows={2} placeholder="Descreva brevemente..." className="text-sm resize-none" />
            </div>
          </div>
          <SheetFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="font-medium flex-1">Cancelar</Button>
            <Button onClick={() => setShowForm(false)} className="font-medium flex-1">Salvar evento</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ── Event Chip with Popover ─────────────────────────────────── */
function EventChip({
  evento,
  getAssessor,
}: {
  evento: EventoPolitico;
  getAssessor: (id?: string) => string;
}) {
  const cfg = CATEGORIA_CONFIG[evento.categoria];
  const expired = oficioExpirado(evento);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full text-left px-1 py-0.5 text-[10px] font-medium truncate flex items-center gap-0.5 transition-all duration-300",
            expired && "ring-1 ring-destructive"
          )}
          style={{
            backgroundColor: `${cfg.color}20`,
            color: cfg.color,
            borderLeft: `2px solid ${cfg.color}`,
          }}
        >
          {STATUS_ICONS[evento.status]}
          <span className="truncate">{evento.titulo}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-2rem)] p-3 space-y-2" side="bottom" align="start">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{evento.titulo}</p>
          <Badge
            variant="outline"
            className="text-[9px] shrink-0 font-medium rounded-full px-2 py-0.5"
            style={{ borderColor: cfg.color, color: cfg.color }}
          >
            {cfg.label}
          </Badge>
        </div>

        {evento.hora && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {evento.hora}
          </div>
        )}
        {evento.bairro && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {evento.bairro}
          </div>
        )}
        {evento.assessorId && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" /> {getAssessor(evento.assessorId)}
          </div>
        )}
        {evento.pauta && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{evento.pauta}</span>
          </div>
        )}

        {expired && (
          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium bg-destructive/10 p-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Ofício sem resposta há mais de 15 dias!</span>
          </div>
        )}

        {evento.sugestaoPost && (
          <div className="bg-muted p-2 space-y-1">
            <div className="flex items-center gap-1 label-ui">
              <Sparkles className="h-3 w-3" /> Sugestão de Post IA
            </div>
            <p className="text-xs italic text-muted-foreground">{evento.sugestaoPost}</p>
          </div>
        )}

        <div className="flex items-center gap-1 pt-1">
          <Badge variant={evento.status === "confirmado" ? "default" : evento.status === "concluido" ? "secondary" : "outline"} className="text-[9px] font-medium rounded-full px-2 py-0.5">
            {evento.status.charAt(0).toUpperCase() + evento.status.slice(1)}
          </Badge>
        </div>
      </PopoverContent>
    </Popover>
  );
}
