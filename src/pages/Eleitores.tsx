import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle, Loader2, Eye, Building2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BAIRROS, SITUACOES, getSituacaoColor, eleitores as mockEleitores } from "@/data/mockData";
import { CadastroModal } from "@/components/eleitores/CadastroModal";
import { GerarMensagemIA } from "@/components/eleitores/GerarMensagemIA";
import { useVotersPaginated } from "@/hooks/useVoters";
import { useAuth } from "@/contexts/AuthContext";
import { GabinetesRedePanel } from "@/components/admin/GabinetesRedePanel";

const LAST_ELEITOR_STORAGE_KEY = "qg:last-eleitor-detalhe";

const toEleitorProfileSnapshot = (e: any) => {
  const createdAt = e.created_at || (e.criadoEm ? `${e.criadoEm}T12:00:00Z` : new Date().toISOString());
  const updatedAt = e.updated_at || createdAt;

  return {
    id: e.id,
    nome: e.nome,
    whatsapp: (e.whatsapp || "").replace?.(/\D/g, "") ?? "",
    bairro: e.bairro || "",
    data_nascimento: e.data_nascimento ?? e.dataNascimento ?? null,
    situacao: e.situacao || "Novo Cadastro",
    is_leader: Boolean(e.is_leader ?? false),
    assessor_id: e.assessor_id ?? e.assessorId ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    image_urls: e.image_urls ?? null,
  };
};

export default function Eleitores() {
  const navigate = useNavigate();
  const { isImpersonating, roleLevel } = useAuth();
  const [search, setSearch] = useState("");
  const [filtroBairro, setFiltroBairro] = useState("todos");
  const [filtroSituacao, setFiltroSituacao] = useState("todos");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useState(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  });

  const { data: realData, loading, hasMore, loadMore } = useVotersPaginated({
    search: debouncedSearch, bairro: filtroBairro, situacao: filtroSituacao,
  });

  const useMock = isImpersonating || (!loading && realData.length === 0 && !debouncedSearch && filtroBairro === "todos" && filtroSituacao === "todos");

  const filtered = useMemo(() => {
    if (!useMock) return realData;
    return mockEleitores.filter((e) => {
      const matchSearch = !search || e.nome.toLowerCase().includes(search.toLowerCase());
      const matchBairro = filtroBairro === "todos" || e.bairro === filtroBairro;
      const matchSituacao = filtroSituacao === "todos" || e.situacao === filtroSituacao;
      return matchSearch && matchBairro && matchSituacao;
    });
  }, [useMock, realData, search, filtroBairro, filtroSituacao]);

  const badgeVariant = (color: string) => {
    switch (color) {
      case "success": return "default" as const;
      case "warning": return "secondary" as const;
      case "destructive": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  const openPerfil = (eleitor: any) => {
    const snapshot = toEleitorProfileSnapshot(eleitor);

    try {
      sessionStorage.setItem(LAST_ELEITOR_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (storageError) {
      console.warn("[Eleitores] Falha ao salvar fallback local", storageError);
    }

    navigate(`/eleitores/${eleitor.id}`, { state: { eleitor: snapshot } });
  };

  // L4 sees "Gabinetes da Rede" instead of individual eleitores
  if (roleLevel === 4) {
    return <GabinetesRedePanel />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-28 md:pb-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Eleitores</h1>
        <p className="text-xs font-medium text-muted-foreground mt-1">{filtered.length} registros</p>

        {/* Visibility badge based on role level */}
        {!useMock && (
          <div className="mt-2">
            {roleLevel <= 2 ? (
              <Badge variant="outline" className="gap-1.5 text-xs py-1 px-3 border-primary/30 text-primary">
                <Eye className="h-3 w-3" />
                Exibindo seus cadastros
              </Badge>
            ) : roleLevel === 3 ? (
              <Badge variant="outline" className="gap-1.5 text-xs py-1 px-3 border-primary/30 text-primary">
                <Building2 className="h-3 w-3" />
                Visão Geral do Gabinete
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-xs py-1 px-3 border-emerald-500/30 text-emerald-600">
                <Users className="h-3 w-3" />
                Visão Total — Todos os Gabinetes
              </Badge>
            )}
          </div>
        )}

        <div className="mt-3 w-full"><CadastroModal fullWidth /></div>
      </div>

      <div className="border-t" />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setTimeout(() => setDebouncedSearch(e.target.value), 400); }} />
        </div>
        <Select value={filtroBairro} onValueChange={setFiltroBairro}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Bairro" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Bairros</SelectItem>
            {BAIRROS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Situações</SelectItem>
            {SITUACOES.map((s) => <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((e: any) => {
          const color = getSituacaoColor(e.situacao);
          const dateField = e.dataNascimento || e.data_nascimento;
          return (
            <Card key={e.id} className="p-3 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openPerfil(e)}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{e.nome}</p>
                    <Badge variant={badgeVariant(color)} className="text-[10px] shrink-0">{e.situacao}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{e.bairro}</span>
                    {dateField && <span className="text-xs text-muted-foreground">{new Date(dateField + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <GerarMensagemIA nome={e.nome} situacao={e.situacao} />
                  <Button size="icon" variant="secondary" className="h-8 w-8 !bg-[#21c45d] hover:!bg-[#1ba94e] !text-white" asChild>
                    <a href={`https://wa.me/${(e.whatsapp || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {!useMock && hasMore && (
          <div className="flex justify-center py-4">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={loadMore} disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...</> : "Carregar mais"}
            </Button>
          </div>
        )}

        {loading && filtered.length === 0 && (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum eleitor encontrado.</div>
        )}
      </div>
    </div>
  );
}
