/**
 * Auto-categorize a demanda description using keyword matching.
 * Returns the best matching category or "Outros".
 */

const KEYWORD_MAP: Record<string, string[]> = {
  "Saúde": ["médico", "medico", "hospital", "posto de saúde", "ubs", "saúde", "saude", "remédio", "remedio", "ambulância", "ambulancia", "dentista", "cirurgia", "exame", "doença", "doente", "enfermeiro", "clínica", "clinica"],
  "Infraestrutura": ["asfalto", "buraco", "rua", "calçada", "calcada", "esgoto", "pavimentação", "pavimentacao", "obra", "ponte", "muro", "construção", "construcao", "estrada", "cratera"],
  "Segurança": ["segurança", "seguranca", "policia", "polícia", "assalto", "roubo", "violência", "violencia", "crime", "droga", "tráfico", "trafico", "câmera", "camera"],
  "Educação": ["escola", "educação", "educacao", "creche", "professor", "matrícula", "matricula", "ensino", "aluno", "vaga", "universidade", "faculdade"],
  "Iluminação": ["iluminação", "iluminacao", "poste", "luz", "lâmpada", "lampada", "escuro", "energia", "apagão", "apagao"],
};

export function categorizeDemanda(texto: string): string {
  if (!texto) return "Outros";
  const lower = texto.toLowerCase();

  let bestCategory = "Outros";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}
