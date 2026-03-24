import { useMemo } from "react";
import { Demanda } from "@/hooks/useDemandas";
import { GabineteCidade } from "@/hooks/useGabinetesCidade";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3, TrendingUp, MapPin, Building2, Users, Target, FileText, AlertCircle, AlertTriangle, Eye, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Unique colors per gabinete index (used for map markers too)
export const GABINETE_COLORS = [
  "hsl(210, 80%, 55%)",   // Blue
  "hsl(330, 70%, 55%)",   // Pink
  "hsl(160, 70%, 45%)",   // Teal
  "hsl(45, 90%, 50%)",    // Gold
  "hsl(270, 65%, 55%)",   // Purple
  "hsl(15, 80%, 55%)",    // Orange
  "hsl(190, 75%, 45%)",   // Cyan
  "hsl(350, 60%, 50%)",   // Rose
];

interface Props {
  demandas: Demanda[];
  eleitoresCount: number;
  selectedCidade?: string | null;
  topCidadesRanking?: [string, { eleitores: number; demandas: number; pendentes: number }][];
  gabinetesCidade?: GabineteCidade[];
  selectedGabineteId?: string | null;
  onSelectCidade?: (cidade: string) => void;
  onSelectGabinete?: (id: string | null) => void;
  onOpenRaioX?: (gabinete: GabineteCidade, index: number) => void;
  onClose?: () => void;
  isL4Plus?: boolean;
  isLoading?: boolean;
  isMobile?: boolean;
}

function gerarRelatorioCidade(cidade: string, gabinetes: GabineteCidade[], demandas: Demanda[], totalEleitores: number) {
  const doc = new jsPDF();
  const now = new Date().toLocaleDateString("pt-BR");

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Relatório — ${cidade}`, 14, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Gerado em ${now} | QG Digital`, 14, 30);
  doc.setTextColor(0);

  // Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo da Cidade", 14, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Total de Eleitores: ${totalEleitores}`, 14, 52);
  doc.text(`Gabinetes ativos: ${gabinetes.length}`, 14, 58);
  const totalPendentes = demandas.filter((d) => d.status === "Pendente").length;
  doc.text(`Demandas pendentes: ${totalPendentes}`, 14, 64);

  // Gabinetes table
  if (gabinetes.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Gabinetes", 14, 78);

    autoTable(doc, {
      startY: 82,
      head: [["Vereador", "Eleitores", "Demandas", "Pendentes", "Resolvidas", "Taxa"]],
      body: gabinetes.map((g) => {
        const taxa = g.total_demandas > 0 ? Math.round((g.demandas_resolvidas / g.total_demandas) * 100) : 0;
        return [
          g.nome_vereador,
          g.total_eleitores.toString(),
          g.total_demandas.toString(),
          g.demandas_pendentes.toString(),
          g.demandas_resolvidas.toString(),
          `${taxa}%`,
        ];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 95] },
    });
  }

  doc.save(`relatorio-${cidade.toLowerCase().replace(/\s+/g, "-")}-${now.replace(/\//g, "-")}.pdf`);
}

