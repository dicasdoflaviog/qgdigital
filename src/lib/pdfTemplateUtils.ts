import { jsPDF } from "jspdf";
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

/**
 * Draws the minimal institutional PDF header.
 * Returns the Y coordinate where body content should start.
 *
 * Layout (minimal):
 *  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← 2.5mm brand accent line
 *  [logo 16×16]  Nome do Vereador (12pt, dark)
 *                Câmara Municipal de X • Cargo  (8pt, gray)
 *  ─────────────────────────────────────────── ← 0.3pt gray separator
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

  // 1. Thin brand accent line at top (2.5mm)
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 2.5, "F");

  // 2. Logo on left — small, no box/border
  const logoSize = 16;
  const logoY = 2.5 + 6;

  const rightImg = opts.logoBase64 || opts.fotoBase64 || opts.camaraLogoBase64;
  if (rightImg) {
    try {
      doc.addImage(rightImg, "PNG", marginL, logoY, logoSize, logoSize);
    } catch {
      // fallback: monogram text only
    }
  }

  // 3. Text block — right of logo (or from left if no logo)
  const textX = rightImg ? marginL + logoSize + 6 : marginL;
  const textMaxW = pageW - textX - marginR;

  // Vereador name — primary text
  const nome = gabConfig.nomeVereador || gabConfig.nomeMandato?.split(" - ")[0] || "Vereador";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // near-black
  doc.text(nome, textX, 2.5 + 10);

  // Subtitle: câmara + city — secondary text
  const camaraNome = gabConfig.camaraNome ||
    (gabConfig.cidadeEstado
      ? `Câmara Municipal de ${gabConfig.cidadeEstado.split(" - ")[0]}`
      : "Câmara Municipal");
  const subtitleParts = [camaraNome];
  if (gabConfig.cidadeEstado) subtitleParts.push(gabConfig.cidadeEstado);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const subtitle = doc.splitTextToSize(subtitleParts.join(" · "), textMaxW);
  doc.text(subtitle[0], textX, 2.5 + 18);

  // 4. Thin gray separator line
  const headerH = 30;
  const divY = 2.5 + headerH;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(marginL, divY, pageW - marginR, divY);

  return divY + 7;
}

/**
 * Adds a minimal footer to all pages.
 * Single line: protocol • date • page
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
    const footerY = pageH - 12;

    // Thin brand accent line above footer
    doc.setFillColor(r, g, b);
    doc.rect(marginL, footerY - 3, pageW - 2 * marginL, 0.4, "F");

    // Single footer line: gabinete • protocol • date • page
    const parts: string[] = [];
    const gabNome = gabConfig.nomeMandato || gabConfig.nomeVereador;
    if (gabNome) parts.push(gabNome);
    if (opts.protocolo) parts.push(`Protocolo ${opts.protocolo}`);
    parts.push(today);
    parts.push(`${i} / ${totalPages}`);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(parts.join("  ·  "), pageW / 2, footerY + 2, { align: "center" });
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
