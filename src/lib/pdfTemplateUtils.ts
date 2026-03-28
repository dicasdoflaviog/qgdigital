import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/brand";

export interface PDFGabineteConfig {
  corPrimaria?: string | null;  // hex, e.g. "#1E3A8A"
  logoUrl?: string | null;
  fotoOficialUrl?: string | null;
  nomeVereador?: string | null;
  nomeMandato?: string | null;
  cidadeEstado?: string | null;
  enderecoSede?: string | null;
  telefoneContato?: string | null;
  camaraLogoUrl?: string | null;  // câmara municipal logo
  camaraNome?: string | null;     // "Câmara Municipal de Teixeira de Freitas"
}

export interface PDFResult {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  protocolo?: string;
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || "#1E3A8A").replace("#", "");
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(clean);
  if (!result) return [30, 58, 138];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

export async function loadImageAsBase64(url: string): Promise<string | null> {
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

function getInitials(name?: string | null): string {
  if (!name) return "VR";
  return name.split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "VR";
}

function drawLogoBox(
  doc: jsPDF,
  text: string,
  x: number, y: number, size: number,
  rgb: [number, number, number]
) {
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(x, y, size, size, 2, 2, "F");
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, size, size, 2, 2, "S");
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(text.length > 2 ? 6 : 8);
  doc.text(text.slice(0, 3), x + size / 2, y + size / 2 + 2.5, { align: "center" });
}

/**
 * Draws the institutional PDF header.
 * Returns the Y coordinate where body content should start.
 *
 * Layout:
 *  ┌──────────────────────────────────────────┐ ← 4mm cor_primaria bar
 *  │ [câmara logo] Câmara Municipal de TF   [gabinete logo/foto] │
 *  │               Gabinete do Vereador                           │
 *  │               Nome do Vereador                               │
 *  │               Teixeira de Freitas - BA                       │
 *  ├──────────────────────────────────────────┤ ← 1.5mm divider
 */
export function drawPDFHeader(
  doc: jsPDF,
  gabConfig: PDFGabineteConfig,
  opts: {
    logoBase64?: string | null;
    camaraLogoBase64?: string | null;
    fotoBase64?: string | null;
  } = {}
): number {
  const pageW = doc.internal.pageSize.getWidth();
  const [r, g, b] = hexToRgb(gabConfig.corPrimaria ?? "#1E3A8A");
  const marginL = 15;
  const marginR = 15;

  // 1. Top color bar (4mm)
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 4, "F");

  // 2. White header background (38mm)
  const headerH = 38;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 4, pageW, headerH, "F");

  // 3. Câmara logo — left side
  const camaraLogoSize = 22;
  const logoY = 4 + (headerH - camaraLogoSize) / 2;
  if (opts.camaraLogoBase64) {
    try {
      doc.addImage(opts.camaraLogoBase64, "PNG", marginL, logoY, camaraLogoSize, camaraLogoSize);
    } catch {
      drawLogoBox(doc, "CM", marginL, logoY, camaraLogoSize, [r, g, b]);
    }
  } else {
    drawLogoBox(doc, "CM", marginL, logoY, camaraLogoSize, [r, g, b]);
  }

  // 4. Center text block
  const textX = marginL + camaraLogoSize + 8;
  const rightLogoSize = 24;
  const textMaxW = pageW - textX - rightLogoSize - marginR - 10;

  const camaraNome = gabConfig.camaraNome ||
    (gabConfig.cidadeEstado
      ? `Câmara Municipal de ${gabConfig.cidadeEstado.split(" - ")[0]}`
      : "Câmara Municipal");

  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(camaraNome, textX, 4 + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("Gabinete do Vereador", textX, 4 + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  const nomeText = gabConfig.nomeVereador || gabConfig.nomeMandato || "Vereador";
  const nomeLines = doc.splitTextToSize(nomeText, textMaxW);
  doc.text(nomeLines[0], textX, 4 + 24);

  if (gabConfig.cidadeEstado) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(gabConfig.cidadeEstado, textX, 4 + 31);
  }

  // 5. Right: gabinete logo or foto_oficial
  const rightLogoX = pageW - marginR - rightLogoSize;
  const rightLogoY = 4 + (headerH - rightLogoSize) / 2;
  const rightImg = opts.logoBase64 || opts.fotoBase64;

  if (rightImg) {
    try {
      doc.addImage(rightImg, "PNG", rightLogoX, rightLogoY, rightLogoSize, rightLogoSize);
    } catch {
      drawLogoBox(doc, getInitials(gabConfig.nomeVereador), rightLogoX, rightLogoY, rightLogoSize, [r, g, b]);
    }
  } else {
    drawLogoBox(doc, getInitials(gabConfig.nomeVereador), rightLogoX, rightLogoY, rightLogoSize, [r, g, b]);
  }

  // 6. Bottom divider
  const divY = 4 + headerH;
  doc.setFillColor(r, g, b);
  doc.rect(0, divY, pageW, 1.5, "F");

  return divY + 8;
}

/**
 * Adds a unified footer to all pages.
 * Call AFTER all content has been added to the doc.
 */
export function addFooterToAllPages(
  doc: jsPDF,
  gabConfig: PDFGabineteConfig,
  opts: { protocolo?: string; docType?: string } = {}
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();
  const [r, g, b] = hexToRgb(gabConfig.corPrimaria ?? "#1E3A8A");
  const marginL = 15;

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric"
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageH - 15;

    // Thin top divider
    doc.setFillColor(r, g, b);
    doc.rect(marginL, footerY - 2, pageW - 2 * marginL, 0.4, "F");

    // Line 1: gabinete info
    const infoParts: string[] = [];
    if (gabConfig.nomeMandato) infoParts.push(gabConfig.nomeMandato);
    if (gabConfig.cidadeEstado) infoParts.push(gabConfig.cidadeEstado);
    if (gabConfig.enderecoSede) infoParts.push(gabConfig.enderecoSede);
    if (gabConfig.telefoneContato) infoParts.push(`Tel: ${gabConfig.telefoneContato}`);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);

    if (infoParts.length > 0) {
      doc.text(infoParts.join(" • "), pageW / 2, footerY + 1.5, { align: "center" });
    }

    // Line 2: doc info + page
    const docParts: string[] = [];
    docParts.push(`Documento gerado em ${today}`);
    if (opts.protocolo) docParts.push(`Protocolo: ${opts.protocolo}`);
    docParts.push(`Pág. ${i}/${totalPages}`);

    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(docParts.join("  •  "), pageW / 2, footerY + 6, { align: "center" });

    // Brand credit
    doc.setFontSize(6);
    doc.setTextColor(203, 213, 225);
    doc.text(BRAND.footerCredit, pageW / 2, footerY + 10, { align: "center" });
  }
}

/**
 * Creates a PDFResult from a jsPDF doc — blob + blobUrl + fileName.
 * Does NOT auto-save. Let the caller decide when to download.
 */
export function buildPDFResult(doc: jsPDF, fileName: string, protocolo?: string): PDFResult {
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  return { blob, blobUrl, fileName, protocolo };
}
