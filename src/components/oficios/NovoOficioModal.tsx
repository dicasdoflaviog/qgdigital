import { useState, useRef, useEffect } from "react";
import { Plus, FileText, Upload, Sparkles, Loader2, X, FileUp, Eye, Download, FileEdit } from "lucide-react";
import { useGerarOficio } from "@/hooks/useGerarOficio";
import { OficioTemplate } from "./OficioTemplate";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BAIRROS, assessores } from "@/data/mockData";
import type { Oficio } from "@/data/oficiosData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx";

interface NovoOficioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (oficio: Oficio) => void;
  initialBairro?: string;
  initialPauta?: string;
  initialEleitorNome?: string;
  numeroSequencial?: number;
}

export function NovoOficioModal({
  open,
  onOpenChange,
  onSave,
  initialBairro,
  initialPauta,
  initialEleitorNome,
  numeroSequencial = 1,
}: NovoOficioModalProps) {
  const [numero, setNumero] = useState("");
  const [titulo, setTitulo] = useState("");
  const [bairro, setBairro] = useState("");
  const [pauta, setPauta] = useState("");
  const [assessorId, setAssessorId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiResumo, setAiResumo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Modo do modal: IA ou upload existente
  const [modalMode, setModalMode] = useState<"ia" | "upload">("ia");

  // Campos do modo IA
  const [tipoDoc, setTipoDoc] = useState("oficio");
  const [destinatario, setDestinatario] = useState("Exmº Sr. Prefeito Municipal");
  const [orgao, setOrgao] = useState("");
  const [demandaDescricao, setDemandaDescricao] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { loading: gerandoIA, templateData, setTemplateData, gerarRascunho, exportarPDF } = useGerarOficio();

  // Pré-preenche campos quando modal abre com dados do Radar de Rua
  useEffect(() => {
    if (!open) { resetForm(); return; }
    if (initialBairro) setBairro(initialBairro);
    if (initialPauta) {
      setPauta(initialPauta);
      setDemandaDescricao(initialPauta);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialBairro, initialPauta]);

  const resetForm = () => {
    setNumero("");
    setTitulo("");
    setBairro("");
    setPauta("");
    setAssessorId("");
    setFile(null);
    setAiResumo("");
    setDemandaDescricao("");
    setTemplateData(null);
    setShowPreview(false);
    setModalMode("ia");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast({
        title: "Formato não suportado",
        description: "Envie arquivos nos formatos PDF, DOC ou DOCX.",
        variant: "destructive",
      });
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 20MB.",
        variant: "destructive",
      });
      return;
    }

    setFile(selected);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setAiResumo("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const readFileAsText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // For PDFs and binary docs, we send base64. For text-based, send as-is.
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleExtractWithAI = async () => {
    if (!file) return;

    setIsExtracting(true);
    try {
      const textContent = await readFileAsText(file);

      if (!textContent || textContent.trim().length < 10) {
        toast({
          title: "Conteúdo insuficiente",
          description: "Não foi possível ler o conteúdo do arquivo. Tente com um arquivo de texto puro ou PDF com texto selecionável.",
          variant: "destructive",
        });
        setIsExtracting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("extract-oficio", {
        body: {
          fileContent: textContent.substring(0, 15000), // Limit content size
          fileName: file.name,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao processar documento");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data?.data) {
        const extracted = data.data;

        if (extracted.numero && !numero) setNumero(extracted.numero);
        if (extracted.titulo && !titulo) setTitulo(extracted.titulo);
        if (extracted.pauta && !pauta) setPauta(extracted.pauta);
        if (extracted.resumo) setAiResumo(extracted.resumo);

        // Try to match bairro
        if (extracted.bairro && !bairro) {
          const matchedBairro = BAIRROS.find(
            (b) => b.toLowerCase() === extracted.bairro.toLowerCase()
          );
          if (matchedBairro) setBairro(matchedBairro);
        }

        toast({
          title: "Dados extraídos com sucesso",
          description: "A IA preencheu os campos com as informações do documento.",
        });
      }
    } catch (err) {
      console.error("AI extraction error:", err);
      toast({
        title: "Erro na extração",
        description: err instanceof Error ? err.message : "Não foi possível extrair dados do documento.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !bairro || !numero) return;

    const novoOficio: Oficio = {
      id: `of-${Date.now()}`,
      numero,
      titulo,
      bairro,
      pauta,
      status: "elaborado",
      criadoEm: new Date().toISOString().split("T")[0],
      assessorId: assessorId || undefined,
    };

    // Upload file if present
    if (file) {
      const filePath = `${novoOficio.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("oficios-documentos")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: "Erro no upload",
          description: "O ofício será criado, mas o documento não foi anexado.",
          variant: "destructive",
        });
      }
    }

    onSave(novoOficio);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-safe max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base font-medium tracking-tight">
            <div className="flex h-6 w-6 items-center justify-center bg-primary text-primary-foreground">
              <FileText className="h-3.5 w-3.5" />
            </div>
            Novo ofício
          </SheetTitle>
          <SheetDescription className="text-xs">
            Crie com IA ou envie um documento existente.
          </SheetDescription>
        </SheetHeader>

        {/* Seletor de modo */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
          <button
            onClick={() => setModalMode("ia")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              modalMode === "ia" ? "bg-white text-[#2563eb] shadow-sm" : "text-slate-500"
            }`}
          >
            <Sparkles className="h-4 w-4" /> Criar com IA
          </button>
          <button
            onClick={() => setModalMode("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              modalMode === "upload" ? "bg-white text-[#2563eb] shadow-sm" : "text-slate-500"
            }`}
          >
            <FileEdit className="h-4 w-4" /> Upload existente
          </button>
        </div>

        {/* Banner de origem quando vier do Radar de Rua */}
        {initialEleitorNome && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <span className="text-emerald-600 text-sm">📡</span>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Demanda originada pelo <span className="font-medium">Radar de Rua</span>
              {initialEleitorNome && <> — eleitor: <span className="font-medium">{initialEleitorNome}</span></>}
            </p>
          </div>
        )}

        {/* MODO IA */}
        {modalMode === "ia" && (
          <div className="space-y-4">
            {/* Tipo do documento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Tipo de documento</Label>
              <Select value={tipoDoc} onValueChange={setTipoDoc}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficio">Ofício</SelectItem>
                  <SelectItem value="pedido_providencia">Pedido de Providência</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="requerimento">Requerimento</SelectItem>
                  <SelectItem value="mocao">Moção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destinatário */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Destinatário</Label>
              <Select value={destinatario} onValueChange={setDestinatario}>
                <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Exmº Sr. Prefeito Municipal">Prefeito Municipal</SelectItem>
                  <SelectItem value="Exmº Sr. Presidente da Câmara Municipal">Presidente da Câmara</SelectItem>
                  <SelectItem value="Ilmº Sr. Secretário Municipal de Obras">Secretaria de Obras</SelectItem>
                  <SelectItem value="Ilmº Sr. Secretário Municipal de Saúde">Secretaria de Saúde</SelectItem>
                  <SelectItem value="Ilmº Sr. Secretário Municipal de Educação">Secretaria de Educação</SelectItem>
                  <SelectItem value="Embasa — Empresa Baiana de Águas e Saneamento">Embasa</SelectItem>
                  <SelectItem value="Coelba — Companhia de Eletricidade da Bahia">Coelba</SelectItem>
                  <SelectItem value="Ministério Público do Estado da Bahia">Ministério Público</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição da demanda */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500">Descrição da demanda *</Label>
              <Textarea
                value={demandaDescricao}
                onChange={(e) => setDemandaDescricao(e.target.value)}
                placeholder="Descreva a situação: o que acontece, onde, quem é afetado..."
                rows={4}
                className="min-h-[96px] resize-none"
              />
              {initialEleitorNome && (
                <p className="text-[10px] text-[#2563eb] flex items-center gap-1">
                  <span>★</span> Originado de: {initialEleitorNome} — {initialBairro}
                </p>
              )}
            </div>

            {/* Botão gerar */}
            {!templateData && (
              <Button
                type="button"
                className="w-full min-h-[48px] gap-2 bg-[#2563eb] hover:bg-[#1d4ed8]"
                onClick={() => gerarRascunho({
                  tipo: tipoDoc,
                  destinatario,
                  orgao: "",
                  demanda_descricao: demandaDescricao,
                  bairro: initialBairro || bairro || "",
                  numero_sequencial: numeroSequencial,
                })}
                disabled={gerandoIA || !demandaDescricao.trim()}
              >
                {gerandoIA
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando rascunho...</>
                  : <><Sparkles className="h-4 w-4" /> Gerar com IA</>
                }
              </Button>
            )}

            {/* Preview e edição do rascunho */}
            {templateData && (
              <div className="space-y-3">
                <div className="rounded-xl border-[0.5px] border-[#2563eb]/30 bg-[#eff6ff] p-3">
                  <p className="text-[11px] font-medium text-[#1d4ed8] mb-1">✨ Rascunho gerado pela IA</p>
                  <p className="text-[11px] text-[#2563eb] font-medium truncate">{templateData.assunto}</p>
                </div>

                {/* Editar assunto */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">Assunto (editável)</Label>
                  <Input
                    value={templateData.assunto}
                    onChange={(e) => setTemplateData({ ...templateData, assunto: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>

                {/* Editar corpo */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">Corpo do documento (editável)</Label>
                  <Textarea
                    value={templateData.corpo}
                    onChange={(e) => setTemplateData({ ...templateData, corpo: e.target.value })}
                    rows={6}
                    className="min-h-[140px] resize-none text-sm"
                  />
                </div>

                {/* Editar justificativa */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">Justificativa (editável)</Label>
                  <Textarea
                    value={templateData.justificativa}
                    onChange={(e) => setTemplateData({ ...templateData, justificativa: e.target.value })}
                    rows={4}
                    className="min-h-[100px] resize-none text-sm"
                  />
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 min-h-[44px] gap-2 border-[#2563eb]/30 text-[#2563eb]"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4" />
                    {showPreview ? "Ocultar" : "Visualizar"}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 min-h-[44px] gap-2 bg-[#2563eb] hover:bg-[#1d4ed8]"
                    onClick={() => exportarPDF(templateData)}
                  >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-400 text-xs"
                  onClick={() => setTemplateData(null)}
                >
                  ↺ Gerar novo rascunho
                </Button>
              </div>
            )}

            {/* Template oculto para export — fora do fluxo, sem causar scroll horizontal */}
            {templateData && (
              <div style={{ position: "fixed", left: "-9999px", top: "-9999px", width: 0, height: 0, overflow: "hidden", visibility: "hidden" }}>
                <OficioTemplate data={templateData} />
              </div>
            )}

            {/* Preview inline — escala correta com wrapper que ocupa o espaço real escalado */}
            {showPreview && templateData && (
              <div className="mt-4 rounded-xl border overflow-hidden"
                style={{ width: `${210 * 0.38}mm`, height: `${297 * 0.38}mm` }}>
                <div style={{ transform: "scale(0.38)", transformOrigin: "top left", width: "210mm", height: "297mm" }}>
                  <OficioTemplate data={templateData} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODO UPLOAD (formulário original) */}
        {modalMode === "upload" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload Section */}
            <div className="space-y-2">
              <Label className="label-ui flex items-center gap-1.5">
                <Upload className="h-3 w-3" />
                Upload de documento (PDF, DOC, DOCX)
              </Label>
              <div className="border border-dashed border-border p-4 text-center space-y-2">
                {!file ? (
                  <>
                    <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Arraste um arquivo ou clique para selecionar
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs font-medium"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Selecionar arquivo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-muted p-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs font-medium truncate">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full gap-1.5 font-medium text-xs"
                      onClick={handleExtractWithAI}
                      disabled={isExtracting}
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Analisando com IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Extrair dados com IA
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Summary */}
            {aiResumo && (
              <div className="bg-muted border border-border p-3 space-y-1">
                <p className="label-ui flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Resumo da IA
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{aiResumo}</p>
              </div>
            )}

            <div className="border-t border-border" />

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="label-ui">Número *</Label>
                <Input
                  placeholder="Ex: 080/2026"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="label-ui">Bairro *</Label>
                <Select value={bairro} onValueChange={setBairro} required>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAIRROS.map((b) => (
                      <SelectItem key={b} value={b} className="text-sm">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="label-ui">Título *</Label>
              <Input
                placeholder="Ex: Recuperação de Pavimentação"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="label-ui">Pauta / Descrição</Label>
              <Textarea
                placeholder="Descreva a demanda do ofício..."
                value={pauta}
                onChange={(e) => setPauta(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="label-ui">Assessor responsável</Label>
              <Select value={assessorId} onValueChange={setAssessorId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecionar assessor" />
                </SelectTrigger>
                <SelectContent>
                  {assessores.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-sm">{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 gap-2 h-12 font-medium text-sm">
                <Plus className="h-4 w-4" />
                Criar ofício
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12 font-medium text-sm">
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
