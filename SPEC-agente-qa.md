# SPEC - Agente de QA e Melhoria Contínua

> **Baseado em:** PRD-agente-qa.md
> **Método:** SDD (Spec-Driven Development)

---

## TAREFA 1: Criar estrutura de pastas

### 1.1 Criar diretórios
```bash
mkdir -p scripts/agents
mkdir -p scripts/utils
mkdir -p scripts/reports
```

### 1.2 Criar package.json para scripts
```
ARQUIVO: scripts/package.json
```

```json
{
  "name": "qg-digital-agents",
  "version": "1.0.0",
  "scripts": {
    "audit": "npx ts-node agents/audit-agent.ts",
    "suggestions": "npx ts-node agents/suggestion-agent.ts",
    "errors": "npx ts-node agents/error-agent.ts",
    "all": "npm run audit && npm run suggestions && npm run errors",
    "dashboard": "npx ts-node agents/health-dashboard.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@supabase/supabase-js": "^2.39.0",
    "glob": "^10.3.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0"
  }
}
```

---

## TAREFA 2: Criar utilitários base

### 2.1 Cliente Supabase
```
ARQUIVO: scripts/utils/supabase-client.ts
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found in environment');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos
export interface Sugestao {
  id: string;
  user_id: string;
  gabinete_id: string;
  conteudo: string;
  tipo: 'feature' | 'bug' | 'melhoria';
  status: 'pendente' | 'analisando' | 'aprovado' | 'rejeitado' | 'implementado';
  prioridade: number;
  analise_ia?: string;
  spec_gerada?: string;
  created_at: string;
}

export interface LogErro {
  id: string;
  tipo: 'frontend' | 'backend' | 'api' | 'database';
  mensagem: string;
  stack_trace?: string;
  arquivo?: string;
  linha?: number;
  user_id?: string;
  url?: string;
  status: 'novo' | 'analisando' | 'corrigido' | 'ignorado';
  created_at: string;
}
```

### 2.2 Cliente AI (Claude)
```
ARQUIVO: scripts/utils/ai-client.ts
```

```typescript
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

if (apiKey) {
  client = new Anthropic({ apiKey });
}

export async function analyzeWithAI(prompt: string): Promise<string> {
  if (!client) {
    console.warn('⚠️ ANTHROPIC_API_KEY não configurada. Pulando análise de IA.');
    return 'Análise de IA não disponível (API key não configurada)';
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock ? textBlock.text : 'Sem resposta';
  } catch (error) {
    console.error('Erro na API Claude:', error);
    return `Erro na análise: ${error}`;
  }
}

export function isAIAvailable(): boolean {
  return client !== null;
}
```

### 2.3 Analisador de código
```
ARQUIVO: scripts/utils/code-analyzer.ts
```

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface CodeIssue {
  tipo: 'critico' | 'importante' | 'menor';
  categoria: string;
  arquivo: string;
  linha?: number;
  descricao: string;
  codigo?: string;
  sugestao?: string;
}

export async function findFiles(pattern: string, baseDir: string = 'src'): Promise<string[]> {
  return glob(pattern, { cwd: baseDir, absolute: true });
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function findInFile(content: string, patterns: RegExp[]): { line: number; match: string }[] {
  const lines = content.split('\n');
  const results: { line: number; match: string }[] = [];

  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      if (pattern.test(line)) {
        results.push({ line: index + 1, match: line.trim() });
      }
    });
  });

  return results;
}

