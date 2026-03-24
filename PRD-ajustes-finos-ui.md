# PRD - Ajustes Finos UI/UX Mobile

> **Data:** 2026-03-22
> **Contexto:** QG Digital - CRM Eleitoral
> **Prioridade:** Alta
> **Tipo:** Polimento de interface

---

## 1. PROBLEMAS IDENTIFICADOS

### 1.1 Textos em CAPS LOCK (ainda restam)

| Tela | Elemento | Texto Atual | Correção |
|------|----------|-------------|----------|
| Gestão de Base | CardTitle | "FILTROS DE SEGMENTAÇÃO" | "Filtros de segmentação" |
| Gestão de Base | TableHeader | "NOME", "WHATSAPP", "AÇÃO" | "Nome", "WhatsApp", "Ação" |
| Log de Sugestões | Subtítulo | "FEEDBACKS DA EQUIPE PARA O ROADMAP DO QG DIGITAL" | "Feedbacks da equipe para o roadmap do QG Digital" |
| Modal Sugerir | Título | "SUGERIR MELHORIA" | "Sugerir melhoria" |
| Modal Cadastro | Título | "NOVO CADASTRO" | "Novo cadastro" |
| System Master | Badge | "NÍVEL 5 · SYSTEM MASTER" | OK (badges podem ser CAPS) |

### 1.2 KPI Cards quebrando texto

**Tela:** Gestão de Equipa (Imagem 5)

```
Problema:
┌─────────┬─────────┬─────────┐
│   136   │   136   │    0    │
│  Total  │  Ativ   │  Pend   │
│         │   os    │  ente   │
│         │         │    s    │
└─────────┴─────────┴─────────┘

Solução:
┌─────────┬─────────┬─────────┐
│   136   │   136   │    0    │
│  Total  │  Ativos │Pendentes│
└─────────┴─────────┴─────────┘
```

### 1.3 Modais centralizados (deveriam ser BottomSheet)

**Telas afetadas:**
- Modal "Sugerir Melhoria" (Imagem 11) - flutuando no centro
- Modal "Novo Cadastro" (Imagem 12) - flutuando no centro

**Regra:** Em mobile, modais devem vir de baixo (BottomSheet).

### 1.4 Elementos fora da safe area

**Tela:** Calendário (Imagem 6)
- Evento/card cortado na lateral esquerda
- Texto "— Semáforo" aparecendo cortado

**Tela:** Gestão de Base (Imagem 8)
- Botão vermelho "EXPORTAR CONTATOS..." cortando na direita

### 1.5 Espaçamento abaixo do bottom nav

**Telas afetadas:** Várias
- Há uma área preta/escura abaixo da bottom navigation
- Deveria usar `pb-safe` corretamente

### 1.6 FABs sobrepostos/conflitantes

**Tela:** Novo Cadastro (Imagem 12)
- FAB do microfone (azul)
- FAB do JARVIS IA (preto/dourado)
- Ambos muito próximos, confuso visualmente

### 1.7 Pills/Badges desproporcionais

**Tela:** Calendário (Imagem 6)
- Badge "OFÍCIOS" muito grande com borda vermelha
- Deveria ser mais compacto

**Tela:** System Master (Imagem 1)
- Tabs "PAINEL", "CLIENTES", "SKILLS" com estilo inconsistente

---

## 2. PADRÕES DE CORREÇÃO

### 2.1 Sentence Case - Padrão
```tsx
// ❌ ERRADO:
<h2>FILTROS DE SEGMENTAÇÃO</h2>
<th>WHATSAPP</th>
<DialogTitle>SUGERIR MELHORIA</DialogTitle>

// ✅ CORRETO:
<h2>Filtros de segmentação</h2>
<th>WhatsApp</th>
<DialogTitle>Sugerir melhoria</DialogTitle>
```

### 2.2 KPI Cards - whitespace-nowrap
```tsx
// ✅ CORRETO:
<p className="text-2xl font-medium whitespace-nowrap">{value}</p>
<p className="text-sm text-slate-500 whitespace-nowrap">{label}</p>
```

### 2.3 Modal → BottomSheet
```tsx
// ❌ ERRADO - Modal centralizado:
<Dialog>
  <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">

// ✅ CORRETO - BottomSheet:
<Dialog>
  <DialogContent className="fixed bottom-0 left-0 right-0 rounded-t-3xl">
```

### 2.4 Safe Area
```tsx
// ✅ Layout principal:
<main className="pt-safe pb-20">  {/* pb-20 para bottom nav */}
  {children}
</main>

// ✅ Bottom Nav:
<nav className="fixed bottom-0 left-0 right-0 h-16 pb-safe bg-white">
```

### 2.5 Badge compacto
```tsx
// ❌ ERRADO - Badge grande:
<Badge className="px-6 py-3 text-lg border-2">OFÍCIOS</Badge>

// ✅ CORRETO - Badge compacto:
<Badge className="px-2 py-0.5 text-xs">Ofícios</Badge>
```

---

## 3. ARQUIVOS PROVAVELMENTE AFETADOS

```
src/pages/GestaoBase.tsx           → CAPS em filtros, tabela
src/pages/LogSugestoes.tsx         → CAPS no subtítulo
src/pages/Equipe.tsx               → KPIs quebrando
src/pages/Calendario.tsx           → Badge grande, evento cortado
src/components/ui/dialog.tsx       → Modal → BottomSheet
src/components/SugerirMelhoria.tsx → Modal centralizado
src/components/NovoEleitor.tsx     → Modal centralizado, título CAPS
src/components/BottomNav.tsx       → Safe area
src/components/AppLayout.tsx       → Safe area geral
```

---

## 4. CHECKLIST DE VALIDAÇÃO

### Textos
- [ ] Nenhum título/subtítulo em CAPS LOCK
- [ ] Headers de tabela em sentence case
- [ ] Títulos de modal em sentence case

### KPIs
- [ ] Números não quebram linha
- [ ] Labels não quebram linha

### Modais
- [ ] Todos os modais vêm de baixo (BottomSheet)
- [ ] Nenhum modal flutuando no centro

### Safe Area
- [ ] Nenhum elemento cortado nas bordas
- [ ] Bottom nav com pb-safe
- [ ] Conteúdo não fica atrás da status bar

### FABs
- [ ] Máximo 2 FABs por tela (principal + IA)
- [ ] FABs não se sobrepõem
- [ ] Espaçamento adequado entre FABs

### Badges
- [ ] Badges compactos e proporcionais
- [ ] Sem bordas exageradas

---

*PRD gerado para Spec-Driven Development*
