import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useVotersForMap } from "@/hooks/useVoters";
import { useDemandas, CATEGORIAS_DEMANDA } from "@/hooks/useDemandas";
import { useContratoByUser } from "@/hooks/useContratos";
import { useMunicipiosFoco } from "@/hooks/useMunicipiosFoco";
import { useAuth } from "@/contexts/AuthContext";
import { MapaSidebar, GABINETE_COLORS } from "@/components/mapa/MapaSidebar";
import { GabineteRaioXModal } from "@/components/mapa/GabineteRaioXModal";
import { GabineteCidade } from "@/hooks/useGabinetesCidade";
import { useGabinetesCidade } from "@/hooks/useGabinetesCidade";
import { logError } from "@/lib/errorLogger";
import { geocodeAddress } from "@/lib/geocode";
import { toast } from "@/hooks/use-toast";
import { Users, AlertTriangle, Loader2, Globe, RotateCcw, Eye, MapPin, Building2, Map, Navigation, PanelLeftOpen } from "lucide-react";
import "leaflet/dist/leaflet.css";

// --- Geographic coords for Teixeira de Freitas bairros ---
const BAIRRO_COORDS: Record<string, [number, number]> = {
  // Região Central
  "Centro":[-17.5393,-39.7436],"Bela Vista":[-17.5370,-39.7410],"Recanto do Lago":[-17.5355,-39.7460],
  "Jardim Caraípe":[-17.5410,-39.7400],
  // Zona Leste
  "Castelinho":[-17.5420,-39.7320],"Vila Vargas":[-17.5450,-39.7280],
  "Jerusalém":[-17.5470,-39.7250],"Nova Teixeira":[-17.5440,-39.7350],"Ouro Verde":[-17.5490,-39.7300],
  // Zona Oeste
  "Ulisses Guimarães":[-17.5380,-39.7520],"Colina Verde":[-17.5340,-39.7550],"Teixeirinha":[-17.5360,-39.7580],
  "Liberdade":[-17.5420,-39.7500],"Santa Rita":[-17.5400,-39.7560],
  // Zona Norte
  "Kaikan":[-17.5280,-39.7400],"Kaikan Sul":[-17.5300,-39.7420],"Bonadiman":[-17.5260,-39.7450],
  "Vila Caraípe":[-17.5240,-39.7380],"Estância Biquíni":[-17.5220,-39.7350],
  // Zona Sul
  "Tancredo Neves":[-17.5500,-39.7450],"São Lourenço":[-17.5520,-39.7400],
  "Duque de Caxias":[-17.5540,-39.7480],"Monte Castelo":[-17.5560,-39.7430],
  // Distritos
  "Santo Antônio":[-17.5580,-39.7350],"Jardim Novo":[-17.5320,-39.7300],
  // Bairros adicionais (usados em ofícios e demandas mock)
  "Cohab":[-17.5460,-39.7510],"São José":[-17.5330,-39.7370],
  "Industrial":[-17.5510,-39.7340],"Alto da Colina":[-17.5350,-39.7530],
  "Vila Nova":[-17.5480,-39.7470],"Boa Vista":[-17.5310,-39.7440],
  "Parque das Flores":[-17.5290,-39.7490],"São Pedro":[-17.5530,-39.7370],
  "Santa Maria":[-17.5400,-39.7340],"Jardim América":[-17.5370,-39.7500],
};

/**
 * Deterministic fallback: generate stable coords for unknown bairros
 * so they don't all collapse on "Centro". Spreads them around the city center.
 */
function getBairroCoordsFallback(bairro: string): [number, number] {
  if (BAIRRO_COORDS[bairro]) return BAIRRO_COORDS[bairro];
  const hash = bairro.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const angle = (hash % 360) * (Math.PI / 180);
  const distance = 0.008 + (hash % 50) * 0.0003;
  return [
    -17.5393 + Math.cos(angle) * distance,
    -39.7436 + Math.sin(angle) * distance,
  ];
}

/** Get coords with geocoded override support */
function getBairroCoords(bairro: string, geocoded?: Record<string, [number, number]>): [number, number] {
  if (BAIRRO_COORDS[bairro]) return BAIRRO_COORDS[bairro];
  if (geocoded?.[bairro]) return geocoded[bairro];
  return getBairroCoordsFallback(bairro);
}

