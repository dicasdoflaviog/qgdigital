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
  gabinete_logo_url?: string;
  gabinete_nome?: string;
  hash?: string;
}

export const OficioTemplate = forwardRef<HTMLDivElement, { data: OficioTemplateData }>(
  ({ data }, ref) => {
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
          padding: "20mm 25mm 20mm 25mm",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4mm" }}>
          {/* Logo Câmara — esquerda */}
          <div style={{ width: "35mm" }}>
            <img
              src="/logo-camara.png"
              alt="Câmara Municipal de Teixeira de Freitas"
              style={{ width: "100%", objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Título central */}
          <div style={{ flex: 1, textAlign: "center", padding: "0 10mm" }}>
            <p style={{ fontWeight: "bold", fontSize: "14pt", margin: 0, lineHeight: 1.3 }}>
              CÂMARA MUNICIPAL<br />DE TEIXEIRA DE FREITAS
            </p>
            <p style={{ fontSize: "11pt", margin: "2mm 0 0", fontWeight: "bold" }}>ESTADO DA BAHIA</p>
            <p style={{ fontSize: "9pt", margin: "2mm 0 0" }}>CNPJ: 03.984.483/0001-02</p>
          </div>

          {/* Logo gabinete — direita */}
          <div style={{ width: "35mm", textAlign: "right" }}>
            {data.gabinete_logo_url ? (
              <img
                src={data.gabinete_logo_url}
                alt={data.gabinete_nome || "Gabinete"}
                style={{ width: "100%", objectFit: "contain", maxHeight: "20mm" }}
              />
            ) : (
              <p style={{ fontSize: "9pt", color: "#334155", margin: 0, textAlign: "right", lineHeight: 1.4 }}>
                {data.gabinete_nome || "Gabinete do Vereador"}
              </p>
            )}
          </div>
        </div>

        {/* Linha separadora vermelha */}
        <div style={{ borderTop: "2px solid #dc2626", margin: "3mm 0" }} />
        <div style={{ borderTop: "1px solid #dc2626", margin: "1mm 0 6mm" }} />

        {/* Destinatário */}
        <p style={{ fontWeight: "bold", textAlign: "justify", marginBottom: "6mm", lineHeight: 1.5 }}>
          {data.destinatario?.toUpperCase()}
        </p>

        {/* Tipo e número */}
        <p style={{ fontWeight: "bold", textAlign: "center", margin: "0 0 1mm" }}>
          {data.tipo.toUpperCase()} Nº {data.numero}
        </p>
        <p style={{ textAlign: "center", marginBottom: "6mm" }}>
          Em {data.data}.
        </p>

        {/* Assunto */}
        <p style={{ marginBottom: "4mm" }}>
          <strong>Assunto:</strong> {data.assunto}
        </p>

        {/* Corpo */}
        <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: "6mm", whiteSpace: "pre-line" }}>
          {data.corpo}
        </p>

        {/* Justificativa */}
        <p style={{ fontWeight: "bold", textAlign: "center", marginBottom: "3mm" }}>Justificativa</p>
        <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: "10mm", whiteSpace: "pre-line" }}>
          {data.justificativa}
        </p>

        {/* Local e data */}
        <p style={{ textAlign: "center", marginBottom: "12mm" }}>
          Plenário Francistônio Alves Pinto, {data.data}.
        </p>

        {/* Assinatura */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #000", width: "60mm", marginBottom: "2mm" }} />
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "11pt" }}>{data.vereador_nome}</p>
            <p style={{ margin: 0, fontSize: "10pt" }}>Vereador</p>
          </div>
          {/* QR Code placeholder — direita */}
          {data.hash && (
            <div style={{ textAlign: "center", width: "25mm" }}>
              <div
                style={{
                  width: "20mm", height: "20mm", border: "1px solid #94a3b8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "6pt", color: "#94a3b8", margin: "0 auto"
                }}
              >
                QR CODE
              </div>
              <p style={{ fontSize: "7pt", margin: "1mm 0 0", color: "#64748b" }}>
                Autenticidade:<br />{data.hash.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ position: "absolute", bottom: "15mm", left: "25mm", right: "25mm" }}>
          <div style={{ borderTop: "2px solid #dc2626", marginBottom: "2mm" }} />
          <p style={{ fontSize: "8pt", textAlign: "center", margin: 0, color: "#334155" }}>
            Rua Massanori Nagão, 64 – Centro – 45985-900<br />
            Teixeira de Freitas – BA – Fone: (73) 3011-5460 / 3291-5460<br />
            <strong>www.camaratf.ba.gov.br</strong> @camarateixeiradefreitas
          </p>
        </div>
      </div>
    );
  }
);

OficioTemplate.displayName = "OficioTemplate";
