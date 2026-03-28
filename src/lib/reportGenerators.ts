import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import {
  PDFGabineteConfig,
  PDFResult,
  drawPDFHeader,
  addFooterToAllPages,
  buildPDFResult,
  loadImageAsBase64,
} from "./pdfTemplateUtils";
import { applyDocumentSecurity } from "./pdfSecurityUtils";

const NAVY: [number, number, number] = [30, 41, 59];
const PURPLE: [number, number, number] = [124, 58, 237];
const GRAY: [number, number, number] = [107, 114, 128];
const GREEN: [number, number, number] = [34, 197, 94];
const AMBER: [number, number, number] = [245, 158, 11];

function getMesAno() {
  const now = new Date();
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return { mes: meses[now.getMonth()], ano: now.getFullYear(), periodo: `${meses[now.getMonth()]}/${now.getFullYear()}` };
}

export async function generateStrategicReport(gabConfig?: PDFGabineteConfig): Promise<PDFResult> {
  const { periodo } = getMesAno();
  const defaultConfig: PDFGabineteConfig = gabConfig ?? {
    corPrimaria: "#1E3A8A",
    nomeVereador: "Gabinete",
    cidadeEstado: "Teixeira de Freitas - BA",
  };

  // Fetch data
  const [eleitoresRes, assessoresRes] = await Promise.all([
    supabase.from("eleitores").select("*, assessores(nome)").order("created_at", { ascending: false }),
    supabase.from("assessores").select("*"),
  ]);

  const eleitores = eleitoresRes.data ?? [];
  const assessores = assessoresRes.data ?? [];

  // Load images
  const [logoBase64, camaraLogoBase64] = await Promise.all([
    defaultConfig.logoUrl ? loadImageAsBase64(defaultConfig.logoUrl) : Promise.resolve(null),
    defaultConfig.camaraLogoUrl ? loadImageAsBase64(defaultConfig.camaraLogoUrl) : Promise.resolve(null),
  ]);

  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  let y = drawPDFHeader(doc, defaultConfig, { logoBase64, camaraLogoBase64 });

  // ===== Section 1: Produtividade por Assessor =====
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PRODUTIVIDADE POR ASSESSOR", margin + 4, y + 6);
  y += 12;

  const assessorStats = assessores.map((a: any) => {
    const linked = eleitores.filter((e: any) => e.assessor_id === a.id);
    const resolvidos = linked.filter((e: any) => e.situacao === "Resolvido" || e.situacao === "Atendido").length;
    return [a.nome, String(linked.length), String(resolvidos)];
  });

  autoTable(doc, {
    startY: y,
    head: [["Assessor", "Total Cadastros", "Demandas Resolvidas"]],
    body: assessorStats.length > 0 ? assessorStats : [["—", "0", "0"]],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 248, 255] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ===== Section 2: Demandas Abertas =====
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DEMANDAS ABERTAS", margin + 4, y + 6);
  y += 12;

  const abertas = eleitores
    .filter((e: any) => e.situacao !== "Resolvido" && e.situacao !== "Atendido" && e.situacao !== "Arquivado")
    .map((e: any) => {
      const dias = Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86400000);
      return [e.nome, e.bairro || "—", String(dias)];
    })
    .sort((a, b) => parseInt(b[2]) - parseInt(a[2]))
    .slice(0, 30);

  autoTable(doc, {
    startY: y,
    head: [["Eleitor", "Bairro", "Dias em Aberto"]],
    body: abertas.length > 0 ? abertas : [["Nenhuma demanda aberta", "—", "—"]],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 251, 235] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ===== Section 3: Assuntos mais Reclamados (pie chart as text breakdown) =====
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DISTRIBUIÇÃO POR STATUS", margin + 4, y + 6);
  y += 14;

  const statusCount: Record<string, number> = {};
  eleitores.forEach((e: any) => {
    statusCount[e.situacao] = (statusCount[e.situacao] || 0) + 1;
  });

  const total = eleitores.length || 1;
  const statusEntries = Object.entries(statusCount).sort((a, b) => b[1] - a[1]);
  const colors: [number, number, number][] = [PURPLE, GREEN, AMBER, NAVY, GRAY];

  statusEntries.forEach(([status, count], i) => {
    const pct = ((count / total) * 100).toFixed(1);
    const barW = (count / total) * (pageW - 2 * margin - 60);
    const color = colors[i % colors.length];

    doc.setFillColor(...color);
    doc.roundedRect(margin, y, barW, 6, 1, 1, "F");

    doc.setTextColor(...NAVY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${status} (${count} - ${pct}%)`, margin + barW + 4, y + 5);
    y += 10;
  });

  // Security: watermark + QR + hash + registro
  const strSeqId = Date.now().toString(36).toUpperCase().slice(-6);
  const strProtocolo = `RE-${strSeqId}`;
  await applyDocumentSecurity(doc, strProtocolo, {
    tipo_doc: "relatorio_estrategico",
    nome_vereador: defaultConfig.nomeVereador,
    cidade_estado: defaultConfig.cidadeEstado,
    dados_resumo: { periodo },
  }, defaultConfig.nomeVereador || "RELATÓRIO ESTRATÉGICO");

  // Footer
  addFooterToAllPages(doc, defaultConfig);

  const fileName = `relatorio_estrategico_${periodo.replace("/", "_")}.pdf`;
  return buildPDFResult(doc, fileName);
}

export async function generatePublicReport(gabConfig?: PDFGabineteConfig): Promise<PDFResult> {
  const { periodo, mes, ano } = getMesAno();
  const defaultConfig: PDFGabineteConfig = gabConfig ?? {
    corPrimaria: "#1E3A8A",
    nomeVereador: "Gabinete",
    cidadeEstado: "Teixeira de Freitas - BA",
  };

  const [eleitoresRes] = await Promise.all([
    supabase.from("eleitores").select("*").order("created_at", { ascending: false }),
  ]);

  const eleitores = eleitoresRes.data ?? [];

  // Load images
  const [logoBase64, camaraLogoBase64] = await Promise.all([
    defaultConfig.logoUrl ? loadImageAsBase64(defaultConfig.logoUrl) : Promise.resolve(null),
    defaultConfig.camaraLogoUrl ? loadImageAsBase64(defaultConfig.camaraLogoUrl) : Promise.resolve(null),
  ]);

  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  let y = drawPDFHeader(doc, defaultConfig, { logoBase64, camaraLogoBase64 });

  // ===== Resumo de Conquistas =====
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO DE CONQUISTAS", margin + 4, y + 6);
  y += 14;

  const totalBairros = new Set(eleitores.map((e: any) => e.bairro).filter(Boolean)).size;
  const totalAtendidos = eleitores.filter((e: any) => e.situacao === "Resolvido" || e.situacao === "Atendido").length;

  const conquistas = [
    `Neste mês de ${mes}, atendemos ${totalBairros} bairros diferentes.`,
    `${totalAtendidos} demandas foram resolvidas com sucesso.`,
    `${eleitores.length} cidadãos estão cadastrados no sistema de atendimento.`,
  ];

  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  conquistas.forEach((c) => {
    doc.text(`✓  ${c}`, margin + 2, y);
    y += 7;
  });

  y += 6;

  // ===== Atendimentos por Bairro (Anonymized) =====
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ATENDIMENTOS REALIZADOS", margin + 4, y + 6);
  y += 12;

  const bairroGroups: Record<string, number> = {};
  eleitores.forEach((e: any) => {
    if (e.bairro) bairroGroups[e.bairro] = (bairroGroups[e.bairro] || 0) + 1;
  });

  const bairroRows = Object.entries(bairroGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([bairro, count], i) => [`Cidadão do Bairro ${bairro}`, bairro, String(count)]);

  autoTable(doc, {
    startY: y,
    head: [["Identificação", "Bairro", "Atendimentos"]],
    body: bairroRows.length > 0 ? bairroRows : [["—", "—", "0"]],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [239, 246, 255] },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ===== Galeria placeholder =====
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 8, 1, 1, "F");
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("GALERIA DE AÇÕES", margin + 4, y + 6);
  y += 14;

  // Photo grid placeholder
  const photoW = (pageW - 2 * margin - 10) / 2;
  const photoH = 35;

  for (let row = 0; row < 2; row++) {
    if (y + photoH > 270) { doc.addPage(); y = 20; }
    for (let col = 0; col < 2; col++) {
      const px = margin + col * (photoW + 10);
      doc.setFillColor(240, 240, 245);
      doc.setDrawColor(200, 200, 210);
      doc.roundedRect(px, y, photoW, photoH, 2, 2, "FD");
      doc.setTextColor(160, 160, 170);
      doc.setFontSize(8);
      doc.text(row === 0 ? "ANTES" : "DEPOIS", px + photoW / 2, y + photoH / 2, { align: "center" });
    }
    y += photoH + 5;
  }

  // Security: watermark + QR + hash + registro
  const pubSeqId = Date.now().toString(36).toUpperCase().slice(-6);
  const pubProtocolo = `PC-${pubSeqId}`;
  await applyDocumentSecurity(doc, pubProtocolo, {
    tipo_doc: "prestacao_contas",
    nome_vereador: defaultConfig.nomeVereador,
    cidade_estado: defaultConfig.cidadeEstado,
    dados_resumo: { periodo, total_eleitores: eleitores.length },
  }, defaultConfig.nomeVereador || "PRESTAÇÃO DE CONTAS");

  // Footer
  addFooterToAllPages(doc, defaultConfig);

  const fileName = `prestacao_contas_${periodo.replace("/", "_")}.pdf`;
  return buildPDFResult(doc, fileName);
}
