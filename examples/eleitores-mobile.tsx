"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  ChevronRight,
  Filter,
  X,
  MapPin,
  Calendar,
  MoreVertical,
} from "lucide-react";
import {
  BottomNav,
  FAB,
  BottomSheet,
  FilterChips,
  FilterChip,
  EmptyState,
  EleitorListSkeleton,
  PullToRefresh,
} from "@/components/mobile";
import { cn } from "@/lib/utils";

// ============================================
// 📱 Lista de Eleitores - Mobile
// ============================================

// Dados mockados
const eleitoresMock = [
  {
    id: "1",
    nome: "Maria Silva Santos",
    telefone: "(73) 99999-1234",
    bairro: "Centro",
    status: "ativo",
    cadastradoEm: "2024-03-15",
  },
  {
    id: "2",
    nome: "João Costa Oliveira",
    telefone: "(73) 98888-5678",
    bairro: "Liberdade",
    status: "pendente",
    cadastradoEm: "2024-03-18",
  },
  {
    id: "3",
    nome: "Ana Lima Pereira",
    telefone: "(73) 97777-9012",
    bairro: "Santa Cruz",
    status: "ativo",
    cadastradoEm: "2024-03-10",
  },
  {
    id: "4",
    nome: "Pedro Santos Almeida",
    telefone: "(73) 96666-3456",
    bairro: "Nova Esperança",
    status: "ativo",
    cadastradoEm: "2024-02-28",
  },
  {
    id: "5",
    nome: "Carla Rodrigues",
    telefone: "(73) 95555-7890",
    bairro: "Jardim",
    status: "inativo",
    cadastradoEm: "2024-01-15",
  },
];

type StatusFilter = "todos" | "ativo" | "pendente" | "inativo";

