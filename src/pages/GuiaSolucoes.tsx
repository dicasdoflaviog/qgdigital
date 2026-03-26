import { useState, useEffect, useMemo } from "react";
import { Search, Phone, MessageCircle, Plus, Building2, Heart, Shield, Wrench, Sparkles, X, Trash2, Pencil, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DEFAULT_CATEGORIAS = [
  { value: "infraestrutura", label: "Infraestrutura", icon: Wrench, color: "text-amber-500" },
  { value: "saude", label: "Saúde", icon: Heart, color: "text-rose-500" },
  { value: "seguranca_social", label: "Segurança / Social", icon: Shield, color: "text-blue-500" },
  { value: "outros", label: "Outros", icon: Building2, color: "text-muted-foreground" },
];

interface ContatoEstrategico {
  id: string;
  nome: string;
  cargo_funcao: string | null;
  instituicao: string | null;
  whatsapp: string;
  bairro_atuacao: string;
  categoria: string;
  observacao: string | null;
  created_at: string;
}

function getCategoriaInfo(cat: string) {
  const found = DEFAULT_CATEGORIAS.find((c) => c.value === cat);
  if (found) return found;
  return { value: cat, label: cat, icon: Tag, color: "text-primary" };
}

function buildWhatsAppUrl(contato: ContatoEstrategico, assessorName: string) {
  const phone = contato.whatsapp.replace(/\D/g, "");
  const problema = "[Problema]";
  const bairroText = contato.bairro_atuacao || "[Bairro]";
  const msg = encodeURIComponent(
    `Olá ${contato.nome}, aqui é ${assessorName || "o assessor"} do Gabinete do Vereador. Estou aqui com um morador do ${bairroText} que precisa de um auxílio urgente sobre ${problema}. Pode nos dar uma orientação?`
  );
  return `https://wa.me/55${phone}?text=${msg}`;
}

export default function GuiaSolucoes() {
  const [contatos, setContatos] = useState<ContatoEstrategico[]>([]);
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const { role, profile } = useAuth();

  const isAdmin = role === "admin" || role === "super_admin";

  // Build dynamic categories from defaults + any custom ones from data
  const CATEGORIAS = useMemo(() => {
    const customCats = contatos
      .map((c) => c.categoria)
      .filter((cat) => !DEFAULT_CATEGORIAS.some((d) => d.value === cat));
    const uniqueCustom = [...new Set(customCats)];
    return [
      ...DEFAULT_CATEGORIAS,
      ...uniqueCustom.map((cat) => ({
        value: cat,
        label: cat,
        icon: Tag,
        color: "text-primary",
      })),
    ];
  }, [contatos]);

  // Form state
  const [form, setForm] = useState({
    nome: "", cargo_funcao: "", instituicao: "", whatsapp: "",
    bairro_atuacao: "", categoria: "infraestrutura", observacao: "",
  });

  const resetForm = () => {
    setForm({ nome: "", cargo_funcao: "", instituicao: "", whatsapp: "", bairro_atuacao: "", categoria: "infraestrutura", observacao: "" });
    setEditingId(null);
    setShowNewCat(false);
    setNewCatInput("");
  };

  const fetchContatos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contatos_estrategicos")
      .select("*")
      .order("categoria")
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar contatos");
    } else {
      setContatos((data as ContatoEstrategico[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchContatos(); }, []);

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }

    const finalCategoria = showNewCat && newCatInput.trim()
      ? newCatInput.trim().toLowerCase().replace(/\s+/g, "_")
      : form.categoria;

    const payload = { ...form, categoria: finalCategoria };

    if (editingId) {
      const { error } = await supabase
        .from("contatos_estrategicos")
        .update(payload)
        .eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Contato atualizado!");
    } else {
      const { error } = await supabase
        .from("contatos_estrategicos")
        .insert(payload);
      if (error) { toast.error("Erro ao cadastrar"); return; }
      toast.success("Contato cadastrado!");
    }
    resetForm();
    setModalOpen(false);
    fetchContatos();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contatos_estrategicos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Contato removido");
    fetchContatos();
  };

  const startEdit = (c: ContatoEstrategico) => {
    setForm({
      nome: c.nome, cargo_funcao: c.cargo_funcao ?? "", instituicao: c.instituicao ?? "",
      whatsapp: c.whatsapp, bairro_atuacao: c.bairro_atuacao, categoria: c.categoria,
      observacao: c.observacao ?? "",
    });
    setEditingId(c.id);
    setShowNewCat(false);
    setNewCatInput("");
    setModalOpen(true);
  };

  const filtered = contatos.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.nome.toLowerCase().includes(q) ||
      (c.instituicao ?? "").toLowerCase().includes(q) ||
      (c.cargo_funcao ?? "").toLowerCase().includes(q) ||
      c.bairro_atuacao.toLowerCase().includes(q) ||
      (c.observacao ?? "").toLowerCase().includes(q);
    const matchCat = filtroCategoria === "todos" || c.categoria === filtroCategoria;
    return matchSearch && matchCat;
  });

  // Group by category
  const grouped = CATEGORIAS.reduce<Record<string, ContatoEstrategico[]>>((acc, cat) => {
    const items = filtered.filter((c) => c.categoria === cat.value);
    if (items.length > 0) acc[cat.value] = items;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl">
          Guia de Soluções
        </h1>
        <p className="label-ui mt-1">Agenda de Influência · {contatos.length} contatos</p>
      </div>
      <Dialog open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2 font-medium uppercase tracking-wider text-sm h-12">
            <Plus className="h-4 w-4" /> Novo Contato
          </Button>
        </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Contato" : "Novo Contato Estratégico"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-xs font-medium uppercase tracking-wider">Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do contato" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wider">Cargo / Função</Label>
                  <Input value={form.cargo_funcao} onChange={(e) => setForm({ ...form, cargo_funcao: e.target.value })} placeholder="Gerente, Enfermeira..." />
                </div>
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wider">Instituição</Label>
                  <Input value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} placeholder="Embasa, UBS..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wider">WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="71999999999" />
                </div>
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wider">Bairro de Atuação</Label>
                  <Input value={form.bairro_atuacao} onChange={(e) => setForm({ ...form, bairro_atuacao: e.target.value })} placeholder="Eixo Sul, Centro..." />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-medium uppercase tracking-wider">Categoria</Label>
                  <button
                    type="button"
                    onClick={() => setShowNewCat(!showNewCat)}
                    className="text-[10px] font-medium uppercase tracking-wider text-primary hover:underline"
                  >
                    {showNewCat ? "Usar existente" : "+ Nova Categoria"}
                  </button>
                </div>
                {showNewCat ? (
                  <Input
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    placeholder="Ex: Educação, Transporte..."
                    autoFocus
                  />
                ) : (
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label className="text-xs font-medium uppercase tracking-wider">Observação</Label>
                <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Fala direto com ele para religação de água..." rows={2} />
              </div>
              <Button className="w-full font-medium uppercase tracking-wider" onClick={handleSave}>
                {editingId ? "Salvar Alterações" : "Cadastrar Contato"}
              </Button>
            </div>
          </DialogContent>
      </Dialog>

      <div className="border-t border-border" />

      {/* Search & Filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, bairro, instituição, problema..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Categorias</SelectItem>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {contatos.length === 0 ? "Nenhum contato cadastrado ainda." : "Nenhum contato encontrado."}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([catValue, items]) => {
            const catInfo = getCategoriaInfo(catValue);
            const CatIcon = catInfo.icon;
            return (
              <div key={catValue} className="space-y-2">
                <div className="flex items-center gap-2">
                  <CatIcon className={`h-4 w-4 ${catInfo.color}`} />
                  <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    {catInfo.label}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <Card key={c.id} className="p-3 hover:shadow-md transition-all duration-300 group">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{c.nome}</p>
                            {c.bairro_atuacao && (
                              <Badge variant="outline" className="text-[10px] shrink-0">{c.bairro_atuacao}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {c.cargo_funcao && (
                              <span className="text-xs text-muted-foreground">{c.cargo_funcao}</span>
                            )}
                            {c.cargo_funcao && c.instituicao && (
                              <span className="text-xs text-muted-foreground">·</span>
                            )}
                            {c.instituicao && (
                              <span className="text-xs font-medium text-foreground/80">{c.instituicao}</span>
                            )}
                          </div>
                          {c.observacao && (
                            <p className="text-xs text-muted-foreground mt-1 italic leading-relaxed">
                              💡 {c.observacao}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.whatsapp && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600"
                              asChild
                            >
                              <a
                                href={buildWhatsAppUrl(c, profile?.full_name ?? "")}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir WhatsApp com mensagem"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {c.whatsapp && (
                            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                              <a href={`tel:+55${c.whatsapp.replace(/\D/g, "")}`} title="Ligar">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                              </a>
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(c)}>
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
