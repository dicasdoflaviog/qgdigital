import { useState } from "react";
import { Building2, Plus, Search, Phone, MapPin, Trash2, ChevronRight, Landmark, FileText, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInstituicoes, useCreateInstituicao, useDeleteInstituicao, Instituicao } from "@/hooks/useInstituicoes";
import { useEmendas } from "@/hooks/useEmendas";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BAIRROS } from "@/data/mockData";

const TIPOS = ["Igreja", "Associação", "Escola", "ONG", "Órgão Público", "Outros"];

function InstituicaoProfile({ inst, onBack }: { inst: Instituicao; onBack: () => void }) {
  const { data: allEmendas = [] } = useEmendas();
  const emendasDestinadas = allEmendas.filter((e) => e.destino_instituicao_id === inst.id);
  const totalValorEmendas = emendasDestinadas.reduce((s, e) => s + (Number(e.valor) || 0), 0);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors active:scale-95">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>

      <div className="bg-card rounded-2xl p-5 border border-border/50 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{inst.nome}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="rounded-full text-[10px]">{inst.tipo || "Outros"}</Badge>
              {inst.bairro && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{inst.bairro}</span>}
            </div>
          </div>
        </div>

        {inst.responsavel_nome && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Responsável:</span> {inst.responsavel_nome}
            {inst.responsavel_contato && <span> · <Phone className="h-3 w-3 inline" /> {inst.responsavel_contato}</span>}
          </div>
        )}
        {inst.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {inst.cnpj}</p>}
        {inst.endereco && <p className="text-xs text-muted-foreground">Endereço: {inst.endereco}</p>}
        {inst.historico_apoio && (
          <div>
            <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground mb-1">Histórico de Apoio</p>
            <p className="text-xs text-foreground bg-muted/50 p-3 rounded-xl">{inst.historico_apoio}</p>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Landmark className="h-3.5 w-3.5 text-primary" />
            <span className="text-[9px] uppercase tracking-wide font-medium text-muted-foreground">Emendas Destinadas</span>
          </div>
          <p className="text-lg font-bold text-foreground">{emendasDestinadas.length}</p>
          <p className="text-[10px] text-muted-foreground">
            {totalValorEmendas > 0 ? totalValorEmendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span className="text-[9px] uppercase tracking-wide font-medium text-muted-foreground">Demandas</span>
          </div>
          <p className="text-lg font-bold text-foreground">0</p>
          <p className="text-[10px] text-muted-foreground">Em breve</p>
        </div>
      </div>

      {/* Emendas list */}
      {emendasDestinadas.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Emendas vinculadas</p>
          <div className="space-y-2">
            {emendasDestinadas.map((e) => (
              <div key={e.id} className="bg-muted/50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">{e.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">{e.status} · {e.ano_exercicio}</p>
                </div>
                {e.valor && <span className="text-xs font-semibold text-primary">{Number(e.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Instituicoes() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [bairroFilter, setBairroFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<Instituicao | null>(null);

  const { data: instituicoes = [], isLoading } = useInstituicoes({ search, tipo: tipoFilter });
  const createMut = useCreateInstituicao();
  const deleteMut = useDeleteInstituicao();

  const filtered = bairroFilter === "todos" ? instituicoes : instituicoes.filter((i) => i.bairro === bairroFilter);

  const [form, setForm] = useState({
    nome: "", tipo: "Associação", cnpj: "", responsavel_nome: "",
    responsavel_contato: "", endereco: "", bairro: "", historico_apoio: "",
  });

  const resetForm = () => setForm({
    nome: "", tipo: "Associação", cnpj: "", responsavel_nome: "",
    responsavel_contato: "", endereco: "", bairro: "", historico_apoio: "",
  });

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    try {
      await createMut.mutateAsync({ ...form, gabinete_id: user?.id ?? "" });
      toast.success("Instituição cadastrada!");
      setModalOpen(false);
      resetForm();
    } catch {
      toast.error("Erro ao cadastrar instituição");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Instituição removida");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  if (selectedInst) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
        <InstituicaoProfile inst={selectedInst} onBack={() => setSelectedInst(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Gestão Institucional</h1>
          <p className="text-xs text-muted-foreground">Rede de Apoio — Associações e Órgãos</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm" className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card" />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[110px] rounded-xl bg-card text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={bairroFilter} onValueChange={setBairroFilter}>
          <SelectTrigger className="w-[110px] rounded-xl bg-card text-xs">
            <SelectValue placeholder="Bairro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {BAIRROS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma instituição encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelectedInst(inst)}
              className="w-full text-left bg-card rounded-2xl p-4 border border-border/50 space-y-2 hover:border-primary/30 transition-colors active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inst.nome}</p>
                    {inst.responsavel_nome && <p className="text-xs text-muted-foreground">{inst.responsavel_nome}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="rounded-full text-[10px] font-medium">{inst.tipo || "Outros"}</Badge>
                  <button
                    onClick={(e) => handleDelete(inst.id, e)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {inst.bairro && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {inst.bairro}</span>}
                {inst.responsavel_contato && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {inst.responsavel_contato}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Nova Instituição</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Responsável</Label>
                <Input value={form.responsavel_nome} onChange={(e) => setForm({ ...form, responsavel_nome: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Contato</Label>
                <Input value={form.responsavel_contato} onChange={(e) => setForm({ ...form, responsavel_contato: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Endereço</Label>
                <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Bairro</Label>
                <Select value={form.bairro} onValueChange={(v) => setForm({ ...form, bairro: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{BAIRROS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Histórico de Apoio</Label>
              <Textarea value={form.historico_apoio} onChange={(e) => setForm({ ...form, historico_apoio: e.target.value })} className="rounded-xl resize-none" rows={2} />
            </div>
            <Button onClick={handleSave} disabled={createMut.isPending} className="w-full rounded-full">
              {createMut.isPending ? "Salvando..." : "Cadastrar Instituição"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
