import { useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, MapPin, Star, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSituacaoColor, eleitores as mockEleitores, assessores as mockAssessores } from "@/data/mockData";

const badgeVariant = (color: string) => {
  switch (color) {
    case "success": return "default" as const;
    case "warning": return "secondary" as const;
    case "destructive": return "destructive" as const;
    default: return "outline" as const;
  }
};

function PerfilSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <Skeleton className="h-6 w-20 rounded" />
      <Card className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-12 rounded" />
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded" />
        <Skeleton className="h-16 rounded" />
        <Skeleton className="h-16 rounded" />
      </div>
      <Skeleton className="h-16 rounded" />
    </div>
  );
}

// Check if string is a valid UUID
function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Convert mock eleitor to the shape expected by the profile view
function mockToProfile(mock: typeof mockEleitores[0]) {
  return {
    id: mock.id,
    nome: mock.nome,
    whatsapp: mock.whatsapp,
    bairro: mock.bairro,
    data_nascimento: mock.dataNascimento,
    situacao: mock.situacao,
    is_leader: false,
    assessor_id: mock.assessorId,
    created_at: mock.criadoEm + "T12:00:00Z",
    updated_at: mock.criadoEm + "T12:00:00Z",
    image_urls: null,
  };
}

type PerfilEleitorRecord = ReturnType<typeof mockToProfile>;

const LAST_ELEITOR_STORAGE_KEY = "qg:last-eleitor-detalhe";

function normalizeEleitor(source: unknown): PerfilEleitorRecord | null {
  if (!source || typeof source !== "object") return null;

  const id = source.id ? String(source.id) : "";
  const nome = source.nome ? String(source.nome) : "";
  if (!id || !nome) return null;

  const createdAt = source.created_at ?? (source.criadoEm ? `${source.criadoEm}T12:00:00Z` : new Date().toISOString());
  const updatedAt = source.updated_at ?? createdAt;

  return {
    id,
    nome,
    whatsapp: String(source.whatsapp ?? ""),
    bairro: String(source.bairro ?? ""),
    data_nascimento: source.data_nascimento ?? source.dataNascimento ?? null,
    situacao: String(source.situacao ?? "Novo Cadastro"),
    is_leader: Boolean(source.is_leader ?? false),
    assessor_id: source.assessor_id ?? source.assessorId ?? null,
    created_at: String(createdAt),
    updated_at: String(updatedAt),
    image_urls: source.image_urls ?? null,
  };
}

function readStoredEleitor(): PerfilEleitorRecord | null {
  try {
    const raw = sessionStorage.getItem(LAST_ELEITOR_STORAGE_KEY);
    if (!raw) return null;
    return normalizeEleitor(JSON.parse(raw));
  } catch {
    return null;
  }
}

