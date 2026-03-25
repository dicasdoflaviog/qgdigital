# PRD - Agente de QA e Melhoria Contínua

> **Data:** 2026-03-22
> **Projeto:** QG Digital - CRM Eleitoral
> **Tipo:** Automação / DevOps / QA
> **Prioridade:** Alta

---

## 1. VISÃO GERAL

Criar um sistema de agente inteligente que:

1. **Audita o código** automaticamente
2. **Lê sugestões de usuários** do banco e analisa viabilidade
3. **Lê logs de erro** e corrige automaticamente quando possível
4. **Gera relatórios** de saúde do sistema

---

## 2. COMPONENTES DO SISTEMA

### 2.1 Agente de Auditoria (Code Audit)

**Função:** Varrer o código e identificar problemas

**O que detecta:**
- Funções vazias ou com TODO/FIXME
- Botões sem onClick
- Formulários sem onSubmit
- Console.log de debug
- Imports não utilizados
- Rotas órfãs (páginas não acessíveis)
- Componentes não utilizados
- Erros de TypeScript
- Código duplicado

**Output:** Relatório em Markdown ou JSON

---

### 2.2 Agente de Sugestões (Feature Agent)

**Função:** Ler sugestões dos usuários e analisar

**Fonte de dados:** Tabela `sugestoes` no Supabase

**Fluxo:**
1. Busca sugestões com status "pendente"
2. Analisa cada sugestão:
   - É viável tecnicamente?
   - Já existe algo similar no código?
   - Qual o esforço estimado?
   - Qual a prioridade sugerida?
3. Gera PRD + SPEC se aprovado
4. Pode implementar automaticamente (com flag)

**Output:** Lista de sugestões analisadas com recomendação

---

### 2.3 Agente de Erros (Error Fixer)

**Função:** Ler logs de erro e corrigir automaticamente

**Fonte de dados:** 
- Tabela `logs_erro` no Supabase
- Console de erros do browser (se capturado)
- Logs do servidor

**Fluxo:**
1. Busca erros recentes (últimas 24h)
2. Agrupa por tipo/frequência
3. Analisa causa raiz
4. Gera fix automático se possível
5. Aplica fix em branch separada (segurança)

**Output:** Lista de erros com status de correção

---

### 2.4 Dashboard de Saúde (Health Dashboard)

**Função:** Visualização do estado do sistema

**Métricas:**
- % de telas funcionais
- Número de erros nas últimas 24h
- Sugestões pendentes
- Cobertura de testes (se houver)
- Performance (se monitorado)

---

## 3. ESTRUTURA DE DADOS

### 3.1 Tabela: sugestoes (já existe)
```sql
CREATE TABLE sugestoes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  gabinete_id UUID REFERENCES gabinetes(id),
  conteudo TEXT,
  tipo VARCHAR(50), -- 'feature', 'bug', 'melhoria'
  status VARCHAR(50), -- 'pendente', 'analisando', 'aprovado', 'rejeitado', 'implementado'
  prioridade INTEGER, -- 1-5
  analise_ia TEXT, -- Análise do agente
  spec_gerada TEXT, -- SPEC se aprovado
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3.2 Tabela: logs_erro (criar se não existir)
```sql
CREATE TABLE logs_erro (
  id UUID PRIMARY KEY,
  tipo VARCHAR(100), -- 'frontend', 'backend', 'api', 'database'
  mensagem TEXT,
  stack_trace TEXT,
  arquivo VARCHAR(255),
  linha INTEGER,
  user_id UUID,
  gabinete_id UUID,
  url VARCHAR(500),
  metadata JSONB, -- dados extras
  status VARCHAR(50), -- 'novo', 'analisando', 'corrigido', 'ignorado'
  correcao_aplicada TEXT, -- descrição do fix
  created_at TIMESTAMP
);
```

### 3.3 Tabela: auditorias (criar)
```sql
CREATE TABLE auditorias (
  id UUID PRIMARY KEY,
  tipo VARCHAR(50), -- 'code', 'ui', 'performance', 'security'
  resultado JSONB, -- relatório completo
  problemas_criticos INTEGER,
  problemas_importantes INTEGER,
  problemas_menores INTEGER,
  created_at TIMESTAMP
);
```

---

## 4. SCRIPTS DO AGENTE

### 4.1 Estrutura de arquivos
```
scripts/
├── agents/
│   ├── audit-agent.ts        # Agente de auditoria
│   ├── suggestion-agent.ts   # Agente de sugestões
│   ├── error-agent.ts        # Agente de erros
│   └── health-dashboard.ts   # Gerador de dashboard
├── utils/
│   ├── code-analyzer.ts      # Analisador de código
│   ├── supabase-client.ts    # Cliente Supabase
│   └── ai-client.ts          # Cliente para IA (Claude API)
├── reports/
│   └── [gerados automaticamente]
└── package.json
```

### 4.2 Comandos NPM
```json
{
  "scripts": {
    "agent:audit": "ts-node scripts/agents/audit-agent.ts",
    "agent:suggestions": "ts-node scripts/agents/suggestion-agent.ts",
    "agent:errors": "ts-node scripts/agents/error-agent.ts",
    "agent:all": "npm run agent:audit && npm run agent:suggestions && npm run agent:errors",
    "agent:dashboard": "ts-node scripts/agents/health-dashboard.ts"
  }
}
```

---

## 5. FLUXO DE EXECUÇÃO

### 5.1 Execução Manual
```bash
# Rodar auditoria completa
npm run agent:all

