import { useState, useRef } from "react";
import { Plus, FileText, Upload, Sparkles, Loader2, X, FileUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
}

export function NovoOficioModal({ open, onOpenChange, onSave }: NovoOficioModalProps) {
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

  const resetForm = () => {
    setNumero("");
    setTitulo("");
    setBairro("");
    setPauta("");
    setAssessorId("");
    setFile(null);
    setAiResumo("");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-tight">
            <div className="flex h-6 w-6 items-center justify-center bg-primary text-primary-foreground">
              <FileText className="h-3.5 w-3.5" />
            </div>
            Novo Ofício
          </DialogTitle>
          <DialogDescription className="text-xs">
            Preencha os dados ou envie um documento para extração automática via IA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label className="label-ui flex items-center gap-1.5">
              <Upload className="h-3 w-3" />
              Upload de Documento (PDF, DOC, DOCX)
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
                    className="text-xs font-bold uppercase tracking-wider"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar Arquivo
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
                    className="w-full gap-1.5 font-bold uppercase tracking-wider text-xs"
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
                        Extrair Dados com IA
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
            <Label className="label-ui">Assessor Responsável</Label>
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
            <Button type="submit" className="flex-1 gap-2 h-12 font-bold uppercase tracking-wider text-sm">
              <Plus className="h-4 w-4" />
              Criar Ofício
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12 font-bold uppercase tracking-wider text-sm">
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