const ESTADO_COORDS: Record<string, { coords: [number, number]; nome: string }> = {
  "AC": { coords: [-9.97, -67.81], nome: "Acre" },
  "AL": { coords: [-9.57, -35.74], nome: "Alagoas" },
  "AM": { coords: [-3.12, -60.02], nome: "Amazonas" },
  "AP": { coords: [0.03, -51.07], nome: "Amapá" },
  "BA": { coords: [-12.97, -38.51], nome: "Bahia" },
  "CE": { coords: [-3.72, -38.52], nome: "Ceará" },
  "DF": { coords: [-15.78, -47.93], nome: "Distrito Federal" },
  "ES": { coords: [-20.32, -40.34], nome: "Espírito Santo" },
  "GO": { coords: [-16.68, -49.25], nome: "Goiás" },
  "MA": { coords: [-2.53, -44.28], nome: "Maranhão" },
  "MG": { coords: [-19.92, -43.94], nome: "Minas Gerais" },
  "MS": { coords: [-20.44, -54.65], nome: "Mato Grosso do Sul" },
  "MT": { coords: [-15.60, -56.10], nome: "Mato Grosso" },
  "PA": { coords: [-1.46, -48.50], nome: "Pará" },
  "PB": { coords: [-7.12, -34.84], nome: "Paraíba" },
  "PE": { coords: [-8.05, -34.87], nome: "Pernambuco" },
  "PI": { coords: [-5.09, -42.80], nome: "Piauí" },
  "PR": { coords: [-25.43, -49.27], nome: "Paraná" },
  "RJ": { coords: [-22.91, -43.17], nome: "Rio de Janeiro" },
  "RN": { coords: [-5.79, -35.21], nome: "Rio Grande do Norte" },
  "RO": { coords: [-8.76, -63.90], nome: "Rondônia" },
  "RR": { coords: [2.82, -60.67], nome: "Roraima" },
  "RS": { coords: [-30.03, -51.23], nome: "Rio Grande do Sul" },
  "SC": { coords: [-27.60, -48.55], nome: "Santa Catarina" },
  "SE": { coords: [-10.91, -37.07], nome: "Sergipe" },
  "SP": { coords: [-23.55, -46.63], nome: "São Paulo" },
  "TO": { coords: [-10.18, -48.33], nome: "Tocantins" },
};

// CIDADES_BA is now a fallback; primary source is municipios_foco table
const CIDADES_BA_FALLBACK: Record<string, [number, number]> = {
  "Teixeira de Freitas": [-17.54, -39.74],
  "Salvador": [-12.97, -38.51],
  "Feira de Santana": [-12.27, -38.97],
};

type ViewMode = "eleitores" | "demandas";
type ZoomLayer = "brasil" | "estado" | "municipio";

function getLayerFromZoom(zoom: number): ZoomLayer {
  if (zoom <= 4) return "brasil";
  if (zoom <= 8) return "estado";
  return "municipio";
}

function getDeterministicCityCoords(city: string, base: [number, number] = [-17.54, -39.74]): [number, number] {
  const hash = city.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((hash % 21) - 10) * 0.015;
  const lngOffset = (((hash * 7) % 21) - 10) * 0.015;
  return [base[0] + latOffset, base[1] + lngOffset];
}

function heatColorEleitores(ratio: number) {
  if (ratio >= 0.7) return "hsl(0, 84%, 50%)";
  if (ratio >= 0.4) return "hsl(38, 92%, 50%)";
  return "hsl(210, 70%, 55%)";
}

function heatColorDemandas(ratio: number, hasPending: boolean) {
  if (!hasPending) return "hsl(142, 71%, 45%)";
  if (ratio >= 0.7) return "hsl(0, 84%, 45%)";
  if (ratio >= 0.4) return "hsl(25, 95%, 53%)";
  return "hsl(45, 93%, 55%)";
}

function DensityBar({ mode }: { mode: ViewMode }) {
  const items = mode === "eleitores"
    ? [
        { color: "hsl(210, 70%, 55%)", label: "Baixa" },
        { color: "hsl(38, 92%, 50%)", label: "Média" },
        { color: "hsl(0, 84%, 50%)", label: "Alta", pulse: true },
      ]
    : [
        { color: "hsl(142, 71%, 45%)", label: "Resolvido" },
        { color: "hsl(45, 93%, 55%)", label: "Poucas" },
        { color: "hsl(25, 95%, 53%)", label: "Moderadas" },
        { color: "hsl(0, 84%, 45%)", label: "Crítico", pulse: true },
      ];

  return (
    <div className="absolute left-0 right-0 z-map-density px-3 pb-1"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 16px))" }}>
      <div className="flex gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex-1 flex items-center gap-2 bg-card rounded-xl shadow-sm px-3 py-2">
            <span className={`h-3 w-3 rounded-full shrink-0 ${item.pulse ? "animate-pulse" : ""}`}
              style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-semibold text-foreground truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ZoomTracker({ onLayerChange }: { onLayerChange: (layer: ZoomLayer) => void }) {
  useMapEvents({
    zoomend: (e) => {
      onLayerChange(getLayerFromZoom(e.target.getZoom()));
    },
  });
  return null;
}

function MapFlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 2 }); }, [center, zoom, map]);
  return null;
}

function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resize = () => map.invalidateSize();

    const raf = requestAnimationFrame(resize);
    const timeout = window.setTimeout(resize, 250);
    window.addEventListener("resize", resize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(resize);
      observer.observe(container);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
      window.removeEventListener("resize", resize);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}

