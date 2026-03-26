import { useState } from "react";
import { FileSpreadsheet, Loader2, Download, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const MESES = [
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];

interface ReportProgress {
  current: number;
  total: number;
  percent: number;
  label: string;
}

export function RelatorioModal() {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<ReportProgress>({ current: 0, total: 0, percent: 0, label: "" });

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [filtroBairro, setFiltroBairro] = useState("");
  const [filtroAssessor, setFiltroAssessor] = useState("");

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress({ current: 0, total: 4, percent: 0, label: "Buscando assessores..." });

    try {
      // Step 1: Fetch assessores
      const { data: assessores, error: assErr } = await supabase
        .from("assessores")
        .select("*")
        .order("cadastros", { ascending: false });
      if (assErr) throw assErr;

      setProgress({ current: 1, total: 4, percent: 25, label: "Buscando eleitores..." });
      await new Promise((r) => setTimeout(r, 100));

      // Step 2: Fetch eleitores for the selected period
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      let eleitorQuery = supabase
        .from("eleitores")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (filtroBairro.trim()) {
        eleitorQuery = eleitorQuery.ilike("bairro", `%${filtroBairro.trim()}%`);
      }

      const { data: eleitores, error: elErr } = await eleitorQuery;
      if (elErr) throw elErr;

      setProgress({ current: 2, total: 4, percent: 50, label: "Consolidando dados..." });
      await new Promise((r) => setTimeout(r, 100));

      // Step 3: Build report data
      const allEleitores = eleitores ?? [];

      // Filter by assessor name if provided
      let filteredEleitores = allEleitores;
      if (filtroAssessor.trim() && assessores) {
        const matchingAssessorIds = assessores
          .filter((a) => a.nome.toLowerCase().includes(filtroAssessor.trim().toLowerCase()))
          .map((a) => a.id);
        filteredEleitores = allEleitores.filter((e) => matchingAssessorIds.includes(e.assessor_id ?? ""));
      }

      // Bairro stats
      const bairroCounts: Record<string, number> = {};
      filteredEleitores.forEach((e) => {
        if (e.bairro) bairroCounts[e.bairro] = (bairroCounts[e.bairro] || 0) + 1;
      });
      const bairroMaisAtivo = Object.entries(bairroCounts).sort((a, b) => b[1] - a[1])[0];

      // Situacao stats
      const situacaoCounts: Record<string, number> = {};
      filteredEleitores.forEach((e) => {
        situacaoCounts[e.situacao] = (situacaoCounts[e.situacao] || 0) + 1;
      });

      // Assessor ranking
      const assessorMap: Record<string, { nome: string; cadastros: number; comFoto: number }> = {};
      filteredEleitores.forEach((e) => {
        const assId = e.assessor_id ?? "sem_assessor";
        if (!assessorMap[assId]) {
          const ass = assessores?.find((a) => a.id === assId);
          assessorMap[assId] = { nome: ass?.nome ?? "Sem assessor", cadastros: 0, comFoto: 0 };
        }
        assessorMap[assId].cadastros++;
        const imgs = e.image_urls as any;
        if (imgs && Array.isArray(imgs) && imgs.length > 0) {
          assessorMap[assId].comFoto++;
        }
      });
      const rankingSorted = Object.values(assessorMap).sort((a, b) => b.cadastros - a.cadastros).slice(0, 15);

      setProgress({ current: 3, total: 4, percent: 75, label: "Gerando planilha..." });
      await new Promise((r) => setTimeout(r, 100));

      // Step 4: Generate Excel
      const mesLabel = MESES.find((m) => m.value === selectedMonth)?.label ?? "";

      // Aba 1: Resumo
      const resumoData = [
        { Métrica: "Período", Valor: `${mesLabel} ${selectedYear}` },
        { Métrica: "Total de Eleitores no Período", Valor: filteredEleitores.length },
        { Métrica: "Novos Cadastros", Valor: filteredEleitores.filter((e) => e.situacao === "Novo Cadastro").length },
        { Métrica: "Demandas Pendentes", Valor: situacaoCounts["Pendente"] ?? 0 },
        { Métrica: "Demandas Atendidas", Valor: situacaoCounts["Atendido"] ?? 0 },
        { Métrica: "Bairro Mais Ativo", Valor: bairroMaisAtivo ? `${bairroMaisAtivo[0]} (${bairroMaisAtivo[1]} eleitores)` : "—" },
        { Métrica: "Total de Bairros Atendidos", Valor: Object.keys(bairroCounts).length },
        { Métrica: "Assessores Ativos", Valor: Object.keys(assessorMap).length },
      ];
      const resumoSheet = XLSX.utils.json_to_sheet(resumoData);
      resumoSheet["!cols"] = [{ wch: 30 }, { wch: 40 }];

      // Aba 2: Ranking
      const rankingData = rankingSorted.map((a, i) => ({
        "Posição": i + 1,
        "Nome": a.nome,
        "Cadastros": a.cadastros,
        "Com Foto": a.comFoto,
        "% Fotos": a.cadastros > 0 ? `${Math.round((a.comFoto / a.cadastros) * 100)}%` : "0%",
      }));
      const rankingSheet = XLSX.utils.json_to_sheet(rankingData);
      rankingSheet["!cols"] = [{ wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];

      // Aba 3: Eleitores detalhados
      const detalhesData = filteredEleitores.map((e) => {
        const ass = assessores?.find((a) => a.id === e.assessor_id);
        const imgs = e.image_urls as any;
        return {
          "Nome": e.nome,
          "Bairro": e.bairro,
          "WhatsApp": e.whatsapp,
          "Situação": e.situacao,
          "Líder": e.is_leader ? "Sim" : "Não",
          "Assessor": ass?.nome ?? "—",
          "Data Cadastro": new Date(e.created_at).toLocaleDateString("pt-BR"),
          "Fotos": imgs && Array.isArray(imgs) ? imgs.length : 0,
        };
      });
      const detalhesSheet = XLSX.utils.json_to_sheet(detalhesData);
      detalhesSheet["!cols"] = [
        { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
        { wch: 8 }, { wch: 20 }, { wch: 15 }, { wch: 8 },
      ];

      // Aba 4: Bairros
      const bairrosData = Object.entries(bairroCounts)
        .sort((a, b) => b[1] - a[1])
        .map((b, i) => ({ "Posição": i + 1, "Bairro": b[0], "Eleitores": b[1] }));
      const bairrosSheet = XLSX.utils.json_to_sheet(bairrosData);
      bairrosSheet["!cols"] = [{ wch: 8 }, { wch: 25 }, { wch: 12 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, resumoSheet, "Resumo");
      XLSX.utils.book_append_sheet(workbook, rankingSheet, "Ranking Assessores");
      XLSX.utils.book_append_sheet(workbook, detalhesSheet, "Eleitores");
      XLSX.utils.book_append_sheet(workbook, bairrosSheet, "Bairros");

      const filename = `QG_Digital_Relatorio_${mesLabel}_${selectedYear}.xlsx`;
      XLSX.writeFile(workbook, filename);

      setProgress({ current: 4, total: 4, percent: 100, label: "Concluído!" });
      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Relatório exportado: ${filename}`);
      setOpen(false);
    } catch (err: any) {
      toast.error(`Erro ao gerar relatório: ${err.message}`);
    } finally {
      setGenerating(false);
      setProgress({ current: 0, total: 0, percent: 0, label: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!generating) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 font-medium text-xs">
          <FileSpreadsheet className="h-4 w-4" />
          Gerar Relatório Estratégico Mensal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-medium">
            Relatório Estratégico
          </DialogTitle>
        </DialogHeader>

        {generating ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <Progress value={progress.percent} className="h-3" />
              <p className="text-xs text-muted-foreground text-center font-medium">
                {progress.label} ({progress.percent}%)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Mês</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Ano</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Filtrar por Bairro (opcional)</Label>
              <Input
                value={filtroBairro}
                onChange={(e) => setFiltroBairro(e.target.value)}
                placeholder="Ex: Centro, Liberdade..."
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Filtrar por Assessor (opcional)</Label>
              <Input
                value={filtroAssessor}
                onChange={(e) => setFiltroAssessor(e.target.value)}
                placeholder="Nome do assessor..."
              />
            </div>

            <Button
              className="w-full h-12 gap-2 font-medium"
              onClick={handleGenerate}
            >
              <Download className="h-4 w-4" />
              Gerar e Baixar Relatório
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
