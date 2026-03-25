import { supabase, Sugestao } from '../utils/supabase-client.js';
import { analyzeWithAI, isAIAvailable } from '../utils/ai-client.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.resolve(__dirname, '../reports');

async function fetchPendingSuggestions(): Promise<Sugestao[]> {
  const { data, error } = await supabase
    .from('sugestoes')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar sugestões:', error);
    return [];
  }

  return data || [];
}

async function analyzeSuggestion(sugestao: Sugestao): Promise<string> {
  const prompt = `
Você é um analista de produto do QG Digital, um CRM Eleitoral.

Analise esta sugestão de usuário e responda em formato estruturado:

**Sugestão:**
"${sugestao.conteudo}"

**Tipo:** ${sugestao.tipo}

---

Responda com:

## Viabilidade Técnica
(Sim/Não/Parcial) + explicação breve

## Esforço Estimado
(Baixo/Médio/Alto) + estimativa em horas

## Prioridade Sugerida
(1-5) + justificativa

## Arquivos Provavelmente Afetados
- Liste os arquivos que seriam modificados

## Recomendação
(Aprovar/Rejeitar/Mais informações) + justificativa

## Esboço de Implementação
Se aprovar, descreva brevemente os passos de implementação.
`;

  return analyzeWithAI(prompt);
}

async function updateSuggestionStatus(
  id: string, 
  status: string, 
  analise: string
): Promise<void> {
  const { error } = await supabase
    .from('sugestoes')
    .update({ 
      status, 
      analise_ia: analise,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar sugestão:', error);
  }
}

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('💡 INICIANDO ANÁLISE DE SUGESTÕES');
  console.log('='.repeat(50) + '\n');

  if (!isAIAvailable()) {
    console.warn('⚠️ API de IA não configurada. Análise limitada.\n');
  }

  const sugestoes = await fetchPendingSuggestions();
  console.log(`📋 ${sugestoes.length} sugestões pendentes encontradas\n`);

  if (sugestoes.length === 0) {
    console.log('✅ Nenhuma sugestão pendente para analisar.');
    return;
  }

  let report = `# 💡 Análise de Sugestões\n\n**Data:** ${new Date().toLocaleString('pt-BR')}\n\n---\n\n`;

  for (const sugestao of sugestoes) {
    console.log(`🔍 Analisando sugestão #${sugestao.id.slice(0, 8)}...`);
    
    const analise = isAIAvailable() 
      ? await analyzeSuggestion(sugestao)
      : 'Análise de IA não disponível';
    
    // Atualizar status no banco
    await updateSuggestionStatus(sugestao.id, 'analisando', analise);

    report += `## Sugestão #${sugestao.id.slice(0, 8)}\n\n`;
    report += `**Conteúdo:** "${sugestao.conteudo}"\n\n`;
    report += `**Tipo:** ${sugestao.tipo}\n\n`;
    report += `### Análise\n\n${analise}\n\n---\n\n`;
  }

  // Salvar relatório
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORT_DIR, `suggestions-${Date.now()}.md`);
  fs.writeFileSync(reportPath, report);

  console.log(`\n✅ Análise concluída! Relatório: ${reportPath}\n`);
}

main();
