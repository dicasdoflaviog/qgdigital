import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OficioTemplateData } from "@/components/oficios/OficioTemplate";

async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatNumero(tipo: string, seq: number): string {
  const ano = new Date().getFullYear();
  const prefixos: Record<string, string> = {
    oficio: "OF",
    pedido_providencia: "PP",
    indicacao: "IND",
    requerimento: "REQ",
    mocao: "MOC",
  };
  const prefixo = prefixos[tipo] || "DOC";
  return `${prefixo}-${ano}/${String(seq).padStart(3, "0")}`;
}

function formatDataExtenso(date: Date = new Date()): string {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const TIPO_LABELS: Record<string, string> = {
  oficio: "Ofício",
  pedido_providencia: "Pedido de Providência",
  indicacao: "Indicação",
  requerimento: "Requerimento",
  mocao: "Moção",
};

export interface UseGerarOficioParams {
  tipo: string;
  destinatario: string;
  orgao: string;
  demanda_descricao: string;
  bairro: string;
  vereador_nome: string;
  gabinete_logo_url?: string;
  gabinete_nome?: string;
  numero_sequencial?: number;
}

export function useGerarOficio() {
  const [loading, setLoading] = useState(false);
  const [templateData, setTemplateData] = useState<OficioTemplateData | null>(null);
  const { toast } = useToast();

  const gerarRascunho = async (params: UseGerarOficioParams) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-oficio", {
        body: {
          tipo: params.tipo,
          destinatario: params.destinatario,
          orgao: params.orgao,
          demanda_descricao: params.demanda_descricao,
          bairro: params.bairro,
          vereador_nome: params.vereador_nome,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const numero = formatNumero(params.tipo, params.numero_sequencial ?? 1);
      const hash = await generateHash(`${numero}${data.corpo}${data.justificativa}`);

      const td: OficioTemplateData = {
        tipo: TIPO_LABELS[params.tipo] || "Ofício",
        numero,
        data: formatDataExtenso(),
        destinatario: params.destinatario,
        orgao: params.orgao,
        assunto: data.assunto,
        corpo: data.corpo,
        justificativa: data.justificativa,
        vereador_nome: params.vereador_nome,
        gabinete_logo_url: params.gabinete_logo_url,
        gabinete_nome: params.gabinete_nome,
        hash,
      };

      setTemplateData(td);
      toast({ title: "Rascunho gerado ✨", description: "Revise o documento antes de exportar." });
      return td;
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err?.message || "Tente novamente.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async (td: OficioTemplateData) => {
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      toast({ title: "Aguarde", description: "Exportador ainda carregando. Tente em instantes.", variant: "destructive" });
      return;
    }

    const element = document.getElementById("oficio-template");
    if (!element) {
      toast({ title: "Erro", description: "Template não encontrado.", variant: "destructive" });
      return;
    }

    const opt = {
      margin: 0,
      filename: `${td.numero.replace("/", "-")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FEFDE8" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(element).save();
      toast({ title: "PDF exportado! 📄", description: `${td.numero} salvo com sucesso.` });
    } catch (err: any) {
      toast({ title: "Erro ao exportar PDF", description: err?.message, variant: "destructive" });
    }
  };

  return { loading, templateData, setTemplateData, gerarRascunho, exportarPDF };
}
