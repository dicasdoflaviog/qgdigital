import { forwardRef } from "react";

export interface OficioTemplateData {
  tipo: string;
  numero: string;
  data: string;
  destinatario: string;
  orgao: string;
  assunto: string;
  corpo: string;
  justificativa: string;
  vereador_nome: string;
  gabinete_logo_url?: string | null;
  gabinete_nome?: string;
  gabinete_cor?: string;
  gabinete_cidade_estado?: string;
  gabinete_endereco?: string | null;
  gabinete_telefone?: string | null;
  hash?: string;
}

export const OficioTemplate = forwardRef<HTMLDivElement, { data: OficioTemplateData }>(
  ({ data }, ref) => {
    const corLinha = data.gabinete_cor || "#dc2626";
    const cidadeEstado = data.gabinete_cidade_estado || "Teixeira de Freitas – BA";
    const endereco = data.gabinete_endereco || "Rua Massanori Nagão, 64 – Centro – 45985-900";
    const telefone = data.gabinete_telefone || "(73) 3011-5460";

    return (
      <div
        ref={ref}
        id="oficio-template"
        style={{
          width: "210mm",
          minHeight: "297mm",
          backgroundColor: "#FEFDE8",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "12pt",
          color: "#000",
          padding: "20mm 25mm 28mm 25mm",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4mm" }}>
          <div style={{ width: "35mm", flexShrink: 0 }}>
            <img
              src="/logo-camara-tf.png"
              alt="Câmara Municipal de Teixeira de Freitas"
              style={{ width: "100%", objectFit: "contain", maxHeight: "22mm" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "0 8mm" }}>
            <p style={{ fontWeight: "bold", fontSize: "14pt", margin: 0, lineHeight: 1.3, textTransform: "uppercase" }}>
              Câmara Municipal<br />de Teixeira de Freitas
            </p>
            <p style={{ fontSize: "11pt", margin: "1.5mm 0 0", fontWeight: "bold", textTransform: "uppercase" }}>Estado da Bahia</p>
            <p style={{ fontSize: "9pt", margin: "1.5mm 0 0" }}>CNPJ: 03.984.483/0001-02</p>
          </div>
          <div style={{ width: "35mm", flexShrink: 0, textAlign: "right" }}>
            {data.gabinete_logo_url ? (
              <img
                src={data.gabinete_logo_url}
                alt={data.gabinete_nome || "Gabinete"}
                style={{ maxWidth: "100%", maxHeight: "22mm", objectFit: "contain" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <p style={{ fontSize: "9pt", color: "#334155", margin: 0, textAlign: "right", lineHeight: 1.4, fontWeight: "bold" }}>
                {data.gabinete_nome || "Gabinete do Vereador"}
              </p>
            )}
          </div>
        </div>

        <div style={{ borderTop: `2px solid ${corLinha}`, margin: "3mm 0 1mm" }} />
        <div style={{ borderTop: `1px solid ${corLinha}`, margin: "0 0 6mm" }} />

        <p style={{ fontWeight: "bold", textAlign: "justify", marginBottom: "6mm", lineHeight: 1.6, textTransform: "uppercase" }}>
          {data.destinatario}
        </p>

        <p style={{ fontWeight: "bold", textAlign: "center", margin: "0 0 1mm", textTransform: "uppercase" }}>
          {data.tipo} Nº {data.numero}
        </p>
        <p style={{ textAlign: "center", marginBottom: "6mm" }}>Em {data.data}.</p>

        <p style={{ marginBottom: "5mm", lineHeight: 1.6 }}>
          <strong>Assunto:</strong> {data.assunto}
        </p>

        <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: "6mm", whiteSpace: "pre-line" }}>
          {data.corpo}
        </p>

        <p style={{ fontWeight: "bold", textAlign: "center", marginBottom: "3mm" }}>Justificativa</p>
        <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: "10mm", whiteSpace: "pre-line" }}>
          {data.justificativa}
        </p>

        <p style={{ textAlign: "center", marginBottom: "14mm" }}>
          Plenário Francistônio Alves Pinto, {data.data}.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #000", width: "65mm", marginBottom: "2mm" }} />
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "11pt" }}>{data.vereador_nome}</p>
            <p style={{ margin: "1mm 0 0", fontSize: "10pt" }}>Vereador</p>
          </div>
          {data.hash && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "22mm", height: "22mm", border: "1px solid #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6pt", color: "#94a3b8" }}>
                QR CODE
              </div>
              <p style={{ fontSize: "7pt", margin: "1mm 0 0", color: "#64748b" }}>
                Código: {data.hash.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}
        </div>

        <div style={{ position: "absolute", bottom: "12mm", left: "25mm", right: "25mm" }}>
          <div style={{ borderTop: `2px solid ${corLinha}`, marginBottom: "2mm" }} />
          <p style={{ fontSize: "8pt", textAlign: "center", margin: 0, color: "#334155", lineHeight: 1.5 }}>
            {endereco}<br />
            {cidadeEstado} – Fone: {telefone}<br />
            <strong>www.camaratf.ba.gov.br</strong> @camarateixeiradefreitas
          </p>
        </div>
      </div>
    );
  }
);

OficioTemplate.displayName = "OficioTemplate";
