import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

const NAVY: [number, number, number] = [30, 41, 59];
const PRIMARY: [number, number, number] = [124, 58, 237];
const GRAY: [number, number, number] = [107, 114, 128];
const DARK: [number, number, number] = [45, 45, 60];

function getMesAno() {
  const now = new Date();
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return { mes: meses[now.getMonth()], ano: now.getFullYear(), periodo: `${meses[now.getMonth()]}/${now.getFullYear()}` };
}

interface ReportFilters {
  cidadeFoco?: string;
  userId: string;
  userName?: string;
}

export async function generateIntelligenceReport(filters: ReportFilters) {
  const { periodo } = getMesAno();
  const regiao = filters.cidadeFoco || "Todas as Regiões";

  // 1. Fetch demandas (last 30 days, filtered by city if set)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  let demandasQuery = supabase
    .from("demandas")
    .select("categoria, descricao, bairro, status, created_at")
    .gte("created_at", thirtyDaysAgo)
    .eq("excluido", false);

  // Fetch eleitores for bairro stats
  let eleitoresQuery = supabase
    .from("eleitores")
    .select("bairro, cidade, situacao, created_at")
    .eq("excluido", false);

  if (filters.cidadeFoco) {
    demandasQuery = demandasQuery.ilike("bairro", `%${filters.cidadeFoco}%`);
    eleitoresQuery = eleitoresQuery.eq("cidade", filters.cidadeFoco);
  }

  const [demandasRes, eleitoresRes] = await Promise.all([
    demandasQuery.limit(500),
    eleitoresQuery.limit(1000),
  ]);

  const demandas = demandasRes.data ?? [];
  const eleitores = eleitoresRes.data ?? [];

  // 2. AI Temperature Analysis
  let temperaturaText = "Análise indisponível.";
  try {
    const { data: fnData, error } = await supabase.functions.invoke("sentiment-analysis", {
      body: { demandas: demandas.slice(0, 80), regiao },
    });
    if (!error && fnData?.pauta) {
      temperaturaText = fnData.pauta;
    }
  } catch {
    temperaturaText = "Não foi possível gerar a análise de IA neste momento.";
  }

  // 3. Top 5 Bairros by demand count
  const bairroCount: Record<string, number> = {};
  demandas.forEach((d: any) => {
    const b = d.bairro || "Sem bairro";
    bairroCount[b] = (bairroCount[b] || 0) + 1;
  });
  const top5Bairros = Object.entries(bairroCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 4. Status breakdown
  const statusCount: Record<string, number> = {};
  demandas.forEach((d: any) => {
    statusCount[d.status || "Sem status"] = (statusCount[d.status || "Sem status"] || 0) + 1;
  });

  // ===== BUILD PDF =====
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 0;

  // --- Header with QG Digital letterhead ---
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 36, pageW, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("QG Digital — Relatório de Inteligência", margin, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Região: ${regiao}  •  Período: ${periodo}`, margin, 23);
  doc.setFontSize(8);
  doc.text(`Emitido em: ${new Date().toLocaleString("pt-BR")}  •  Por: ${filters.userName || "Usuário"}`, margin, 30);

  y = 46;

  // --- Section: Temperatura Política (AI) ---
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TEMPERATURA POLÍTICA — ANÁLISE DE IA", margin + 4, y + 6);
  y += 12;

  doc.setTextColor(...NAVY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const splitText = doc.splitTextToSize(temperaturaText, pageW - 2 * margin - 4);
  doc.text(splitText, margin + 2, y);
  y += splitText.length * 4.5 + 8;

  // --- Section: Top 5 Bairros ---
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOP 5 BAIRROS COM MAIS DEMANDAS", margin + 4, y + 6);
  y += 12;

  const bairroRows = top5Bairros.length > 0
    ? top5Bairros.map(([bairro, count], i) => [String(i + 1), bairro, String(count)])
    : [["—", "Sem dados", "0"]];

  autoTable(doc, {
    startY: y,
    head: [["#", "Bairro", "Demandas"]],
    body: bairroRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 248, 255] },
    columnStyles: { 0: { cellWidth: 12, halign: "center" } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // --- Section: Breakdown por Status ---
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DISTRIBUIÇÃO POR STATUS DE DEMANDA", margin + 4, y + 6);
  y += 14;

  const totalDemandas = demandas.length || 1;
  const statusEntries = Object.entries(statusCount).sort((a, b) => b[1] - a[1]);
  const barColors: [number, number, number][] = [PRIMARY, [34, 197, 94], [245, 158, 11], NAVY, GRAY];

  statusEntries.forEach(([status, count], i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    const pct = ((count / totalDemandas) * 100).toFixed(1);
    const barW = Math.max(4, (count / totalDemandas) * (pageW - 2 * margin - 70));
    const color = barColors[i % barColors.length];

    doc.setFillColor(...color);
    doc.roundedRect(margin, y, barW, 6, 1, 1, "F");

    doc.setTextColor(...NAVY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${status} (${count} — ${pct}%)`, margin + barW + 4, y + 5);
    y += 10;
  });

  y += 6;

  // --- Section: Resumo numérico ---
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO NUMÉRICO", margin + 4, y + 6);
  y += 14;

  const totalEleitores = eleitores.length;
  const bairrosUnicos = new Set(eleitores.map((e: any) => e.bairro).filter(Boolean)).size;
  const resolvidas = demandas.filter((d: any) => d.status === "Resolvida").length;

  const resumoItems = [
    `Total de eleitores cadastrados: ${totalEleitores}`,
    `Bairros alcançados: ${bairrosUnicos}`,
    `Total de demandas (30 dias): ${demandas.length}`,
    `Demandas resolvidas: ${resolvidas}`,
    `Taxa de resolução: ${demandas.length > 0 ? ((resolvidas / demandas.length) * 100).toFixed(1) : 0}%`,
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  resumoItems.forEach((item) => {
    doc.text(`•  ${item}`, margin + 2, y);
    y += 6;
  });

  // --- Confidential Footer on ALL pages ---
  const addConfidentialFooter = (d: jsPDF) => {
    const pages = d.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      d.setPage(i);
      const pH = d.internal.pageSize.getHeight();

      // Footer bar
      d.setFillColor(...DARK);
      d.rect(0, pH - 14, pageW, 14, "F");

      // Confidential watermark text
      d.setTextColor(255, 255, 255);
      d.setFontSize(7);
      d.setFont("helvetica", "bold");
      d.text(
        "Documento Confidencial — Uso Exclusivo de Inteligência Estratégica",
        pageW / 2,
        pH - 7,
        { align: "center" }
      );

      // Page number
      d.setFont("helvetica", "normal");
      d.setFontSize(6);
      d.text(`Pág ${i}/${pages}  •  QG Digital`, pageW - margin, pH - 4, { align: "right" });
    }
  };

  addConfidentialFooter(doc);

  // 5. Audit log (fire and forget)
  supabase.from("audit_logs").insert({
    user_id: filters.userId,
    action: "GERAR_RELATORIO_INTELIGENCIA",
    acao: "GERAR_RELATORIO_INTELIGENCIA",
    details: {
      regiao,
      periodo,
      total_demandas: demandas.length,
      total_eleitores: eleitores.length,
      top5_bairros: top5Bairros.map(([b, c]) => ({ bairro: b, demandas: c })),
      gerado_em: new Date().toISOString(),
    },
  } as any).then(() => {});

  // Save
  const filename = `relatorio_inteligencia_${regiao.replace(/\s+/g, "_")}_${periodo.replace("/", "_")}.pdf`;
  doc.save(filename);

  return filename;
}
