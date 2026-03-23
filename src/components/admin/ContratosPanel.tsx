import { useState } from "react";
import { useContratos, useUpsertContrato, ContratoNacional } from "@/hooks/useContratos";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FileText, Loader2, Globe, MapPin, CheckCircle, XCircle, Pencil } from "lucide-react";

const TODOS_ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

const ESCOPO_OPTIONS = ["Regional", "Estadual", "Nacional"];

export function ContratosPanel() {
  const { data: contratos = [], isLoading } = useContratos();
  const upsertContrato = useUpsertContrato();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    user_id: string;
    escopo_geografico: string;
    estados_autorizados: string[];
    limite_gabinetes: number;
    ativo: boolean;
  } | null>(null);

  // Get L4 users (super_admin role_level 4)
  const { data: l4Users = [] } = useQuery({
    queryKey: ["l4-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role_level")
        .eq("role_level", 4);
      if (!data?.length) return [];
      const ids = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      return profiles ?? [];
    },
  });

  // Profile name map
  const { data: profileMap = {} } = useQuery({
    queryKey: ["profile-map-contratos"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { map[p.id] = p.full_name; });
      return map;
    },
  });

  const openEdit = (c: ContratoNacional) => {
    setEditingId(c.id);
    setEditForm({
      user_id: c.user_id,
      escopo_geografico: c.escopo_geografico,
      estados_autorizados: c.estados_autorizados ?? [],
      limite_gabinetes: c.limite_gabinetes,
      ativo: c.ativo,
    });
  };

  const openNew = () => {
    setEditingId("new");
    setEditForm({
      user_id: "",
      escopo_geografico: "Regional",
      estados_autorizados: ["BA"],
      limite_gabinetes: 10,
      ativo: true,
    });
  };

  const toggleEstado = (uf: string) => {
    if (!editForm) return;
    const current = editForm.estados_autorizados;
    if (current.includes(uf)) {
      setEditForm({ ...editForm, estados_autorizados: current.filter(e => e !== uf) });
    } else {
      setEditForm({ ...editForm, estados_autorizados: [...current, uf] });
    }
  };

  const handleSave = async () => {
    if (!editForm || !editForm.user_id) {
      toast({ title: "Selecione um usuário", variant: "destructive" });
      return;
    }
    try {
      await upsertContrato.mutateAsync({
        user_id: editForm.user_id,
        escopo_geografico: editForm.escopo_geografico,
        estados_autorizados: editForm.estados_autorizados,
        limite_gabinetes: editForm.limite_gabinetes,
        ativo: editForm.ativo,
      });
      toast({ title: "Contrato salvo! ✅" });
      setEditingId(null);
      setEditForm(null);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Contratos Nacionais</h3>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1 text-xs font-bold uppercase tracking-wider">
          + Novo Contrato
        </Button>
      </div>

      <Card className="border-purple-500/20">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : contratos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum contrato cadastrado. Crie um para definir o escopo geográfico de um usuário Nível 4.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Usuário L4</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Escopo</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Estados</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Limite</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{(profileMap as any)[c.user_id] || c.user_id.slice(0, 8) + "…"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
                          <Globe className="h-3 w-3 mr-1" />{c.escopo_geografico}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(c.estados_autorizados ?? []).slice(0, 5).map(uf => (
                            <Badge key={uf} variant="secondary" className="text-[9px] px-1.5 py-0">{uf}</Badge>
                          ))}
                          {(c.estados_autorizados?.length ?? 0) > 5 && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{(c.estados_autorizados?.length ?? 0) - 5}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm font-bold">{c.limite_gabinetes}</span>
                      </TableCell>
                      <TableCell>
                        {c.ativo ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                            <CheckCircle className="h-3 w-3" /> Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                            <XCircle className="h-3 w-3" /> Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="h-7 w-7 p-0">
                          <Pencil className="h-3.5 w-3.5" />
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

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingId} onOpenChange={(v) => { if (!v) { setEditingId(null); setEditForm(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-tight">
              {editingId === "new" ? "Novo Contrato" : "Editar Contrato"}
            </DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Usuário Nível 4</Label>
                <Select value={editForm.user_id} onValueChange={(v) => setEditForm({ ...editForm, user_id: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecione o usuário" /></SelectTrigger>
                  <SelectContent>
                    {l4Users.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Escopo Geográfico</Label>
                <Select value={editForm.escopo_geografico} onValueChange={(v) => setEditForm({ ...editForm, escopo_geografico: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESCOPO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Estados Autorizados</Label>
                <div className="grid grid-cols-6 gap-1.5 max-h-[200px] overflow-y-auto p-1">
                  {TODOS_ESTADOS.map(uf => {
                    const selected = editForm.estados_autorizados.includes(uf);
                    return (
                      <button key={uf} type="button" onClick={() => toggleEstado(uf)}
                        className={`text-[10px] font-bold py-1.5 rounded-md border transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        }`}>
                        {uf}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {editForm.estados_autorizados.length} estado(s) selecionado(s)
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Limite de Gabinetes</Label>
                <Input type="number" min={1} max={1000} value={editForm.limite_gabinetes}
                  onChange={(e) => setEditForm({ ...editForm, limite_gabinetes: parseInt(e.target.value) || 10 })}
                  className="min-h-[44px]" />
              </div>

              <div className="flex items-center justify-between border border-border p-3 rounded-xl">
                <div>
                  <p className="text-sm font-bold">Contrato Ativo</p>
                  <p className="text-xs text-muted-foreground">Desativar bloqueia o acesso ao mapa nacional</p>
                </div>
                <Switch checked={editForm.ativo} onCheckedChange={(v) => setEditForm({ ...editForm, ativo: v })} />
              </div>

              <Button onClick={handleSave} disabled={upsertContrato.isPending}
                className="w-full min-h-[48px] text-sm font-bold uppercase tracking-wider rounded-full">
                {upsertContrato.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Contrato
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
