# SPEC — Interatividade QG Digital
> Versão: 1.0 | Data: Março 2026
> Objetivo: Corrigir 5 bugs de interatividade + 4 violações de tipografia

---

## 📁 Arquivos a modificar (4 arquivos)

| # | Arquivo | Ação | Bugs corrigidos |
|---|---------|------|-----------------|
| 1 | `src/pages/Index.tsx` | Modificar | Bug 5 — crash N3/N4/N5 |
| 2 | `src/pages/DashboardAssessor.tsx` | Modificar | Bug 1, Bug 2 + 4 violações font |
| 3 | `src/components/dashboard/RadarDaRua.tsx` | Modificar | Bug 3 |
| 4 | `src/pages/Dashboard.tsx` | Modificar | Bug 4 |

---

## TAREFA 1 — `src/pages/Index.tsx`
**Bug 5: DashboardVereador, DashboardSuperAdmin, DashboardDeus não existem → crash**

### Localizar (linhas 715–722):
```tsx
if (simulatedLevel !== null) {
  switch (simulatedLevel) {
    case 1: return <DashboardAssessor />;
    case 2: return <DashboardSecretaria />;
    case 3: return <DashboardVereador />;      // ← NÃO EXISTE
    case 4: return <DashboardSuperAdmin />;    // ← NÃO EXISTE
    case 5: return <DashboardDeus />;          // ← NÃO EXISTE
  }
}
```

### Substituir por:
```tsx
if (simulatedLevel !== null) {
  switch (simulatedLevel) {
    case 1: return <DashboardAssessor />;
    case 2: return <DashboardSecretaria />;
    case 3: return <Dashboard />;   // Vereador → usa Dashboard admin até implementação específica
    case 4: return <Dashboard />;   // Líder Político → usa Dashboard admin
    case 5: return <Dashboard />;   // System Master → usa Dashboard admin
  }
}
```

### Também ajustar o roteamento por role real (linhas 726–728):
```tsx
// ATUAL
if (role === "assessor") return <DashboardAssessor />;
if (role === "super_admin") return <DashboardDeus />;  // ← DashboardDeus não existe
return <Dashboard />;

// CORRETO
if (role === "assessor") return <DashboardAssessor />;
if (role === "super_admin") return <Dashboard />;
if (role === "vereador") return <Dashboard />;
if (role === "lider_politico") return <Dashboard />;
return <Dashboard />;
```

---

## TAREFA 2 — `src/pages/DashboardAssessor.tsx`
**Bug 1: Cards de demandas sem onClick**
**Bug 2: Cards de eleitores sem onClick para perfil**
**+ 4 violações de font-weight (CLAUDE.md)**

### 2A — Corrigir violações de font-weight
Buscar e substituir em todo o arquivo:
- `font-semibold` → `font-medium`
- `font-bold` → `font-medium`

Localizações específicas:
- Linha 125: `font-bold uppercase` → `font-medium`
- Linha 131: `font-semibold` → `font-medium`
- Linha 144: `font-semibold` → `font-medium`
- Linha 148: `font-bold` → `font-medium`
- Linha 191: `font-bold` → `font-medium`
- Linha 192: `font-semibold uppercase` → `font-medium uppercase`
- Linha 194: `font-semibold` → `font-medium`
- Linha 209: `font-semibold` → `font-medium`
- Linha 214: `font-semibold` → `font-medium`
- Linha 238: `font-semibold` → `font-medium`
- Linha 263: `font-semibold` → `font-medium`
- Linha 280: `font-semibold` → `font-medium`
- Linha 319: `font-semibold` → `font-medium`
- Linha 343: `font-semibold` → `font-medium`
- Linha 371: `font-semibold` → `font-medium`
- Linha 378: `font-semibold` → `font-medium`

### 2B — Bug 1: Cards de métricas (linhas 183–199)
Adicionar navegação nos 3 cards de métricas:

```tsx
// ATUAL
{[
  { value: meusEleitores.length, label: "Meus Cadastros" },
  { value: pendencias, label: "Pendências", alert: pendencias > 0 },
  { value: oficiosGerados, label: "Ofícios Gerados" },
].map(({ value, label, alert }) => (
  <Card key={label} className="bg-card rounded-2xl shadow-sm border-0">

// CORRETO — adicionar route e onClick
{[
  { value: meusEleitores.length, label: "Meus Cadastros", route: "/eleitores" },
  { value: pendencias, label: "Pendências", alert: pendencias > 0, route: "/oficios" },
  { value: oficiosGerados, label: "Ofícios Gerados", route: "/oficios" },
].map(({ value, label, alert, route }) => (
  <Card
    key={label}
    className="bg-card rounded-2xl shadow-sm border-0 cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
    onClick={() => navigate(route)}
  >
```

### 2C — Bug 1: Cards de demandas não clicáveis (linhas 230–254)
```tsx
// ATUAL
<Card
  key={o.id}
  className="rounded-2xl shadow-sm border-0 bg-card"
>

// CORRETO
<Card
  key={o.id}
  className="rounded-2xl shadow-sm border-0 bg-card cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
  onClick={() => navigate("/oficios")}
>
```

### 2D — Bug 2: Cards de aniversariantes não clicáveis (linhas 202–217)
```tsx
// ATUAL
<Card className="animate-fade-up rounded-2xl shadow-sm border-0 bg-card">

// CORRETO
<Card
  className="animate-fade-up rounded-2xl shadow-sm border-0 bg-card cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
  onClick={() => navigate("/eleitores")}
>
```

### 2E — Bug 2: Cards de eleitores recentes sem navegação para perfil (linhas 332–356)
```tsx
// ATUAL
<Card
  key={e.id}
  className="rounded-2xl shadow-sm border-0 bg-card"
>
  <CardContent className="p-3.5 flex items-center justify-between">
    ...
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl" asChild>
      <a href={`https://wa.me/...`} ...>
        <MessageCircle className="h-3.5 w-3.5 text-primary" />
      </a>
    </Button>

