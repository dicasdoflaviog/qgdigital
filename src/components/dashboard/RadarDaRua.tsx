import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, MessageSquare, FileText, Send, Clock, MapPin, User, Mic, Sparkles, Pencil, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BAIRROS } from "@/data/mockData";

const KEYWORDS = [
  "esgoto", "asfalto", "luz", "iluminação", "água", "buraco", "lixo",
  "saúde", "escola", "creche", "segurança", "ônibus", "transporte",
  "ponte", "rua", "calçada", "praça", "posto", "hospital", "dengue",
];

interface VoiceDemand {
  id: string;
  assessor: string;
  bairro: string;
  transcription: string;
  timestamp: Date;
  isNew: boolean;
  eleitorNome?: string;
  isNewTerritory?: boolean;
}

const mockDemands: VoiceDemand[] = [
  {
    id: "vd1",
    assessor: "Flávio",
    bairro: "Castelinho",
    transcription: "Dona Maria tá reclamando que o esgoto tá estourado na porta da casa dela há duas semanas e ninguém resolve. A rua tá alagada.",
    timestamp: new Date(Date.now() - 1000 * 30),
    isNew: true,
    eleitorNome: "Dona Maria",
  },
  {
    id: "vd2",
    assessor: "Carlos",
    bairro: "Eixo Sul",
    transcription: "Seu João pediu pra resolver o problema da iluminação na praça principal. Tem três postes sem luz e tá perigoso à noite.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    isNew: true,
    eleitorNome: "Seu João",
    isNewTerritory: true,
  },
  {
    id: "vd3",
    assessor: "Ana",
    bairro: "Liberdade",
    transcription: "Moradores reclamando do buraco enorme na calçada perto da escola municipal. Já teve criança que caiu ali.",
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    isNew: false,
  },
  {
    id: "vd4",
    assessor: "Roberto",
    bairro: "Cohab",
    transcription: "A água tá faltando no bairro todo há 3 dias. Pessoal tá comprando água mineral pra cozinhar.",
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    isNew: false,
  },
  {
    id: "vd5",
    assessor: "Fernanda",
    bairro: "Jardim Caraípe",
    transcription: "Posto de saúde sem médico faz uma semana. Os moradores tão indo pro hospital e lotando a emergência.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    isNew: false,
  },
];

function highlightKeywords(text: string): React.ReactNode[] {
  const regex = new RegExp(`(${KEYWORDS.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (KEYWORDS.some((kw) => kw.toLowerCase() === part.toLowerCase())) {
      return (
        <span key={i} className="font-medium text-primary bg-primary/10 px-0.5">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "agora mesmo";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `há ${hours}h`;
}

function DemandCard({ demand }: { demand: VoiceDemand }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(demand.transcription);

  if (dismissed) return null;

  const isKnownBairro = BAIRROS.some((b) => b.toLowerCase() === demand.bairro.toLowerCase());

  const whatsLink = demand.eleitorNome
    ? `https://wa.me/?text=${encodeURIComponent(`Olá ${demand.eleitorNome}, sua demanda sobre "${editText.slice(0, 60)}..." já foi registrada pelo nosso gabinete. Estamos trabalhando! 🤝`)}`
    : null;

  return (
    <div
      className={cn(
        "relative border p-3 transition-all duration-500 animate-fade-in",
        demand.isNew
          ? "border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_20px_hsl(152_100%_40%/0.15)]"
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      {/* New indicator pulse */}
      {demand.isNew && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </div>
      )}

      {/* Header: Assessor | Bairro + territory tag */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1 text-[11px] font-medium text-foreground">
          <User className="h-3 w-3 text-primary" />
          {demand.assessor}
        </div>
        <span className="text-muted-foreground text-[10px]">|</span>
        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {demand.bairro}
        </div>

        {/* New territory tag */}
        {(demand.isNewTerritory || !isKnownBairro) && (
          <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-violet-500 to-primary text-white border-0 font-medium gap-0.5">
            <Sparkles className="h-2.5 w-2.5" />
            Novo Território
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          {timeAgo(demand.timestamp)}
        </div>
      </div>

      {/* Transcription - editable or highlighted */}
      <div className="flex items-start gap-2 mb-3">
        <Mic className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
        {editing ? (
          <div className="flex-1 space-y-1.5">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="text-xs min-h-[60px]"
              autoFocus
            />
            <Button
              size="sm"
              className="h-6 text-[10px] font-medium gap-1"
              onClick={() => setEditing(false)}
            >
              <Check className="h-3 w-3" />
              Confirmar
            </Button>
          </div>
        ) : (
          <div className="flex-1 group/edit">
            <p className="text-xs leading-relaxed text-foreground/90">
              {highlightKeywords(editText)}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover/edit:opacity-100"
            >
              <Pencil className="h-2.5 w-2.5" />
              Editar transcrição
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          className="h-7 text-[10px] font-medium gap-1"
          onClick={() => {
            setDismissed(true);
            navigate("/oficios");
          }}
        >
          <FileText className="h-3 w-3" />
          Transformar em Ofício
        </Button>
        {whatsLink && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] font-medium gap-1 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
            onClick={() => window.open(whatsLink, "_blank")}
          >
            <Send className="h-3 w-3" />
            Avisar via WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}

export function RadarDaRua() {
  return (
    <Card className="hover-glow animate-fade-up delay-300 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium tracking-tight">
            <div className="flex h-6 w-6 items-center justify-center bg-emerald-600 text-white rounded-full">
              <Radio className="h-3.5 w-3.5" />
            </div>
            Radar da rua
            <Badge
              variant="outline"
              className="ml-1 text-[10px] font-medium border-emerald-500/50 text-emerald-600 animate-pulse"
            >
              <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
              {mockDemands.filter((d) => d.isNew).length} novas
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {mockDemands.map((demand) => (
          <DemandCard key={demand.id} demand={demand} />
        ))}
      </CardContent>
    </Card>
  );
}
