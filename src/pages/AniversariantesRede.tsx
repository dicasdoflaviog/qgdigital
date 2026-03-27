import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Cake, MessageCircle, Mic, Lock, ChevronDown, ChevronUp, Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAniversariantesRede, type AniversarianteRede } from "@/hooks/useAniversariantesRede";

const ROLE_LABELS: Record<string, string> = {
  admin: "Vereador",
  assessor: "Assessor",
  secretaria: "Secretária",
  lider_politico: "Líder político",
  super_admin: "Super admin",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function getGroup(dias: number): "hoje" | "amanha" | "semana" | "mes" {
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanha";
  if (dias <= 7) return "semana";
  return "mes";
}

function gerarMensagem(p: AniversarianteRede, vereadorNome = "seu vereador"): string {
  const primeiro = p.full_name.split(" ")[0];
  if (p.genero === "F") {
    return `Olá ${primeiro}! 🎉 Parabéns pelo seu aniversário! O vereador ${vereadorNome} manda um carinhoso abraço e deseja um dia lindo!`;
  }
  return `Olá ${primeiro}! 🎉 Parabéns pelo seu aniversário! O vereador ${vereadorNome} manda um forte abraço e deseja um dia especial!`;
}

function AniversarianteCard({
  p,
  vereadorNome,
}: {
  p: AniversarianteRede;
  vereadorNome: string;
}) {
  const group = getGroup(p.diasParaAniversario);
  const daysBadge =
    group === "hoje" ? (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0.5 font-medium">
        Hoje 🎂
      </Badge>
    ) : group === "amanha" ? (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0.5 font-medium">
        Amanhã
      </Badge>
    ) : (
      <Badge variant="outline" className="text-blue-600 border-blue-200 text-[10px] px-1.5 py-0.5 font-medium">
        em {p.diasParaAniversario}d
      </Badge>
    );

  const waLink = `https://wa.me/${p.whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent(gerarMensagem(p, vereadorNome))}`;

  return (
    <Card className="rounded-2xl shadow-none border border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={p.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(p.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
              {daysBadge}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ROLE_LABELS[p.role] ?? p.role}
              {p.idade != null ? ` · ${p.idade + (p.diasParaAniversario === 0 ? 0 : 1)} anos` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 text-xs font-medium gap-1.5"
            disabled={!p.whatsapp}
            asChild={Boolean(p.whatsapp)}
          >
            {p.whatsapp ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            ) : (
              <span>
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 text-xs font-medium gap-1.5"
            disabled={!p.voice_configured}
          >
            {p.voice_configured ? (
              <Mic className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            Voz IA
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupSection({
  label,
  items,
  vereadorNome,
}: {
  label: string;
  items: AniversarianteRede[];
  vereadorNome: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
        {label} ({items.length})
      </p>
      <div className="space-y-3">
        {items.map((p) => (
          <AniversarianteCard key={p.id} p={p} vereadorNome={vereadorNome} />
        ))}
      </div>
    </div>
  );
}

export default function AniversariantesRede() {
  const { roleLevel, profile } = useAuth();

  if (roleLevel < 4) return <Navigate to="/" replace />;

  const vereadorNome = profile?.full_name ?? "seu vereador";

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cargo, setCargo] = useState("all");
  const [genero, setGenero] = useState("all");
  const [periodo, setPeriodo] = useState("30");

  const { data = [], isLoading } = useAniversariantesRede({
    cargo: cargo as any,
    genero: genero as any,
    diasAhead: Number(periodo),
  });

  const hoje = data.filter((p) => p.diasParaAniversario === 0);
  const amanha = data.filter((p) => p.diasParaAniversario === 1);
  const semana = data.filter((p) => p.diasParaAniversario > 1 && p.diasParaAniversario <= 7);
  const mes = data.filter((p) => p.diasParaAniversario > 7);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-amber-600" />
            <h1 className="text-base font-medium text-foreground">Aniversariantes da rede</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {filtersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* Collapsible filters */}
        {filtersOpen && (
          <div className="grid grid-cols-2 gap-2 mt-3 pb-1">
            <Select value={cargo} onValueChange={setCargo}>
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                <SelectItem value="admin">Vereador</SelectItem>
                <SelectItem value="assessor">Assessor</SelectItem>
                <SelectItem value="secretaria">Secretária</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genero} onValueChange={setGenero}>
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="h-10 text-xs col-span-2">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Próximos 7 dias</SelectItem>
                <SelectItem value="15">Próximos 15 dias</SelectItem>
                <SelectItem value="30">Próximos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="rounded-2xl shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-10 flex-1 rounded-md" />
                    <Skeleton className="h-10 flex-1 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Cake className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum aniversariante</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Não há aniversariantes no período selecionado com os filtros aplicados.
            </p>
          </div>
        ) : (
          <>
            <GroupSection label="Hoje" items={hoje} vereadorNome={vereadorNome} />
            <GroupSection label="Amanhã" items={amanha} vereadorNome={vereadorNome} />
            <GroupSection label="Esta semana" items={semana} vereadorNome={vereadorNome} />
            <GroupSection label="Este mês" items={mes} vereadorNome={vereadorNome} />
          </>
        )}
      </div>
    </div>
  );
}
