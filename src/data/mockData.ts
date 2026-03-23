export type UserRole = "admin" | "assessor" | "secretaria";

export interface Eleitor {
  id: string;
  nome: string;
  whatsapp: string;
  bairro: string;
  dataNascimento: string;
  situacao: string;
  assessorId: string;
  criadoEm: string;
}

export interface Assessor {
  id: string;
  nome: string;
  cadastros: number;
  avatar?: string;
}

export const BAIRROS = [
  // Região Central
  "Centro",
  "Bela Vista",
  "Recanto do Lago",
  "Jardim Caraípe",
  // Zona Leste
  "Castelinho",
  "Vila Vargas",
  "Jerusalém",
  "Nova Teixeira",
  "Ouro Verde",
  // Zona Oeste
  "Ulisses Guimarães",
  "Colina Verde",
  "Teixeirinha",
  "Liberdade",
  "Santa Rita",
  // Zona Norte
  "Kaikan",
  "Kaikan Sul",
  "Bonadiman",
  "Vila Caraípe",
  "Estância Biquíni",
  // Zona Sul
  "Tancredo Neves",
  "São Lourenço",
  "Duque de Caxias",
  "Monte Castelo",
  // Distritos/Zonais
  "Santo Antônio",
  "Jardim Novo",
];

export const SITUACOES = [
  { label: "Apoiador Confirmado", color: "success" },
  { label: "Indeciso", color: "warning" },
  { label: "Necessita Visita", color: "info" },
  { label: "Demanda Específica", color: "destructive" },
  { label: "Novo Cadastro", color: "secondary" },
] as const;

export const assessores: Assessor[] = [
  { id: "a1", nome: "Carlos Silva", cadastros: 142 },
  { id: "a2", nome: "Ana Souza", cadastros: 118 },
  { id: "a3", nome: "Roberto Lima", cadastros: 95 },
  { id: "a4", nome: "Fernanda Costa", cadastros: 87 },
  { id: "a5", nome: "Pedro Alves", cadastros: 64 },
];

const hoje = new Date();
const formatDate = (d: Date) => d.toISOString().split("T")[0];

