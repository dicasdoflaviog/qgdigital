import { useState } from "react";
import { Landmark, Plus, TrendingUp, CircleDollarSign, FileBarChart, Trash2, HardHat, CheckCircle2, Clock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmendas, useEmendasStats, useCreateEmenda, useDeleteEmenda } from "@/hooks/useEmendas";
import { useInstituicoes } from "@/hooks/useInstituicoes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const STATUS_STEPS = ["Indicada", "Aprovada", "Em Execução", "Concluída"];
const STATUS_COLORS: Record<string, string> = {
  Indicada: "hsl(var(--muted-foreground))",
  Aprovada: "hsl(var(--primary))",
  "Em Execução": "hsl(var(--warning))",
  Concluída: "hsl(var(--success))",
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  Indicada: <Clock className="h-3.5 w-3.5" />,
  Aprovada: <CheckCircle2 className="h-3.5 w-3.5" />,
  "Em Execução": <HardHat className="h-3.5 w-3.5" />,
  Concluída: <CheckCircle2 className="h-3.5 w-3.5" />,
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ProgressStepper({ current }: { current: string }) {
  const idx = STATUS_STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-1 w-full mt-2">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= idx;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full transition-colors ${done ? "bg-primary" : "bg-muted"}`} />
            <span className={`text-[9px] leading-tight ${done ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Emendas() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: emendas = [], isLoading } = useEmendas({ status: statusFilter });
  const { data: stats } = useEmendasStats();
  const { data: instituicoes = [] } = useInstituicoes();
  const createMut = useCreateEmenda();
  const deleteMut = useDeleteEmenda();

  const [form, setForm] = useState({
    titulo: "", valor: "", ano_exercicio: String(new Date().getFullYear()),
    status: "Indicada", destino_instituicao_id: "", descricao: "",
  });

  const resetForm = () => setForm({
    titulo: "", valor: "", ano_exercicio: String(new Date().getFullYear()),
    status: "Indicada", destino_instituicao_id: "", descricao: "",
  });

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título é obrigatório"); return; }
    try {
      await createMut.mutateAsync({
        titulo: form.titulo,
        valor: form.valor ? parseFloat(form.valor) : undefined,
        ano_exercicio: form.ano_exercicio ? parseInt(form.ano_exercicio) : undefined,
        status: form.status,
        destino_instituicao_id: form.destino_instituicao_id || undefined,
        descricao: form.descricao || undefined,
        gabinete_id: user?.id ?? "",
      });
      toast.success("Emenda cadastrada!");
      setModalOpen(false);
      resetForm();
    } catch {
      toast.error("Erro ao cadastrar emenda");
    }
  };

  const pieData = stats
    ? Object.entries(stats.byStatus).map(([name, { count }]) => ({ name, value: count }))
    : [];

  const indicado = stats?.byStatus?.["Indicada"]?.valor ?? 0;
  const emExecucao = stats?.byStatus?.["Em Execução"]?.valor ?? 0;
  const concluido = stats?.byStatus?.["Concluída"]?.valor ?? 0;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-foreground">Painel de Emendas</h1>
          <p className="text-xs text-muted-foreground">Acompanhamento parlamentar</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm" className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      {/* Highlight Cards — 3 cols */}
      <div className="grid grid-cols-3 gap-2">
        <div
          className={`bg-card rounded-2xl p-3 border cursor-pointer transition-all active:scale-95 ${
            statusFilter === "Indicada"
              ? "border-primary ring-2 ring-primary/30 bg-primary/5"
              : "border-border/50 hover:border-primary/40"
          }`}
          onClick={() => setStatusFilter(statusFilter === "Indicada" ? "todos" : "Indicada")}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">Total indicado</span>
          </div>
          <p className="text-sm font-medium text-foreground">{formatCurrency(indicado)}</p>
          <p className="text-[10px] text-muted-foreground">{stats?.byStatus?.["Indicada"]?.count ?? 0} emendas</p>
        </div>
        <div
          className={`bg-card rounded-2xl p-3 border cursor-pointer transition-all active:scale-95 ${
            statusFilter === "Em Execução"
              ? "border-warning ring-2 ring-warning/30 bg-warning/5"
              : "border-border/50 hover:border-warning/40"
          }`}
          onClick={() => setStatusFilter(statusFilter === "Em Execução" ? "todos" : "Em Execução")}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <HardHat className="h-3.5 w-3.5 text-warning" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">Em execução</span>
          </div>
          <p className="text-sm font-medium text-foreground">{formatCurrency(emExecucao)}</p>
          <p className="text-[10px] text-muted-foreground">{stats?.byStatus?.["Em Execução"]?.count ?? 0} emendas</p>
        </div>
        <div
          className={`bg-card rounded-2xl p-3 border cursor-pointer transition-all active:scale-95 ${
            statusFilter === "Concluída"
              ? "border-success ring-2 ring-success/30 bg-success/5"
              : "border-border/50 hover:border-success/40"
          }`}
          onClick={() => setStatusFilter(statusFilter === "Concluída" ? "todos" : "Concluída")}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">Concluído</span>
          </div>
          <p className="text-sm font-medium text-foreground">{formatCurrency(concluido)}</p>
          <p className="text-[10px] text-muted-foreground">{stats?.byStatus?.["Concluída"]?.count ?? 0} emendas</p>
        </div>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <p className="text-xs font-medium text-foreground mb-3">Distribuição por Status</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3} stroke="none">
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "hsl(var(--muted))"} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [value, name]} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
              <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["todos", ...STATUS_STEPS].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border/50"
            }`}
          >
            {s === "todos" ? "Todos" : s}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : emendas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Landmark className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma emenda cadastrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emendas.map((e) => (
            <div key={e.id} className="bg-card rounded-2xl p-4 border border-border/50 space-y-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${STATUS_COLORS[e.status]}20` }}>
                    <Landmark className="h-4 w-4" style={{ color: STATUS_COLORS[e.status] }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.titulo}</p>
                    {e.descricao && <p className="text-xs text-muted-foreground line-clamp-1">{e.descricao}</p>}
                  </div>
                </div>
                <button
                  onClick={() => deleteMut.mutateAsync(e.id).then(() => toast.success("Removida"))}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {e.valor && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <TrendingUp className="h-3 w-3 text-primary" /> {formatCurrency(Number(e.valor))}
                  </span>
                )}
                {e.ano_exercicio && <span>Ano: {e.ano_exercicio}</span>}
              </div>
              {/* Progress stepper */}
              <ProgressStepper current={e.status} />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Nova Emenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Valor (R$)</Label>
                <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Ano</Label>
                <Input type="number" value={form.ano_exercicio} onChange={(e) => setForm({ ...form, ano_exercicio: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_STEPS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Instituição destino</Label>
                <Select value={form.destino_instituicao_id} onValueChange={(v) => setForm({ ...form, destino_instituicao_id: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {instituicoes.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="rounded-xl resize-none" rows={2} />
            </div>
            <Button onClick={handleSave} disabled={createMut.isPending} className="w-full rounded-full">
              {createMut.isPending ? "Salvando..." : "Cadastrar Emenda"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