// CORRETO — card clica para perfil, botão WhatsApp permanece separado
<Card
  key={e.id}
  className="rounded-2xl shadow-sm border-0 bg-card cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
  onClick={() => navigate(`/eleitores/${e.id}`)}
>
  <CardContent className="p-3.5 flex items-center justify-between">
    ...
    {/* Parar propagação do clique do WhatsApp para não navegar junto */}
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 rounded-xl"
      onClick={(e) => e.stopPropagation()}
      asChild
    >
      <a href={`https://wa.me/${(e.whatsapp || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-3.5 w-3.5 text-primary" />
      </a>
    </Button>
```

---

## TAREFA 3 — `src/components/dashboard/RadarDaRua.tsx`
**Bug 3: "Transformar em Ofício" só faz dismiss, não navega**

### Adicionar import do useNavigate no topo:
```tsx
// Adicionar ao bloco de imports existente
import { useNavigate } from "react-router-dom";
```

### Modificar o componente DemandCard para receber e usar navigate:
```tsx
// ATUAL — função DemandCard sem navigate
function DemandCard({ demand }: { demand: VoiceDemand }) {
  const [dismissed, setDismissed] = useState(false);
  ...

// CORRETO — adicionar useNavigate dentro do componente
function DemandCard({ demand }: { demand: VoiceDemand }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  ...
```

### Modificar o botão "Transformar em Ofício" (linha ~161):
```tsx
// ATUAL
<Button
  size="sm"
  className="h-7 text-[10px] font-medium gap-1"
  onClick={() => setDismissed(true)}
>
  <FileText className="h-3 w-3" />
  Transformar em Ofício
</Button>

// CORRETO — navega para /oficios e depois esconde o card
<Button
  size="sm"
  className="h-7 text-[10px] font-medium gap-1"
  onClick={() => {
    setDismissed(true);
    navigate("/oficios");
  }}
>
  <FileText className="h-3 w-3" />
  Transformar em Ofício
</Button>
```

### Corrigir CAPS LOCK no título (linha ~224):
```tsx
// ATUAL — viola CLAUDE.md (CAPS LOCK proibido)
<div className="flex items-center gap-1.5 font-medium tracking-tight uppercase">
  ...
  Radar da Rua

// CORRETO — sentence case, remover uppercase
<div className="flex items-center gap-1.5 font-medium tracking-tight">
  ...
  Radar da rua
```

---

## TAREFA 4 — `src/pages/Dashboard.tsx`
**Bug 4: Ofícios Recentes — row não é clicável como um todo**

### Localizar o div de cada ofício (linha ~573):
```tsx
// ATUAL — div sem onClick
<div key={o.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-colors">

// CORRETO — div clicável + stopPropagation nos botões internos
<div
  key={o.id}
  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:border-primary/30 active:bg-accent/50 transition-colors touch-manipulation"
  onClick={() => navigate("/oficios")}
>
```

### Adicionar stopPropagation nos 3 botões internos do card de ofício:
```tsx
// Botão Eye (ver detalhes) — linha ~586
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  title="Ver detalhes"
  onClick={(e) => { e.stopPropagation(); navigate("/oficios"); }}
>

// Botão PenLine (assinar) — linha ~596
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  title="Assinar"
  onClick={(e) => { e.stopPropagation(); toast.info("Assinatura em breve"); }}
>

// Botão MessageCircle (WhatsApp) — linha ~604
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  title="Enviar via WhatsApp"
  onClick={(e) => { e.stopPropagation(); toast.info("Envio via WhatsApp em breve"); }}
>
```

---

## ✅ Checklist de validação (após implementação)

### Funcional
- [ ] N3/N4/N5 logado não crasha mais — cai no Dashboard admin
- [ ] Cards de métricas do DashboardAssessor navegam ao clicar
- [ ] Cards de demandas do DashboardAssessor navegam para /oficios
- [ ] Card de aniversariantes do DashboardAssessor navega para /eleitores
- [ ] Cards de eleitores recentes navegam para /eleitores/:id
- [ ] Botão WhatsApp nos eleitores NÃO navega para perfil (stopPropagation)
- [ ] "Transformar em Ofício" no RadarDaRua navega para /oficios
- [ ] Rows de ofícios no Dashboard admin são clicáveis
- [ ] Botões internos dos ofícios (Eye, PenLine, WhatsApp) continuam funcionando separadamente

### Visual (CLAUDE.md)
- [ ] Zero ocorrências de font-bold no DashboardAssessor
- [ ] Zero ocorrências de font-semibold no DashboardAssessor
- [ ] Título "Radar da rua" em sentence case (sem uppercase)

### Mobile
- [ ] Todos os novos cards clicáveis têm `touch-manipulation` e `select-none`
- [ ] Todos os novos cards clicáveis têm `active:scale-95` para feedback tátil
- [ ] Touch targets respeitam mínimo 44px

---

## 📌 Ordem de implementação recomendada

1. `Index.tsx` — corrige crash primeiro (risco mais alto)
2. `DashboardAssessor.tsx` — font-weight primeiro, depois onClick por seção
3. `RadarDaRua.tsx` — import + navigate + sentence case
4. `Dashboard.tsx` — onClick no row + stopPropagation nos botões

---

## 🚫 O que NÃO fazer

- Não criar novos componentes — só modificar os existentes
- Não alterar lógica de dados (hooks, queries, mock data)
- Não alterar o AppLayout, BottomBar ou App.tsx
- Não "melhorar" partes do código que não estão na SPEC
- Não adicionar novas rotas ao App.tsx
