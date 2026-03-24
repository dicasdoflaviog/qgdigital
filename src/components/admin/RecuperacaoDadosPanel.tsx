import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Loader2, Trash2, Users, FileText, Eye, Bot, Send } from "lucide-react";

interface SoftDeletedRecord {
  id: string;
  nome?: string;
  descricao?: string;
  bairro?: string;
  created_at: string;
  updated_at: string;
  gabinete_id?: string;
  assessor_id?: string;
  [key: string]: any;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
};

export function RecuperacaoDadosPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [detailRecord, setDetailRecord] = useState<SoftDeletedRecord | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch soft-deleted eleitores (last 30 days)
  const { data: deletedEleitores = [], isLoading: loadingE } = useQuery({
    queryKey: ["soft-deleted-eleitores"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("eleitores") as any)
        .select("*")
        .eq("excluido", true)
        .gte("updated_at", thirtyDaysAgo())
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SoftDeletedRecord[];
    },
  });

  // Fetch soft-deleted demandas (last 30 days)
  const { data: deletedDemandas = [], isLoading: loadingD } = useQuery({
    queryKey: ["soft-deleted-demandas"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("demandas") as any)
        .select("*")
        .eq("excluido", true)
        .gte("updated_at", thirtyDaysAgo())
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SoftDeletedRecord[];
    },
  });

  // Restore eleitor
  const restoreEleitor = useMutation({
    mutationFn: async (record: SoftDeletedRecord) => {
      const { error } = await supabase
        .from("eleitores")
        .update({ excluido: false } as any)
        .eq("id", record.id);
      if (error) throw error;

      // Log to audit
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        action: "RESTAURAR_ELEITOR",
        acao: "RESTAURAR_ELEITOR",
        details: {
          eleitor_id: record.id,
          eleitor_nome: record.nome,
          gabinete_id: record.gabinete_id,
          mensagem: `System Master restaurou o eleitor "${record.nome}" excluído do Gabinete ${record.gabinete_id || "desconhecido"}`,
        },
      } as any);
    },
    onSuccess: (_, record) => {
      qc.invalidateQueries({ queryKey: ["soft-deleted-eleitores"] });
      qc.invalidateQueries({ queryKey: ["eleitores"] });
      toast({ title: "✅ Eleitor restaurado", description: `"${record.nome}" foi restaurado com sucesso.` });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao restaurar", description: err.message, variant: "destructive" });
    },
  });

  // Restore demanda
  const restoreDemanda = useMutation({
    mutationFn: async (record: SoftDeletedRecord) => {
      const { error } = await supabase
        .from("demandas")
        .update({ excluido: false } as any)
        .eq("id", record.id);
      if (error) throw error;

      // Log to audit
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        action: "RESTAURAR_DEMANDA",
        acao: "RESTAURAR_DEMANDA",
        details: {
          demanda_id: record.id,
          categoria: record.categoria,
          gabinete_id: record.gabinete_id,
          mensagem: `System Master restaurou a demanda "${record.descricao?.substring(0, 50) || record.id}" excluída do Gabinete ${record.gabinete_id || "desconhecido"}`,
        },
      } as any);
    },
    onSuccess: (_, record) => {
      qc.invalidateQueries({ queryKey: ["soft-deleted-demandas"] });
      qc.invalidateQueries({ queryKey: ["demandas"] });
      toast({ title: "✅ Demanda restaurada", description: "Demanda foi restaurada com sucesso." });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao restaurar", description: err.message, variant: "destructive" });
    },
  });

  const isRestoring = restoreEleitor.isPending || restoreDemanda.isPending;

  // AI audit assistant
  const handleAiAsk = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiResponse("");

    // Gather recent audit logs for context
    const { data: recentLogs } = await (supabase.from("audit_logs") as any)
      .select("action, usuario_nome, gabinete_nome, details, created_at")
      .in("action", ["EXCLUIR_ELEITOR", "EXCLUIR_DEMANDA", "RESTAURAR_ELEITOR", "RESTAURAR_DEMANDA"])
      .order("created_at", { ascending: false })
      .limit(50);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-ai`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ question: aiQuestion, logs: recentLogs || [] }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setAiResponse(fullResponse);
            }
          } catch { /* partial json */ }
        }
      }
    } catch (err: any) {
      toast({ title: "Erro na IA", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-qg-blue-500" /> Recuperação de Dados
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Registros excluídos nos últimos 30 dias. Restaure com um clique.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-destructive/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Users className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-medium">{deletedEleitores.length}</p>
              <p className="text-xs text-muted-foreground">Eleitores excluídos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <FileText className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-medium">{deletedDemandas.length}</p>
              <p className="text-xs text-muted-foreground">Demandas excluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="eleitores">
        <TabsList>
          <TabsTrigger value="eleitores" className="text-xs font-medium gap-1">
            <Users className="h-3 w-3" /> Eleitores ({deletedEleitores.length})
          </TabsTrigger>
          <TabsTrigger value="demandas" className="text-xs font-medium gap-1">
            <FileText className="h-3 w-3" /> Demandas ({deletedDemandas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eleitores">
          {loadingE ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : deletedEleitores.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Nenhum eleitor excluído nos últimos 30 dias.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium uppercase">Nome</TableHead>
                    <TableHead className="text-xs font-medium uppercase hidden sm:table-cell">Bairro</TableHead>
                    <TableHead className="text-xs font-medium uppercase hidden md:table-cell">Excluído em</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedEleitores.map((e) => (
                    <TableRow key={e.id} className="opacity-70 hover:opacity-100 transition-opacity">
                      <TableCell>
                        <p className="font-medium text-sm line-through">{e.nome || "—"}</p>
                        <Badge variant="destructive" className="text-[9px] mt-0.5">Excluído</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{e.bairro || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{formatDate(e.updated_at)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setDetailRecord(e)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          disabled={isRestoring}
                          onClick={() => restoreEleitor.mutate(e)}
                        >
                          <RotateCcw className="h-3 w-3" /> RESTAURAR
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="demandas">
          {loadingD ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : deletedDemandas.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Nenhuma demanda excluída nos últimos 30 dias.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium uppercase">Descrição</TableHead>
                    <TableHead className="text-xs font-medium uppercase hidden sm:table-cell">Categoria</TableHead>
                    <TableHead className="text-xs font-medium uppercase hidden md:table-cell">Excluído em</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedDemandas.map((d) => (
                    <TableRow key={d.id} className="opacity-70 hover:opacity-100 transition-opacity">
                      <TableCell>
                        <p className="font-medium text-sm line-through truncate max-w-[200px]">{d.descricao || "Sem descrição"}</p>
                        <Badge variant="destructive" className="text-[9px] mt-0.5">Excluído</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{d.categoria || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{formatDate(d.updated_at)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setDetailRecord(d)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          disabled={isRestoring}
                          onClick={() => restoreDemanda.mutate(d)}
                        >
                          <RotateCcw className="h-3 w-3" /> RESTAURAR
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* AI Assistant Button */}
      <Card className="border-qg-blue-500/20 bg-gradient-to-br from-qg-blue-500/5 to-transparent">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qg-blue-500/10">
              <Bot className="h-5 w-5 text-qg-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Assistente de Auditoria IA</p>
              <p className="text-xs text-muted-foreground">Pergunte sobre exclusões, padrões suspeitos e histórico</p>
            </div>
          </div>
          <Button
            onClick={() => setAiOpen(true)}
            className="gap-1.5 text-xs font-medium"
            variant="outline"
          >
            <Bot className="h-3.5 w-3.5" /> Falar com IA
          </Button>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">Detalhes do Registro</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-[50vh] whitespace-pre-wrap break-words">
              {JSON.stringify(detailRecord, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chat Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-qg-blue-500" /> Assistente de Auditoria IA
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[50vh] pr-2" ref={scrollRef}>
            {aiResponse ? (
              <div className="text-sm whitespace-pre-wrap break-words p-3 bg-muted/30 rounded-lg">
                {aiResponse}
              </div>
            ) : !aiLoading ? (
              <div className="text-center py-8 space-y-2">
                <Bot className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs text-muted-foreground">Pergunte algo como:</p>
                <div className="space-y-1">
                  {[
                    "O que foi apagado nesse gabinete hoje?",
                    "Quem mais excluiu registros esta semana?",
                    "Há algum padrão suspeito de exclusão?",
                  ].map((q) => (
                    <button
                      key={q}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-foreground transition-colors"
                      onClick={() => { setAiQuestion(q); }}
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analisando logs...</span>
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Pergunte sobre os logs de auditoria..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !aiLoading && handleAiAsk()}
              className="text-sm"
            />
            <Button
              size="icon"
              onClick={handleAiAsk}
              disabled={aiLoading || !aiQuestion.trim()}
              className="shrink-0"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