export default function PerfilEleitor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateEleitor = useMemo(
    () => normalizeEleitor((location.state as { eleitor?: unknown } | null)?.eleitor),
    [location.state]
  );

  const storedEleitor = useMemo(() => readStoredEleitor(), [id]);

  // Try mock data first for non-UUID IDs (demo mode)
  const mockEleitor = id ? mockEleitores.find((e) => e.id === id) : undefined;
  const isMockId = !!mockEleitor || (id ? !isUUID(id) : false);

  // Only query Supabase if it's a real UUID
  const { data: dbEleitor, isLoading, error } = useQuery({
    queryKey: ["eleitor", id],
    enabled: !!id && !isMockId,
    retry: 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eleitores")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const fallbackEleitor = stateEleitor ?? storedEleitor;

  // Use mock data as fallback
  const eleitor = isMockId && mockEleitor
    ? mockToProfile(mockEleitor)
    : (dbEleitor ?? fallbackEleitor);

  const usingFallback = !dbEleitor && !!fallbackEleitor && !(isMockId && mockEleitor);

  useEffect(() => {
    if (!eleitor) return;

    try {
      sessionStorage.setItem(LAST_ELEITOR_STORAGE_KEY, JSON.stringify(eleitor));
    } catch {
      // Fallback storage failed, continue without persistence
    }
  }, [eleitor]);

  // Fetch assessor name
  const assessorId = eleitor?.assessor_id;
  const isMockAssessor = isMockId || (assessorId ? !isUUID(assessorId) : true);

  const { data: assessor } = useQuery({
    queryKey: ["assessor-for-eleitor", assessorId],
    enabled: !!assessorId && !isMockAssessor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessores")
        .select("nome")
        .eq("id", assessorId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const mockAssessorName = isMockAssessor && assessorId
    ? mockAssessores.find((a) => a.id === assessorId)?.nome
    : undefined;

  const assessorNome = assessor?.nome || mockAssessorName || "—";
  const situacaoColor = eleitor ? getSituacaoColor(eleitor.situacao) : "secondary";

  if (!isMockId && isLoading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] pb-24 md:pb-6">
        <ScrollArea className="flex-1">
          <PerfilSkeleton />
        </ScrollArea>
      </div>
    );
  }

  const isRlsError = error && (
    (error as any)?.code === "42501" ||
    (error as any)?.message?.toLowerCase().includes("permission") ||
    (error as any)?.message?.toLowerCase().includes("policy")
  );

  if (!isMockId && error && !fallbackEleitor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        {isRlsError ? (
          <>
            <div className="flex items-center gap-2 text-warning">
              <Star className="h-5 w-5" />
              <p className="text-sm font-bold tracking-wider">Sem permissão (RLS)</p>
            </div>
            <p className="text-muted-foreground text-xs text-center max-w-xs">
              Sua conta não tem permissão para visualizar este eleitor. Verifique com o administrador.
            </p>
          </>
        ) : (
          <>
            <p className="text-destructive text-sm font-medium">Erro ao carregar eleitor.</p>
            <p className="text-muted-foreground text-xs">{(error as Error).message}</p>
          </>
        )}
        <Button variant="outline" onClick={() => navigate("/eleitores")} className="active:scale-95">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a lista
        </Button>
      </div>
    );
  }

  // Valid UUID but Supabase returned null (no error) and no local fallback — likely RLS blocking
  if (!isMockId && !isLoading && !error && !dbEleitor && !fallbackEleitor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="flex items-center gap-2 text-warning">
          <Star className="h-5 w-5" />
          <p className="text-sm font-bold tracking-wider">Sem permissão (RLS)</p>
        </div>
        <p className="text-muted-foreground text-xs text-center max-w-xs">
          Não foi possível acessar este registro. Ele pode não existir ou sua conta não tem permissão.
        </p>
        <Button variant="outline" onClick={() => navigate("/eleitores")} className="active:scale-95">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a lista
        </Button>
      </div>
    );
  }

  if (!eleitor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <p className="text-muted-foreground text-sm">Eleitor não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/eleitores")} className="active:scale-95">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a lista
        </Button>
      </div>
    );
  }

  const dataNasc = eleitor.data_nascimento
    ? new Date(eleitor.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")
    : "—";

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] pb-24 md:pb-6">
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/eleitores")}
            className="flex items-center gap-2 text-muted-foreground text-sm font-bold tracking-wider hover:text-foreground transition-colors min-h-[48px] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            {isMockId && (
              <Badge variant="outline" className="text-[10px] border-warning text-warning">MODO DEMO</Badge>
            )}
            {usingFallback && (
              <Badge variant="outline" className="text-[10px]">FALLBACK LOCAL</Badge>
            )}
          </div>

          <Card className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-primary-foreground text-lg font-medium">
                {eleitor.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-medium tracking-tight leading-tight">{eleitor.nome}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground font-bold tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {eleitor.bairro}
                  </span>
                  <Badge variant={badgeVariant(situacaoColor)} className="text-[10px] font-bold tracking-wider">
                    {eleitor.situacao}
                  </Badge>
                </div>
              </div>
            </div>

            {eleitor.is_leader && (
              <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 px-3 py-2">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-xs font-bold tracking-wider text-warning">Liderança Comunitária</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 p-2">
                <span className="label-ui">Nascimento</span>
                <p className="font-bold mt-0.5">{dataNasc}</p>
              </div>
              <div className="bg-muted/50 p-2">
                <span className="label-ui">Assessor</span>
                <p className="font-bold mt-0.5">{assessorNome}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-2">
            <a
              href={`https://wa.me/${eleitor.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 bg-[#21c45d] text-white p-3 min-h-[64px] transition-all hover:bg-[#1ba94e] active:scale-95"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-wider">WhatsApp</span>
            </a>
            <a
              href={`tel:${eleitor.whatsapp}`}
              className="flex flex-col items-center justify-center gap-1.5 bg-primary text-primary-foreground p-3 min-h-[64px] transition-all hover:bg-primary/90 active:scale-95"
            >
              <Phone className="h-5 w-5" />
              <span className="text-[10px] font-medium">Ligar</span>
            </a>
            <button
              onClick={() => {
                window.open(`https://www.google.com/maps/search/${encodeURIComponent(eleitor.bairro + ", Teixeira de Freitas, BA")}`, "_blank");
              }}
              className="flex flex-col items-center justify-center gap-1.5 bg-secondary text-secondary-foreground p-3 min-h-[64px] transition-all hover:bg-secondary/90 active:scale-95"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-wider">Rota</span>
            </button>
          </div>

          <Card className="p-4 border-l-4 border-l-primary space-y-1">
            <span className="label-ui">Cadastrado em</span>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{new Date(eleitor.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
          </Card>
        </div>
      </ScrollArea>

      <div className="fixed bottom-0 left-0 right-0 z-detail-sheet flex items-stretch border-t border-border bg-card md:hidden">
        <a
          href={`tel:${eleitor.whatsapp}`}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] text-primary active:bg-muted transition-colors"
        >
          <Phone className="h-5 w-5" />
          <span className="text-[10px] font-medium">Ligar</span>
        </a>
        <div className="w-px bg-border" />
        <a
          href={`https://wa.me/${eleitor.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] text-success active:bg-muted transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px] font-medium">Mensagem</span>
        </a>
        <div className="w-px bg-border" />
        <button
          onClick={() => {/* TODO: nova demanda */}}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] bg-primary text-primary-foreground active:bg-primary/90 transition-colors"
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-medium">Nova demanda</span>
        </button>
      </div>
    </div>
  );
}