// Helper to generate bulk eleitores for presentation
function gerarEleitoresMock(): Eleitor[] {
  const nomes = [
    "Maria Helena Santos", "João Pedro Oliveira", "Antônia Ferreira", "Francisco Almeida",
    "Lucia Barbosa", "Ricardo Mendes", "Sandra Nunes", "Paulo Henrique Dias",
    "Carla Moreira", "José Roberto Cardoso", "Mariana Lopes", "Fernando Rocha",
    "Beatriz Araújo", "Marcos Vinícius Pereira", "Patrícia Gomes", "Cláudio Nascimento",
    "Rosangela Teixeira", "Edson Luís Costa", "Denise Rodrigues", "Ailton Souza Filho",
    "Ivone Pereira da Silva", "Reginaldo Batista", "Aparecida Gonçalves", "Leandro Matos",
    "Sônia Maria Oliveira", "Valdecir Ribeiro", "Eliane Freitas", "Geraldo Brito",
    "Lúcia de Fátima Alves", "Sebastião Correia", "Adriana Melo", "Ronaldo Xavier",
    "Tereza Cristina", "Josué Pinto", "Simone Andrade", "Wellington Dias",
    "Conceição Alves", "Nilton Pereira", "Fabiana Ramos", "Gilberto Carvalho",
    "Vera Lúcia", "Manoel Santos", "Eugênia Costa", "Thiago Martins",
    "Raimunda Souza", "Cleverton Lima", "Joana D'Arc Silva", "Antônio Carlos",
    "Margarete Vieira", "Domingos Ferreira", "Célia Regina", "Ubirajara Neto",
    "Fátima Oliveira", "Davi Gonçalves", "Neusa Maria", "Jorge Luís Ribeiro",
    "Ilza Nascimento", "Valdir Moreira", "Ednalva Santos", "Rogério Almeida",
    "Dalva Pereira", "Ismael Costa", "Zilda Barbosa", "Cícero Araújo",
    "Graça Freitas", "Osvaldo Matos", "Marlene Teixeira", "Ademir Correia",
    "Lindalva Brito", "Josefa Rodrigues", "Elizeu Gomes", "Núbia Cardoso",
    "Roque Batista", "Celina Mendes", "Laércio Nunes", "Benedita Lopes",
    "Erivaldo Rocha", "Sueli Dias", "Amaro Xavier", "Florentina Pinto",
  ];

  // Distribution: more eleitores in strategic bairros
  const bairroDistribuicao: [string, number][] = [
    ["Centro", 18], ["Liberdade", 14], ["Castelinho", 12], ["Jardim Caraípe", 11],
    ["Bela Vista", 10], ["Tancredo Neves", 9], ["Kaikan", 8], ["Vila Vargas", 7],
    ["Colina Verde", 7], ["Recanto do Lago", 6], ["Ulisses Guimarães", 6],
    ["Bonadiman", 5], ["Santa Rita", 5], ["Nova Teixeira", 5], ["Ouro Verde", 4],
    ["Kaikan Sul", 4], ["Monte Castelo", 4], ["São Lourenço", 4],
    ["Duque de Caxias", 3], ["Jerusalém", 3], ["Teixeirinha", 3],
    ["Vila Caraípe", 3], ["Estância Biquíni", 2], ["Santo Antônio", 2],
    ["Jardim Novo", 2],
  ];

  const situacoes = ["Apoiador Confirmado", "Indeciso", "Necessita Visita", "Demanda Específica", "Novo Cadastro"];
  const assessorIds = ["a1", "a2", "a3", "a4", "a5"];
  const result: Eleitor[] = [];
  let idx = 0;

  for (const [bairro, count] of bairroDistribuicao) {
    for (let i = 0; i < count; i++) {
      const nome = nomes[idx % nomes.length];
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
      const year = 1958 + Math.floor(Math.random() * 42);
      const isAniversariante = idx < 4; // first 4 are today's birthday
      const dn = isAniversariante ? formatDate(hoje) : `${year}-${month}-${day}`;
      const criadoMonth = Math.random() > 0.3 ? "03" : (Math.random() > 0.5 ? "02" : "01");
      const criadoDay = String(Math.floor(Math.random() * 11) + 1).padStart(2, "0");

      result.push({
        id: `e${idx + 1}`,
        nome: idx < nomes.length ? nome : `${nome} ${idx}`,
        whatsapp: `5573999${String(idx).padStart(6, "0")}`,
        bairro,
        dataNascimento: dn,
        situacao: situacoes[idx % situacoes.length],
        assessorId: assessorIds[idx % assessorIds.length],
        criadoEm: `2026-${criadoMonth}-${criadoDay}`,
      });
      idx++;
    }
  }
  return result;
}

export const eleitores: Eleitor[] = gerarEleitoresMock();

export function getAniversariantes() {
  const today = new Date();
  const m = today.getMonth();
  const d = today.getDate();
  return eleitores.filter((e) => {
    const dn = new Date(e.dataNascimento + "T12:00:00");
    return dn.getMonth() === m && dn.getDate() === d;
  });
}

export function getTopBairro() {
  const count: Record<string, number> = {};
  eleitores.forEach((e) => {
    count[e.bairro] = (count[e.bairro] || 0) + 1;
  });
  let top = "";
  let max = 0;
  Object.entries(count).forEach(([b, c]) => {
    if (c > max) { top = b; max = c; }
  });
  return { bairro: top, total: max };
}

export function getBairroStats() {
  const count: Record<string, number> = {};
  eleitores.forEach((e) => {
    count[e.bairro] = (count[e.bairro] || 0) + 1;
  });
  return Object.entries(count)
    .map(([bairro, total]) => ({ bairro, total }))
    .sort((a, b) => b.total - a.total);
}

export function getSituacaoColor(situacao: string) {
  const found = SITUACOES.find((s) => s.label === situacao);
  return found?.color || "secondary";
}

export type ReuniaoStatus = "confirmada" | "pendente" | "conflito";
export type ReuniaoVisibilidade = "publica" | "off";

export interface Reuniao {
  id: string;
  titulo: string;
  data: string;
  horaInicio: string;
  duracao: number; // minutos
  bairro: string;
  pauta: string;
  solicitanteId: string;
  status: ReuniaoStatus;
  visibilidade: ReuniaoVisibilidade;
}

export const LIMITE_DIARIO = 6;