export function MapaSidebar({
  demandas,
  eleitoresCount,
  selectedCidade,
  topCidadesRanking = [],
  gabinetesCidade = [],
  selectedGabineteId,
  onSelectCidade,
  onSelectGabinete,
  onOpenRaioX,
  onClose,
  isL4Plus,
  isLoading,
  isMobile,
}: Props) {
  const stats = useMemo(() => {
    const pendentes = demandas.filter((d) => d.status === "Pendente");

    const bairroMap: Record<string, number> = {};
    pendentes.forEach((d) => {
      const b = d.bairro || "Sem bairro";
      bairroMap[b] = (bairroMap[b] || 0) + 1;
    });
    const topBairros = Object.entries(bairroMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const catMap: Record<string, number> = {};
    pendentes.forEach((d) => {
      if (d.categoria) catMap[d.categoria] = (catMap[d.categoria] || 0) + 1;
    });
    const topCategorias = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { pendentes: pendentes.length, topBairros, topCategorias };
  }, [demandas]);

  return (
    <div className={`w-72 shrink-0 bg-card border-r border-border flex-col h-full z-intel-panel ${isMobile ? "flex w-full border-r-0" : "flex"}`}>
      {/* Sticky header with close button */}
      <div className="p-4 border-b border-border shrink-0 flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground truncate">
          {selectedCidade ? selectedCidade : "Inteligência Regional"}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center transition-colors shrink-0"
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto min-h-0">

      {isLoading ? (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 rounded-xl" />
          ))}
        </div>
      ) : (
      <>
      {/* Summary cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-lg font-medium text-foreground">{eleitoresCount}</p>
          <p className="text-[10px] font-medium text-muted-foreground">Eleitores</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-lg font-medium text-destructive">{stats.pendentes}</p>
          <p className="text-[10px] font-medium text-muted-foreground">Pendentes</p>
        </div>
      </div>

      {/* Top 5 Cidades ranking (when no city selected) */}
      {!selectedCidade && isL4Plus && topCidadesRanking.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Top 5 Cidades — Eleitores
            </h3>
          </div>
          <div className="space-y-1.5">
            {topCidadesRanking.map(([cidade, data], i) => (
              <button
                key={cidade}
                onClick={() => onSelectCidade?.(cidade)}
                className="flex items-center justify-between w-full hover:bg-muted/50 rounded-xl px-3 py-2 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{cidade}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-primary">{data.eleitores}</span>
                  {data.pendentes > 0 && (
                    <span className="text-[9px] text-destructive ml-1">({data.pendentes}⚠)</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gabinete Cards from DB view (when city selected) */}
      {selectedCidade && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground truncate">
              Gabinetes em {selectedCidade}
            </h3>
          </div>

          {gabinetesCidade.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Nenhum gabinete ativo nesta região</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gabinetesCidade.map((g, i) => {
                const isSelected = selectedGabineteId === g.gabinete_id;
                const taxa = g.total_demandas > 0 ? Math.round((g.demandas_resolvidas / g.total_demandas) * 100) : 0;
                const gabColor = GABINETE_COLORS[i % GABINETE_COLORS.length];

                return (
                  <button
                    key={g.gabinete_id}
                    onClick={() => onSelectGabinete?.(isSelected ? null : g.gabinete_id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    {/* Vereador avatar + name */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <Avatar
                        className="h-10 w-10 shrink-0"
                        style={{ boxShadow: `0 0 0 2px ${gabColor}` }}
                      >
                        {g.avatar_url && (
                          <AvatarImage
                            src={g.avatar_url}
                            alt={g.nome_vereador ?? ""}
                            className="object-cover"
                            loading="lazy"
                          />
                        )}
                        <AvatarFallback
                          className="text-xs font-medium text-white"
                          style={{ backgroundColor: gabColor }}
                        >
                          {(g.nome_vereador ?? "")
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0].toUpperCase())
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-foreground truncate block">
                          {g.nome_vereador}
                        </span>
                        {isSelected && (
                          <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 mt-0.5">
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <Users className="h-3 w-3 mx-auto text-primary mb-0.5" />
                        <p className="text-sm font-medium text-foreground">{g.total_eleitores}</p>
                        <p className="text-[8px] text-muted-foreground">eleitores</p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="text-center">
                        <TrendingUp className="h-3 w-3 mx-auto text-success mb-0.5" />
                        <p className="text-sm font-medium text-success">{taxa}%</p>
                        <p className="text-[8px] text-muted-foreground">resolvidas</p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="text-center">
                        <BarChart3 className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                        <p className={`text-sm font-medium ${g.demandas_pendentes > 10 ? "text-destructive" : "text-foreground"}`}>
                          {g.demandas_pendentes}
                        </p>
                        <p className="text-[8px] text-muted-foreground">pendentes</p>
                      </div>
                    </div>

                    {/* Raio-X button for L4+ */}
                    {isL4Plus && onOpenRaioX && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenRaioX(g, i); }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium py-1.5 transition-colors"
                      >
                        <Eye className="h-3 w-3" /> Raio-X do Gabinete
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Export PDF button */}
          {gabinetesCidade.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3 h-8 text-[10px] font-medium gap-1.5"
              onClick={() => gerarRelatorioCidade(selectedCidade, gabinetesCidade, demandas, eleitoresCount)}
            >
              <FileText className="h-3 w-3" /> Gerar Relatório da Cidade
            </Button>
          )}
        </div>
      )}

      {/* Top bairros */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-destructive shrink-0" />
          <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Bairros com mais demandas
          </h3>
        </div>
        {stats.topBairros.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dados</p>
        ) : (
          <div className="space-y-2">
            {stats.topBairros.map(([bairro, count]) => (
              <div key={bairro} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive/60 shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">{bairro}</span>
                </div>
                <span className="text-xs font-medium text-destructive shrink-0">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top categories */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Top Categorias</h3>
        </div>
        {stats.topCategorias.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dados</p>
        ) : (
          <div className="space-y-2.5">
            {stats.topCategorias.map(([cat, count]) => {
              const max = stats.topCategorias[0]?.[1] || 1;
              const pct = Math.round((count / (max as number)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center text-xs gap-2">
                    <span className="font-medium text-foreground truncate">{cat}</span>
                    <span className="font-medium text-muted-foreground shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}
      </div>
    </div>
  );
}
