import { jsPDF } from "jspdf";
import {
  PDFGabineteConfig,
  PDFResult,
  loadImageAsBase64,
  drawPDFHeader,
  addFooterToAllPages,
  buildPDFResult,
} from "./pdfTemplateUtils";
import { applyDocumentSecurity } from "./pdfSecurityUtils";

interface OficioData {
  categoria: string;
  bairro: string;
  descricao: string;
  eleitorNome: string | null;
  status: string;
  criadoEm: string;
  daysOpen: number;
  gabConfig?: PDFGabineteConfig;
  // Legacy fields (kept for backward compat)
  logoUrl?: string | null;
  nomeVereador?: string | null;
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

export async function generateOficioPDF(data: OficioData): Promise<PDFResult & { blob: Blob; protocolo: string }> {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 25;
  const marginR = 25;
  const contentW = pageW - marginL - marginR;

  const now = new Date();
  const today = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const ano = now.getFullYear();
  const seqId = Date.now().toString(36).toUpperCase().slice(-6);
  const protocolo = `OF-${seqId}`;
  const oficioNum = `${ano}/${seqId}`;

  // Build gabConfig from either new gabConfig field or legacy fields
  const gabConfig: PDFGabineteConfig = data.gabConfig ?? {
    corPrimaria: "#1E3A8A",
    logoUrl: data.logoUrl,
    nomeVereador: data.nomeVereador,
    cidadeEstado: data.cidadeEstado,
    enderecoSede: data.enderecoSede,
    telefoneContato: data.telefoneContato,
    nomeMandato: data.nomeMandato,
  };

  // Load images in parallel
  const [logoBase64, camaraLogoBase64, fotoBase64] = await Promise.all([
    gabConfig.logoUrl ? loadImageAsBase64(gabConfig.logoUrl) : Promise.resolve(null),
    gabConfig.camaraLogoUrl ? loadImageAsBase64(gabConfig.camaraLogoUrl) : Promise.resolve(null),
    gabConfig.fotoOficialUrl ? loadImageAsBase64(gabConfig.fotoOficialUrl) : Promise.resolve(null),
  ]);

  // Draw header — returns Y where content starts
  let y = drawPDFHeader(doc, gabConfig, { logoBase64, camaraLogoBase64, fotoBase64 });

  // ── Ofício Number + Date ──
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

  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, pageW - marginR, y);

  // ── Assunto ──
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("ASSUNTO:", marginL, y);
  doc.setFont("helvetica", "normal");
  doc.text(` Solicitação de Providências - ${data.categoria || "Demanda Geral"}`, marginL + doc.getTextWidth("ASSUNTO: "), y);

  // ── Destinatário ──
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("DESTINATÁRIO", marginL, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("À Secretaria Municipal de Obras / Serviços Urbanos", marginL, y);

  y += 8;
  doc.setDrawColor(203, 213, 225);
  doc.line(marginL, y, pageW - marginR, y);

  // ── Corpo ──
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  const eleitorRef = data.eleitorNome || "cidadão(ã) solicitante";
  const enderecoRef = data.bairro || "endereço não especificado";
  const bodyText = [
    `Prezados,\n`,
    `\nSolicito a Vossa Senhoria providências urgentes para resolver `,
    `"${data.descricao || data.categoria || "a demanda registrada"}", `,
    `conforme pedido do eleitor ${eleitorRef} no endereço ${enderecoRef}.\n`,
    `\nA referida demanda encontra-se registrada na categoria "${data.categoria || "Geral"}" `,
    `e está em aberto há ${data.daysOpen} dia(s), necessitando de atenção prioritária `,
    `por parte dessa Secretaria.\n`,
    `\nSolicitamos que as medidas cabíveis sejam adotadas no menor prazo possível, `,
    `garantindo o atendimento adequado à população.\n\nAtenciosamente,`,
  ].join("");

  const splitBody = doc.splitTextToSize(bodyText, contentW);
  doc.text(splitBody, marginL, y);
  y += splitBody.length * 5 + 25;

  // ── Assinatura ──
  const sigX = pageW / 2;
  doc.setDrawColor(100, 116, 139);
  doc.line(sigX - 45, y, sigX + 45, y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(gabConfig.nomeVereador || data.nomeVereador || "Vereador(a)", sigX, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Assinatura do Vereador(a)", sigX, y, { align: "center" });

  // Security: watermark + QR Code + hash + DB registration
  await applyDocumentSecurity(doc, protocolo, {
    tipo_doc: "oficio",
    nome_vereador: gabConfig.nomeVereador,
    cidade_estado: gabConfig.cidadeEstado,
    dados_resumo: {
      categoria: data.categoria,
      bairro: data.bairro,
      daysOpen: data.daysOpen,
    },
  }, gabConfig.nomeVereador || "DOCUMENTO OFICIAL");

  // Footer on all pages
  addFooterToAllPages(doc, gabConfig, { protocolo });

  const fileName = `oficio-${protocolo}.pdf`;
  const result = buildPDFResult(doc, fileName, protocolo);
  return { ...result, blob: result.blob, protocolo };
}
