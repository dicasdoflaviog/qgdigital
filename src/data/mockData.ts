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

export type BairroZona = "central" | "leste" | "oeste" | "norte" | "sul";

export const BAIRROS_ZONAS: Record<string, BairroZona> = {
  "Centro": "central",
  "Bela Vista": "central",
  "Recanto do Lago": "central",
  "Jardim Caraípe": "central",
  "Castelinho": "leste",
  "Vila Vargas": "leste",
  "Jerusalém": "leste",
  "Nova Teixeira": "leste",
  "Ouro Verde": "leste",
  "Ulisses Guimarães": "oeste",
  "Colina Verde": "oeste",
  "Teixeirinha": "oeste",
  "Liberdade": "oeste",
  "Santa Rita": "oeste",
  "Kaikan": "norte",
  "Kaikan Sul": "norte",
  "Bonadiman": "norte",
  "Vila Caraípe": "norte",
  "Estância Biquíni": "norte",
  "Tancredo Neves": "sul",
  "São Lourenço": "sul",
  "Duque de Caxias": "sul",
  "Monte Castelo": "sul",
  "Santo Antônio": "sul",
  "Jardim Novo": "sul",
};

export const SITUACOES = [
  { label: "Novo Cadastro", color: "secondary" },
  { label: "Atendido", color: "success" },
  { label: "Líder Comunitário", color: "info" },
  { label: "Apoiador Forte", color: "warning" },
  { label: "Eleitor Potencial", color: "destructive" },
] as const;

export const assessores: Assessor[] = [
  { id: "a1", nome: "Fábio Nascimento", cadastros: 142 },
  { id: "a2", nome: "Tânia Moreira", cadastros: 118 },
  { id: "a3", nome: "Rogério Bonfim", cadastros: 95 },
  { id: "a4", nome: "Cláudia Vilas Boas", cadastros: 87 },
  { id: "a5", nome: "Edson Cerqueira", cadastros: 64 },
];

const hoje = new Date();
const formatDate = (d: Date) => d.toISOString().split("T")[0];

