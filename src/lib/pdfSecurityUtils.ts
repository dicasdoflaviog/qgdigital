/**
 * pdfSecurityUtils.ts
 *
 * Funções de autenticidade e segurança para documentos PDF do QG Digital:
 *  1. addWatermark()       — marca d'água diagonal em cada página
 *  2. addQRCode()          — QR Code de verificação no canto inferior
 *  3. computeDocumentHash()— SHA-256 do conteúdo canônico
 *  4. registerDocument()   — salva registro no Supabase para verificação pública
 *  5. addSecurityFooter()  — rodapé com hash + URL de verificação
 */

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

// URL base do app para links de verificação
const APP_BASE_URL = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}`
  : "https://app.qgdigital.com.br";

export interface DocumentoRegistroData {
  protocolo: string;
  tipo_doc: "oficio" | "relatorio_transparencia" | "relatorio_estrategico" | "prestacao_contas" | "relatorio_inteligencia" | "relatorio_cidade";
  gabinete_id?: string | null;
  nome_vereador?: string | null;
  cidade_estado?: string | null;
  hash_sha256: string;
  dados_resumo?: Record<string, unknown>;
  gerado_por?: string | null;
}

/**
 * Gera o SHA-256 de um objeto canônico (serializado como JSON ordenado).
 * Retorna a string hex do hash.
 */
export async function computeDocumentHash(canonicalData: Record<string, unknown>): Promise<string> {
  const sorted = JSON.stringify(canonicalData, Object.keys(canonicalData).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(sorted);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Persiste o documento no banco de dados para verificação pública.
 * Falha silenciosamente (não bloqueia geração do PDF).
 */
export async function registerDocument(data: DocumentoRegistroData): Promise<void> {
  try {
    const { error } = await supabase
      .from("documentos_emitidos" as any)
      .upsert(
        {
          protocolo: data.protocolo,
          tipo_doc: data.tipo_doc,
          gabinete_id: data.gabinete_id ?? null,
          nome_vereador: data.nome_vereador ?? null,
          cidade_estado: data.cidade_estado ?? null,
          hash_sha256: data.hash_sha256,
          dados_resumo: data.dados_resumo ?? {},
          gerado_por: data.gerado_por ?? null,
          gerado_em: new Date().toISOString(),
          valido: true,
        },
        { onConflict: "protocolo" }
      );
    if (error) {
      console.warn("[QG PDF] Falha ao registrar documento:", error.message);
    }
  } catch (err) {
    console.warn("[QG PDF] Erro inesperado ao registrar documento:", err);
  }
}

/**
 * Adiciona marca d'água diagonal em TODAS as páginas do documento.
 * Texto em cinza claro (~8% opacidade) repetido em diagonal.
 *
 * @param doc     Instância jsPDF
 * @param text    Texto da marca d'água (ex: "GABINETE VEREADOR JONATAS")
 */
export function addWatermark(doc: jsPDF, text: string) {
  const totalPages = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Save graphics state via transparency workaround
    // jsPDF doesn't support setGState natively, so we use very light gray
    doc.setTextColor(220, 220, 220); // near-white gray
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    // Draw diagonal text pattern
    // Rotate 45° and tile across the page
    const diagText = `  ${text.toUpperCase()}  `;
    const stepX = 60;
    const stepY = 35;

    for (let x = -30; x < pageW + 40; x += stepX) {
      for (let y = 20; y < pageH + 30; y += stepY) {
        doc.text(diagText, x, y, { angle: 45, charSpace: 1 });
      }
    }

    // Reset text color to black for next content
    doc.setTextColor(0, 0, 0);
  }
}

/**
 * Gera um QR Code como data URL e adiciona ao PDF na posição especificada.
 * O QR Code aponta para a URL de verificação pública do protocolo.
 *
 * @param doc       Instância jsPDF
 * @param protocolo Protocolo do documento (ex: "OF-2025XK3A")
 * @param x         Posição X em mm
 * @param y         Posição Y em mm
 * @param size      Tamanho em mm (padrão: 22)
 */
export async function addQRCode(
  doc: jsPDF,
  protocolo: string,
  x: number,
  y: number,
  size = 22
): Promise<void> {
  const verifyUrl = `${APP_BASE_URL}/verificar/${protocolo}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: "#1E293B",  // slate-800
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    // White background box for the QR
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x - 1, y - 1, size + 2, size + 2 + 8, 1, 1, "F");

    // QR Code image
    doc.addImage(qrDataUrl, "PNG", x, y, size, size);

    // Label below QR
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Verificar autenticidade", x + size / 2, y + size + 4, { align: "center" });
    doc.setFontSize(5);
    doc.setTextColor(148, 163, 184);
    doc.text(protocolo, x + size / 2, y + size + 7.5, { align: "center" });
  } catch (err) {
    console.warn("[QG PDF] Falha ao gerar QR Code:", err);
    // Fallback: show URL text
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Verificar em: qgdigital.app/verificar/", x, y + 4);
    doc.text(protocolo, x, y + 8);
  }
}