export const reunioes: Reuniao[] = [
  { id: "r1", titulo: "Visita à Escola Municipal", data: "2026-03-02", horaInicio: "08:00", duracao: 60, bairro: "Centro", pauta: "Reforma da quadra esportiva", solicitanteId: "a1", status: "confirmada", visibilidade: "publica" },
  { id: "r2", titulo: "Reunião com Moradores", data: "2026-03-02", horaInicio: "09:30", duracao: 90, bairro: "Liberdade", pauta: "Pavimentação da Rua das Flores", solicitanteId: "a2", status: "confirmada", visibilidade: "publica" },
  { id: "r3", titulo: "Entrega de Cestas Básicas", data: "2026-03-02", horaInicio: "14:00", duracao: 60, bairro: "Cohab", pauta: "Ação social mensal", solicitanteId: "a3", status: "pendente", visibilidade: "publica" },
  { id: "r4", titulo: "Audiência na Câmara", data: "2026-03-02", horaInicio: "14:00", duracao: 120, bairro: "Centro", pauta: "Votação do orçamento municipal", solicitanteId: "a1", status: "pendente", visibilidade: "off" },
  { id: "r5", titulo: "Visita ao Posto de Saúde", data: "2026-03-02", horaInicio: "16:30", duracao: 45, bairro: "São José", pauta: "Falta de medicamentos", solicitanteId: "a4", status: "confirmada", visibilidade: "publica" },
  { id: "r6", titulo: "Encontro com Lideranças", data: "2026-03-02", horaInicio: "18:00", duracao: 60, bairro: "Boa Vista", pauta: "Articulação para evento comunitário", solicitanteId: "a5", status: "pendente", visibilidade: "publica" },
];

// ── Calendário: Eventos Políticos ──────────────────────────────
export type EventoCategoria = "visita" | "demanda" | "reuniao" | "sazonal" | "oficio";
export type EventoStatus = "pendente" | "confirmado" | "concluido";

export interface EventoPolitico {
  id: string;
  titulo: string;
  data: string;
  hora?: string;
  categoria: EventoCategoria;
  status: EventoStatus;
  bairro?: string;
  assessorId?: string;
  pauta?: string;
  oficioEnviadoEm?: string; // ISO date – para calcular prazo
  sugestaoPost?: string;
}

export const CATEGORIA_CONFIG: Record<EventoCategoria, { label: string; color: string; emoji: string }> = {
  visita:   { label: "Visitas",         color: "hsl(142,71%,45%)",  emoji: "🟢" },
  demanda:  { label: "Demandas",        color: "hsl(38,92%,50%)",   emoji: "🟠" },
  reuniao:  { label: "Reuniões",        color: "hsl(221,83%,53%)",  emoji: "🔵" },
  sazonal:  { label: "Datas Sazonais",  color: "hsl(262,83%,58%)",  emoji: "🟣" },
  oficio:   { label: "Ofícios",         color: "hsl(0,84%,60%)",    emoji: "🔴" },
};

