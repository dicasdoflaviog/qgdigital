# 🚀 QG Digital Agents - Quick Start Guide

## 3 Passos para ficar pronto

### 1️⃣ Credenciais (JÁ FEITO ✅)
```bash
.env
├─ SUPABASE_SERVICE_KEY ✅
├─ ANTHROPIC_API_KEY ✅
└─ SUPABASE_URL ✅
```

### 2️⃣ SQL Migration (FAÇA AGORA)
```
1. https://app.supabase.com/projects
2. SQL Editor → New Query
3. Cole o SQL em: scripts/MIGRATION-MANUAL.md
4. Clique "RUN"
```

### 3️⃣ Rodar Audit Agent (DEPOIS)
```bash
node scripts/run-audit.mjs
# Output: ✅ Audit report saved to Supabase
```

---

## Comandos Rápidos

### Rodar Auditoria
```bash
node scripts/run-audit.mjs
```

### Ver Relatório (JSON)
```bash
cat scripts/reports/audit-*.json
```

### Ver Relatório (Markdown)
```bash
cat scripts/reports/audit-*.md
```

### Demo (sem credenciais)
```bash
node scripts/test-agents.mjs
```

---

## Estrutura

```
scripts/
├── run-audit.mjs           ← Executor principal
├── MIGRATION-MANUAL.md     ← SQL para Supabase
├── AGENTS-REPORT.md        ← Documentação completa
├── agents/
│   ├── audit-agent.ts      (TypeScript - ts-node)
│   ├── suggestion-agent.ts
│   └── error-agent.ts
├── utils/
│   ├── supabase-client.ts
│   ├── ai-client.ts
│   └── code-analyzer.ts
└── reports/
    ├── audit-2026-03-25.json
    └── audit-2026-03-25.md
```

---

## Resultados da 1ª Auditoria

```
📊 Audit Results
├─ Files scanned: 182
├─ Critical: 0 ✅
├─ Important: 133
│  ├─ type 'any' (69)
│  └─ console.log (64)
├─ Minor: 18
│  └─ Large files (>400 lines)
└─ Secrets found: 0 ✅
```

---

## Próximas Fases

- [ ] Execute migration SQL no Supabase
- [ ] Rodar `node scripts/run-audit.mjs` após migration
- [ ] Implementar Suggestion Agent
- [ ] Implementar Error Agent
- [ ] Dashboard UI

---

## Referências

- **Full Docs**: `scripts/AGENTS-REPORT.md`
- **Migration Guide**: `scripts/MIGRATION-MANUAL.md`
- **This File**: `scripts/QUICK-START.md`

