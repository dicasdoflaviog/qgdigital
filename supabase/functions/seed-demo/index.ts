import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── City definitions with real coords and bairros ──
interface CityDef {
  nome: string;
  estado: string;
  lat: number;
  lng: number;
  zoom: number;
  bairros: { nome: string; lat: number; lng: number }[];
}

interface VereadorDef {
  nome: string;
  partido: string;
  foto: string | null;
  cidade: string;
}

const CITIES: CityDef[] = [
  {
    nome: "Teixeira de Freitas", estado: "BA", lat: -17.5389, lng: -39.7422, zoom: 13,
    bairros: [
      { nome: "Centro", lat: -17.5389, lng: -39.7422 },
      { nome: "Castelo Branco", lat: -17.5450, lng: -39.7350 },
      { nome: "Vila Vargas", lat: -17.5320, lng: -39.7380 },
      { nome: "Tancredo Neves", lat: -17.5480, lng: -39.7480 },
      { nome: "Kaikan", lat: -17.5260, lng: -39.7300 },
      { nome: "São Lourenço", lat: -17.5520, lng: -39.7520 },
      { nome: "Jardim Caraípe", lat: -17.5350, lng: -39.7250 },
      { nome: "Colina Verde", lat: -17.5410, lng: -39.7180 },
      { nome: "Liberdade", lat: -17.5300, lng: -39.7450 },
      { nome: "Santa Rita", lat: -17.5550, lng: -39.7400 },
      { nome: "Jerusalém", lat: -17.5280, lng: -39.7500 },
      { nome: "Nova Teixeira", lat: -17.5500, lng: -39.7300 },
      { nome: "Recanto do Lago", lat: -17.5370, lng: -39.7550 },
      { nome: "Bela Vista", lat: -17.5430, lng: -39.7200 },
      { nome: "Ouro Verde", lat: -17.5200, lng: -39.7350 },
    ],
  },
  {
    nome: "Itamaraju", estado: "BA", lat: -17.0389, lng: -39.5311, zoom: 13,
    bairros: [
      { nome: "Centro", lat: -17.0389, lng: -39.5311 },
      { nome: "Nova Cidade", lat: -17.0420, lng: -39.5250 },
      { nome: "Novo Horizonte", lat: -17.0350, lng: -39.5380 },
      { nome: "São Francisco", lat: -17.0450, lng: -39.5350 },
      { nome: "Alto Maron", lat: -17.0310, lng: -39.5280 },
      { nome: "Santo Antônio", lat: -17.0480, lng: -39.5400 },
    ],
  },
  {
    nome: "Caravelas", estado: "BA", lat: -17.7269, lng: -39.2650, zoom: 13,
    bairros: [
      { nome: "Centro", lat: -17.7269, lng: -39.2650 },
      { nome: "Nova Caravelas", lat: -17.7300, lng: -39.2600 },
      { nome: "Ponta de Areia", lat: -17.7230, lng: -39.2580 },
      { nome: "São José", lat: -17.7350, lng: -39.2700 },
      { nome: "Aparecida", lat: -17.7200, lng: -39.2720 },
    ],
  },
  {
    nome: "Mucuri", estado: "BA", lat: -18.0836, lng: -39.5550, zoom: 13,
    bairros: [
      { nome: "Centro", lat: -18.0836, lng: -39.5550 },
      { nome: "Cidade Nova", lat: -18.0870, lng: -39.5500 },
      { nome: "São Jorge", lat: -18.0800, lng: -39.5600 },
      { nome: "Bela Vista", lat: -18.0900, lng: -39.5480 },
      { nome: "Itabatan", lat: -18.0340, lng: -39.5700 },
    ],
  },
  {
    nome: "Prado", estado: "BA", lat: -17.3406, lng: -39.2203, zoom: 13,
    bairros: [
      { nome: "Centro", lat: -17.3406, lng: -39.2203 },
      { nome: "São Bernardo", lat: -17.3450, lng: -39.2250 },
      { nome: "Nova Prado", lat: -17.3370, lng: -39.2150 },
      { nome: "Guarany", lat: -17.3500, lng: -39.2300 },
    ],
  },
  {
    nome: "Medeiros Neto", estado: "BA", lat: -17.3717, lng: -40.2264, zoom: 13,
    bairros: [
      { nome: "Centro", lat: -17.3717, lng: -40.2264 },
      { nome: "São Francisco", lat: -17.3750, lng: -40.2300 },
      { nome: "São José", lat: -17.3680, lng: -40.2200 },
      { nome: "Novo Horizonte", lat: -17.3780, lng: -40.2350 },
    ],
  },
  {
    nome: "Alcobaça", estado: "BA", lat: -17.5197, lng: -39.2036, zoom: 13,
    bairros: [
      { nome: "Centro", lat: -17.5197, lng: -39.2036 },
      { nome: "Nova Alcobaça", lat: -17.5230, lng: -39.2000 },
      { nome: "São Bernardo", lat: -17.5160, lng: -39.2080 },
      { nome: "Beira Rio", lat: -17.5250, lng: -39.1970 },
    ],
  },
  {
    nome: "Lajedão", estado: "BA", lat: -17.6019, lng: -40.3425, zoom: 14,
    bairros: [
      { nome: "Centro", lat: -17.6019, lng: -40.3425 },
      { nome: "São José", lat: -17.6050, lng: -40.3460 },
      { nome: "Nova Esperança", lat: -17.5990, lng: -40.3380 },
    ],
  },
];

