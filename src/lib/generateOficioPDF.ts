import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";

interface OficioData {
  categoria: string;
  bairro: string;
  descricao: string;
  eleitorNome: string | null;
  status: string;
  criadoEm: string;
  daysOpen: number;
  // Tier 1: Gabinete logo
  logoUrl?: string | null;
  nomeVereador?: string | null;
  // White-label institutional data (gabinete level)
  cidadeEstado?: string | null;
  enderecoSede?: string | null;
  telefoneContato?: string | null;
  nomeMandato?: string | null;
  // Tier 2: Global institutional logo (L5)
  logoInstitucionalUrl?: string | null;
  // Global footer (L5)
  nomeInstituicao?: string | null;
  enderecoRodapeGlobal?: string | null;
  telefoneRodapeGlobal?: string | null;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateOficioPDF(data: OficioData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 25;
  const marginR = 25;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const now = new Date();
  const today = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const ano = now.getFullYear();
  const seqId = Date.now().toString(36).toUpperCase().slice(-6);
  const protocolo = `OF-${seqId}`;
  const oficioNum = `${ano}/${seqId}`;

  // ── 3-tier logo loading ──
  // 1st: Gabinete logo, 2nd: Institutional logo (L5), 3rd: text fallback
  let logoBase64: string | null = null;
  if (data.logoUrl) {
    logoBase64 = await loadImageAsBase64(data.logoUrl);
  }
  if (!logoBase64 && data.logoInstitucionalUrl) {
    logoBase64 = await loadImageAsBase64(data.logoInstitucionalUrl);
  }

  // ══════════════════════════════════════
  // ── Header: Logo + Gabinete Name ──
  // ══════════════════════════════════════
  const headerH = 28;
  doc.setFillColor(30, 58, 138); // Navy
  doc.rect(0, 0, pageW, headerH, "F");

  const logoSize = 18;
  const logoX = marginL;
  const logoY = (headerH - logoSize) / 2;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", logoX, logoY, logoSize, logoSize);
    } catch {
      // Draw placeholder circle
      doc.setFillColor(255, 255, 255);
      doc.circle(logoX + logoSize / 2, headerH / 2, logoSize / 2 - 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(30, 58, 138);
      doc.text("LOGO", logoX + logoSize / 2, headerH / 2 + 2, { align: "center" });
    }
  } else {
    // Tier 3: No logo — show elegant text fallback
    doc.setFillColor(226, 232, 240); // slate-200
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    const fallbackName = (data.nomeVereador || "Vereador").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
    doc.text(fallbackName, logoX + logoSize / 2, headerH / 2 + 2, { align: "center" });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("GABINETE DO VEREADOR", logoX + logoSize + 6, headerH / 2 - 1);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.nomeVereador || "Nome do Vereador", logoX + logoSize + 6, headerH / 2 + 5);

  // ══════════════════════════════════════
  // ── Ofício Number + Date ──
  // ══════════════════════════════════════
  y = headerH + 12;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Ofício nº ${oficioNum}`, pageW / 2, y, { align: "center" });

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Protocolo: ${protocolo}`, marginL, y);
  doc.text(today, pageW - marginR, y, { align: "right" });

  // ── Divider ──
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, pageW - marginR, y);

  // ══════════════════════════════════════
  // ── Assunto ──
  // ══════════════════════════════════════
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("ASSUNTO:", marginL, y);
  doc.setFont("helvetica", "normal");
  doc.text(` Solicitação de Providências - ${data.categoria || "Demanda Geral"}`, marginL + doc.getTextWidth("ASSUNTO: "), y);

  // ══════════════════════════════════════
  // ── Destinatário ──
  // ══════════════════════════════════════
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("DESTINATÁRIO", marginL, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("À Secretaria Municipal de Obras / Serviços Urbanos", marginL, y);

  // ── Divider ──
  y += 8;
  doc.setDrawColor(203, 213, 225);
  doc.line(marginL, y, pageW - marginR, y);

  // ══════════════════════════════════════
  // ── Corpo do Ofício ──
  // ══════════════════════════════════════
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  const eleitorRef = data.eleitorNome || "cidadão(ã) solicitante";
  const enderecoRef = data.bairro || "endereço não especificado";

  const bodyText =
    `Prezados,\n\n` +
    `Solicito a Vossa Senhoria providências urgentes para resolver ` +
    `"${data.descricao || data.categoria || "a demanda registrada"}", ` +
    `conforme pedido do eleitor ${eleitorRef} no endereço ${enderecoRef}.\n\n` +
    `A referida demanda encontra-se registrada na categoria "${data.categoria || "Geral"}" ` +
    `e está em aberto há ${data.daysOpen} dia(s), necessitando de atenção prioritária ` +
    `por parte dessa Secretaria.\n\n` +
    `Solicitamos que as medidas cabíveis sejam adotadas no menor prazo possível, ` +
    `garantindo o atendimento adequado à população.\n\n` +
    `Atenciosamente,`;

  const splitBody = doc.splitTextToSize(bodyText, contentW);
  doc.text(splitBody, marginL, y);
  y += splitBody.length * 5 + 25;

  // ══════════════════════════════════════
  // ── Assinatura ──
  // ══════════════════════════════════════
  const sigX = pageW / 2;
  doc.setDrawColor(100, 116, 139);
  doc.line(sigX - 45, y, sigX + 45, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(data.nomeVereador || "Vereador(a)", sigX, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Assinatura do Vereador(a)", sigX, y, { align: "center" });

  // ══════════════════════════════════════
  // ── Footer ──
  // ══════════════════════════════════════
  const footerY = pageH - 18;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);

  // Line 1: Gabinete-level institutional footer
  const footerParts: string[] = [];
  if (data.nomeMandato) footerParts.push(data.nomeMandato);
  if (data.cidadeEstado) footerParts.push(data.cidadeEstado);
  if (data.enderecoSede) footerParts.push(data.enderecoSede);
  if (data.telefoneContato) footerParts.push(`Tel: ${data.telefoneContato}`);

  if (footerParts.length > 0) {
    doc.text(footerParts.join(" • "), pageW / 2, footerY - 8, { align: "center" });
  }

  // Line 2: Global institutional footer (L5)
  const globalParts: string[] = [];
  if (data.nomeInstituicao) globalParts.push(data.nomeInstituicao);
  if (data.enderecoRodapeGlobal) globalParts.push(data.enderecoRodapeGlobal);
  if (data.telefoneRodapeGlobal) globalParts.push(`Tel: ${data.telefoneRodapeGlobal}`);

  if (globalParts.length > 0) {
    doc.text(globalParts.join(" • "), pageW / 2, footerY - 4, { align: "center" });
  }

  // Line 3: Auto-generated notice
  doc.text(
    `Documento gerado automaticamente pelo ${BRAND.name} em ${today}. Protocolo: ${protocolo}`,
    pageW / 2,
    footerY,
    { align: "center" }
  );

  // Line 4: Brand credit — always present
  doc.setFontSize(6);
  doc.setTextColor(160, 174, 192);
  doc.text(BRAND.footerCredit, pageW / 2, footerY + 4, { align: "center" });

  const blob = doc.output("blob");
  doc.save(`oficio-${protocolo}.pdf`);
  return { protocolo, blob };
}