// Detectores específicos
export function findEmptyFunctions(content: string): { line: number; match: string }[] {
  return findInFile(content, [
    /=>\s*\{\s*\}/,                    // () => {}
    /function\s*\([^)]*\)\s*\{\s*\}/,  // function() {}
    /\(\)\s*\{\s*\/\/\s*TODO/i,        // () { // TODO
    /\(\)\s*\{\s*\/\/\s*FIXME/i,       // () { // FIXME
  ]);
}

export function findConsoleLog(content: string): { line: number; match: string }[] {
  return findInFile(content, [
    /console\.(log|debug|info)\(/,
  ]);
}

export function findEmptyOnClick(content: string): { line: number; match: string }[] {
  return findInFile(content, [
    /onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/,  // onClick={() => {}}
    /onClick=\{\s*undefined\s*\}/,             // onClick={undefined}
    /onClick=\{\s*null\s*\}/,                  // onClick={null}
  ]);
}

export function findTODOs(content: string): { line: number; match: string }[] {
  return findInFile(content, [
    /\/\/\s*TODO/i,
    /\/\/\s*FIXME/i,
    /\/\/\s*HACK/i,
    /\/\*\s*TODO/i,
  ]);
}

export function findCapsLock(content: string): { line: number; match: string }[] {
  return findInFile(content, [
    /className="[^"]*uppercase[^"]*"/,
    />[A-Z]{3,}<\//,  // >TEXTO< (3+ letras maiúsculas)
  ]);
}
```

---

## TAREFA 3: Criar Agente de Auditoria

```
ARQUIVO: scripts/agents/audit-agent.ts
```

```typescript
import * as fs from 'fs';
import * as path from 'path';
import {
  findFiles,
  readFile,
  findEmptyFunctions,
  findConsoleLog,
  findEmptyOnClick,
  findTODOs,
  findCapsLock,
  CodeIssue,
} from '../utils/code-analyzer';

const SRC_DIR = path.resolve(__dirname, '../../src');
const REPORT_DIR = path.resolve(__dirname, '../reports');

interface AuditReport {
  timestamp: string;
  summary: {
    criticos: number;
    importantes: number;
    menores: number;
    total: number;
  };
  issues: CodeIssue[];
}

async function auditCode(): Promise<AuditReport> {
  console.log('🔍 Iniciando auditoria de código...\n');
  
  const issues: CodeIssue[] = [];
  
  // Buscar arquivos TypeScript/TSX
  const files = await findFiles('**/*.{ts,tsx}', SRC_DIR);
  console.log(`📁 ${files.length} arquivos encontrados\n`);

  for (const file of files) {
    const relativePath = path.relative(SRC_DIR, file);
    const content = readFile(file);

    // 1. Funções vazias
    const emptyFuncs = findEmptyFunctions(content);
    emptyFuncs.forEach(({ line, match }) => {
      issues.push({
        tipo: 'importante',
        categoria: 'Função vazia',
        arquivo: relativePath,
        linha: line,
        descricao: 'Função vazia ou com TODO/FIXME',
        codigo: match,
        sugestao: 'Implementar lógica ou remover',
      });
    });

    // 2. Console.log
    const consoleLogs = findConsoleLog(content);
    consoleLogs.forEach(({ line, match }) => {
      issues.push({
        tipo: 'menor',
        categoria: 'Debug',
        arquivo: relativePath,
        linha: line,
        descricao: 'Console.log de debug esquecido',
        codigo: match,
        sugestao: 'Remover antes de produção',
      });
    });

    // 3. onClick vazio
    const emptyClicks = findEmptyOnClick(content);
    emptyClicks.forEach(({ line, match }) => {
      issues.push({
        tipo: 'critico',
        categoria: 'Interação quebrada',
        arquivo: relativePath,
        linha: line,
        descricao: 'Botão sem ação (onClick vazio)',
        codigo: match,
        sugestao: 'Implementar handler de click',
      });
    });

    // 4. TODOs
    const todos = findTODOs(content);
    todos.forEach(({ line, match }) => {
      issues.push({
        tipo: 'importante',
        categoria: 'TODO pendente',
        arquivo: relativePath,
        linha: line,
        descricao: 'Código marcado como TODO/FIXME',
        codigo: match,
        sugestao: 'Resolver ou criar issue',
      });
    });

    // 5. CAPS LOCK (violação do design system)
    const capsLocks = findCapsLock(content);
    capsLocks.forEach(({ line, match }) => {
      issues.push({
        tipo: 'menor',
        categoria: 'Design System',
        arquivo: relativePath,
        linha: line,
        descricao: 'Texto em CAPS LOCK (violar design system)',
        codigo: match,
        sugestao: 'Usar sentence case',
      });
    });
  }

  // Gerar relatório
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    summary: {
      criticos: issues.filter(i => i.tipo === 'critico').length,
      importantes: issues.filter(i => i.tipo === 'importante').length,
      menores: issues.filter(i => i.tipo === 'menor').length,
      total: issues.length,
    },
    issues,
  };

  return report;
}

function generateMarkdownReport(report: AuditReport): string {
  const { summary, issues, timestamp } = report;
  
  let md = `# 🔍 Auditoria QG Digital

**Data:** ${new Date(timestamp).toLocaleString('pt-BR')}

## Resumo

| Prioridade | Quantidade |
|------------|------------|
| 🔴 Críticos | ${summary.criticos} |
| 🟡 Importantes | ${summary.importantes} |
| 🟢 Menores | ${summary.menores} |
| **Total** | **${summary.total}** |

---

`;

  // Agrupar por prioridade
  const criticos = issues.filter(i => i.tipo === 'critico');
  const importantes = issues.filter(i => i.tipo === 'importante');
  const menores = issues.filter(i => i.tipo === 'menor');

  if (criticos.length > 0) {
    md += `## 🔴 Problemas Críticos\n\n`;
    criticos.forEach((issue, idx) => {
      md += `### ${idx + 1}. ${issue.categoria} - ${issue.arquivo}\n`;
      md += `- **Linha:** ${issue.linha || 'N/A'}\n`;
      md += `- **Problema:** ${issue.descricao}\n`;
      if (issue.codigo) md += `- **Código:** \`${issue.codigo}\`\n`;
      md += `- **Sugestão:** ${issue.sugestao}\n\n`;
    });
  }

  if (importantes.length > 0) {
    md += `## 🟡 Problemas Importantes\n\n`;
    importantes.forEach((issue, idx) => {
      md += `### ${idx + 1}. ${issue.categoria} - ${issue.arquivo}\n`;
      md += `- **Linha:** ${issue.linha || 'N/A'}\n`;
      md += `- **Problema:** ${issue.descricao}\n`;
      if (issue.codigo) md += `- **Código:** \`${issue.codigo}\`\n`;
      md += `- **Sugestão:** ${issue.sugestao}\n\n`;
    });
  }

  if (menores.length > 0) {
    md += `## 🟢 Problemas Menores\n\n`;
    menores.forEach((issue, idx) => {
      md += `${idx + 1}. **${issue.arquivo}:${issue.linha}** - ${issue.descricao}\n`;
    });
  }

  return md;
}

async function main() {
  try {
    const report = await auditCode();
    
    // Criar diretório de reports se não existir
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    // Salvar JSON
    const jsonPath = path.join(REPORT_DIR, `audit-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Salvar Markdown
    const mdPath = path.join(REPORT_DIR, `audit-${Date.now()}.md`);
    const markdown = generateMarkdownReport(report);
    fs.writeFileSync(mdPath, markdown);

    // Exibir resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DA AUDITORIA');
    console.log('='.repeat(50));
    console.log(`🔴 Críticos: ${report.summary.criticos}`);
    console.log(`🟡 Importantes: ${report.summary.importantes}`);
    console.log(`🟢 Menores: ${report.summary.menores}`);
    console.log(`📁 Total: ${report.summary.total}`);
    console.log('='.repeat(50));
    console.log(`\n✅ Relatório salvo em:\n   ${mdPath}\n`);

  } catch (error) {
    console.error('❌ Erro na auditoria:', error);
    process.exit(1);
  }
}

main();
```

---

## TAREFA 4: Criar Agente de Sugestões

```
ARQUIVO: scripts/agents/suggestion-agent.ts
```

```typescript
import { supabase, Sugestao } from '../utils/supabase-client';
import { analyzeWithAI, isAIAvailable } from '../utils/ai-client';
import * as fs from 'fs';
import * as path from 'path';

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
  console.log('💡 Iniciando análise de sugestões...\n');

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
    
    const analise = await analyzeSuggestion(sugestao);
    
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
```

---

## TAREFA 5: Criar Agente de Erros

```
ARQUIVO: scripts/agents/error-agent.ts
```

```typescript
import { supabase, LogErro } from '../utils/supabase-client';
import { analyzeWithAI, isAIAvailable } from '../utils/ai-client';
import * as fs from 'fs';
import * as path from 'path';

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
  console.log('🐛 Iniciando análise de erros...\n');

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
```

---

## TAREFA 6: Criar migrations do Supabase

```
ARQUIVO: supabase/migrations/20260322_agent_tables.sql
```

```sql
-- Adicionar colunas na tabela sugestoes (se já existir)
ALTER TABLE sugestoes 
ADD COLUMN IF NOT EXISTS analise_ia TEXT,
ADD COLUMN IF NOT EXISTS spec_gerada TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Criar tabela de logs de erro
CREATE TABLE IF NOT EXISTS logs_erro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(100) DEFAULT 'frontend',
  mensagem TEXT NOT NULL,
  stack_trace TEXT,
  arquivo VARCHAR(255),
  linha INTEGER,
  user_id UUID REFERENCES auth.users(id),
  gabinete_id UUID,
  url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'novo',
  correcao_aplicada TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de auditorias
CREATE TABLE IF NOT EXISTS auditorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL,
  resultado JSONB NOT NULL,
  problemas_criticos INTEGER DEFAULT 0,
  problemas_importantes INTEGER DEFAULT 0,
  problemas_menores INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_logs_erro_status ON logs_erro(status);
CREATE INDEX IF NOT EXISTS idx_logs_erro_created ON logs_erro(created_at);
CREATE INDEX IF NOT EXISTS idx_sugestoes_status ON sugestoes(status);

-- RLS
ALTER TABLE logs_erro ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditorias ENABLE ROW LEVEL SECURITY;

-- Policies (apenas service role pode acessar)
CREATE POLICY "Service role full access logs" ON logs_erro
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access auditorias" ON auditorias
  FOR ALL USING (auth.role() = 'service_role');
```

---

## TAREFA 7: Adicionar captura de erros no frontend

```
ARQUIVO: src/utils/error-logger.ts
```

```typescript
import { supabase } from '@/lib/supabase';

interface ErrorLog {
  tipo: 'frontend' | 'api' | 'database';
  mensagem: string;
  stack_trace?: string;
  arquivo?: string;
  linha?: number;
  url?: string;
  metadata?: Record<string, any>;
}

export async function logError(error: Error | ErrorLog, context?: Record<string, any>) {
  try {
    const errorData: ErrorLog = error instanceof Error 
      ? {
          tipo: 'frontend',
          mensagem: error.message,
          stack_trace: error.stack,
          url: window.location.href,
          metadata: context,
        }
      : error;

    // Extrair arquivo e linha do stack trace
    if (errorData.stack_trace) {
      const match = errorData.stack_trace.match(/at\s+.*?\s+\(?(.*?):(\d+):\d+\)?/);
      if (match) {
        errorData.arquivo = match[1];
        errorData.linha = parseInt(match[2]);
      }
    }

    await supabase.from('logs_erro').insert({
      ...errorData,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });
  } catch (e) {
    // Fallback silencioso - não quebrar o app por erro de logging
    console.error('Erro ao logar erro:', e);
  }
}

// Capturar erros globais
if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    logError({
      tipo: 'frontend',
      mensagem: String(message),
      stack_trace: error?.stack,
      arquivo: source || undefined,
      linha: lineno,
      url: window.location.href,
    });
  };

  window.onunhandledrejection = (event) => {
    logError({
      tipo: 'frontend',
      mensagem: `Unhandled Promise Rejection: ${event.reason}`,
      stack_trace: event.reason?.stack,
      url: window.location.href,
    });
  };
}
```

---

## ORDEM DE IMPLEMENTAÇÃO

1. ✅ TAREFA 1 - Estrutura de pastas
2. ✅ TAREFA 2 - Utilitários base
3. ✅ TAREFA 6 - Migrations Supabase
4. ✅ TAREFA 7 - Error logger no frontend
5. ✅ TAREFA 3 - Agente de auditoria
6. ✅ TAREFA 4 - Agente de sugestões
7. ✅ TAREFA 5 - Agente de erros

---

## COMO USAR

```bash
# Instalar dependências
cd scripts && npm install

# Configurar variáveis de ambiente
export SUPABASE_URL="..."
export SUPABASE_SERVICE_KEY="..."
export ANTHROPIC_API_KEY="..."  # Opcional

# Rodar auditoria de código
npm run audit

# Analisar sugestões pendentes
npm run suggestions

# Analisar erros recentes
npm run errors

# Rodar tudo
npm run all
```

---

*SPEC gerada para Agente de QA e Melhoria Contínua*
