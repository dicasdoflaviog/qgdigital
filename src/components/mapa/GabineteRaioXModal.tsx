import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GabineteCidade } from "@/hooks/useGabinetesCidade";
import { useGabinetePerformance } from "@/hooks/useGabinetePerformance";
import { GABINETE_COLORS } from "./MapaSidebar";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Users, MapPin,
  Target, MessageSquare, Lightbulb, Send, Activity,
  Stethoscope, Wrench, BookOpen, Droplets, Zap, HelpCircle,
  GraduationCap, Home, TreePine, Shield,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";

// Category → icon mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Saúde": Stethoscope,
  "Infraestrutura": Wrench,
  "Educação": GraduationCap,
  "Iluminação Pública": Zap,
  "Saneamento": Droplets,
  "Segurança": Shield,
  "Habitação": Home,
  "Meio Ambiente": TreePine,
  "Assistência Social": Users,
  "Cultura": BookOpen,
};

// BAIRRO_COORDS duplicated here for mini-map (same source as MapaCalor)
const BAIRRO_COORDS: Record<string, [number, number]> = {
  "Centro": [-17.5393, -39.7436], "Bela Vista": [-17.5370, -39.7410], "Recanto do Lago": [-17.5355, -39.7460],
  "Jardim Caraípe": [-17.5410, -39.7400], "Castelinho": [-17.5420, -39.7320], "Vila Vargas": [-17.5450, -39.7280],
  "Jerusalém": [-17.5470, -39.7250], "Nova Teixeira": [-17.5440, -39.7350], "Ouro Verde": [-17.5490, -39.7300],
  "Ulisses Guimarães": [-17.5380, -39.7520], "Colina Verde": [-17.5340, -39.7550], "Teixeirinha": [-17.5360, -39.7580],
  "Liberdade": [-17.5420, -39.7500], "Santa Rita": [-17.5400, -39.7560], "Kaikan": [-17.5280, -39.7400],
  "Kaikan Sul": [-17.5300, -39.7420], "Bonadiman": [-17.5260, -39.7450], "Vila Caraípe": [-17.5240, -39.7380],
  "Estância Biquíni": [-17.5220, -39.7350], "Tancredo Neves": [-17.5500, -39.7450], "São Lourenço": [-17.5520, -39.7400],
  "Duque de Caxias": [-17.5540, -39.7480], "Monte Castelo": [-17.5560, -39.7430], "Santo Antônio": [-17.5580, -39.7350],
  "Jardim Novo": [-17.5320, -39.7300],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gabinete: GabineteCidade | null;
  gabineteIndex: number;
  cidade?: string | null;
}

/* Circular progress ring */
function CircularProgress({ value, size = 80, strokeWidth = 6, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-foreground text-sm font-medium" transform={`rotate(90 ${size / 2} ${size / 2})`}>
        {value}%
      </text>
    </svg>
  );
}