// Helper to generate bulk eleitores for presentation
function gerarEleitoresMock(): Eleitor[] {
  const nomes = [
    "Maria das Graças Silva", "João Batista Oliveira", "Antônio Carlos Ferreira", "Francisca Lima Santos",
    "José Augusto Souza", "Josefa Alves Costa", "Raimundo Neto Barbosa", "Edilaine Santos Pereira",
    "Cleonice Ferreira Rocha", "Hélio Barbosa Nunes", "Neuza Costa Almeida", "Geovani Souza Melo",
    "Divaldina Rocha Brito", "Sineide Almeida Gomes", "Adailton Pereira Cruz", "Rosinete Gomes Cardoso",
    "Valdinei Cruz Nascimento", "Janete Teixeira Moreira", "Osvaldo Borges Lima", "Conceição Silva Dias",
    "Sebastião Nunes Ribeiro", "Iracema Fonseca Mendes", "Roney Carvalho Pinto", "Gilzete Martins Araujo",
    "Ademar Santos Xavier", "Creusa Lima Vieira", "Waldivino Dias Castro", "Tereza Cardoso Monteiro",
    "Nadson Moreira Ramos", "Lucelina Melo Freitas", "Maria Helena Santos", "João Pedro Oliveira",
    "Antônia Ferreira Lima", "Francisco Almeida Souza", "Lucia Barbosa Costa", "Ricardo Mendes Nunes",
    "Sandra Nunes Dias", "Paulo Henrique Dias Rocha", "Carla Moreira Alves", "José Roberto Cardoso",
    "Mariana Lopes Silva", "Fernando Rocha Batista", "Beatriz Araújo Gonçalves", "Marcos Vinícius Pereira",
    "Patrícia Gomes Nascimento", "Cláudio Nascimento Brito", "Rosangela Teixeira Matos", "Edson Luís Costa",
    "Denise Rodrigues Vieira", "Ailton Souza Filho", "Ivone Pereira da Silva", "Reginaldo Batista Pinto",
    "Aparecida Gonçalves Ramos", "Leandro Matos Freitas", "Sônia Maria Oliveira", "Valdecir Ribeiro Carvalho",
    "Eliane Freitas Santos", "Geraldo Brito Lima", "Lúcia de Fátima Alves", "Sebastião Correia Neto",
    "Adriana Melo Cardoso", "Ronaldo Xavier Mendes", "Tereza Cristina Araújo", "Josué Pinto Barbosa",
    "Simone Andrade Costa", "Wellington Dias Silva", "Conceição Alves Rodrigues", "Nilton Pereira Gomes",
    "Fabiana Ramos Ferreira", "Gilberto Carvalho Nascimento", "Vera Lúcia Moreira", "Manoel Santos Cruz",
    "Eugênia Costa Brito", "Thiago Martins Lopes", "Raimunda Souza Vieira", "Cleverton Lima Teixeira",
    "Joana D'Arc Silva", "Antônio Carlos Dias", "Margarete Vieira Cardoso", "Domingos Ferreira Melo",
    "Célia Regina Batista", "Ubirajara Neto Santos", "Fátima Oliveira Ramos", "Davi Gonçalves Freitas",
    "Neusa Maria Alves", "Jorge Luís Ribeiro", "Ilza Nascimento Pinto", "Valdir Moreira Barbosa",
    "Ednalva Santos Mendes", "Rogério Almeida Cruz", "Dalva Pereira Araújo", "Ismael Costa Gomes",
    "Zilda Barbosa Vieira", "Cícero Araújo Lima", "Graça Freitas Cardoso", "Osvaldo Matos Nascimento",
    "Marlene Teixeira Brito", "Ademir Correia Santos", "Lindalva Brito Ferreira", "Josefa Rodrigues Lopes",
    "Elizeu Gomes Carvalho", "Núbia Cardoso Moreira", "Roque Batista Silva", "Celina Mendes Dias",
    "Laércio Nunes Costa", "Benedita Lopes Rocha", "Erivaldo Rocha Pinto", "Sueli Dias Almeida",
    "Amaro Xavier Ribeiro", "Florentina Pinto Souza", "Geralda Cruz Nunes", "Norberto Silva Batista",
  ];

  // Distribution: ~400 voters across TF bairros proportional to real population
  const bairroDistribuicao: [string, number][] = [
    ["Centro", 42], ["Liberdade", 32], ["Castelinho", 28], ["Jardim Caraípe", 26],
    ["Bela Vista", 24], ["Tancredo Neves", 22], ["Kaikan", 20], ["Vila Vargas", 18],
    ["Colina Verde", 18], ["Recanto do Lago", 16], ["Ulisses Guimarães", 14],
    ["Bonadiman", 14], ["Santa Rita", 13], ["Nova Teixeira", 12], ["Ouro Verde", 12],
    ["Kaikan Sul", 10], ["Monte Castelo", 10], ["São Lourenço", 10],
    ["Duque de Caxias", 9], ["Jerusalém", 8], ["Teixeirinha", 8],
    ["Vila Caraípe", 7], ["Estância Biquíni", 7], ["Santo Antônio", 6],
    ["Jardim Novo", 5],
  ];

  // situações distribution: 30% Novo Cadastro, 40% Atendido, 15% Líder Comunitário, 15% Apoiador Forte
  const situacoesPool = [
    ...Array(30).fill("Novo Cadastro"),
    ...Array(40).fill("Atendido"),
    ...Array(15).fill("Líder Comunitário"),
    ...Array(15).fill("Apoiador Forte"),
  ];
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
        situacao: situacoesPool[idx % situacoesPool.length],
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
  // ── Março 2026 ──
  { id: "ev1",  titulo: "Visita à Escola Machado de Assis", data: "2026-03-02", hora: "08:00", categoria: "visita", status: "confirmado", bairro: "Centro", assessorId: "a1", pauta: "Reforma da quadra esportiva" },
  { id: "ev2",  titulo: "Demanda: Asfalto Rua das Flores",  data: "2026-03-02", hora: "10:00", categoria: "demanda", status: "pendente", bairro: "Liberdade", assessorId: "a2", pauta: "Moradores reclamam de buracos há 6 meses" },
  { id: "ev3",  titulo: "Reunião com Assoc. de Moradores",   data: "2026-03-03", hora: "14:00", categoria: "reuniao", status: "confirmado", bairro: "Kaikan", assessorId: "a3", pauta: "Segurança pública no bairro" },
  { id: "ev4",  titulo: "Dia Internacional da Mulher",       data: "2026-03-08", categoria: "sazonal", status: "confirmado", sugestaoPost: "Homenagem às mulheres de Teixeira de Freitas que transformam nossos bairros todos os dias. 💜" },
  { id: "ev5",  titulo: "Ofício nº 042 — Iluminação Pública", data: "2026-03-04", categoria: "oficio", status: "pendente", bairro: "Tancredo Neves", oficioEnviadoEm: "2026-02-15", pauta: "Solicitação de troca de postes na Av. Tancredo Neves" },
  { id: "ev6",  titulo: "Visita ao Posto de Saúde Kaikan",   data: "2026-03-05", hora: "09:00", categoria: "visita", status: "pendente", bairro: "Kaikan", assessorId: "a4", pauta: "Falta de médicos clínicos gerais" },
  { id: "ev7",  titulo: "Demanda: Creche Colina Verde",       data: "2026-03-06", hora: "11:00", categoria: "demanda", status: "confirmado", bairro: "Colina Verde", assessorId: "a5", pauta: "Falta de vagas em creche municipal" },
  { id: "ev8",  titulo: "Aniversário de Teixeira de Freitas", data: "2026-03-14", categoria: "sazonal", status: "confirmado", sugestaoPost: "Parabéns, Teixeira de Freitas! Nossa cidade segue crescendo com a força do seu povo. 🎂🏙️" },
  { id: "ev9",  titulo: "Reunião com Sec. de Obras",          data: "2026-03-10", hora: "15:00", categoria: "reuniao", status: "pendente", bairro: "Centro", assessorId: "a1", pauta: "Cronograma de pavimentação 2026 — BR-101 trecho urbano" },
  { id: "ev10", titulo: "Ofício nº 051 — Transporte Escolar", data: "2026-03-11", categoria: "oficio", status: "pendente", bairro: "Tancredo Neves", oficioEnviadoEm: "2026-02-20", pauta: "Falta de ônibus escolar no Tancredo Neves" },
  { id: "ev11", titulo: "Dia do Consumidor",                  data: "2026-03-15", categoria: "sazonal", status: "confirmado", sugestaoPost: "Neste Dia do Consumidor, reforçamos nosso compromisso com o comércio local de Teixeira de Freitas! 🛒" },
  { id: "ev12", titulo: "Visita ao CRAS Liberdade",           data: "2026-03-12", hora: "10:00", categoria: "visita", status: "confirmado", bairro: "Liberdade", assessorId: "a2", pauta: "Acompanhar atendimentos sociais e demandas de habitação" },
  { id: "ev13", titulo: "Demanda: Poda de Árvores Kaikan Sul", data: "2026-03-16", hora: "08:30", categoria: "demanda", status: "pendente", bairro: "Kaikan Sul", assessorId: "a3", pauta: "Risco de queda em período de chuvas" },
  { id: "ev14", titulo: "Ofício nº 053 — Esgoto Liberdade",   data: "2026-03-13", categoria: "oficio", status: "pendente", bairro: "Liberdade", oficioEnviadoEm: "2026-02-22", pauta: "Esgoto a céu aberto na Rua São João — risco sanitário" },
  { id: "ev15", titulo: "Reunião Câmara Municipal",            data: "2026-03-17", hora: "09:00", categoria: "reuniao", status: "confirmado", bairro: "Centro", assessorId: "a1", pauta: "Votação PL 012/2026 — orçamento para saúde" },
  { id: "ev16", titulo: "Visita à UBS Tancredo Neves",         data: "2026-03-18", hora: "10:00", categoria: "visita", status: "confirmado", bairro: "Tancredo Neves", assessorId: "a3", pauta: "Verificar atendimento CAPS e fila de espera" },
  { id: "ev17", titulo: "Demanda: Semáforo Av. Getúlio Vargas", data: "2026-03-19", hora: "08:00", categoria: "demanda", status: "pendente", bairro: "Centro", assessorId: "a4", pauta: "Cruzamento perigoso próximo ao Mercado Municipal" },
  { id: "ev18", titulo: "Dia Mundial da Água",                 data: "2026-03-22", categoria: "sazonal", status: "confirmado", sugestaoPost: "Neste Dia Mundial da Água, reforçamos a luta por saneamento básico em todos os bairros de Teixeira de Freitas! 💧" },
  { id: "ev19", titulo: "Reunião com Líderes — Castelo Branco", data: "2026-03-23", hora: "19:00", categoria: "reuniao", status: "pendente", bairro: "Castelinho", assessorId: "a3", pauta: "Planejamento de mutirão de limpeza e manutenção" },
  { id: "ev20", titulo: "Visita à Escola Estadual Castelo Branco", data: "2026-03-24", hora: "10:00", categoria: "visita", status: "confirmado", bairro: "Castelinho", assessorId: "a1", pauta: "Fiscalizar reforma e estrutura do laboratório" },
  { id: "ev21", titulo: "Ofício nº 063 — Pavimentação Bonadiman", data: "2026-03-25", categoria: "oficio", status: "pendente", bairro: "Bonadiman", oficioEnviadoEm: "2026-03-05", pauta: "Ruas sem asfalto há mais de 10 anos" },
  { id: "ev22", titulo: "Demanda: Wi-Fi nas Praças",           data: "2026-03-26", hora: "11:00", categoria: "demanda", status: "confirmado", bairro: "Centro", assessorId: "a2", pauta: "Jovens e comerciantes pedem internet pública gratuita" },
  { id: "ev23", titulo: "Reunião com Assoc. Comercial TF",    data: "2026-03-27", hora: "15:00", categoria: "reuniao", status: "confirmado", bairro: "Centro", assessorId: "a1", pauta: "Apoio ao comércio local — desburocratização" },
  { id: "ev24", titulo: "Visita à Obra do Ginásio Kaikan",    data: "2026-03-30", hora: "09:00", categoria: "visita", status: "pendente", bairro: "Kaikan", assessorId: "a4", pauta: "Acompanhar andamento da construção do ginásio" },
  { id: "ev25", titulo: "Demanda: Iluminação Ouro Verde",     data: "2026-03-31", hora: "08:00", categoria: "demanda", status: "pendente", bairro: "Ouro Verde", assessorId: "a5", pauta: "Moradores relatam assaltos por falta de iluminação" },
  // ── Abril 2026 ──
  { id: "ev26", titulo: "Reunião com Sec. de Saúde",           data: "2026-04-01", hora: "10:00", categoria: "reuniao", status: "pendente", bairro: "Centro", assessorId: "a1", pauta: "Campanha de vacinação de outono — metas 2026" },
  { id: "ev27", titulo: "Visita ao CAPS — Saúde Mental",       data: "2026-04-02", hora: "14:00", categoria: "visita", status: "confirmado", bairro: "Centro", assessorId: "a2", pauta: "Verificar capacidade de atendimento e leitos" },
  { id: "ev28", titulo: "Ofício nº 070 — Coleta de Lixo",      data: "2026-04-03", categoria: "oficio", status: "pendente", bairro: "Kaikan Sul", oficioEnviadoEm: "2026-03-15", pauta: "Coleta irregular às quartas no Kaikan Sul" },
  { id: "ev29", titulo: "Páscoa",                              data: "2026-04-05", categoria: "sazonal", status: "confirmado", sugestaoPost: "Feliz Páscoa a todas as famílias de Teixeira de Freitas! Que a esperança renasça em cada lar. 🐣" },
  { id: "ev30", titulo: "Demanda: Acessibilidade Calçadas TF", data: "2026-04-07", hora: "09:30", categoria: "demanda", status: "pendente", bairro: "Centro", assessorId: "a3", pauta: "Cadeirantes sem acesso na Av. Bahia" },
  { id: "ev31", titulo: "Visita à Feira do Produtor Rural",    data: "2026-04-08", hora: "07:30", categoria: "visita", status: "confirmado", bairro: "Centro", assessorId: "a5", pauta: "Articulação com agricultores familiares do ES da Bahia" },
  { id: "ev32", titulo: "Reunião com Sec. de Educação",        data: "2026-04-09", hora: "14:00", categoria: "reuniao", status: "pendente", bairro: "Centro", assessorId: "a1", pauta: "Merenda escolar e reformas nas escolas municipais" },
  { id: "ev33", titulo: "Ofício nº 074 — Quadra Santa Rita",  data: "2026-04-10", categoria: "oficio", status: "pendente", bairro: "Santa Rita", oficioEnviadoEm: "2026-03-20", pauta: "Construção de quadra poliesportiva no Santa Rita" },
  { id: "ev34", titulo: "Demanda: Drenos São Lourenço",       data: "2026-04-11", hora: "10:00", categoria: "demanda", status: "pendente", bairro: "São Lourenço", assessorId: "a4", pauta: "Alagamentos recorrentes na chuva — falta de drenagem" },
  { id: "ev35", titulo: "Visita ao CEI Vila Vargas",          data: "2026-04-14", hora: "09:00", categoria: "visita", status: "confirmado", bairro: "Vila Vargas", assessorId: "a2", pauta: "Verificar ampliação de vagas — lista espera 200 crianças" },
  { id: "ev36", titulo: "Tiradentes",                         data: "2026-04-21", categoria: "sazonal", status: "confirmado", sugestaoPost: "21 de Abril — Dia de Tiradentes. Honramos quem luta pela liberdade e justiça! 🇧🇷" },
  { id: "ev37", titulo: "Reunião Orçamento Participativo",    data: "2026-04-22", hora: "18:00", categoria: "reuniao", status: "pendente", bairro: "Tancredo Neves", assessorId: "a4", pauta: "Definir prioridades de investimento 2026/2027" },
  { id: "ev38", titulo: "Dia da Terra",                       data: "2026-04-22", categoria: "sazonal", status: "confirmado", sugestaoPost: "No Dia da Terra, lembramos que preservar o Rio Itanhém é preservar Teixeira de Freitas! 🌱" },
  { id: "ev39", titulo: "Ofício nº 081 — Escola Tancredo",   data: "2026-04-23", categoria: "oficio", status: "pendente", bairro: "Tancredo Neves", oficioEnviadoEm: "2026-04-01", pauta: "Reforma urgente do telhado da Escola Estadual" },
  { id: "ev40", titulo: "Visita ao Jardim Caraípe",          data: "2026-04-25", hora: "09:00", categoria: "visita", status: "pendente", bairro: "Jardim Caraípe", assessorId: "a3", pauta: "Vistoria de ruas sem iluminação no setor B" },
  // ── Maio 2026 ──
  { id: "ev41", titulo: "Dia do Trabalhador",                 data: "2026-05-01", categoria: "sazonal", status: "confirmado", sugestaoPost: "Feliz Dia do Trabalhador! Teixeira de Freitas cresce com a força de cada um de vocês. 💪" },
  { id: "ev42", titulo: "Demanda: Pavimentação Bonadiman",   data: "2026-05-04", hora: "10:00", categoria: "demanda", status: "confirmado", bairro: "Bonadiman", assessorId: "a5", pauta: "Rua das Palmeiras — moradores aguardam há 3 mandatos" },
  { id: "ev43", titulo: "Reunião Câmara — Audiência Pública", data: "2026-05-05", hora: "14:00", categoria: "reuniao", status: "pendente", bairro: "Centro", assessorId: "a1", pauta: "PL 018/2026 — plano municipal de mobilidade urbana" },
  { id: "ev44", titulo: "Visita ao Mercado Municipal",        data: "2026-05-06", hora: "08:00", categoria: "visita", status: "confirmado", bairro: "Centro", assessorId: "a2", pauta: "Acompanhar obras de revitalização do mercado" },
  { id: "ev45", titulo: "Dia das Mães",                      data: "2026-05-10", categoria: "sazonal", status: "confirmado", sugestaoPost: "Feliz Dia das Mães a todas as guerreiras de Teixeira de Freitas! Vocês são a base desta cidade. 🌸❤️" },
  { id: "ev46", titulo: "Ofício nº 089 — Ponte Duque Caxias", data: "2026-05-11", categoria: "oficio", status: "pendente", bairro: "Duque de Caxias", oficioEnviadoEm: "2026-04-20", pauta: "Ponte na Rua 14 com risco de colapso nas chuvas" },
  { id: "ev47", titulo: "Demanda: Escola Noturna Liberdade", data: "2026-05-12", hora: "19:00", categoria: "demanda", status: "pendente", bairro: "Liberdade", assessorId: "a3", pauta: "Trabalhadores sem turno noturno disponível" },
  { id: "ev48", titulo: "Visita ao Colina Verde",             data: "2026-05-14", hora: "09:00", categoria: "visita", status: "pendente", bairro: "Colina Verde", assessorId: "a4", pauta: "Inauguração de área de lazer com recursos emenda" },
  { id: "ev49", titulo: "Reunião com Conselho de Saúde",     data: "2026-05-15", hora: "18:00", categoria: "reuniao", status: "confirmado", bairro: "Centro", assessorId: "a1", pauta: "Prestação de contas — fundo municipal de saúde" },
  { id: "ev50", titulo: "Moto Festival TF — Edição 2026",    data: "2026-05-16", categoria: "sazonal", status: "confirmado", sugestaoPost: "O Moto Festival de Teixeira de Freitas movimenta nossa economia e celebra nossa comunidade! 🏍️🔥" },
  { id: "ev51", titulo: "Demanda: Iluminação Monte Castelo", data: "2026-05-18", hora: "08:00", categoria: "demanda", status: "pendente", bairro: "Monte Castelo", assessorId: "a5", pauta: "5 postes sem luz na Rua das Acácias há 2 meses" },
  { id: "ev52", titulo: "Ofício nº 095 — UBS Kaikan",        data: "2026-05-19", categoria: "oficio", status: "pendente", bairro: "Kaikan", oficioEnviadoEm: "2026-04-28", pauta: "Solicitação de médico clínico geral para UBS do Kaikan" },
  { id: "ev53", titulo: "Visita à Creche Tancredo Neves",    data: "2026-05-21", hora: "10:00", categoria: "visita", status: "confirmado", bairro: "Tancredo Neves", assessorId: "a2", pauta: "Verificar reforma e capacidade de vagas" },
  { id: "ev54", titulo: "Reunião com Sec. de Assistência",   data: "2026-05-22", hora: "14:00", categoria: "reuniao", status: "pendente", bairro: "Centro", assessorId: "a3", pauta: "Benefícios sociais — famílias em vulnerabilidade" },
  // ── Junho 2026 ──
  { id: "ev55", titulo: "Corpus Christi",                    data: "2026-06-04", categoria: "sazonal", status: "confirmado", sugestaoPost: "Corpus Christi — fé e esperança nas ruas de Teixeira de Freitas! 🙏✨" },
  { id: "ev56", titulo: "Demanda: CRAS Bela Vista",          data: "2026-06-05", hora: "09:00", categoria: "demanda", status: "pendente", bairro: "Bela Vista", assessorId: "a4", pauta: "Comunidade pede instalação de CRAS no bairro" },
  { id: "ev57", titulo: "Dia do Meio Ambiente",              data: "2026-06-05", categoria: "sazonal", status: "confirmado", sugestaoPost: "No Dia do Meio Ambiente, reafirmamos nosso compromisso com o Rio Itanhém e o Verde de TF! 🌿🌊" },
  { id: "ev58", titulo: "Visita ao Parque Rio Itanhém",      data: "2026-06-06", hora: "08:00", categoria: "visita", status: "pendente", bairro: "Centro", assessorId: "a1", pauta: "Vistoria da área de lazer e mata ciliar do rio" },
  { id: "ev59", titulo: "Ofício nº 102 — Calçadão Centro",  data: "2026-06-09", categoria: "oficio", status: "pendente", bairro: "Centro", oficioEnviadoEm: "2026-05-15", pauta: "Revitalização do calçadão central — acessibilidade" },
  { id: "ev60", titulo: "Reunião com Vereadores — Habitação", data: "2026-06-10", hora: "10:00", categoria: "reuniao", status: "pendente", bairro: "Centro", assessorId: "a1", pauta: "Programa habitacional para famílias de baixa renda" },
  { id: "ev61", titulo: "Festa de Nossa Sra da Penha — TF",  data: "2026-06-14", categoria: "sazonal", status: "confirmado", sugestaoPost: "Festa de Nossa Senhora da Penha — a fé do povo de Teixeira de Freitas renovada a cada ano! 🕊️🌟" },
  { id: "ev62", titulo: "Demanda: Calçamento Jerusalém",     data: "2026-06-16", hora: "09:00", categoria: "demanda", status: "confirmado", bairro: "Jerusalém", assessorId: "a5", pauta: "Ruas irregulares dificultam locomoção de idosos" },
  { id: "ev63", titulo: "Visita à Assoc. de Pescadores",    data: "2026-06-20", hora: "07:00", categoria: "visita", status: "pendente", bairro: "Centro", assessorId: "a2", pauta: "Apoiar pesca artesanal no Rio Itanhém" },
  { id: "ev64", titulo: "Dia de São João",                   data: "2026-06-24", categoria: "sazonal", status: "confirmado", sugestaoPost: "Arraiá de Teixeira de Freitas! Festa junina, tradição e alegria do povo baiano! 🎉🌽" },
  { id: "ev65", titulo: "Ofício nº 110 — Ginásio Ulisses",  data: "2026-06-25", categoria: "oficio", status: "pendente", bairro: "Ulisses Guimarães", oficioEnviadoEm: "2026-06-01", pauta: "Solicitação de reforma do ginásio Ulisses Guimarães" },
];