export default function EleitoresMobile() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("todos");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedEleitor, setSelectedEleitor] = React.useState<typeof eleitoresMock[0] | null>(null);

  // Filtrar eleitores
  const filteredEleitores = eleitoresMock.filter((e) => {
    const matchesSearch =
      e.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.bairro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.telefone.includes(searchQuery);

    const matchesStatus = statusFilter === "todos" || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Contadores
  const counts = {
    todos: eleitoresMock.length,
    ativo: eleitoresMock.filter((e) => e.status === "ativo").length,
    pendente: eleitoresMock.filter((e) => e.status === "pendente").length,
    inativo: eleitoresMock.filter((e) => e.status === "inativo").length,
  };

  // Simular refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-bottom-nav">
      {/* Header com busca */}
      <header className="sticky top-0 z-header bg-white border-b border-slate-200 pt-safe">
        <div className="p-4">
          {/* Título e contador */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-medium text-slate-900">Eleitores</h1>
              <p className="text-sm text-slate-500">{counts.todos} cadastrados</p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center active:bg-slate-200"
            >
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              inputMode="search"
              placeholder="Buscar por nome, bairro ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-touch pl-12 bg-slate-100 border-0 focus:bg-white focus:border-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <FilterChips className="mt-3">
            <FilterChip
              active={statusFilter === "todos"}
              onClick={() => setStatusFilter("todos")}
            >
              Todos ({counts.todos})
            </FilterChip>
            <FilterChip
              active={statusFilter === "ativo"}
              onClick={() => setStatusFilter("ativo")}
            >
              Ativos ({counts.ativo})
            </FilterChip>
            <FilterChip
              active={statusFilter === "pendente"}
              onClick={() => setStatusFilter("pendente")}
            >
              Pendentes ({counts.pendente})
            </FilterChip>
            <FilterChip
              active={statusFilter === "inativo"}
              onClick={() => setStatusFilter("inativo")}
            >
              Inativos ({counts.inativo})
            </FilterChip>
          </FilterChips>
        </div>
      </header>

      {/* Lista de eleitores */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-white">
          {isLoading ? (
            <EleitorListSkeleton count={5} />
          ) : filteredEleitores.length === 0 ? (
            <EmptyState
              icon={<Search className="w-16 h-16" />}
              title="Nenhum eleitor encontrado"
              description={
                searchQuery
                  ? `Não encontramos resultados para "${searchQuery}"`
                  : "Comece adicionando um novo eleitor"
              }
              action={
                searchQuery
                  ? { label: "Limpar busca", onClick: () => setSearchQuery("") }
                  : { label: "Adicionar eleitor", onClick: () => console.log("Add") }
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEleitores.map((eleitor) => (
                <EleitorListItem
                  key={eleitor.id}
                  eleitor={eleitor}
                  onClick={() => setSelectedEleitor(eleitor)}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* FAB */}
      <FAB
        icon={<Plus className="w-6 h-6" />}
        onClick={() => console.log("Novo eleitor")}
        label="Adicionar eleitor"
      />

      {/* Bottom Nav */}
      <BottomNav activeTab="eleitores" />

      {/* Bottom Sheet - Detalhes do eleitor */}
      <BottomSheet
        isOpen={!!selectedEleitor}
        onClose={() => setSelectedEleitor(null)}
        title={selectedEleitor?.nome}
      >
        {selectedEleitor && (
          <EleitorDetails
            eleitor={selectedEleitor}
            onClose={() => setSelectedEleitor(null)}
          />
        )}
      </BottomSheet>

      {/* Bottom Sheet - Filtros avançados */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
      >
        <FilterSheet onClose={() => setShowFilters(false)} />
      </BottomSheet>
    </div>
  );
}

// ============================================
// 📦 Sub-componentes
// ============================================

interface EleitorListItemProps {
  eleitor: typeof eleitoresMock[0];
  onClick: () => void;
}

function EleitorListItem({ eleitor, onClick }: EleitorListItemProps) {
  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const statusStyles = {
    ativo: "bg-qg-green-100 text-qg-green-700",
    pendente: "bg-qg-amber-100 text-qg-amber-700",
    inativo: "bg-slate-100 text-slate-600",
  };

  const statusLabels = {
    ativo: "Ativo",
    pendente: "Pendente",
    inativo: "Inativo",
  };

  // Cores de avatar baseadas no nome
  const avatarColors = [
    "bg-qg-blue-100 text-qg-blue-700",
    "bg-qg-green-100 text-qg-green-700",
    "bg-qg-amber-100 text-qg-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
  ];
  const avatarColor = avatarColors[eleitor.nome.length % avatarColors.length];

  return (
    <button
      onClick={onClick}
      className="w-full list-item-touch text-left"
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
          avatarColor
        )}
      >
        <span className="text-lg font-medium">{getInitials(eleitor.nome)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-slate-900 truncate">{eleitor.nome}</p>
        <p className="text-sm text-slate-500 truncate">
          {eleitor.bairro} • {eleitor.telefone}
        </p>
      </div>

      {/* Status + Seta */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-full",
            statusStyles[eleitor.status as keyof typeof statusStyles]
          )}
        >
          {statusLabels[eleitor.status as keyof typeof statusLabels]}
        </span>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </button>
  );
}

interface EleitorDetailsProps {
  eleitor: typeof eleitoresMock[0];
  onClose: () => void;
}

function EleitorDetails({ eleitor, onClose }: EleitorDetailsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Ações rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <a
          href={`tel:${eleitor.telefone}`}
          className="flex flex-col items-center gap-2 p-4 bg-qg-green-50 rounded-2xl active:bg-qg-green-100"
        >
          <div className="w-12 h-12 bg-qg-green-600 rounded-full flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-qg-green-700">Ligar</span>
        </a>

        <a
          href={`https://wa.me/55${eleitor.telefone.replace(/\D/g, "")}`}
          className="flex flex-col items-center gap-2 p-4 bg-qg-green-50 rounded-2xl active:bg-qg-green-100"
        >
          <div className="w-12 h-12 bg-qg-green-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-qg-green-700">WhatsApp</span>
        </a>

        <button className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl active:bg-slate-100">
          <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
            <MoreVertical className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-700">Mais</span>
        </button>
      </div>

      {/* Informações */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          Informações
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Telefone</p>
              <p className="text-base font-medium text-slate-900">{eleitor.telefone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Bairro</p>
              <p className="text-base font-medium text-slate-900">{eleitor.bairro}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Cadastrado em</p>
              <p className="text-base font-medium text-slate-900">
                {formatDate(eleitor.cadastradoEm)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button className="btn-secondary flex-1">Editar</button>
        <button className="btn-primary flex-1">Ver perfil completo</button>
      </div>
    </div>
  );
}

function FilterSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6 space-y-6">
      {/* Bairro */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Bairro</label>
        <select className="input-touch">
          <option value="">Todos os bairros</option>
          <option value="centro">Centro</option>
          <option value="liberdade">Liberdade</option>
          <option value="santa-cruz">Santa Cruz</option>
          <option value="nova-esperanca">Nova Esperança</option>
          <option value="jardim">Jardim</option>
        </select>
      </div>

      {/* Período de cadastro */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Período de cadastro
        </label>
        <select className="input-touch">
          <option value="">Qualquer período</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 3 meses</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {/* Ordenação */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Ordenar por</label>
        <select className="input-touch">
          <option value="recente">Mais recentes</option>
          <option value="antigo">Mais antigos</option>
          <option value="nome-az">Nome (A-Z)</option>
          <option value="nome-za">Nome (Z-A)</option>
        </select>
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="btn-secondary flex-1">
          Limpar
        </button>
        <button onClick={onClose} className="btn-primary flex-1">
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