export const eventosPoliticos: EventoPolitico[] = [
  // Março 2026
  { id: "ev1",  titulo: "Visita à Escola Machado de Assis", data: "2026-03-02", hora: "08:00", categoria: "visita", status: "confirmado", bairro: "Centro", assessorId: "a1", pauta: "Reforma da quadra" },
  { id: "ev2",  titulo: "Demanda: Asfalto Rua das Flores",  data: "2026-03-02", hora: "10:00", categoria: "demanda", status: "pendente", bairro: "Liberdade", assessorId: "a2", pauta: "Moradores reclamam de buracos há 6 meses" },
  { id: "ev3",  titulo: "Reunião com Assoc. de Moradores",   data: "2026-03-03", hora: "14:00", categoria: "reuniao", status: "confirmado", bairro: "Cohab", assessorId: "a3", pauta: "Segurança pública no bairro" },
  { id: "ev4",  titulo: "Dia Internacional da Mulher",       data: "2026-03-08", categoria: "sazonal", status: "confirmado", sugestaoPost: "Homenagem às mulheres de Teixeira de Freitas que transformam nossos bairros todos os dias. 💜" },
  { id: "ev5",  titulo: "Ofício nº 042 — Iluminação Pública", data: "2026-03-04", categoria: "oficio", status: "pendente", bairro: "São José", oficioEnviadoEm: "2026-02-15", pauta: "Solicitação de troca de postes na Av. Principal" },
  { id: "ev6",  titulo: "Visita ao Posto de Saúde",          data: "2026-03-05", hora: "09:00", categoria: "visita", status: "pendente", bairro: "Boa Vista", assessorId: "a4", pauta: "Falta de medicamentos básicos" },
  { id: "ev7",  titulo: "Demanda: Creche Lot. Colina Verde",  data: "2026-03-06", hora: "11:00", categoria: "demanda", status: "confirmado", bairro: "Alto da Colina", assessorId: "a5", pauta: "Falta de vagas em creche municipal" },
  { id: "ev8",  titulo: "Aniversário de Teixeira de Freitas", data: "2026-03-09", categoria: "sazonal", status: "confirmado", sugestaoPost: "Parabéns, Teixeira de Freitas! Nossa cidade segue crescendo com a força do seu povo. 🎂🏙️" },
  { id: "ev9",  titulo: "Reunião com Sec. de Obras",          data: "2026-03-10", hora: "15:00", categoria: "reuniao", status: "pendente", bairro: "Centro", assessorId: "a1", pauta: "Cronograma de pavimentação 2026" },
  { id: "ev10", titulo: "Ofício nº 051 — Transporte Escolar", data: "2026-03-11", categoria: "oficio", status: "pendente", bairro: "Industrial", oficioEnviadoEm: "2026-02-20", pauta: "Falta de ônibus escolar na zona rural" },
  { id: "ev11", titulo: "Dia do Consumidor",                  data: "2026-03-15", categoria: "sazonal", status: "confirmado", sugestaoPost: "Neste Dia do Consumidor, reforçamos nosso compromisso com o comércio local de Teixeira de Freitas! 🛒" },
  { id: "ev12", titulo: "Visita ao CRAS Liberdade",           data: "2026-03-12", hora: "10:00", categoria: "visita", status: "confirmado", bairro: "Liberdade", assessorId: "a2", pauta: "Acompanhar atendimentos sociais" },
  { id: "ev13", titulo: "Demanda: Poda de Árvores",           data: "2026-03-16", hora: "08:30", categoria: "demanda", status: "pendente", bairro: "Parque das Flores", assessorId: "a3", pauta: "Risco de queda em período de chuvas" },
  { id: "ev14", titulo: "Páscoa",                             data: "2026-04-05", categoria: "sazonal", status: "confirmado", sugestaoPost: "Feliz Páscoa a todas as famílias de Teixeira de Freitas! Que a esperança renasça em cada lar. 🐣" },
  { id: "ev15", titulo: "Tiradentes",                         data: "2026-04-21", categoria: "sazonal", status: "confirmado", sugestaoPost: "21 de Abril — Dia de Tiradentes. Honramos quem luta pela liberdade e justiça! 🇧🇷" },
  { id: "ev16", titulo: "Dia do Trabalhador",                 data: "2026-05-01", categoria: "sazonal", status: "confirmado", sugestaoPost: "Feliz Dia do Trabalhador! Teixeira de Freitas cresce com a força de cada um de vocês. 💪" },
  // Mais eventos fictícios para usabilidade
  { id: "ev17", titulo: "Visita à Creche Arco-Íris",          data: "2026-03-13", hora: "09:00", categoria: "visita", status: "pendente", bairro: "Cohab", assessorId: "a3", pauta: "Verificar condições das instalações" },
  { id: "ev18", titulo: "Demanda: Esgoto a Céu Aberto",       data: "2026-03-14", hora: "10:30", categoria: "demanda", status: "pendente", bairro: "Vila Nova", assessorId: "a4", pauta: "Moradores da Rua 7 de Setembro pedem urgência" },
  { id: "ev19", titulo: "Reunião com Sec. de Educação",        data: "2026-03-17", hora: "14:00", categoria: "reuniao", status: "confirmado", bairro: "Centro", assessorId: "a1", pauta: "Merenda escolar e reformas nas escolas" },
  { id: "ev20", titulo: "Ofício nº 058 — Semáforo Av. Brasil", data: "2026-03-18", categoria: "oficio", status: "pendente", bairro: "Centro", oficioEnviadoEm: "2026-02-28", pauta: "Instalação de semáforo no cruzamento perigoso" },
  { id: "ev21", titulo: "Visita ao Mercado Municipal",         data: "2026-03-19", hora: "08:00", categoria: "visita", status: "confirmado", bairro: "Centro", assessorId: "a2", pauta: "Acompanhar obras de revitalização" },
  { id: "ev22", titulo: "Demanda: Quadra Esportiva",           data: "2026-03-20", hora: "16:00", categoria: "demanda", status: "pendente", bairro: "São Pedro", assessorId: "a5", pauta: "Jovens pedem reforma da quadra do bairro" },
  { id: "ev23", titulo: "Dia Mundial da Água",                 data: "2026-03-22", categoria: "sazonal", status: "confirmado", sugestaoPost: "Neste Dia Mundial da Água, reforçamos a luta por saneamento básico em todos os bairros de Teixeira de Freitas! 💧" },
  { id: "ev24", titulo: "Reunião com Líderes Comunitários",    data: "2026-03-23", hora: "19:00", categoria: "reuniao", status: "pendente", bairro: "Santa Maria", assessorId: "a3", pauta: "Planejamento de mutirão de limpeza" },
  { id: "ev25", titulo: "Visita ao Hospital Municipal",        data: "2026-03-24", hora: "10:00", categoria: "visita", status: "confirmado", bairro: "Jardim América", assessorId: "a1", pauta: "Fiscalizar fila de espera e leitos" },
  { id: "ev26", titulo: "Ofício nº 063 — Ponte da Estrada",    data: "2026-03-25", categoria: "oficio", status: "pendente", bairro: "Industrial", oficioEnviadoEm: "2026-03-05", pauta: "Ponte com risco de desabamento na zona rural" },
  { id: "ev27", titulo: "Demanda: Wi-Fi nas Praças",           data: "2026-03-26", hora: "11:00", categoria: "demanda", status: "confirmado", bairro: "Boa Vista", assessorId: "a2", pauta: "Jovens e comerciantes pedem internet pública" },
  { id: "ev28", titulo: "Reunião com Assoc. Comercial",        data: "2026-03-27", hora: "15:00", categoria: "reuniao", status: "confirmado", bairro: "Centro", assessorId: "a1", pauta: "Apoio ao comércio local pós-pandemia" },
  { id: "ev29", titulo: "Visita à Obra do Ginásio",            data: "2026-03-30", hora: "09:00", categoria: "visita", status: "pendente", bairro: "Parque das Flores", assessorId: "a4", pauta: "Acompanhar andamento da construção" },
  { id: "ev30", titulo: "Demanda: Iluminação Rua do Campo",    data: "2026-03-31", hora: "08:00", categoria: "demanda", status: "pendente", bairro: "Alto da Colina", assessorId: "a5", pauta: "Moradores relatam assaltos por falta de luz" },
  // Abril
  { id: "ev31", titulo: "Reunião com Sec. de Saúde",           data: "2026-04-01", hora: "10:00", categoria: "reuniao", status: "pendente", bairro: "Centro", assessorId: "a1", pauta: "Campanha de vacinação do outono" },
  { id: "ev32", titulo: "Visita à UBS Liberdade",              data: "2026-04-02", hora: "14:00", categoria: "visita", status: "confirmado", bairro: "Liberdade", assessorId: "a2", pauta: "Falta de profissionais de saúde" },
  { id: "ev33", titulo: "Ofício nº 070 — Limpeza Urbana",      data: "2026-04-03", categoria: "oficio", status: "pendente", bairro: "Cohab", oficioEnviadoEm: "2026-03-15", pauta: "Coleta de lixo irregular no bairro" },
  { id: "ev34", titulo: "Demanda: Acessibilidade Calçadas",    data: "2026-04-07", hora: "09:30", categoria: "demanda", status: "pendente", bairro: "Centro", assessorId: "a3", pauta: "Cadeirantes sem acesso na Av. Principal" },
  { id: "ev35", titulo: "Dia do Índio",                        data: "2026-04-19", categoria: "sazonal", status: "confirmado", sugestaoPost: "Respeito e valorização aos povos indígenas do extremo sul da Bahia! 🪶🇧🇷" },
  { id: "ev36", titulo: "Reunião Orçamento Participativo",     data: "2026-04-22", hora: "18:00", categoria: "reuniao", status: "pendente", bairro: "São José", assessorId: "a4", pauta: "Definir prioridades de investimento 2026" },
];
