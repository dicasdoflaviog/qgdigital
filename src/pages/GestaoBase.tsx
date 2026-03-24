import { useState, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Filter, Download, MessageSquare, Shield, Search,
  X, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function GestaoBase() {
  const { role, user } = useAuth();
  const { toast } = useToast();

  const [bairroFilter, setBairroFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [assessorFilter, setAssessorFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const isSuperAdmin = role === "super_admin";

  const { data: eleitores = [], isLoading } = useQuery({
    queryKey: ["gestao-eleitores"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eleitores")
        .select("*, assessores(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: assessores = [] } = useQuery({
    queryKey: ["gestao-assessores"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("assessores").select("id, nome");
      return data ?? [];
    },
  });

  const bairros = useMemo(() => {
    const set = new Set(eleitores.map((e: any) => e.bairro).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [eleitores]);

  const statuses = useMemo(() => {
    const set = new Set(eleitores.map((e: any) => e.situacao).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [eleitores]);

  const filtered = useMemo(() => {
    return eleitores.filter((e: any) => {
      if (bairroFilter !== "todos" && e.bairro !== bairroFilter) return false;
      if (statusFilter !== "todos" && e.situacao !== statusFilter) return false;
      if (assessorFilter !== "todos" && e.assessor_id !== assessorFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!e.nome.toLowerCase().includes(q) && !e.whatsapp.includes(q)) return false;
      }
      return true;
    });
  }, [eleitores, bairroFilter, statusFilter, assessorFilter, searchTerm]);

  const buildWhatsAppLink = (nome: string, bairro: string, whatsapp: string) => {
    const phone = whatsapp.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const msg = encodeURIComponent(
      `Olá, ${nome}! Aqui é o Vereador. Sobre aquele pedido no bairro ${bairro}...`
    );
    return `https://wa.me/${fullPhone}?text=${msg}`;
  };

  const logAudit = async (action: string, details: Record<string, any>) => {
    if (!user) return;
    await supabase.from("audit_logs" as any).insert({
      user_id: user.id,
      action,
      details,
    } as any);
  };

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    setExportProgress(10);
    try {
      setExportProgress(40);
      const header = "Name,Phone 1 - Value,Phone 1 - Type,Notes";
      const rows = filtered.map((e: any) => {
        const phone = e.whatsapp.replace(/\D/g, "");
        const fullPhone = phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
        const notes = `Bairro: ${e.bairro || "N/A"}`;
        return `"${e.nome}","${fullPhone}","Mobile","${notes}"`;
      });
      setExportProgress(70);
      const csv = [header, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contatos_campanha_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportProgress(90);
      await logAudit("export_base_csv", {
        total_exported: filtered.length,
        filters: { bairro: bairroFilter, status: statusFilter, assessor: assessorFilter },
      });
      setExportProgress(100);
      toast({ title: "Exportação concluída", description: `${filtered.length} contatos exportados.` });
    } catch {
      toast({ title: "Erro na exportação", variant: "destructive" });
    } finally {
      setTimeout(() => { setExporting(false); setExportProgress(0); }, 800);
    }
  }, [filtered, bairroFilter, statusFilter, assessorFilter, user]);

  const clearFilters = () => {
    setBairroFilter("todos");
    setStatusFilter("todos");
    setAssessorFilter("todos");
    setSearchTerm("");
  };

  const hasActiveFilters = bairroFilter !== "todos" || statusFilter !== "todos" || assessorFilter !== "todos" || searchTerm !== "";

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <Badge variant="outline" className="text-[10px] font-medium">Super Admin</Badge>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[-0.04em] text-foreground leading-[0.9]">
          Gestão de Base Eleitoral
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Segmentação avançada, envio de WhatsApp e exportação para campanha.
        </p>
      </div>

      <div className="border-t border-border" />

      {/* Filters */}
      <Card className="animate-fade-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5 font-medium tracking-tight ">
            <Filter className="h-4 w-4" /> Filtros de Segmentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou WhatsApp..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={bairroFilter} onValueChange={setBairroFilter}>
              <SelectTrigger><SelectValue placeholder="Bairro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Bairros</SelectItem>
                {bairros.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assessorFilter} onValueChange={setAssessorFilter}>
              <SelectTrigger><SelectValue placeholder="Assessor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Assessores</SelectItem>
                {assessores.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span> eleitores encontrados
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
                <X className="h-3 w-3" /> Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-up">
        <Button
          onClick={handleExportCSV}
          disabled={filtered.length === 0 || exporting}
          className="w-full gap-2 font-medium text-sm h-12"
        >
          <Download className="h-4 w-4" /> Exportar Contatos para Lista de Transmissão
        </Button>
        <Button
          variant="secondary"
          disabled={filtered.length === 0}
          onClick={() => toast({ title: `${filtered.length} contatos prontos`, description: "Use o botão WhatsApp ao lado de cada nome na tabela abaixo." })}
          className="w-full gap-2 font-medium text-sm h-12"
        >
          <MessageSquare className="h-4 w-4" /> WhatsApp em Massa
        </Button>
      </div>

      {exporting && (
        <div className="space-y-2 animate-fade-in">
          <Progress value={exportProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">Consolidando dados do mandato...</p>
        </div>
      )}

      {/* Table */}
      <Card className="animate-fade-up">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando base...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum eleitor encontrado com os filtros aplicados.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium text-xs">Nome</TableHead>
                    <TableHead className="font-medium text-xs">WhatsApp</TableHead>
                    <TableHead className="font-medium text-xs hidden sm:table-cell">Bairro</TableHead>
                    <TableHead className="font-medium text-xs hidden md:table-cell">Status</TableHead>
                    <TableHead className="font-medium text-xs hidden lg:table-cell">Assessor</TableHead>
                    <TableHead className="font-medium text-xs text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-sm">{e.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.whatsapp || "—"}</TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px]">{e.bairro || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">
                        <Badge variant={e.situacao === "Resolvido" ? "default" : "secondary"} className="text-[10px]">{e.situacao}</Badge>
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">
                        {(e as any).assessores?.nome || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {e.whatsapp ? (
                          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs font-medium !text-[#21c45d]">
                            <a href={buildWhatsAppLink(e.nome, e.bairro, e.whatsapp)} target="_blank" rel="noopener noreferrer">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem nº</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 100 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Exibindo 100 de {filtered.length} resultados. Exporte para ver todos.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