export default function MapaCalor() {
  const { roleLevel, user } = useAuth();
  const isL5 = roleLevel >= 5;
  const isL4Plus = roleLevel >= 4;

  const [viewMode, setViewMode] = useState<ViewMode>("eleitores");
  const [currentLayer, setCurrentLayer] = useState<ZoomLayer>("municipio");
  const [categoriaFilter, setCategoriaFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showSidebar, setShowSidebar] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-17.5393, -39.7436]);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);
  const [selectedCidade, setSelectedCidade] = useState<string | null>(null);
  const [selectedGabineteId, setSelectedGabineteId] = useState<string | null>(null);
  const [raioXGabinete, setRaioXGabinete] = useState<{ gabinete: GabineteCidade; index: number } | null>(null);
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, [number, number]>>({});
  const geocodeAttempted = useRef<Set<string>>(new Set());
  const [backfilling, setBackfilling] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // L4 contract for geographic scope restriction
  const { data: contrato } = useContratoByUser(isL4Plus && !isL5 ? user?.id : undefined);
  const { data: municipios = [] } = useMunicipiosFoco(selectedEstado);
  // For L4+, fetch ALL gabinetes when no city is selected; otherwise filter by city
  const gabineteQueryCity = isL4Plus ? (selectedCidade || "__all__") : selectedCidade;
  const { data: gabinetesCidade = [], refetch: refetchGabinetesCidade } = useGabinetesCidade(gabineteQueryCity);

  const { data: eleitoresData = [], isLoading: loadingEleitores, refetch: refetchEleitores } = useVotersForMap();
  const { data: demandas = [], isLoading: loadingDemandas, refetch: refetchDemandas } = useDemandas();

  const handleBackfillGeocode = useCallback(async () => {
    setBackfilling(true);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-geocode");
      if (error) throw error;
      toast({
        title: "Geocodificação concluída",
        description: `${data.updated} eleitores atualizados. ${data.remaining} restantes.`,
      });
      if (data.updated > 0) {
        refetchEleitores();
      }
    } catch (err: any) {
      toast({ title: "Erro na geocodificação", description: err.message, variant: "destructive" });
    } finally {
      setBackfilling(false);
    }
  }, [refetchEleitores]);

  const gabineteColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    gabinetesCidade.forEach((g, i) => {
      map[g.gabinete_id] = GABINETE_COLORS[i % GABINETE_COLORS.length];
    });
    return map;
  }, [gabinetesCidade]);

  // Build dynamic city coords map from DB
  const cidadesMap = useMemo(() => {
    const map: Record<string, [number, number]> = { ...CIDADES_BA_FALLBACK };
    municipios.forEach((m) => { map[m.nome] = [m.latitude, m.longitude]; });

    // Also add cities from gabinetes that might not be in municipios_foco
    gabinetesCidade.forEach((g) => {
      if (g.cidade && !map[g.cidade]) {
        const base = Object.values(map)[0] || [-17.54, -39.74];
        map[g.cidade] = getDeterministicCityCoords(g.cidade, base);
      }
    });

    return map;
  }, [municipios, gabinetesCidade]);

  const cidadesParaPins = useMemo(() => {
    const fromGabinetes = Array.from(new Set(gabinetesCidade.map((g) => g.cidade).filter(Boolean))) as string[];
    if (fromGabinetes.length > 0) return fromGabinetes;
    return Object.keys(cidadesMap);
  }, [gabinetesCidade, cidadesMap]);

  // Allowed states for L4 (all for L5)
  const allowedEstados = useMemo(() => {
    if (isL5) return Object.keys(ESTADO_COORDS);
    if (contrato?.estados_autorizados?.length) return contrato.estados_autorizados;
    return ["BA"];
  }, [isL5, contrato]);

  // Revalidate map sources on role/filter changes to prevent stale/empty map states
  useEffect(() => {
    void refetchGabinetesCidade();
    void refetchEleitores();
    void refetchDemandas();
  }, [
    roleLevel,
    selectedEstado,
    selectedCidade,
    selectedGabineteId,
    categoriaFilter,
    statusFilter,
    viewMode,
    refetchGabinetesCidade,
    refetchEleitores,
    refetchDemandas,
  ]);

  const handleLayerChange = useCallback((layer: ZoomLayer) => {
    setCurrentLayer(layer);
  }, []);

  const navigateToEstado = (uf: string) => {
    if (!isL5 && isL4Plus && !allowedEstados.includes(uf)) {
      toast({ title: "Acesso bloqueado", description: `Você não tem permissão para acessar ${uf}.`, variant: "destructive" });
      logError(`Tentativa de acesso ao estado ${uf} sem autorização contratual`, "UNAUTHORIZED_STATE_ACCESS", { attempted_estado: uf, allowed_estados: allowedEstados });
      return;
    }
    const est = ESTADO_COORDS[uf];
    if (est) {
      setSelectedEstado(uf);
      setSelectedCidade(null);
      setSelectedGabineteId(null);
      setMapCenter(est.coords);
      setMapZoom(7);
    }
  };

  const navigateToCidade = (cidade: string) => {
    const coords = cidadesMap[cidade];
    const mun = municipios.find((m) => m.nome === cidade);
    if (coords) {
      setSelectedCidade(cidade);
      setSelectedGabineteId(null);
      setMapCenter(coords);
      setMapZoom(mun?.zoom_ideal ?? 12);
    }
  };

  const navigateToBrasil = () => {
    setSelectedEstado(null);
    setSelectedCidade(null);
    setSelectedGabineteId(null);
    setMapCenter([-15.78, -47.93]);
    setMapZoom(4);
  };

  const navigateToMunicipio = () => {
    setSelectedCidade("Teixeira de Freitas");
    setMapCenter([-17.5393, -39.7436]);
    setMapZoom(14);
  };

  // --- Eleitores filtered by selected city/gabinete ---
  const cityFilteredEleitores = useMemo(() => {
    let data = eleitoresData;
    if (selectedCidade) data = data.filter((e) => (e.cidade || "Teixeira de Freitas") === selectedCidade);
    if (selectedGabineteId) data = data.filter((e) => e.gabinete_id === selectedGabineteId);
    return data;
  }, [eleitoresData, selectedCidade, selectedGabineteId]);

  const cityFilteredDemandas = useMemo(() => {
    let data = demandas;
    if (selectedCidade) {
      // Filter demandas by city — match via eleitor's city or gabinete
      const eleitorIdsInCity = new Set(
        eleitoresData
          .filter((e) => (e.cidade || "Teixeira de Freitas") === selectedCidade)
          .map((e) => e.id)
      );
      data = data.filter((d) => d.eleitor_id && eleitorIdsInCity.has(d.eleitor_id));
    }
    if (selectedGabineteId) data = data.filter((d) => d.gabinete_id === selectedGabineteId);
    if (categoriaFilter !== "todas") data = data.filter((x) => x.categoria === categoriaFilter);
    if (statusFilter !== "todos") data = data.filter((x) => x.status === statusFilter);
    return data;
  }, [demandas, eleitoresData, selectedCidade, selectedGabineteId, categoriaFilter, statusFilter]);

  // --- Eleitores by bairro (city-filtered) ---
  const eleitoresBairroData = useMemo(() => {
    const map: Record<string, { total: number }> = {};
    cityFilteredEleitores.forEach((e) => {
      if (!e.bairro) return;
      if (!map[e.bairro]) map[e.bairro] = { total: 0 };
      map[e.bairro].total++;
    });
    return map;
  }, [cityFilteredEleitores]);

  // --- Auto-geocode unknown bairros ---
  useEffect(() => {
    const unknownBairros = Object.keys(eleitoresBairroData).filter(
      (b) => !BAIRRO_COORDS[b] && !geocodedCoords[b] && !geocodeAttempted.current.has(b)
    );
    if (unknownBairros.length === 0) return;

    const batch = unknownBairros.slice(0, 5);
    batch.forEach((b) => geocodeAttempted.current.add(b));

    const city = selectedCidade || "Teixeira de Freitas";
    const state = selectedEstado || "BA";

    Promise.all(
      batch.map(async (bairro) => {
        const result = await geocodeAddress(bairro, city, state);
        if (result) return { bairro, coords: [result.lat, result.lng] as [number, number] };
        return null;
      })
    ).then((results) => {
      const newCoords: Record<string, [number, number]> = {};
      results.forEach((r) => { if (r) newCoords[r.bairro] = r.coords; });
      if (Object.keys(newCoords).length > 0) {
        setGeocodedCoords((prev) => ({ ...prev, ...newCoords }));
      }
    });
  }, [eleitoresBairroData, geocodedCoords, selectedCidade, selectedEstado]);

  const demandasBairroData = useMemo(() => {
    const map: Record<string, { total: number; pendentes: number; categorias: Record<string, number> }> = {};
    cityFilteredDemandas.forEach((d) => {
      const b = d.bairro || "Sem bairro";
      if (!map[b]) map[b] = { total: 0, pendentes: 0, categorias: {} };
      map[b].total++;
      if (d.status === "Pendente") map[b].pendentes++;
      if (d.categoria) map[b].categorias[d.categoria] = (map[b].categorias[d.categoria] || 0) + 1;
    });
    return map;
  }, [cityFilteredDemandas]);

  // State-level aggregation
  const estadoAggData = useMemo(() => {
    const map: Record<string, { eleitores: number; demandas: number; pendentes: number }> = {};
    const estado = "BA";
    if (!map[estado]) map[estado] = { eleitores: 0, demandas: 0, pendentes: 0 };
    map[estado].eleitores = eleitoresData.length;
    map[estado].demandas = demandas.length;
    map[estado].pendentes = demandas.filter((d) => d.status === "Pendente").length;
    return map;
  }, [eleitoresData, demandas]);

  // City-level aggregation
  const cidadeAggData = useMemo(() => {
    const map: Record<string, { eleitores: number; demandas: number; pendentes: number }> = {};
    // Primary source: gabinetes view (most accurate for L4/L5)
    gabinetesCidade.forEach((g) => {
      const c = g.cidade || "Desconhecida";
      if (!map[c]) map[c] = { eleitores: 0, demandas: 0, pendentes: 0 };
      map[c].eleitores += g.total_eleitores;
      map[c].demandas += g.total_demandas;
      map[c].pendentes += g.demandas_pendentes;
    });
    // Fallback: also merge from eleitores/demandas if not covered
    eleitoresData.forEach((e) => {
      const c = e.cidade || "Teixeira de Freitas";
      if (!map[c]) map[c] = { eleitores: 0, demandas: 0, pendentes: 0 };
      // Only add if not already counted via view
      if (gabinetesCidade.length === 0) map[c].eleitores++;
    });
    demandas.forEach((d) => {
      if (gabinetesCidade.length === 0) {
        const eleitor = eleitoresData.find((e) => e.id === d.eleitor_id);
        const c = eleitor?.cidade || "Teixeira de Freitas";
        if (!map[c]) map[c] = { eleitores: 0, demandas: 0, pendentes: 0 };
        map[c].demandas++;
        if (d.status === "Pendente") map[c].pendentes++;
      }
    });
    return map;
  }, [eleitoresData, demandas, gabinetesCidade]);

  // Top 5 cities ranking for sidebar
  const topCidadesRanking = useMemo(() => {
    return Object.entries(cidadeAggData)
      .sort((a, b) => b[1].eleitores - a[1].eleitores)
      .slice(0, 5);
  }, [cidadeAggData]);

  const maxEleitores = Math.max(...Object.values(eleitoresBairroData).map((d) => d.total), 1);
  const maxDemandas = Math.max(...Object.values(demandasBairroData).map((d) => d.total), 1);

  const topCategoria = (cats: Record<string, number>) => {
    let top = ""; let max = 0;
    Object.entries(cats).forEach(([k, v]) => { if (v > max) { top = k; max = v; } });
    return top || "—";
  };

  const isLoading = loadingEleitores || loadingDemandas;
  const sidebarVisible = showSidebar || mobileSidebarOpen;
  const layerLabelNode = currentLayer === "brasil" ? (<><Globe className="h-3 w-3 inline-block mr-1" /><span className="sm:hidden">BR</span><span className="hidden sm:inline">Brasil</span></>) 
    : currentLayer === "estado" ? (<><Navigation className="h-3 w-3 inline-block mr-1" />{selectedEstado || "UF"}</>)
    : (<><Building2 className="h-3 w-3 inline-block mr-1" /><span className="sm:hidden">{(selectedCidade || "Cidade").slice(0, 4).toUpperCase()}</span><span className="hidden sm:inline">{selectedCidade || "Município"}</span></>);

  return (
    <div className="relative flex h-[100dvh] min-h-[50dvh] overflow-hidden">
      <div className={`transition-all duration-300 ease-in-out ${showSidebar ? "w-72 opacity-100" : "w-0 opacity-0 overflow-hidden"} hidden lg:block shrink-0`}>
        <MapaSidebar
          demandas={selectedCidade ? cityFilteredDemandas : demandas}
          eleitoresCount={selectedCidade ? cityFilteredEleitores.length : eleitoresData.length}
          selectedCidade={selectedCidade}
          topCidadesRanking={topCidadesRanking}
          gabinetesCidade={gabinetesCidade}
          selectedGabineteId={selectedGabineteId}
          onSelectCidade={navigateToCidade}
          onSelectGabinete={setSelectedGabineteId}
          onOpenRaioX={(g, i) => setRaioXGabinete({ gabinete: g, index: i })}
          onClose={() => setShowSidebar(false)}
          isL4Plus={isL4Plus}
          isLoading={isLoading}
        />
      </div>

      <div className="relative h-full flex-1 min-w-0">
        {/* Layer breadcrumb + loading — hidden on desktop when sidebar open */}
        <div className={`absolute top-3 left-3 z-map-controls flex items-center gap-1.5 max-w-[calc(100%-11.5rem)] sm:max-w-[calc(100%-14rem)] overflow-x-auto scrollbar-hide transition-opacity duration-200 ${sidebarVisible ? "opacity-0 pointer-events-none" : ""}`}>
          {/* Mobile sidebar toggle */}
          <Button size="sm" variant="outline"
            className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm shrink-0 lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}>
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </Button>
          {isLoading && (
            <div className="bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1.5 flex items-center gap-1 text-[10px] font-bold border border-border shrink-0">
              <Loader2 className="h-3 w-3 animate-spin" /> <span className="hidden xs:inline">Carregando...</span>
            </div>
          )}
          {currentLayer !== "brasil" && isL4Plus && (
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold bg-background/90 backdrop-blur-sm shrink-0 px-2"
              onClick={navigateToBrasil}>
              ← <span className="sm:hidden">BR</span><span className="hidden sm:inline">Brasil</span>
            </Button>
          )}
          {selectedCidade && (
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold bg-background/90 backdrop-blur-sm border-primary/40 text-primary shrink-0 px-2"
              onClick={() => { setSelectedCidade(null); setSelectedGabineteId(null); navigateToEstado(selectedEstado || "BA"); }}>
              <RotateCcw className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">Ver Estado Inteiro</span>
            </Button>
          )}
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-border shrink-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap flex items-center gap-1">
              {layerLabelNode}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className={`absolute top-4 right-2 sm:right-4 z-map-controls flex flex-col gap-1.5 sm:gap-2 w-[11rem] sm:w-52 transition-opacity duration-200 ${sidebarVisible ? "opacity-0 pointer-events-none" : ""}`}>
          {isL4Plus && (
            <div className="flex rounded-lg overflow-hidden border border-border bg-background/90 backdrop-blur-sm">
              <Button size="sm" variant={currentLayer === "brasil" ? "default" : "ghost"}
                className="flex-1 h-7 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded-none whitespace-nowrap px-1"
                onClick={navigateToBrasil}>
                <Globe className="h-3 w-3 shrink-0 sm:mr-0.5" /> <span className="hidden sm:inline">País</span>
              </Button>
              <Button size="sm" variant={currentLayer === "estado" ? "default" : "ghost"}
                className="flex-1 h-7 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded-none whitespace-nowrap px-1"
                onClick={() => navigateToEstado(selectedEstado || "BA")}>
                Estado
              </Button>
              <Button size="sm" variant={currentLayer === "municipio" ? "default" : "ghost"}
                className="flex-1 h-7 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded-none whitespace-nowrap px-1"
                onClick={navigateToMunicipio}>
                Cidade
              </Button>
            </div>
          )}

          {/* Estado selector — L5 can pick any state, L4 sees only contract states */}
          {isL4Plus && (currentLayer === "brasil" || currentLayer === "estado") && (
            <Select value={selectedEstado || "none"} onValueChange={(v) => v === "none" ? navigateToBrasil() : navigateToEstado(v)}>
              <SelectTrigger className="bg-background/90 backdrop-blur-sm border-border text-[10px] sm:text-xs h-8 sm:h-9 font-bold uppercase tracking-wider">
                <SelectValue placeholder="Selecionar Estado" />
              </SelectTrigger>
              <SelectContent className="z-map-select">
                <SelectItem value="none" className="text-sm"><Globe className="h-3 w-3 inline-block mr-1" />Todos os Estados</SelectItem>
                {allowedEstados.sort().map((uf) => {
                  const est = ESTADO_COORDS[uf as keyof typeof ESTADO_COORDS];
                  return (
                    <SelectItem key={uf} value={uf} className="text-sm">
                      {est ? est.nome : uf} ({uf})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {/* City selector when in estado or municipio view */}
          {(currentLayer === "estado" || (currentLayer === "municipio" && selectedCidade)) && isL4Plus && (
            <Select value={selectedCidade || "todas"} onValueChange={(v) => v === "todas" ? (() => { setSelectedCidade(null); setSelectedGabineteId(null); navigateToEstado(selectedEstado || "BA"); })() : navigateToCidade(v)}>
              <SelectTrigger className="bg-background/90 backdrop-blur-sm border-border text-[10px] sm:text-xs h-8 sm:h-9 font-bold uppercase tracking-wider">
                <SelectValue placeholder="Selecionar Cidade" />
              </SelectTrigger>
              <SelectContent className="z-map-select">
                <SelectItem value="todas" className="text-sm"><Map className="h-3 w-3 inline-block mr-1" />Todas as Cidades</SelectItem>
                {Object.keys(cidadesMap).sort().map((c) => {
                  const agg = cidadeAggData[c];
                  return (
                    <SelectItem key={c} value={c} className="text-sm">
                      {c} {agg ? `(${agg.eleitores})` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {/* Visão Global — L5 only */}
          {isL5 && (
            <Button size="sm" variant="outline"
              className="h-7 sm:h-8 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider gap-1 bg-background/90 backdrop-blur-sm border-primary/40 text-primary"
              onClick={() => {
                setSelectedEstado(null);
                setSelectedCidade(null);
                setSelectedGabineteId(null);
                setMapCenter([-15.78, -47.93]);
                setMapZoom(4);
                setCurrentLayer("brasil");
              }}
            >
              <Eye className="h-3 w-3" /> Visão Global
            </Button>
          )}

          {/* Backfill geocode — L3+ */}
          {roleLevel >= 3 && (
            <Button size="sm" variant="outline"
              className="h-7 sm:h-8 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider gap-1 bg-background/90 backdrop-blur-sm border-accent/40 text-accent-foreground"
              onClick={handleBackfillGeocode}
              disabled={backfilling}>
              {backfilling ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
              {backfilling ? "Geocodificando..." : "Corrigir Pins"}
            </Button>
          )}

          {/* View mode toggle */}
          <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-border bg-background/90 backdrop-blur-sm">
            <Button size="sm" variant={viewMode === "eleitores" ? "default" : "ghost"}
              className="h-7 sm:h-8 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider gap-1 rounded-none"
              onClick={() => setViewMode("eleitores")}>
              <Users className="h-3 w-3 shrink-0" /> <span className="hidden sm:inline">Apoiadores</span><span className="sm:hidden">Apoiad.</span>
            </Button>
            <Button size="sm" variant={viewMode === "demandas" ? "default" : "ghost"}
              className="h-7 sm:h-8 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider gap-1 rounded-none"
              onClick={() => setViewMode("demandas")}>
              <AlertTriangle className="h-3 w-3 shrink-0" /> Demandas
            </Button>
          </div>

          {viewMode === "demandas" && (
            <>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="bg-background/90 backdrop-blur-sm border-border text-[10px] sm:text-xs h-8 sm:h-9 font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="z-map-select">
                  <SelectItem value="todas" className="text-sm">Todas as Categorias</SelectItem>
                  {CATEGORIAS_DEMANDA.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/90 backdrop-blur-sm border-border text-[10px] sm:text-xs h-8 sm:h-9 font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="z-map-select">
                  <SelectItem value="todos" className="text-sm">Todos os Status</SelectItem>
                  <SelectItem value="Pendente" className="text-sm">🔴 Pendentes</SelectItem>
                  <SelectItem value="Em andamento" className="text-sm">🟡 Em andamento</SelectItem>
                  <SelectItem value="Resolvido" className="text-sm">🟢 Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <div className="hidden lg:flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
            <Switch checked={showSidebar} onCheckedChange={setShowSidebar} id="sidebar-toggle" />
            <Label htmlFor="sidebar-toggle" className="text-[10px] font-bold uppercase tracking-wider cursor-pointer">
              Painel Intel
            </Label>
          </div>
        </div>

        <DensityBar mode={viewMode} />

        <MapContainer center={mapCenter} zoom={mapZoom}
          className="h-full w-full z-0" zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <MapFlyTo center={mapCenter} zoom={mapZoom} />
          <ZoomTracker onLayerChange={handleLayerChange} />
          <MapAutoResize />

          {/* === LAYER 0: Brasil — State markers === */}
          {currentLayer === "brasil" && allowedEstados.map((uf) => {
            const est = ESTADO_COORDS[uf];
            if (!est) return null;
            const agg = estadoAggData[uf];
            const value = agg ? (viewMode === "eleitores" ? agg.eleitores : agg.demandas) : 0;
            const hasPending = agg ? agg.pendentes > 0 : false;
            const color = viewMode === "eleitores"
              ? (value > 0 ? "hsl(210, 70%, 55%)" : "hsl(210, 20%, 75%)")
              : (hasPending ? "hsl(0, 84%, 45%)" : value > 0 ? "hsl(142, 71%, 45%)" : "hsl(210, 20%, 75%)");
            const radius = value > 0 ? 15 + Math.min(value / 10, 25) : 8;

            return (
              <CircleMarker key={uf} center={est.coords} radius={radius}
                pathOptions={{ color, fillColor: color, fillOpacity: value > 0 ? 0.5 : 0.15, weight: 2 }}
                eventHandlers={{ click: () => navigateToEstado(uf) }}>
                <Popup>
                  <div className="space-y-1 min-w-[150px]">
                    <p className="font-black text-sm uppercase">{est.nome} ({uf})</p>
                    {agg ? (
                      <>
                        <p className="text-xs">Apoiadores: <strong>{agg.eleitores}</strong></p>
                        <p className="text-xs">Demandas: <strong>{agg.demandas}</strong></p>
                        <p className="text-xs">Pendentes: <strong className="text-red-600">{agg.pendentes}</strong></p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">Sem dados neste estado</p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* === LAYER 1: Estado — City markers (filtered when city selected) === */}
          {currentLayer === "estado" && cidadesParaPins.map((cidade) => {
            // When a city is selected, hide all other city markers
            if (selectedCidade && cidade !== selectedCidade) return null;

            const coords = cidadesMap[cidade];
            if (!coords) return null;

            const agg = cidadeAggData[cidade];
            const value = agg ? (viewMode === "eleitores" ? agg.eleitores : agg.demandas) : 0;
            const hasPending = agg ? agg.pendentes > 0 : false;
            const color = viewMode === "eleitores"
              ? (value > 0 ? heatColorEleitores(value / Math.max(eleitoresData.length, 1)) : "hsl(210, 20%, 75%)")
              : (value > 0 ? heatColorDemandas(value / Math.max(demandas.length, 1), hasPending) : "hsl(210, 20%, 75%)");
            const radius = value > 0 ? 12 + Math.min(value / 5, 30) : 6;
            const isSelected = selectedCidade === cidade;

            return (
              <CircleMarker key={cidade} center={coords as [number, number]} radius={isSelected ? radius + 5 : radius}
                pathOptions={{
                  color: isSelected ? "hsl(262, 83%, 58%)" : color,
                  fillColor: color,
                  fillOpacity: value > 0 ? 0.5 : 0.15,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{ click: () => navigateToCidade(cidade) }}>
                <Popup>
                  <div className="space-y-1 min-w-[150px]">
                    <p className="font-black text-sm uppercase">{cidade}</p>
                    {agg ? (
                      <>
                        <p className="text-xs">Apoiadores: <strong>{agg.eleitores}</strong></p>
                        <p className="text-xs">Demandas: <strong>{agg.demandas}</strong></p>
                        <p className="text-xs">Pendentes: <strong className="text-red-600">{agg.pendentes}</strong></p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">Sem dados</p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* === Territory overlay for selected city === */}
          {selectedCidade && cidadesMap[selectedCidade] && (
            <Circle
              center={cidadesMap[selectedCidade] as [number, number]}
              radius={8000}
              pathOptions={{
                color: "hsl(262, 83%, 58%)",
                fillColor: "hsl(262, 83%, 58%)",
                fillOpacity: 0.06,
                weight: 2,
                dashArray: "8 4",
              }}
            />
          )}

          {/* === LAYER 2: Município — Bairro heatmap with clustering === */}
          {currentLayer === "municipio" && viewMode === "eleitores" && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={40}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              disableClusteringAtZoom={15}
            >
              {Object.entries(eleitoresBairroData).map(([bairro, data]) => {
                const coords = getBairroCoords(bairro, geocodedCoords);
                const ratio = data.total / maxEleitores;
                const color = selectedGabineteId && gabineteColorMap[selectedGabineteId]
                  ? gabineteColorMap[selectedGabineteId]
                  : heatColorEleitores(ratio);
                const radius = 15 + ratio * 35;
                return (
                  <CircleMarker key={bairro} center={coords} radius={radius}
                    pathOptions={{ color, fillColor: color, fillOpacity: selectedGabineteId ? 0.6 : 0.45, weight: selectedGabineteId ? 3 : 2 }}>
                    <Popup>
                      <div className="space-y-1 min-w-[160px]">
                        <p className="font-black text-sm uppercase">{bairro}</p>
                        <p className="text-xs">Total de Apoiadores: <strong>{data.total}</strong></p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MarkerClusterGroup>
          )}

          {currentLayer === "municipio" && viewMode === "demandas" && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={40}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
              disableClusteringAtZoom={15}
            >
              {Object.entries(demandasBairroData).map(([bairro, data]) => {
                const coords = getBairroCoords(bairro, geocodedCoords);
                const hasPending = data.pendentes > 0;
                const ratio = data.total / maxDemandas;
                const color = selectedGabineteId && gabineteColorMap[selectedGabineteId]
                  ? gabineteColorMap[selectedGabineteId]
                  : heatColorDemandas(ratio, hasPending);
                const radius = hasPending ? 15 + ratio * 35 : 10 + ratio * 15;
                return (
                  <CircleMarker key={bairro} center={coords} radius={radius}
                    pathOptions={{ color, fillColor: color, fillOpacity: selectedGabineteId ? 0.65 : (hasPending ? 0.55 : 0.25), weight: selectedGabineteId ? 3 : (hasPending ? 2 : 1) }}>
                    <Popup>
                      <div className="space-y-1 min-w-[180px]">
                        <p className="font-black text-sm uppercase">{bairro}</p>
                        <p className="text-xs">Total de Demandas: <strong>{data.total}</strong></p>
                        <p className="text-xs">Pendentes: <strong className="text-destructive">{data.pendentes}</strong></p>
                        <p className="text-xs">Categoria Principal: <strong>{topCategoria(data.categorias)}</strong></p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>
      {/* Raio-X Modal */}
      <GabineteRaioXModal
        open={!!raioXGabinete}
        onOpenChange={(open) => { if (!open) setRaioXGabinete(null); }}
        gabinete={raioXGabinete?.gabinete ?? null}
        gabineteIndex={raioXGabinete?.index ?? 0}
        cidade={selectedCidade}
      />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[300px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Inteligência Regional
            </SheetTitle>
          </SheetHeader>
          <MapaSidebar
            demandas={selectedCidade ? cityFilteredDemandas : demandas}
            eleitoresCount={selectedCidade ? cityFilteredEleitores.length : eleitoresData.length}
            selectedCidade={selectedCidade}
            topCidadesRanking={topCidadesRanking}
            gabinetesCidade={gabinetesCidade}
            selectedGabineteId={selectedGabineteId}
            onSelectCidade={(c) => { navigateToCidade(c); setMobileSidebarOpen(false); }}
            onSelectGabinete={setSelectedGabineteId}
            onOpenRaioX={(g, i) => { setRaioXGabinete({ gabinete: g, index: i }); setMobileSidebarOpen(false); }}
            onClose={() => setMobileSidebarOpen(false)}
            isL4Plus={isL4Plus}
            isLoading={isLoading}
            isMobile
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