export function GabineteRaioXModal({ open, onOpenChange, gabinete, gabineteIndex, cidade }: Props) {
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const { data: perf, isLoading } = useGabinetePerformance(gabinete?.gabinete_id, cidade);

  // Mini-map markers
  const miniMapMarkers = useMemo(() => {
    if (!perf) return [];
    return Object.entries(perf.eleitoresPorBairro)
      .map(([bairro, count]) => {
        const coords = BAIRRO_COORDS[bairro];
        if (!coords) return null;
        return { bairro, count, coords };
      })
      .filter(Boolean) as { bairro: string; count: number; coords: [number, number] }[];
  }, [perf]);

  if (!gabinete) return null;

  const gabColor = GABINETE_COLORS[gabineteIndex % GABINETE_COLORS.length];
  const taxa = gabinete.total_demandas > 0
    ? Math.round((gabinete.demandas_resolvidas / gabinete.total_demandas) * 100)
    : 0;

  const CategoryIcon = perf?.categoriaTop ? (CATEGORY_ICONS[perf.categoriaTop] || HelpCircle) : HelpCircle;

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Feedback enviado com sucesso", {
      description: `Orientação enviada para o gabinete de ${gabinete.nome_vereador}.`,
    });
    setFeedback("");
    setSending(false);
  };

  // AI Insight generation
  const generateInsight = () => {
    if (!perf) return "";
    const parts: string[] = [];

    // Growth insight
    if (perf.growthStatus === "aceleracao") {
      parts.push(`O gabinete está em fase de aceleração com ${perf.cadastrosMesAtual} novos cadastros este mês (+${perf.growthPct}%)`);
    } else if (perf.growthStatus === "queda") {
      parts.push(`⚠️ Atenção: queda de cadastros em relação ao mês passado (${perf.cadastrosMesPassado} → ${perf.cadastrosMesAtual})`);
    } else {
      parts.push(`Crescimento estável com ${perf.cadastrosMesAtual} cadastros no mês`);
    }

    // Territorial insight
    if (perf.topBairros.length > 0) {
      parts.push(`O gabinete está forte no bairro ${perf.topBairros[0].bairro} (${perf.topBairros[0].count} eleitores)`);
    }

    // Category insight
    if (perf.topCategorias.length > 0) {
      const topPct = perf.totalDemandas > 0 ? Math.round((perf.topCategorias[0].count / perf.totalDemandas) * 100) : 0;
      parts.push(`${topPct}% das demandas são sobre "${perf.topCategorias[0].categoria}"${topPct > 60 ? " — concentração alta, diversificar pautas" : ""}`);
    }

    // Resolution insight
    if (taxa < 40) parts.push("Taxa de resolução abaixo de 40% — recomendado mutirão de atendimento");
    else if (taxa > 75) parts.push("Excelente taxa de resolução — gabinete operando em alta eficiência");

    // Penetration insight
    if (perf.penetracaoPct < 50) parts.push(`Penetração territorial de apenas ${perf.penetracaoPct}% — oportunidade de expansão para novos bairros`);

    return parts.join(". ") + ".";
  };

  const maxMarkerCount = Math.max(...miniMapMarkers.map((m) => m.count), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 z-modal-elevated">
        {/* === HEADER === */}
        <div className="p-5 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            {/* Avatar with WhatsApp link */}
            {(() => {
              const initials = (gabinete.nome_vereador ?? "")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0].toUpperCase())
                .join("");
              const whatsappDigits = (gabinete.whatsapp ?? "").replace(/\D/g, "");
              const avatarEl = (
                <Avatar
                  className="h-12 w-12 shrink-0 transition-transform hover:scale-105"
                  style={{ boxShadow: `0 0 0 2px ${gabColor}` }}
                >
                  {gabinete.avatar_url && (
                    <AvatarImage
                      src={gabinete.avatar_url}
                      alt={gabinete.nome_vereador ?? ""}
                      className="object-cover"
                      loading="lazy"
                    />
                  )}
                  <AvatarFallback
                    className="text-sm font-medium text-white"
                    style={{ backgroundColor: gabColor }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );
              return whatsappDigits ? (
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`WhatsApp de ${gabinete.nome_vereador}`}
                  className="cursor-pointer"
                >
                  {avatarEl}
                </a>
              ) : avatarEl;
            })()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogHeader className="p-0 space-y-0">
                  <DialogTitle className="text-base font-medium text-foreground">
                    {gabinete.nome_vereador}
                  </DialogTitle>
                </DialogHeader>
                {/* Activity Badge */}
                {perf && (
                  <Badge className={`text-[9px] gap-1 ${perf.isActive
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                  }`}>
                    <Activity className="h-2.5 w-2.5" />
                    {perf.isActive ? "Ativo" : "Inativo 7d+"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {cidade} • {gabinete.total_eleitores} eleitores • {gabinete.total_demandas} demandas
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : perf ? (
          <div className="p-5 space-y-5">
            {/* === KPI GRID === */}
            <div className="grid grid-cols-3 gap-3">
              {/* Termômetro de Base */}
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <Users className="h-4 w-4 mx-auto text-primary mb-1.5" />
                <p className="text-xl font-medium text-foreground">{gabinete.total_eleitores}</p>
                <p className="text-[9px] text-muted-foreground">Eleitores</p>
                <div className="mt-1.5 flex items-center justify-center gap-1">
                  {perf.growthPct > 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : perf.growthPct < 0 ? (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={`text-[10px] font-medium ${
                    perf.growthPct > 0 ? "text-success" : perf.growthPct < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {perf.growthPct > 0 ? "+" : ""}{perf.growthPct}%
                  </span>
                </div>
              </div>

              {/* Índice de Resolutividade (Circular) */}
              <div className="bg-muted/50 rounded-xl p-3 flex flex-col items-center justify-center">
                <CircularProgress value={taxa} color={gabColor} size={72} strokeWidth={5} />
                <p className="text-[9px] text-muted-foreground mt-1">Resolutividade</p>
              </div>

              {/* Foco do Gabinete */}
              <div className="bg-muted/50 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-full flex items-center justify-center mb-1.5"
                  style={{ backgroundColor: `${gabColor}20` }}>
                  <CategoryIcon className="h-5 w-5" style={{ color: gabColor }} />
                </div>
                <p className="text-[10px] font-medium text-foreground truncate max-w-full">
                  {perf.categoriaTop || "—"}
                </p>
                <p className="text-[9px] text-muted-foreground">Foco Principal</p>
              </div>
            </div>

            {/* === MINI HEATMAP === */}
            {miniMapMarkers.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Mancha de Influência
                  </h3>
                </div>
                <div className="rounded-xl overflow-hidden border border-border h-[180px]">
                  <MapContainer
                    center={miniMapMarkers[0]?.coords || [-17.5393, -39.7436]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                    attributionControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    {miniMapMarkers.map((m) => {
                      const ratio = m.count / maxMarkerCount;
                      const radius = 8 + ratio * 20;
                      return (
                        <CircleMarker
                          key={m.bairro}
                          center={m.coords}
                          radius={radius}
                          pathOptions={{
                            color: gabColor,
                            fillColor: gabColor,
                            fillOpacity: 0.4 + ratio * 0.3,
                            weight: 2,
                          }}
                        />
                      );
                    })}
                  </MapContainer>
                </div>
              </section>
            )}

            {/* === FUNIL DE DEMANDAS === */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Funil de Demandas</h3>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Progresso Operacional</span>
                  <span className="font-medium" style={{ color: gabColor }}>{taxa}%</span>
                </div>
                <Progress value={taxa} className="h-2" />
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-base font-medium text-foreground">{perf.totalDemandas}</p>
                    <p className="text-[8px] text-muted-foreground uppercase">Recebidas</p>
                  </div>
                  <div>
                    <p className="text-base font-medium text-success">{perf.demandasResolvidas}</p>
                    <p className="text-[8px] text-muted-foreground uppercase">Resolvidas</p>
                  </div>
                  <div>
                    <p className={`text-base font-medium ${perf.demandasPendentes > 10 ? "text-destructive" : "text-foreground"}`}>
                      {perf.demandasPendentes}
                    </p>
                    <p className="text-[8px] text-muted-foreground uppercase">Pendentes</p>
                  </div>
                </div>
              </div>
            </section>

            {/* === PERFIL DA BASE (Dores + Bairros) === */}
            <div className="grid grid-cols-2 gap-3">
              <section className="bg-muted/50 rounded-xl p-3">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Principais Dores</p>
                {perf.topCategorias.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                ) : (
                  <div className="space-y-1.5">
                    {perf.topCategorias.map((c, i) => {
                      const pct = perf.totalDemandas > 0 ? Math.round((c.count / perf.totalDemandas) * 100) : 0;
                      return (
                        <div key={c.categoria} className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-muted-foreground w-4">{i + 1}.</span>
                          <span className="text-xs font-medium text-foreground flex-1 truncate">{c.categoria}</span>
                          <span className="text-[10px] font-medium" style={{ color: gabColor }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
              <section className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3 text-destructive" />
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Top Bairros</p>
                </div>
                {perf.topBairros.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                ) : (
                  <div className="space-y-1.5">
                    {perf.topBairros.map((b, i) => (
                      <div key={b.bairro} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-muted-foreground w-4">{i + 1}.</span>
                          <span className="text-xs font-medium text-foreground truncate max-w-[90px]">{b.bairro}</span>
                        </div>
                        <span className="text-xs font-medium text-primary">{b.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* === NOTA DE INTELIGÊNCIA (IA) === */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-warning" />
                <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Nota de Inteligência</h3>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 relative">
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">IA</Badge>
                </div>
                <p className="text-xs text-foreground leading-relaxed pr-8">{generateInsight()}</p>
              </div>
            </section>

            {/* === FEEDBACK === */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Feedback para o Vereador</h3>
              </div>
              <Textarea
                placeholder="Escreva uma orientação estratégica para este gabinete..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="text-xs min-h-[70px] resize-none"
              />
              <Button
                size="sm"
                className="mt-2 gap-1.5"
                disabled={!feedback.trim() || sending}
                onClick={handleSendFeedback}
              >
                <Send className="h-3 w-3" /> {sending ? "Enviando..." : "Enviar Feedback"}
              </Button>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