const VEREADORES: VereadorDef[] = [
  // ── Teixeira de Freitas ──
  { nome: "Jonatas dos Santos", partido: "MDB", foto: "https://www.camaratf.ba.gov.br/wp-content/uploads/2025/01/perfil-jonatas.jpg", cidade: "Teixeira de Freitas" },
  { nome: "Tequinha Brito", partido: "PSD", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Joris de Gel", partido: "União Brasil", foto: "https://www.camaratf.ba.gov.br/wp-content/uploads/2021/01/joris-gel.jpg", cidade: "Teixeira de Freitas" },
  { nome: "Simara do Projeto Resgate", partido: "AVANTE", foto: "https://www.camaratf.ba.gov.br/wp-content/uploads/2025/01/SIMARA-SITE.jpg", cidade: "Teixeira de Freitas" },
  { nome: "Marcelo Teixeira", partido: "PRD", foto: "https://www.camaratf.ba.gov.br/wp-content/uploads/2022/09/Marcelo-bandeira-447x470.jpg", cidade: "Teixeira de Freitas" },
  { nome: "João Garçom", partido: "PCdoB", foto: "https://www.camaratf.ba.gov.br/wp-content/uploads/2025/01/joao-filho-site.jpg", cidade: "Teixeira de Freitas" },
  { nome: "Adriano Souza", partido: "PP", foto: "https://www.camaratf.ba.gov.br/wp-content/uploads/2025/01/adriano.jpg", cidade: "Teixeira de Freitas" },
  { nome: "Ailton Cruz", partido: "PL", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Bernardo Cabral", partido: "PSDB", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Bruno Barbosa", partido: "Republicanos", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Cláudio Novo Tempo", partido: "PDT", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Clemeson do Postinho", partido: "MDB", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Marquinhos Gomes", partido: "PP", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Jucelio Silva", partido: "PSD", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Ronaldo Baitakão", partido: "União Brasil", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Vanderley do Social", partido: "PT", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Wemerson Sales", partido: "PL", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Adalgiso Rodrigues Jardim", partido: "PSDB", foto: null, cidade: "Teixeira de Freitas" },
  { nome: "Rose Assistente Social", partido: "PT", foto: null, cidade: "Teixeira de Freitas" },

  // ── Itamaraju ──
  { nome: "Rose da Saúde", partido: "PSDB", foto: null, cidade: "Itamaraju" },
  { nome: "Galego de Dr Marcelo", partido: "MDB", foto: null, cidade: "Itamaraju" },
  { nome: "Evalcy Enfermeira", partido: "PSD", foto: null, cidade: "Itamaraju" },
  { nome: "Mazuk", partido: "União Brasil", foto: null, cidade: "Itamaraju" },
  { nome: "Rubens do Hospital", partido: "PP", foto: null, cidade: "Itamaraju" },
  { nome: "Daniel Nascimento", partido: "PL", foto: null, cidade: "Itamaraju" },
  { nome: "Binho da Farmácia", partido: "PDT", foto: null, cidade: "Itamaraju" },
  { nome: "Dal do Cristo Redentor", partido: "AVANTE", foto: null, cidade: "Itamaraju" },
  { nome: "Nêre do Marotinho", partido: "Republicanos", foto: null, cidade: "Itamaraju" },
  { nome: "Bubu da Sinuca", partido: "PT", foto: null, cidade: "Itamaraju" },

  // ── Caravelas ──
  { nome: "Lindeval da Saúde", partido: "MDB", foto: null, cidade: "Caravelas" },
  { nome: "Reginaldo da Saúde", partido: "PSD", foto: null, cidade: "Caravelas" },
  { nome: "Gilminha", partido: "PP", foto: null, cidade: "Caravelas" },
  { nome: "Ayna da Social", partido: "PT", foto: null, cidade: "Caravelas" },
  { nome: "Cró da Balsa", partido: "União Brasil", foto: null, cidade: "Caravelas" },
  { nome: "Zé Cabo", partido: "PL", foto: null, cidade: "Caravelas" },
  { nome: "Toquinho", partido: "PSDB", foto: null, cidade: "Caravelas" },
  { nome: "Leandro", partido: "PDT", foto: null, cidade: "Caravelas" },
  { nome: "Meire Enfermeira", partido: "AVANTE", foto: null, cidade: "Caravelas" },
  { nome: "Claudino", partido: "Republicanos", foto: null, cidade: "Caravelas" },
  { nome: "Dr. Herbert", partido: "MDB", foto: null, cidade: "Caravelas" },

  // ── Mucuri ──
  { nome: "Roberto Júnior", partido: "MDB", foto: null, cidade: "Mucuri" },
  { nome: "Dr. Hélio da Fisioterapia", partido: "PSD", foto: null, cidade: "Mucuri" },
  { nome: "Carlinhos da Ótica", partido: "PP", foto: null, cidade: "Mucuri" },
  { nome: "Willian Crisma", partido: "União Brasil", foto: null, cidade: "Mucuri" },
  { nome: "Fernando da Gazzinelli", partido: "PL", foto: null, cidade: "Mucuri" },
  { nome: "Dema", partido: "PSDB", foto: null, cidade: "Mucuri" },
  { nome: "Dodô", partido: "PDT", foto: null, cidade: "Mucuri" },
  { nome: "Diney Drinks", partido: "Republicanos", foto: null, cidade: "Mucuri" },

  // ── Prado ──
  { nome: "André Luiz das Neves", partido: "MDB", foto: null, cidade: "Prado" },
  { nome: "Plínio Marcos", partido: "PSD", foto: null, cidade: "Prado" },
  { nome: "Guilherme de Oliveira", partido: "PP", foto: null, cidade: "Prado" },
  { nome: "Lourival de Souza", partido: "União Brasil", foto: null, cidade: "Prado" },
  { nome: "Dilma Maria", partido: "PT", foto: null, cidade: "Prado" },
  { nome: "Fernando Antônio", partido: "PL", foto: null, cidade: "Prado" },
  { nome: "Jader Júnior", partido: "AVANTE", foto: null, cidade: "Prado" },
  { nome: "Delfim Geraldo", partido: "PSDB", foto: null, cidade: "Prado" },
  { nome: "Paulo Junior Jaques", partido: "PDT", foto: null, cidade: "Prado" },

  // ── Medeiros Neto ──
  { nome: "André de Tonhão", partido: "MDB", foto: null, cidade: "Medeiros Neto" },
  { nome: "Berguinho Fonseca", partido: "PSD", foto: null, cidade: "Medeiros Neto" },
  { nome: "Deó Lucas", partido: "PP", foto: null, cidade: "Medeiros Neto" },
  { nome: "Jhone da Caçamba", partido: "União Brasil", foto: null, cidade: "Medeiros Neto" },
  { nome: "Cristiano Alves 'Pintão'", partido: "PL", foto: null, cidade: "Medeiros Neto" },
  { nome: "Diran Cigano", partido: "PDT", foto: null, cidade: "Medeiros Neto" },
  { nome: "Igor Morais", partido: "AVANTE", foto: null, cidade: "Medeiros Neto" },
  { nome: "Ermisvaldo Rodrigues", partido: "PT", foto: null, cidade: "Medeiros Neto" },
  { nome: "Júnior Serapião", partido: "Republicanos", foto: null, cidade: "Medeiros Neto" },

  // ── Alcobaça ──
  { nome: "Adroabson Wagmaker", partido: "MDB", foto: null, cidade: "Alcobaça" },
  { nome: "Bruno de Souza", partido: "PSD", foto: null, cidade: "Alcobaça" },
  { nome: "Elis Regina", partido: "PP", foto: null, cidade: "Alcobaça" },
  { nome: "Erico Carlos", partido: "União Brasil", foto: null, cidade: "Alcobaça" },
  { nome: "Iziel Correia", partido: "PL", foto: null, cidade: "Alcobaça" },
  { nome: "Jesuel Santos", partido: "PDT", foto: null, cidade: "Alcobaça" },
  { nome: "Lucileide Costa", partido: "AVANTE", foto: null, cidade: "Alcobaça" },
  { nome: "Marcos Silva", partido: "PT", foto: null, cidade: "Alcobaça" },
  { nome: "Otoniel de Souza", partido: "Republicanos", foto: null, cidade: "Alcobaça" },
  { nome: "Pedro Samarony", partido: "PSDB", foto: null, cidade: "Alcobaça" },
  { nome: "Robério Lima", partido: "PRD", foto: null, cidade: "Alcobaça" },

  // ── Lajedão ──
  { nome: "Catia Sione", partido: "MDB", foto: null, cidade: "Lajedão" },
  { nome: "Emeterio Neto", partido: "PSD", foto: null, cidade: "Lajedão" },
  { nome: "Ivan Ribeiro", partido: "PP", foto: null, cidade: "Lajedão" },
  { nome: "José Marques", partido: "União Brasil", foto: null, cidade: "Lajedão" },
  { nome: "Jucelino Conceição", partido: "PL", foto: null, cidade: "Lajedão" },
  { nome: "Luis Pedro", partido: "PDT", foto: null, cidade: "Lajedão" },
  { nome: "Maisa Menezes", partido: "AVANTE", foto: null, cidade: "Lajedão" },
  { nome: "Marlon Soares", partido: "Republicanos", foto: null, cidade: "Lajedão" },
  { nome: "Rildo Dias", partido: "PT", foto: null, cidade: "Lajedão" },
];

const CATEGORIAS = [
  "Iluminação", "Saúde", "Infraestrutura", "Segurança", "Educação",
  "Saneamento", "Transporte", "Habitação", "Meio Ambiente",
];

const DESCRICOES: Record<string, string[]> = {
  "Iluminação": ["Poste queimado na rua principal", "Rua sem iluminação há 3 meses", "Lâmpada piscando na praça"],
  "Saúde": ["UBS sem médico há 2 semanas", "Falta de medicamentos na farmácia municipal", "Ambulância quebrada no posto"],
  "Infraestrutura": ["Buraco enorme na via principal", "Calçada destruída próximo à escola", "Ponte com risco de desabamento"],
  "Segurança": ["Ponto de tráfico próximo à escola", "Rua sem policiamento à noite", "Assaltos frequentes no bairro"],
  "Educação": ["Escola sem professor de matemática", "Telhado da creche com goteiras", "Falta de material escolar"],
  "Saneamento": ["Esgoto a céu aberto na rua", "Falta de água há 5 dias", "Bueiro entupido causando alagamento"],
  "Transporte": ["Ônibus não passa no bairro", "Ponto de ônibus sem cobertura", "Linha de ônibus cancelada"],
  "Habitação": ["Família em situação de rua", "Casa com risco de desabamento", "Área de invasão irregular"],
  "Meio Ambiente": ["Queimada próximo a residências", "Lixo acumulado no terreno baldio", "Poda de árvore urgente"],
};

const NOMES_ELEITORES = [
  "Maria Silva", "José Santos", "Ana Oliveira", "Carlos Souza", "Francisca Lima",
  "Antônio Pereira", "Juliana Costa", "Pedro Almeida", "Luciana Ferreira", "Paulo Rodrigues",
  "Mariana Nascimento", "Fernando Barbosa", "Camila Ribeiro", "Rafael Carvalho", "Patrícia Gomes",
  "Ricardo Martins", "Beatriz Araújo", "Marcos Vieira", "Lúcia Monteiro", "Gustavo Moreira",
  "Sandra Cardoso", "Anderson Dias", "Tatiana Mendes", "Roberto Nunes", "Cristiane Correia",
  "Sérgio Rocha", "Vanessa Pinto", "Diego Teixeira", "Aline Castro", "Leandro Machado",
  "Priscila Freitas", "Thiago Ramos", "Amanda Lopes", "Vinícius Moura", "Bianca Fonseca",
  "Eduardo Cunha", "Isabela Duarte", "Bruno Campos", "Natália Melo", "Henrique Nogueira",
];

const STATUS_OPTIONS = ["Pendente", "Em Andamento", "Resolvida", "Ofício Gerado"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomPhone(): string {
  return `(73) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}
function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString();
}
function randomBirthDate(): string {
  const year = 1960 + Math.floor(Math.random() * 40);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function makeEmail(nome: string, cidade: string): string {
  const slug = cidade.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const user = nome.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]/g, "");
  return `${user}@demo.${slug}.ba.gov.br`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: string[] = [];
    const cores = ["#1E40AF", "#DC2626", "#059669", "#D97706", "#7C3AED", "#DB2777", "#0891B2", "#EA580C", "#4F46E5"];

    // ── 1. Upsert municipios_foco ──
    for (const city of CITIES) {
      await admin.from("municipios_foco").upsert({
        nome: city.nome,
        estado: city.estado,
        latitude: city.lat,
        longitude: city.lng,
        zoom_ideal: city.zoom,
      } as any, { onConflict: "nome,estado" } as any);
    }
    results.push(`✅ ${CITIES.length} municípios upserted`);

    // ── 2. Create vereador auth users + profiles + roles ──
    const vereadorMap: Map<string, { userId: string; cidade: string }[]> = new Map();

    for (const v of VEREADORES) {
      const email = makeEmail(v.nome, v.cidade);

      const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = existingUsers?.users?.find((u: any) => u.email === email);

      let userId: string;
      if (existing) {
        userId = existing.id;
      } else {
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email,
          password: "Demo@2024!",
          email_confirm: true,
          user_metadata: { full_name: v.nome },
        });
        if (createErr) {
          results.push(`❌ ${v.nome}: ${createErr.message}`);
          continue;
        }
        userId = newUser.user.id;
      }

      // Track by city
      if (!vereadorMap.has(v.cidade)) vereadorMap.set(v.cidade, []);
      vereadorMap.get(v.cidade)!.push({ userId, cidade: v.cidade });

      // Update profile
      await admin.from("profiles").upsert({
        id: userId,
        full_name: v.nome,
        avatar_url: v.foto,
        estado_atuacao: "BA",
        gabinete_id: userId,
        is_active: true,
        first_login: false,
      }, { onConflict: "id" });

      // Set role to admin (L3)
      await admin.from("user_roles").upsert({
        user_id: userId,
        role: "admin",
        role_level: 3,
      }, { onConflict: "user_id,role" } as any);

      // Create gabinete_config with partido in nome_mandato
      await admin.from("gabinete_config").upsert({
        gabinete_id: userId,
        nome_mandato: `${v.nome} - ${v.partido}`,
        cor_primaria: randomItem(cores),
        cidade_estado: `${v.cidade} - BA`,
        foto_oficial_url: v.foto,
      }, { onConflict: "gabinete_id" });
    }
    results.push(`✅ ${VEREADORES.length} vereadores processados`);

    // ── 3. Create eleitores per city ──
    let totalEleitores = 0;
    for (const city of CITIES) {
      const cityVereadores = vereadorMap.get(city.nome) || [];
      if (cityVereadores.length === 0) continue;

      const qtdEleitores = city.nome === "Teixeira de Freitas" ? 40 : 20;

      for (let i = 0; i < qtdEleitores; i++) {
        const bairro = city.bairros[i % city.bairros.length];
        const ver = cityVereadores[i % cityVereadores.length];

        await admin.from("eleitores").insert({
          nome: `${randomItem(NOMES_ELEITORES)} ${i + 1}`,
          whatsapp: randomPhone(),
          bairro: bairro.nome,
          cidade: city.nome,
          estado: "BA",
          latitude: bairro.lat + (Math.random() - 0.5) * 0.005,
          longitude: bairro.lng + (Math.random() - 0.5) * 0.005,
          data_nascimento: randomBirthDate(),
          situacao: randomItem(["Novo Cadastro", "Atendido", "Líder Comunitário"]),
          is_leader: Math.random() > 0.85,
          gabinete_id: ver.userId,
          created_at: randomDate(90),
        });
        totalEleitores++;
      }
    }
    results.push(`✅ ${totalEleitores} eleitores criados`);

    // ── 4. Create demandas per city ──
    let totalDemandas = 0;
    for (const city of CITIES) {
      const cityVereadores = vereadorMap.get(city.nome) || [];
      if (cityVereadores.length === 0) continue;

      const qtdDemandas = city.nome === "Teixeira de Freitas" ? 30 : 15;

      for (let i = 0; i < qtdDemandas; i++) {
        const bairro = city.bairros[i % city.bairros.length];
        const categoria = randomItem(CATEGORIAS);
        const descricoes = DESCRICOES[categoria] || ["Demanda registrada"];
        const ver = cityVereadores[i % cityVereadores.length];

        await admin.from("demandas").insert({
          descricao: randomItem(descricoes),
          bairro: bairro.nome,
          categoria,
          status: randomItem(STATUS_OPTIONS),
          latitude: bairro.lat + (Math.random() - 0.5) * 0.004,
          longitude: bairro.lng + (Math.random() - 0.5) * 0.004,
          gabinete_id: ver.userId,
          created_at: randomDate(60),
        });
        totalDemandas++;
      }
    }
    results.push(`✅ ${totalDemandas} demandas criadas`);

    // ── 5. Global config ──
    await admin.from("global_config").update({ value: "Câmara Municipal - Extremo Sul da Bahia" }).eq("key", "nome_instituicao");
    await admin.from("global_config").update({ value: "Extremo Sul da Bahia" }).eq("key", "endereco_rodape_global");
    await admin.from("global_config").update({ value: "(73) 3011-5700" }).eq("key", "telefone_rodape_global");
    results.push("✅ Global config atualizado");

    // ── 6. Ensure Flávio stays L5 ──
    await admin.from("user_roles").upsert({
      user_id: "b7bdcf07-060a-49a1-88b5-0437abf64d95",
      role: "super_admin",
      role_level: 5,
    }, { onConflict: "user_id,role" } as any);
    results.push("✅ Flávio mantido como L5");

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
