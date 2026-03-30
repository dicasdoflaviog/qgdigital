export interface GabineteConfig {
  id: string;
  gabinete_id: string;
  logo_url: string | null;
  foto_oficial_url: string | null;
  cor_primaria: string;
  nome_mandato: string;
  cidade_estado: string;
  endereco_sede: string | null;
  telefone_contato: string | null;
  voice_clone_id: string | null;
  voice_sample_url: string | null;
  voice_provider: string | null;
  voice_configured_at: string | null;
  ia_nome?: string | null;
}

export function extractVereadorNome(nome_mandato: string): string {
  if (!nome_mandato) return "Vereador";
  const separators = [" – ", " - ", " — "];
  for (const sep of separators) {
    const idx = nome_mandato.indexOf(sep);
    if (idx !== -1) return nome_mandato.slice(0, idx).trim();
  }
  return nome_mandato.trim();
}

export function extractPartido(nome_mandato: string): string {
  if (!nome_mandato) return "";
  const separators = [" – ", " - ", " — "];
  for (const sep of separators) {
    const idx = nome_mandato.indexOf(sep);
    if (idx !== -1) return nome_mandato.slice(idx + sep.length).trim();
  }
  return "";
}

export function extractCidade(cidade_estado: string): string {
  if (!cidade_estado) return "";
  const separators = [" – ", " - ", " — ", ", "];
  for (const sep of separators) {
    const idx = cidade_estado.indexOf(sep);
    if (idx !== -1) return cidade_estado.slice(0, idx).trim();
  }
  return cidade_estado.trim();
}
