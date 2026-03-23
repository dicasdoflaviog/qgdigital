export type OficioStatus = "elaborado" | "protocolado" | "em_cobranca" | "respondido" | "resolvido";

export interface Oficio {
  id: string;
  numero: string;
  titulo: string;
  bairro: string;
  pauta: string;
  status: OficioStatus;
  criadoEm: string;
  protocoladoEm?: string;
  respondidoEm?: string;
  resolvidoEm?: string;
  protocolo?: string;
  assessorId?: string;
  resposta?: string;
}

export const OFICIO_STATUS_CONFIG: Record<OficioStatus, { label: string; step: number; color: string }> = {
  elaborado:    { label: "Elaborado",       step: 1, color: "hsl(220, 9%, 46%)" },
  protocolado:  { label: "Protocolado",     step: 2, color: "hsl(221, 83%, 53%)" },
  em_cobranca:  { label: "Em Cobrança",     step: 3, color: "hsl(38, 92%, 50%)" },
  respondido:   { label: "Respondido",      step: 4, color: "hsl(199, 89%, 48%)" },
  resolvido:    { label: "Resolvido",       step: 5, color: "hsl(142, 71%, 45%)" },
};

export const PRAZO_COBRANCA_DIAS = 15;

export function diasDesdeProtocolo(oficio: Oficio): number | null {
  if (!oficio.protocoladoEm) return null;
  const agora = new Date();
  const protocolo = new Date(oficio.protocoladoEm + "T12:00:00");
  return Math.floor((agora.getTime() - protocolo.getTime()) / (1000 * 60 * 60 * 24));
}

export function isAtrasado(oficio: Oficio): boolean {
  if (oficio.status === "resolvido" || oficio.status === "respondido") return false;
  const dias = diasDesdeProtocolo(oficio);
  return dias !== null && dias > PRAZO_COBRANCA_DIAS;
}

export function getProgressPercent(status: OficioStatus): number {
  return (OFICIO_STATUS_CONFIG[status].step / 5) * 100;
}

// Mock data
export const oficios: Oficio[] = [
  {
    id: "of1", numero: "042/2026", titulo: "Recuperação de Pavimentação - Rua das Flores",
    bairro: "Liberdade", pauta: "Buracos na via principal há mais de 6 meses",
    status: "em_cobranca", criadoEm: "2026-02-10", protocoladoEm: "2026-02-12",
    protocolo: "PREF-2026-0421", assessorId: "a2",
  },
  {
    id: "of2", numero: "043/2026", titulo: "Iluminação Pública - Av. Principal",
    bairro: "São José", pauta: "Troca de postes queimados no trecho entre Rua 3 e Rua 7",
    status: "protocolado", criadoEm: "2026-02-15", protocoladoEm: "2026-02-18",
    protocolo: "PREF-2026-0435", assessorId: "a4",
  },
  {
    id: "of3", numero: "051/2026", titulo: "Transporte Escolar - Zona Rural",
    bairro: "Industrial", pauta: "Falta de ônibus escolar para alunos da zona rural",
    status: "respondido", criadoEm: "2026-02-20", protocoladoEm: "2026-02-22",
    respondidoEm: "2026-03-01", protocolo: "PREF-2026-0518", assessorId: "a1",
    resposta: "Prefeitura informa que 2 novos veículos serão contratados até abril.",
  },
  {
    id: "of4", numero: "058/2026", titulo: "Semáforo - Cruzamento Av. Brasil",
    bairro: "Centro", pauta: "Instalação de semáforo no cruzamento perigoso da Av. Brasil com Rua 15",
    status: "elaborado", criadoEm: "2026-02-28", assessorId: "a1",
  },
  {
    id: "of5", numero: "063/2026", titulo: "Ponte com Risco - Estrada Vicinal",
    bairro: "Industrial", pauta: "Ponte com risco de desabamento na estrada vicinal zona rural",
    status: "protocolado", criadoEm: "2026-03-01", protocoladoEm: "2026-03-02",
    protocolo: "PREF-2026-0630", assessorId: "a5",
  },
  {
    id: "of6", numero: "038/2026", titulo: "Esgoto a Céu Aberto - Rua 7 de Setembro",
    bairro: "Vila Nova", pauta: "Moradores da Rua 7 de Setembro pedem urgência no saneamento",
    status: "resolvido", criadoEm: "2026-01-20", protocoladoEm: "2026-01-22",
    respondidoEm: "2026-02-05", resolvidoEm: "2026-02-20",
    protocolo: "PREF-2026-0385", assessorId: "a4",
    resposta: "Obra concluída pela Secretaria de Infraestrutura.",
  },
  {
    id: "of7", numero: "070/2026", titulo: "Coleta de Lixo Irregular",
    bairro: "Cohab", pauta: "Coleta de lixo não está sendo feita regularmente no bairro",
    status: "em_cobranca", criadoEm: "2026-02-05", protocoladoEm: "2026-02-08",
    protocolo: "PREF-2026-0702", assessorId: "a3",
  },
  {
    id: "of8", numero: "075/2026", titulo: "Creche Municipal - Falta de Vagas",
    bairro: "Alto da Colina", pauta: "Mais de 50 crianças na fila de espera por vagas em creche",
    status: "protocolado", criadoEm: "2026-02-25", protocoladoEm: "2026-02-27",
    protocolo: "PREF-2026-0755", assessorId: "a5",
  },
];