/**
 * Adiciona o bloco de segurança ao rodapé da PRIMEIRA página.
 * Inclui: hash SHA-256 truncado + URL de verificação + ícone de escudo.
 *
 * Deve ser chamado ANTES de addFooterToAllPages (do pdfTemplateUtils).
 *
 * @param doc       Instância jsPDF
 * @param protocolo Protocolo do documento
 * @param hash      SHA-256 completo
 */
export function addSecurityBlock(
  doc: jsPDF,
  protocolo: string,
  hash: string,
  pageIndex = 1
) {
  doc.setPage(pageIndex);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // QR Code position: lower-right corner, above footer
  const qrSize = 22;
  const qrX = pageW - margin - qrSize;
  const qrY = pageH - 38;

  // Security info box — left side, same row as QR
  const infoX = margin;
  const infoY = qrY + 2;
  const infoW = pageW - margin * 2 - qrSize - 6;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(infoX, infoY - 2, infoW, qrSize + 2, 1.5, 1.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(infoX, infoY - 2, infoW, qrSize + 2, 1.5, 1.5, "S");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("🔐  Documento com autenticidade verificável", infoX + 3, infoY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Protocolo: ${protocolo}`, infoX + 3, infoY + 10);

  const verifyUrl = `${APP_BASE_URL}/verificar/${protocolo}`;
  doc.text(`Verificar em: ${verifyUrl}`, infoX + 3, infoY + 15);

  // Hash (truncated to 32 chars for readability)
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5.5);
  const hashDisplay = `SHA-256: ${hash.slice(0, 32)}...`;
  doc.text(hashDisplay, infoX + 3, infoY + 20);

  // Return QR position for caller to add QR Code
  return { qrX, qrY, qrSize };
}

/**
 * Pipeline completo de segurança:
 *  1. Computa hash SHA-256
 *  2. Adiciona marca d'água
 *  3. Adiciona bloco de segurança + QR Code (página 1)
 *  4. Registra no banco de dados (async, não bloqueante)
 *
 * @returns O hash SHA-256 gerado
 */
export async function applyDocumentSecurity(
  doc: jsPDF,
  protocolo: string,
  registro: Omit<DocumentoRegistroData, "hash_sha256">,
  watermarkText: string
): Promise<string> {
  // 1. Compute hash of canonical content
  const canonicalData = {
    protocolo,
    tipo_doc: registro.tipo_doc,
    nome_vereador: registro.nome_vereador ?? "",
    cidade_estado: registro.cidade_estado ?? "",
    gerado_em: new Date().toISOString().slice(0, 16), // minute precision
  };
  const hash = await computeDocumentHash(canonicalData);

  // 2. Add watermark to all pages (draw first, under content — not possible in jsPDF after the fact,
  //    so we draw it now and accept it appears over content at low opacity)
  addWatermark(doc, watermarkText);

  // 3. Add security block + QR Code to page 1
  const { qrX, qrY, qrSize } = addSecurityBlock(doc, protocolo, hash, 1);
  await addQRCode(doc, protocolo, qrX, qrY, qrSize);

  // 4. Register in DB (fire and forget)
  registerDocument({ ...registro, hash_sha256: hash });

  return hash;
}