# Rodar apenas auditoria de código
npm run agent:audit

# Analisar sugestões pendentes
npm run agent:suggestions

# Corrigir erros automaticamente
npm run agent:errors --auto-fix
```

### 5.2 Execução Automática (CI/CD)
```yaml
# .github/workflows/agent.yml
name: QA Agent
on:
  schedule:
    - cron: '0 6 * * *'  # Roda todo dia às 6h
  workflow_dispatch:  # Permite rodar manualmente

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run agent:all
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: audit-report
          path: scripts/reports/
```

---

## 6. INTEGRAÇÃO COM CLAUDE API

Para análise inteligente, usar a API do Claude:

```typescript
// scripts/utils/ai-client.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeWithAI(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  
  return response.content[0].text;
}
```

---

## 7. EXEMPLO DE OUTPUT

### 7.1 Relatório de Auditoria
```markdown
# Auditoria QG Digital - 2026-03-22

## Resumo
- 🔴 Críticos: 3
- 🟡 Importantes: 8
- 🟢 Menores: 15

## Problemas Críticos

### 1. Formulário sem submit - NovoEleitor.tsx
- **Arquivo:** src/components/NovoEleitor.tsx:45
- **Problema:** onSubmit está vazio
- **Fix sugerido:** Implementar salvamento no Supabase

### 2. Rota órfã - Relatorios.tsx
- **Arquivo:** src/pages/Relatorios.tsx
- **Problema:** Página existe mas não está no menu
- **Fix sugerido:** Adicionar ao menu ou remover arquivo

...
```

### 7.2 Análise de Sugestão
```markdown
# Análise de Sugestão #42

**Usuário:** João Silva (Assessor)
**Sugestão:** "Queria poder filtrar eleitores por aniversariante do mês"

## Análise

✅ **Viável tecnicamente:** Sim
- Campo `data_nascimento` já existe na tabela `eleitores`
- Filtro pode ser adicionado na página de Eleitores

📊 **Esforço estimado:** Baixo (2-4 horas)

🎯 **Prioridade sugerida:** Média
- Funcionalidade útil para engajamento
- Não é crítica para operação

## SPEC Gerada

[Link para SPEC-filtro-aniversariantes.md]
```

---

## 8. SEGURANÇA

### 8.1 Regras de auto-fix
- **NUNCA** aplicar fix diretamente na main
- **SEMPRE** criar branch separada
- **SEMPRE** gerar PR para revisão humana
- **NUNCA** modificar dados de produção
- **SEMPRE** fazer backup antes de migrations

### 8.2 Permissões
- Agente tem acesso READ ao banco de produção
- Agente tem acesso WRITE apenas em branch de desenvolvimento
- Logs sensíveis são sanitizados antes de análise

---

## 9. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar estrutura de pastas scripts/agents/
- [ ] Implementar audit-agent.ts
- [ ] Implementar suggestion-agent.ts
- [ ] Implementar error-agent.ts
- [ ] Criar tabela logs_erro no Supabase
- [ ] Criar tabela auditorias no Supabase
- [ ] Adicionar colunas analise_ia e spec_gerada em sugestoes
- [ ] Configurar variáveis de ambiente (ANTHROPIC_API_KEY)
- [ ] Criar workflow GitHub Actions
- [ ] Testar execução manual
- [ ] Documentar uso

---

*PRD gerado para implementação do Agente de QA e Melhoria Contínua*
