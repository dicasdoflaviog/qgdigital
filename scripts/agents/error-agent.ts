import { supabase, LogErro } from '../utils/supabase-client.js';
import { analyzeWithAI, isAIAvailable } from '../utils/ai-client.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.resolve(__dirname, '../reports');

async function fetchRecentErrors(): Promise<LogErro[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('logs_erro')
    .select('*')
    .gte('created_at', oneDayAgo)
    .in('status', ['novo', 'analisando'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar logs:', error);
    return [];
  }

  return data || [];
}

function groupErrors(errors: LogErro[]): Map<string, LogErro[]> {
  const groups = new Map<string, LogErro[]>();

  errors.forEach(error => {
    // Agrupar por mensagem de erro (primeiras 100 chars)
    const key = error.mensagem.slice(0, 100);
    const existing = groups.get(key) || [];
    existing.push(error);
    groups.set(key, existing);
  });

  return groups;
}

async function analyzeError(errors: LogErro[]): Promise<string> {
  const sample = errors[0];
  
  const prompt = `
Você é um desenvolvedor senior analisando erros do QG Digital (React + Supabase).

**Erro:**
${sample.mensagem}

**Stack trace:**
${sample.stack_trace || 'Não disponível'}

**Arquivo:** ${sample.arquivo || 'Não identificado'}
**Linha:** ${sample.linha || 'N/A'}
**URL:** ${sample.url || 'N/A'}
**Ocorrências:** ${errors.length}

---

Responda com:

## Causa Provável
Explique a causa raiz do erro.

## Severidade
(Crítico/Alto/Médio/Baixo)

## Fix Sugerido
Código ou passos para corrigir.

## Arquivos a Modificar
Liste os arquivos que precisam ser alterados.

## Pode ser corrigido automaticamente?
(Sim/Não) + explicação
`;

  return analyzeWithAI(prompt);
}

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('🐛 INICIANDO ANÁLISE DE ERROS');
  console.log('='.repeat(50) + '\n');

  const errors = await fetchRecentErrors();
  console.log(`📋 ${errors.length} erros encontrados nas últimas 24h\n`);

  if (errors.length === 0) {
    console.log('✅ Nenhum erro recente para analisar.');
    return;
  }

  const grouped = groupErrors(errors);
  console.log(`📊 ${grouped.size} tipos únicos de erro\n`);

  let report = `# 🐛 Análise de Erros\n\n**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`;
  report += `**Total de erros:** ${errors.length}\n`;
  report += `**Tipos únicos:** ${grouped.size}\n\n---\n\n`;

  let idx = 1;
  for (const [key, errorGroup] of grouped) {
    console.log(`🔍 Analisando erro tipo ${idx}/${grouped.size}...`);
    
    const analise = isAIAvailable() 
      ? await analyzeError(errorGroup)
      : 'Análise de IA não disponível';

    report += `## Erro ${idx}: ${key.slice(0, 50)}...\n\n`;
    report += `**Ocorrências:** ${errorGroup.length}\n\n`;
    report += `### Análise\n\n${analise}\n\n---\n\n`;
    
    idx++;
  }

  // Salvar relatório
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORT_DIR, `errors-${Date.now()}.md`);
  fs.writeFileSync(reportPath, report);

  console.log(`\n✅ Análise concluída! Relatório: ${reportPath}\n`);
}

main();
