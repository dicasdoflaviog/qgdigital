import { useState, useEffect, useMemo } from "react";
import { Scale, Search, Download, FileText, Clock, CheckCircle2, Filter, Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface DocumentoLegislativo {
  id: string;
  gabinete_id: string;
  tipo: string | null;
  numero_protocolo: string | null;
  titulo: string;
  descricao: string | null;
  status: string;
  link_arquivo: string | null;
  created_by: string | null;
  created_at: string;
}

interface GabineteInfo {
  id: string;
  full_name: string;
}

const TIPOS_DOCUMENTO = ["Ofício", "Projeto de Lei", "Indicação", "Moção", "Requerimento"];
const STATUS_OPTIONS = ["Protocolado", "Em Tramitação", "Em tramitação", "Aprovado", "Respondido", "Aguardando", "Arquivado"];
// Deduplicate display (normalize casing for filter matching)
const UNIQUE_STATUS = [...new Set(STATUS_OPTIONS.map(s => s))];

const statusColor: Record<string, string> = {
  "Protocolado": "bg-blue-500/10 text-blue-700 border-blue-500/20",
  "Em tramitação": "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  "Em Tramitação": "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  "Aprovado": "bg-green-500/10 text-green-700 border-green-500/20",
  "Respondido": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  "Aguardando": "bg-orange-500/10 text-orange-700 border-orange-500/20",
  "Arquivado": "bg-muted text-muted-foreground border-border",
};

const RESPONDIDO_STATUSES = ["Respondido", "Aprovado"];
const AGUARDANDO_STATUSES = ["Protocolado", "Em tramitação", "Em Tramitação", "Aguardando"];

export default function ObservatorioLegislativo() {
  const { role, realRole, roleLevel } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [docs, setDocs] = useState<DocumentoLegislativo[]>([]);
  const [gabinetes, setGabinetes] = useState<GabineteInfo[]>([]);
  const [gabineteMap, setGabineteMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterGabinete, setFilterGabinete] = useState("todos");

  const isL4orL5 = roleLevel >= 4;
  const isSuperAdmin = role === "super_admin";
  const canCreate = role === "secretaria" || role === "admin";

  useEffect(() => {
    fetchDocuments();
    if (isL4orL5) fetchGabinetes();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("obs-legislativo-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documentos_legislativos" },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documentos_legislativos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar documentos", description: error.message, variant: "destructive" });
    } else {
      setDocs((data as DocumentoLegislativo[]) || []);
    }
    setLoading(false);
  };

  const fetchGabinetes = async () => {
    // Fetch L3 (admin) gabinetes — these are the vereadores
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminRoles && adminRoles.length > 0) {
      const userIds = adminRoles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      if (profiles) {
        setGabinetes(profiles);
        const map: Record<string, string> = {};
        profiles.forEach((p) => { map[p.id] = p.full_name; });
        setGabineteMap(map);
      }
    }
  };

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (filterTipo !== "todos" && d.tipo !== filterTipo) return false;
      if (filterStatus !== "todos" && d.status !== filterStatus) return false;
      if (filterGabinete !== "todos" && d.gabinete_id !== filterGabinete) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.titulo.toLowerCase().includes(q) ||
          (d.numero_protocolo || "").toLowerCase().includes(q) ||
          (d.tipo || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [docs, filterTipo, filterStatus, filterGabinete, search]);

  // Counters based on FILTERED data
  const totalFiltered = filtered.length;
  const respondidos = filtered.filter((d) => RESPONDIDO_STATUSES.includes(d.status)).length;
  const aguardando = filtered.filter((d) => AGUARDANDO_STATUSES.includes(d.status)).length;
  const arquivados = filtered.filter((d) => d.status === "Arquivado").length;

  const handleDownload = (doc: DocumentoLegislativo) => {
    if (doc.link_arquivo) {
      window.open(doc.link_arquivo, "_blank");
    } else {
      toast({ title: "Sem arquivo", description: "Este documento não possui arquivo anexado." });
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [newDoc, setNewDoc] = useState({ titulo: "", tipo: "Ofício", numero_protocolo: "", descricao: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newDoc.titulo.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: profile } = await supabase.from("profiles").select("gabinete_id").eq("id", (await supabase.auth.getUser()).data.user?.id || "").single();

    const { error } = await supabase.from("documentos_legislativos").insert({
      titulo: newDoc.titulo,
      tipo: newDoc.tipo,
      numero_protocolo: newDoc.numero_protocolo || null,
      descricao: newDoc.descricao || null,
      gabinete_id: profile?.gabinete_id || "00000000-0000-0000-0000-000000000000",
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
    });

    if (error) {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Documento cadastrado com sucesso!" });
      setNewDoc({ titulo: "", tipo: "Ofício", numero_protocolo: "", descricao: "" });
      setShowForm(false);
      fetchDocuments();
    }
    setSaving(false);
  };

  // Get unique statuses from actual data for filter
  const availableStatuses = useMemo(() => {
    const set = new Set(docs.map((d) => d.status));
    return Array.from(set).sort();
  }, [docs]);

  return (
    <div className="p-4 md:p-6 space-y-4 pb-28 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="h-4 w-4" />
          </div>
          Observatório Legislativo
        </h1>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          {isL4orL5 ? "Visão global de todos os gabinetes da rede" : "Documentos legislativos do gabinete"}
        </p>
      </div>

      {/* Counters — reflect filtered data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              {loading ? <Skeleton className="h-5 w-10 mb-1" /> : (
                <p className="text-lg font-bold text-foreground">{totalFiltered}</p>
              )}
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              {loading ? <Skeleton className="h-5 w-10 mb-1" /> : (
                <p className="text-lg font-bold text-foreground">{respondidos}</p>
              )}
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Respondidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              {loading ? <Skeleton className="h-5 w-10 mb-1" /> : (
                <p className="text-lg font-bold text-foreground">{aguardando}</p>
              )}
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-500 text-white">
              <Archive className="h-4 w-4" />
            </div>
            <div>
              {loading ? <Skeleton className="h-5 w-10 mb-1" /> : (
                <p className="text-lg font-bold text-foreground">{arquivados}</p>
              )}
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Arquivados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        {canCreate && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <FileText className="h-4 w-4" />
            Novo Documento
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showForm && canCreate && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Cadastrar Documento Legislativo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Título *" value={newDoc.titulo} onChange={(e) => setNewDoc({ ...newDoc, titulo: e.target.value })} />
              <Select value={newDoc.tipo} onValueChange={(v) => setNewDoc({ ...newDoc, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Nº Protocolo" value={newDoc.numero_protocolo} onChange={(e) => setNewDoc({ ...newDoc, numero_protocolo: e.target.value })} />
              <Input placeholder="Descrição" value={newDoc.descricao} onChange={(e) => setNewDoc({ ...newDoc, descricao: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={saving}>{saving ? "Salvando..." : "Cadastrar"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título ou protocolo..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-full sm:w-40"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            {TIPOS_DOCUMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {availableStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {isL4orL5 && gabinetes.length > 0 && (
          <Select value={filterGabinete} onValueChange={setFilterGabinete}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Vereador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Vereadores</SelectItem>
              {gabinetes.map((g) => <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Scale className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum documento encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    {isL4orL5 && <TableHead>Gabinete</TableHead>}
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    {(isSuperAdmin || realRole === "super_admin") && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{doc.titulo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{doc.tipo || "—"}</Badge>
                      </TableCell>
                      {isL4orL5 && (
                        <TableCell className="text-xs text-muted-foreground">
                          {gabineteMap[doc.gabinete_id] || doc.gabinete_id.slice(0, 8)}
                        </TableCell>
                      )}
                      <TableCell className="text-xs text-muted-foreground">{doc.numero_protocolo || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColor[doc.status] || ""}`}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      {(isSuperAdmin || realRole === "super_admin") && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)} className="h-7 px-2">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
