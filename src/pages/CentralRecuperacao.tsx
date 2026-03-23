import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Archive, RotateCcw, Download, Users, MapPin, Clock, Shield, AlertTriangle,
  FileText, FileBarChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { generateStrategicReport, generatePublicReport } from "@/lib/reportGenerators";

export default function CentralRecuperacao() {
  const { role } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = role === "super_admin";
  const [generatingStrategic, setGeneratingStrategic] = useState(false);
  const [generatingPublic, setGeneratingPublic] = useState(false);

  const handleStrategicReport = async () => {
    setGeneratingStrategic(true);
    try {
      await generateStrategicReport();
      toast({ title: "Relatório estratégico gerado!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar relatório", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingStrategic(false);
    }
  };

  const handlePublicReport = async () => {
    setGeneratingPublic(true);
    try {
      await generatePublicReport();
      toast({ title: "Prestação de contas gerada!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar relatório", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingPublic(false);
    }
  };

  // Backup exclusões (audit trail)
  const { data: backups = [], isLoading: loadingBackups } = useQuery({
    queryKey: ["backup-exclusoes"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backup_exclusoes")
        .select("*")
        .order("excluido_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Deactivated profiles
  const { data: deactivated = [], isLoading: loadingDeactivated } = useQuery({
    queryKey: ["deactivated-profiles"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Orphaned eleitores (assessor_id = null, from SET NULL)
  const { data: orphanedCount = 0 } = useQuery({
    queryKey: ["orphaned-eleitores"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("eleitores")
        .select("*", { count: "exact", head: true })
        .is("assessor_id", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Total eleitores
  const { data: totalEleitores = 0 } = useQuery({
    queryKey: ["total-eleitores-backup"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("eleitores")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Unique bairros
  const { data: bairros = [] } = useQuery({
    queryKey: ["unique-bairros-backup"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eleitores")
        .select("bairro")
        .neq("bairro", "");
      if (error) throw error;
      const unique = new Set((data ?? []).map((e: any) => e.bairro));
      return Array.from(unique);
    },
  });

  const handleReactivate = async (profileId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: true } as any)
      .eq("id", profileId);
    if (error) {
      toast({ title: "Erro ao reativar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil reativado com sucesso!" });
    }
  };

  const handleExportBackup = (backup: any) => {
    const json = JSON.stringify(backup.dados_originais, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${backup.tabela_origem}_${new Date(backup.excluido_em).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Backup exportado!" });
  };

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      {/* Header - Purple/Gray system area */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Archive className="h-5 w-5 text-purple-500" />
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">
            Área de Sistema
          </Badge>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[-0.04em] text-foreground leading-[0.9]">
          Central de Recuperação
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Backup, reativação de mandatos e auditoria de exclusões.
        </p>
      </div>

      <Separator className="bg-purple-500/20" />

      {/* Report Export Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-bold">Relatório Estratégico</p>
                <p className="text-xs text-muted-foreground">Interno • Tabelas e dados brutos</p>
              </div>
            </div>
            <Button
              onClick={handleStrategicReport}
              disabled={generatingStrategic}
              className="w-full gap-2 text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-700 text-white"
            >
              <FileBarChart className="h-4 w-4" />
              {generatingStrategic ? "Gerando..." : "Exportar Relatório Estratégico"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold">Prestação de Contas</p>
                <p className="text-xs text-muted-foreground">Público • Dados anonimizados</p>
              </div>
            </div>
            <Button
              onClick={handlePublicReport}
              disabled={generatingPublic}
              className="w-full gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <FileText className="h-4 w-4" />
              {generatingPublic ? "Gerando..." : "Exportar Prestação de Contas"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{totalEleitores}</p>
                <p className="text-xs text-muted-foreground font-medium">Total de Eleitores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <MapPin className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{bairros.length}</p>
                <p className="text-xs text-muted-foreground font-medium">Bairros Mapeados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <AlertTriangle className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{orphanedCount}</p>
                <p className="text-xs text-muted-foreground font-medium">Eleitores Órfãos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{deactivated.length}</p>
                <p className="text-xs text-muted-foreground font-medium">Contas Desativadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deactivated Profiles Table */}
      <Card className="border-purple-500/20 animate-fade-up">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Archive className="h-4 w-4 text-purple-500" /> Gabinetes Desativados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingDeactivated ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : deactivated.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum gabinete desativado encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Nome</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Data Desativação</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">WhatsApp</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deactivated.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.full_name || "Sem nome"}</p>
                          <Badge className="bg-destructive/10 text-destructive text-[10px] mt-1">Desativado</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {formatDate(p.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {p.whatsapp || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs font-bold border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                          onClick={() => handleReactivate(p.id)}
                        >
                          <RotateCcw className="h-3 w-3" /> Reativar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log - Exclusions */}
      <Card className="border-purple-500/20 animate-fade-up">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" /> Auditoria de Exclusões
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingBackups ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum registro de exclusão encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Origem</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Dados</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Data</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Backup</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((b: any) => {
                    const dados = b.dados_originais as any;
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
                            {b.tabela_origem}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <p className="font-medium">{dados?.full_name || dados?.nome || "—"}</p>
                          <p className="text-xs text-muted-foreground">{dados?.email || dados?.whatsapp || ""}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                          {formatDate(b.excluido_em)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs font-bold"
                            onClick={() => handleExportBackup(b)}
                          >
                            <Download className="h-3 w-3" /> JSON
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
