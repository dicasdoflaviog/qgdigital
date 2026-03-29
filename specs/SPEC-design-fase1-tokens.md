# SPEC — Design Fase 1: Tokens CSS e Tailwind
> Versão: 1.0 | Março 2026
> Abordagem: Opção B — Unificação semântica (sem quebrar nada existente)
> Build deve passar com 0 erros após cada arquivo

---

## Regras absolutas desta SPEC
- NÃO remover variáveis existentes — apenas adicionar e ajustar valores
- NÃO alterar z-index scale (está correta)
- NÃO alterar hCaptcha, Leaflet ou iOS fixes
- NÃO alterar componentes `.dark` sem ajustar o light mode primeiro
- Apenas 2 arquivos: `src/index.css` e `tailwind.config.ts`

---

## TAREFA 1 — `src/index.css`

### 1A — Ajustar background da página (linha ~27)

```css
/* ATUAL */
--background: 220 14% 96%;

/* NOVO — #F7F8FA em HSL */
--background: 210 17% 97%;
```

### 1B — Conectar --primary ao qg-blue-600 (linha ~23)
O `--primary` atual (224 76% 40%) é visualmente igual ao `qg-blue-600` (#2563eb = 224 76% 48%).
Ajustar para ficarem sincronizados:

```css
/* ATUAL */
--primary: 224 76% 40%;

/* NOVO — alinhado ao qg-blue-600 exato */
--primary: 224 76% 48%;
```

> ⚠️ Isso afeta todos os componentes que usam `bg-primary`, `text-primary`, `border-primary`.
> É intencional — unifica a cor primária em uma fonte de verdade.

### 1C — Adicionar variáveis semânticas de surface (após --card, linha ~31)

```css
/* ADICIONAR após --card-foreground */
--surface: 0 0% 100%;           /* branco puro para cards */
--surface-muted: 210 17% 97%;  /* mesmo que --background */
--border-subtle: 220 13% 91%;  /* borda 0.5px padrão */
```

### 1D — Remover tokens sem uso real (linhas ~44-45)

```css
/* REMOVER estas 2 linhas — não são usadas em nenhum componente */
--primary-end: 270 70% 50%;
--z-role-fab: 500;
```

### 1E — Ajustar sidebar tokens (linha ~70)

```css
/* ATUAL */
--sidebar-background: 0 0% 100%;
--sidebar-foreground: 215 16% 47%;
--sidebar-primary: 224 76% 40%;
--sidebar-primary-foreground: 0 0% 100%;
--sidebar-accent: 220 13% 91%;

/* NOVO — item ativo: fundo azul 50, texto azul 700 */
--sidebar-background: 0 0% 100%;
--sidebar-foreground: 215 16% 47%;
--sidebar-primary: 213 94% 68%;          /* azul claro — fundo do item ativo */
--sidebar-primary-foreground: 224 76% 35%; /* azul escuro — texto do item ativo */
--sidebar-accent: 213 100% 97%;           /* #eff6ff — hover suave */
--sidebar-accent-foreground: 224 76% 35%; /* texto no hover */
```

> Resultado: item ativo fica com `bg-[#eff6ff]` + `text-[#1d4ed8]` — exatamente o aprovado no style guide.

### 1F — Ajustar dark mode (bloco `.dark`, linha ~87)

```css
/* AJUSTAR no .dark — manter escala, só alinhar primary */
--primary: 217 91% 60%;  /* já está correto — manter */

/* ADICIONAR no .dark após --primary-end */
--surface: 222 47% 8%;         /* mesmo que --card no dark */
--surface-muted: 222 84% 5%;   /* mesmo que --background no dark */
--border-subtle: 223 25% 18%;  /* mesmo que --border no dark */

/* REMOVER no .dark */
--primary-end: 270 70% 60%;    /* não usado */
```

### 1G — Atualizar componente `.kpi-card` (linha ~linha 266)

```css
/* ATUAL */
.kpi-card {
  @apply bg-white rounded-2xl border border-slate-200 p-4;
}

/* NOVO — border mais sutil, sem mudança estrutural */
.kpi-card {
  @apply bg-white rounded-xl border border-slate-200/80 p-4;
}
```

### 1H — Adicionar utilitários de badge (no final do @layer components)

```css
/* ADICIONAR no final do bloco @layer components */

/* Badge de situação eleitoral */
.badge-apoiador   { @apply bg-green-50 text-green-700 border border-green-200; }
.badge-indeciso   { @apply bg-amber-50 text-amber-700 border border-amber-200; }
.badge-opositor   { @apply bg-slate-100 text-slate-600 border border-slate-200; }
.badge-urgente    { @apply bg-red-50 text-red-700 border border-red-200; }
.badge-novo       { @apply bg-blue-50 text-blue-700 border border-blue-200; }

/* Badge de sistema */
.badge-sucesso    { @apply bg-green-50 text-green-700 border border-green-200; }
.badge-erro       { @apply bg-red-50 text-red-700 border border-red-200; }
.badge-atencao    { @apply bg-amber-50 text-amber-700 border border-amber-200; }
.badge-info       { @apply bg-blue-50 text-blue-700 border border-blue-200; }
.badge-restrito   { @apply bg-violet-50 text-violet-700 border border-violet-200; }
.badge-upgrade    { @apply bg-violet-50 text-violet-700 border border-violet-200; }

/* KPI badge sobre card azul sólido */
.kpi-badge-positive { @apply bg-green-600 text-white; }
.kpi-badge-alert    { @apply bg-red-600 text-white; }

/* KPI badge sobre card branco */
.kpi-badge-soft-green  { @apply bg-green-100 text-green-700; }
.kpi-badge-soft-orange { @apply bg-orange-100 text-orange-700; }
```

---

## TAREFA 2 — `tailwind.config.ts`

### 2A — Adicionar cor de surface e border-subtle (dentro de `extend.colors`)

```ts
// ADICIONAR dentro de colors: { ... }
surface: {
  DEFAULT: "#ffffff",
  muted: "#F7F8FA",
},
border: {
  subtle: "#e8eaed",
  DEFAULT: "hsl(var(--border))",
  input: "hsl(var(--input))",
},
```

> ⚠️ A chave `border` já existe com valores HSL — adicionar `subtle` como novo sub-token sem remover os existentes.

### 2B — Ajustar sidebar colors (dentro de `extend.colors.sidebar`)

```ts
// ATUAL
sidebar: {
  DEFAULT: "hsl(var(--sidebar-background))",
  foreground: "hsl(var(--sidebar-foreground))",
  primary: "hsl(var(--sidebar-primary))",
  "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
  accent: "hsl(var(--sidebar-accent))",
  "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
  border: "hsl(var(--sidebar-border))",
  ring: "hsl(var(--sidebar-ring))",
},

// MANTER IGUAL — os tokens CSS foram ajustados na Tarefa 1,
// o Tailwind vai pegar automaticamente os novos valores HSL.
// Não alterar esta seção.
```

### 2C — Adicionar border-width 0.5px (dentro de `extend`)

```ts
// ADICIONAR dentro de theme.extend
borderWidth: {
  "0.5": "0.5px",
},
```

### 2D — Adicionar background específico do novo design (dentro de `extend.colors`)

```ts
// ADICIONAR
page: {
  bg: "#F7F8FA",   // off-white frio — fundo da página
},
```

---

## ✅ Checklist de validação

### Build
- [ ] `npm run build` passa com 0 erros
- [ ] `npm run build` sem warnings de CSS

### Visual — verificar no browser
- [ ] Fundo da página mudou de cinza atual para #F7F8FA (mais frio, mais limpo)
- [ ] Cor primária (botões, links) continua azul — só ficou levemente mais vivo
- [ ] Sidebar: item ativo agora tem fundo azul claro (#eff6ff) com texto azul escuro
- [ ] Sidebar: item inativo continua em cinza discreto
- [ ] Dark mode: sem mudança visual perceptível (tokens internos apenas)
- [ ] Cards continuam brancos com bordas sutis

### O que NÃO deve mudar
- [ ] Nenhum componente quebrou layout
- [ ] Mapa de calor (Leaflet) continua funcionando
- [ ] Bottom nav z-index correto
- [ ] hCaptcha sem regressão

---

## 📌 Ordem de implementação
1. `src/index.css` — todas as tarefas 1A até 1H em sequência
2. `tailwind.config.ts` — tarefas 2A até 2D
3. `npm run build` — deve passar
4. Verificar no browser antes de commitar

## 🚫 O que NÃO fazer
- Não usar `!important` em nenhum novo CSS
- Não alterar a escala z-index
- Não remover variáveis que estão sendo usadas em componentes shadcn
- Não tocar em AppSidebar.tsx, Dashboard.tsx ou qualquer .tsx nesta fase
