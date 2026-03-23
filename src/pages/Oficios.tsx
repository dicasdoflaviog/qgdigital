import { useState, useMemo, useCallback } from "react";
import { FileText, AlertTriangle, Clock, CheckCircle2, Search, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { oficios as initialOficios, Oficio, OficioStatus, OFICIO_STATUS_CONFIG, isAtrasado } from "@/data/oficiosData";
import { FeedbackModal } from "@/components/oficios/FeedbackModal";
import { NovoOficioModal } from "@/components/oficios/NovoOficioModal";
import { OficioCard } from "@/components/oficios/OficioCard";
import { useToast } from "@/hooks/use-toast";

type TabFilter = "todos" | "pendentes" | "aguardando" | "atrasados" | "concluidos";

function getTabFilter(tab: TabFilter) {
  return (o: Oficio) => {
    switch (tab) {
      case "pendentes": return o.status === "elaborado";
      case "aguardando": return o.status === "protocolado" || o.status === "em_cobranca";
      case "atrasados": return isAtrasado(o);
      case "concluidos": return o.status === "respondido" || o.status === "resolvido";
      default: return true;
    }
  };
}

export default function Oficios() {
  const [tab, setTab] = useState<TabFilter>("todos");
  const [search, setSearch] = useState("");
  const [oficiosList, setOficiosList] = useState<Oficio[]>(initialOficios);
  const [feedbackData, setFeedbackData] = useState<{ oficio: Oficio; from: OficioStatus; to: OficioStatus } | null>(null);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = useCallback((oficio: Oficio, newStatus: OficioStatus) => {
    const triggersFeedback = newStatus === "respondido" || newStatus === "resolvido";
    if (triggersFeedback) setFeedbackData({ oficio, from: oficio.status, to: newStatus });
    else applyStatusChange(oficio.id, newStatus);
  }, []);

  const applyStatusChange = (oficioId: string, newStatus: OficioStatus) => {
    setOficiosList((prev) => prev.map((o) => o.id === oficioId ? {
      ...o, status: newStatus,
      ...(newStatus === "protocolado" ? { protocoladoEm: new Date().toISOString().split("T")[0] } : {}),
      ...(newStatus === "respondido" ? { respondidoEm: new Date().toISOString().split("T")[0] } : {}),
      ...(newStatus === "resolvido" ? { resolvidoEm: new Date().toISOString().split("T")[0] } : {}),
    } : o));
    toast({ title: "Status atualizado", description: `Ofício avançou para ${OFICIO_STATUS_CONFIG[newStatus].label}.` });
  };

  const handleFeedbackSend = (message: string) => {
    if (feedbackData) { applyStatusChange(feedbackData.oficio.id, feedbackData.to); toast({ title: "Notificação enviada" }); }
    setFeedbackData(null);
  };

  const handleFeedbackSaveOnly = () => {
    if (feedbackData) applyStatusChange(feedbackData.oficio.id, feedbackData.to);
    setFeedbackData(null);
  };

  const handleNovoOficio = (oficio: Oficio) => {
    setOficiosList((prev) => [oficio, ...prev]);
    toast({ title: "Ofício criado", description: `Ofício Nº ${oficio.numero} adicionado.` });
  };

  const filtered = useMemo(() => {
    const tabFn = getTabFilter(tab);
    return oficiosList.filter(tabFn).filter((o) =>
      o.titulo.toLowerCase().includes(search.toLowerCase()) ||
      o.bairro.toLowerCase().includes(search.toLowerCase()) ||
      o.numero.includes(search)
    );
  }, [tab, search, oficiosList]);

  const counts = useMemo(() => ({
    todos: oficiosList.length,
    pendentes: oficiosList.filter((o) => o.status === "elaborado").length,
    aguardando: oficiosList.filter((o) => o.status === "protocolado" || o.status === "em_cobranca").length,
    atrasados: oficiosList.filter(isAtrasado).length,
    concluidos: oficiosList.filter((o) => o.status === "respondido" || o.status === "resolvido").length,
  }), [oficiosList]);

  return (
    <div className="p-4 md:p-6 space-y-4 pb-28 md:pb-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><FileText className="h-4 w-4" /></div>
          Gestão de Ofícios
        </h1>
        <p className="text-xs font-medium text-muted-foreground mt-1">Rastreie o ciclo de vida de cada ofício legislativo</p>
        <Button className="w-full gap-2 text-sm h-12 mt-3" onClick={() => setShowNovoModal(true)}><Plus className="h-4 w-4" />Novo Ofício</Button>
      </div>

      <div className="border-t" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={counts.todos} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Pendentes" value={counts.pendentes} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Atrasados" value={counts.atrasados} icon={<AlertTriangle className="h-4 w-4" />} highlight />
        <StatCard label="Concluídos" value={counts.concluidos} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por título, bairro ou número..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
        <TabsList className="w-full grid grid-cols-5 h-11 p-1">
          {([
            { value: "todos", icon: FileText, label: "Todos" },
            { value: "pendentes", icon: Clock, label: "Pendentes" },
            { value: "aguardando", icon: Search, label: "Aguardando" },
            { value: "atrasados", icon: AlertTriangle, label: `Atrasados${counts.atrasados > 0 ? ` (${counts.atrasados})` : ""}` },
            { value: "concluidos", icon: CheckCircle2, label: "Concluídos" },
          ] as const).map(({ value, icon: Icon, label }) => (
            <TabsTrigger key={value} value={value} className="h-full gap-1.5 text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg overflow-hidden">
              <Icon className={`h-4 w-4 shrink-0 ${value === "atrasados" && counts.atrasados > 0 && tab !== "atrasados" ? "text-destructive" : ""}`} />
              {tab === value && <span className="truncate">{label}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-3 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum ofício encontrado.</p>
            </div>
          ) : filtered.map((o) => <OficioCard key={o.id} oficio={o} onStatusChange={handleStatusChange} />)}
        </TabsContent>
      </Tabs>

      {feedbackData && (
        <FeedbackModal open={!!feedbackData} onOpenChange={(open) => { if (!open) setFeedbackData(null); }}
          oficio={feedbackData.oficio} fromStatus={feedbackData.from} toStatus={feedbackData.to}
          onConfirmSend={handleFeedbackSend} onSaveOnly={handleFeedbackSaveOnly} />
      )}
      <NovoOficioModal open={showNovoModal} onOpenChange={setShowNovoModal} onSave={handleNovoOficio} />
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${highlight ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>{icon}</div>
        <div>
          <p className="text-lg font-semibold text-foreground">{value}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
