import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { extractVereadorNome } from "@/types/gabinete";
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
  return `${prefixos[tipo] || "DOC"}-${ano}/${String(seq).padStart(3, "0")}`;
}

function formatDataExtenso(date: Date = new Date()): string {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

const TIPO_LABELS: Record<string, string> = {
  oficio: "Ofício",
  pedido_providencia: "Pedido de Providência",
  indicacao: "Indicação",
  requerimento: "Requerimento",
  mocao: "Moção",
};

interface GerarParams {
  tipo: string;
  destinatario: string;
  orgao?: string;
  demanda_descricao: string;
  bairro: string;
  numero_sequencial?: number;
}

export function useGerarOficio() {
  const [loading, setLoading] = useState(false);
  const [templateData, setTemplateData] = useState<OficioTemplateData | null>(null);
  const { toast } = useToast();
  const { config } = useGabineteConfig();

  const vereadorNome = config?.nome_mandato
    ? extractVereadorNome(config.nome_mandato)
    : "Vereador";

  const gerarRascunho = async (params: GerarParams) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-oficio", {
        body: {
          tipo: params.tipo,
          destinatario: params.destinatario,
          orgao: params.orgao || "",
          demanda_descricao: params.demanda_descricao,
          bairro: params.bairro,
          vereador_nome: vereadorNome,
        },
      });

      if (error) {
        // FunctionsHttpError — tenta extrair mensagem do corpo da resposta
        const funcErr = error as { context?: { json?: { error?: string } }; message?: string };
        const msg = funcErr?.context?.json?.error || funcErr?.message || "Erro na função de IA";
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      const numero = formatNumero(params.tipo, params.numero_sequencial ?? 1);
      const hash = await generateHash(`${numero}${data.corpo}${data.justificativa}`);

      const td: OficioTemplateData = {
        tipo: TIPO_LABELS[params.tipo] || "Ofício",
        numero,
        data: formatDataExtenso(),
        destinatario: params.destinatario,
        orgao: params.orgao || "",
        assunto: data.assunto,
        corpo: data.corpo,
        justificativa: data.justificativa,
        vereador_nome: vereadorNome,
        gabinete_logo_url: config?.logo_url ?? null,
        gabinete_nome: vereadorNome,
        gabinete_cor: config?.cor_primaria ?? "#dc2626",
        gabinete_cidade_estado: config?.cidade_estado ?? "Teixeira de Freitas – BA",
        gabinete_endereco: config?.endereco_sede ?? null,
        gabinete_telefone: config?.telefone_contato ?? null,
        hash,
      };

      setTemplateData(td);
      toast({ title: "Rascunho gerado ✨", description: "Revise o documento antes de exportar." });
      return td;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tente novamente.";
      toast({ title: "Erro ao gerar", description: msg, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async (td: OficioTemplateData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      toast({ title: "Exportador não carregado", description: "Recarregue a página e tente novamente.", variant: "destructive" });
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
      toast({ title: "PDF exportado! 📄", description: `${td.numero} baixado com sucesso.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : undefined;
      toast({ title: "Erro ao exportar PDF", description: msg, variant: "destructive" });
    }
  };

  return { loading, templateData, setTemplateData, gerarRascunho, exportarPDF, vereadorNome, gabineteConfig: config };
}
