import { useState } from "react";
import { FileText, Loader2, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// Official colors
const NAVY: [number, number, number] = [15, 30, 61];
const GRAY_DARK: [number, number, number] = [55, 65, 81];
const GRAY_MED: [number, number, number] = [107, 114, 128];
const BLUE_ACCENT: [number, number, number] = [37, 99, 235];
const GREEN: [number, number, number] = [22, 163, 74];
const AMBER: [number, number, number] = [217, 119, 6];
const RED: [number, number, number] = [220, 38, 38];

interface ReportProgress {
  percent: number;
  label: string;
}

export function TransparencyReportModal() {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<ReportProgress>({ percent: 0, label: "" });

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress({ percent: 0, label: "Buscando dados..." });

    try {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const mesLabel = MESES.find((m) => m.value === selectedMonth)?.label ?? "";
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      // Fetch all data in parallel
      setProgress({ percent: 10, label: "Buscando eleitores e assessores..." });

      const [eleitoresRes, assessoresRes] = await Promise.all([
        supabase
          .from("eleitores")
          .select("*")
          .gte("created_at", startDate)
          .lte("created_at", endDate)
          .order("created_at", { ascending: false }),
        supabase.from("assessores").select("*").order("cadastros", { ascending: false }),
      ]);

      if (eleitoresRes.error) throw eleitoresRes.error;
      if (assessoresRes.error) throw assessoresRes.error;

      const eleitores = eleitoresRes.data ?? [];
      const assessores = assessoresRes.data ?? [];

      setProgress({ percent: 40, label: "Processando estatísticas..." });
      await new Promise((r) => setTimeout(r, 100));

      // Stats
      const totalEleitores = eleitores.length;
      const bairroCounts: Record<string, number> = {};
      const situacaoCounts: Record<string, number> = {};
      const categoriaCounts: Record<string, number> = {};

      eleitores.forEach((e) => {
        if (e.bairro) bairroCounts[e.bairro] = (bairroCounts[e.bairro] || 0) + 1;
        situacaoCounts[e.situacao] = (situacaoCounts[e.situacao] || 0) + 1;
      });

      // Category mapping based on situacao
      const categoriaMap: Record<string, string> = {
        "Novo Cadastro": "Captação",
        "Pendente": "Demanda Pendente",
        "Atendido": "Demanda Atendida",
        "Em Andamento": "Infraestrutura",
      };
      eleitores.forEach((e) => {
        const cat = categoriaMap[e.situacao] || e.situacao;
        categoriaCounts[cat] = (categoriaCounts[cat] || 0) + 1;
      });

      const totalBairros = Object.keys(bairroCounts).length;
      const topBairros = Object.entries(bairroCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const pendentes = situacaoCounts["Pendente"] ?? 0;
      const atendidos = situacaoCounts["Atendido"] ?? 0;

      // Photos count
      let totalFotos = 0;
      eleitores.forEach((e) => {
        const imgs = e.image_urls as any;
        if (imgs && Array.isArray(imgs)) totalFotos += imgs.length;
      });

      setProgress({ percent: 60, label: "Gerando PDF..." });
      await new Promise((r) => setTimeout(r, 100));

      // ========== PDF GENERATION ==========
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = 0;

      // --- HEADER ---
      // Navy bar
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 38, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("RELATÓRIO DE TRANSPARÊNCIA", margin, 16);

      // Subtitle
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Prestação de Contas do Mandato Parlamentar", margin, 24);

      // Period badge
      doc.setFillColor(...BLUE_ACCENT);
      const periodText = `${mesLabel} ${selectedYear}`;
      const periodW = doc.getTextWidth(periodText) + 12;
      doc.roundedRect(pageW - margin - periodW, 10, periodW, 10, 2, 2, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(periodText, pageW - margin - periodW + 6, 17);

      // Shield icon text
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Documento Oficial • QG Digital", pageW - margin - periodW, 30);

      y = 48;

      // --- RESUMO EXECUTIVO ---
      doc.setFillColor(240, 244, 248);
      doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
      doc.setTextColor(...NAVY);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMO EXECUTIVO", margin + 4, y + 6);
      y += 14;

      // Summary cards (3 columns)
      const cardW = (pageW - 2 * margin - 10) / 3;
      const cardH = 28;

      const summaryCards = [
        { value: String(totalEleitores), label: "Demandas\nRecebidas", color: BLUE_ACCENT },
        { value: String(totalBairros), label: "Bairros\nAtendidos", color: GREEN },
        { value: String(atendidos), label: "Demandas\nAtendidas", color: AMBER },
      ];

      summaryCards.forEach((card, i) => {
        const cx = margin + i * (cardW + 5);
        doc.setFillColor(250, 251, 252);
        doc.setDrawColor(220, 225, 230);
        doc.roundedRect(cx, y, cardW, cardH, 2, 2, "FD");

        // Accent line top
        doc.setFillColor(...card.color);
        doc.rect(cx, y, cardW, 2, "F");

        doc.setTextColor(...card.color);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(card.value, cx + cardW / 2, y + 14, { align: "center" });

        doc.setTextColor(...GRAY_MED);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const lines = card.label.split("\n");
        lines.forEach((line, li) => {
          doc.text(line, cx + cardW / 2, y + 20 + li * 4, { align: "center" });
        });
      });

      y += cardH + 8;

      // Extra stats row
      const extraCards = [
        { value: String(pendentes), label: "Pendentes", color: RED },
        { value: String(assessores.length), label: "Assessores Ativos", color: BLUE_ACCENT },
        { value: String(totalFotos), label: "Registros Fotográficos", color: GREEN },
      ];

      extraCards.forEach((card, i) => {
        const cx = margin + i * (cardW + 5);
        doc.setFillColor(250, 251, 252);
        doc.setDrawColor(220, 225, 230);
        doc.roundedRect(cx, y, cardW, 18, 2, 2, "FD");

        doc.setTextColor(...card.color);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(card.value, cx + 8, y + 11);

        doc.setTextColor(...GRAY_DARK);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(card.label, cx + 8 + doc.getTextWidth(card.value + "  ") + 2, y + 11);
      });

      y += 26;

      setProgress({ percent: 75, label: "Adicionando tabelas..." });

      // --- MAPA DE ATUAÇÃO (Top 5 Bairros) ---
      doc.setFillColor(240, 244, 248);
      doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
      doc.setTextColor(...NAVY);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("MAPA DE ATUAÇÃO — TOP 5 BAIRROS", margin + 4, y + 6);
      y += 12;

      if (topBairros.length > 0) {
        const maxVal = topBairros[0][1];
        topBairros.forEach(([bairro, count], i) => {
          const barW = ((pageW - 2 * margin - 60) * count) / maxVal;

          doc.setTextColor(...GRAY_DARK);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`${i + 1}. ${bairro}`, margin + 2, y + 5);

          // Progress bar
          doc.setFillColor(230, 235, 240);
          doc.roundedRect(margin + 55, y + 1, pageW - 2 * margin - 60, 5, 1, 1, "F");

          const barColor = i === 0 ? BLUE_ACCENT : i === 1 ? GREEN : GRAY_MED;
          doc.setFillColor(...barColor);
          doc.roundedRect(margin + 55, y + 1, Math.max(barW, 3), 5, 1, 1, "F");

          doc.setTextColor(...barColor);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text(`${count}`, margin + 57 + barW + 3, y + 5.5);

          y += 9;
        });
      } else {
        doc.setTextColor(...GRAY_MED);
        doc.setFontSize(9);
        doc.text("Nenhum bairro registrado no período.", margin + 4, y + 5);
        y += 10;
      }

      y += 6;

      // --- GRÁFICO DE CATEGORIAS (simulated pie chart as colored bars) ---
      doc.setFillColor(240, 244, 248);
      doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
      doc.setTextColor(...NAVY);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DISTRIBUIÇÃO POR CATEGORIA", margin + 4, y + 6);
      y += 12;

      const catColors = [BLUE_ACCENT, GREEN, AMBER, RED, GRAY_MED];
      const catEntries = Object.entries(categoriaCounts).sort((a, b) => b[1] - a[1]);
      const catTotal = catEntries.reduce((sum, [, v]) => sum + v, 0) || 1;

      catEntries.forEach(([cat, count], i) => {
        const pct = Math.round((count / catTotal) * 100);
        const color = catColors[i % catColors.length];

        doc.setFillColor(...color);
        doc.circle(margin + 5, y + 3, 2.5, "F");

        doc.setTextColor(...GRAY_DARK);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${cat}`, margin + 12, y + 4.5);

        doc.setTextColor(...color);
        doc.setFont("helvetica", "bold");
        doc.text(`${pct}% (${count})`, margin + 80, y + 4.5);

        // Mini bar
        const barMaxW = 70;
        doc.setFillColor(230, 235, 240);
        doc.roundedRect(margin + 105, y + 1, barMaxW, 4, 1, 1, "F");
        doc.setFillColor(...color);
        doc.roundedRect(margin + 105, y + 1, Math.max((barMaxW * pct) / 100, 2), 4, 1, 1, "F");

        y += 8;
      });

      y += 6;

      // --- TABELA DE DEMANDAS ---
      // Check if we need a new page
      if (y > pageH - 80) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(240, 244, 248);
      doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
      doc.setTextColor(...NAVY);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TABELA DE DEMANDAS", margin + 4, y + 6);
      y += 12;

      const tableData = eleitores.slice(0, 30).map((e) => {
        const ass = assessores.find((a) => a.id === e.assessor_id);
        const imgs = e.image_urls as any;
        const temFoto = imgs && Array.isArray(imgs) && imgs.length > 0 ? "Sim" : "Não";
        return [
          new Date(e.created_at).toLocaleDateString("pt-BR"),
          e.bairro || "—",
          e.situacao,
          e.nome,
          ass?.nome ?? "—",
          temFoto,
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [["Data", "Bairro", "Status", "Eleitor", "Assessor", "Foto"]],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          textColor: [...GRAY_DARK],
          lineColor: [220, 225, 230],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [...NAVY],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 28 },
          2: { cellWidth: 28 },
          3: { cellWidth: 45 },
          4: { cellWidth: 35 },
          5: { cellWidth: 14 },
        },
      });

      // --- FOOTER on every page ---
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);

        // Footer line
        doc.setDrawColor(...NAVY);
        doc.setLineWidth(0.5);
        doc.line(margin, pageH - 18, pageW - margin, pageH - 18);

        // Footer text
        doc.setTextColor(...GRAY_MED);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(
          "Gerado automaticamente pelo Sistema QG Digital — Gestão e Transparência",
          margin,
          pageH - 13
        );
        doc.text(
          `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
          margin,
          pageH - 9
        );

        // Page number
        doc.setFont("helvetica", "bold");
        doc.text(`Página ${p} de ${totalPages}`, pageW - margin, pageH - 13, { align: "right" });
      }

      setProgress({ percent: 95, label: "Finalizando..." });
      await new Promise((r) => setTimeout(r, 200));

      const filename = `QG_Digital_Transparencia_${mesLabel}_${selectedYear}.pdf`;
      doc.save(filename);

      setProgress({ percent: 100, label: "Concluído!" });
      await new Promise((r) => setTimeout(r, 500));

      toast.success(`Relatório de Transparência exportado: ${filename}`);
      setOpen(false);
    } catch (err: any) {
      toast.error(`Erro ao gerar relatório: ${err.message}`);
    } finally {
      setGenerating(false);
      setProgress({ percent: 0, label: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!generating) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 font-bold uppercase tracking-wider text-xs border-primary/30 hover:border-primary">
          <Shield className="h-4 w-4" />
          Gerar PDF de Prestação de Contas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Relatório de Transparência
          </DialogTitle>
        </DialogHeader>

        {generating ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <Progress value={progress.percent} className="h-3" />
              <p className="text-xs text-muted-foreground text-center font-bold">
                {progress.label} ({progress.percent}%)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Gere um PDF profissional de prestação de contas com resumo executivo, mapa de atuação, distribuição por categoria e tabela de demandas.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Mês</Label>
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
                <Label className="text-xs font-bold uppercase tracking-wider">Ano</Label>
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

            <Button
              className="w-full h-12 gap-2 font-bold uppercase tracking-wider"
              onClick={handleGenerate}
            >
              <Download className="h-4 w-4" />
              Gerar e Baixar PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
