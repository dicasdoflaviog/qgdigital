# SPEC — Design Fase 3: KPI Cards e Dashboards
> Versão: 1.0 | Março 2026
> Pré-requisito: SPEC-design-fase1 e SPEC-design-fase2 implementadas e build passando
> Arquivos: Dashboard.tsx, DashboardAssessor.tsx, Index.tsx (DashboardSecretaria)

---

## Regras absolutas desta SPEC
- NÃO alterar lógica de dados (hooks, queries, mock data, useMock)
- NÃO alterar onClick handlers de navegação
- NÃO alterar BottomSheets e Drawers existentes
- Apenas classes CSS — estrutura de layout e visual
- Nenhum badge, texto ou elemento empilha sobre outro
- Todos os textos em sentence case (sem CAPS, sem uppercase)
- font-weight: apenas 400 e 500 — zero font-bold, font-semibold

---

## TAREFA 1 — `src/pages/Dashboard.tsx`

### 1A — KPI cards principais: Eleitores e Pendentes (linhas 241-306)

```tsx
// ATUAL — fundo escuro com gradiente
className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 text-white overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"

// NOVO — azul sólido #2563eb, badge no canto
```

**Substituição completa do card Eleitores (linhas 241-273):**

```tsx
<Card
  className="bg-[#2563eb] border-0 overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
  onClick={() => navigate("/eleitores")}
>
  <CardContent className="p-4 flex flex-col justify-between min-h-[108px]">
    {/* Badge no canto — nunca sobrepõe texto */}
    {novos7d > 0 && (
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#16a34a] text-white text-[10px] font-medium px-2 py-1 rounded-[5px] whitespace-nowrap z-10">
        <TrendingUp className="h-2.5 w-2.5" />
        +{novos7d} semana
      </span>
    )}
    <div>
      <p className="text-[10.5px] text-white/60 pr-20 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
        Total da base
      </p>
      <p className="text-[28px] font-medium text-white tracking-tight leading-none mt-1.5 whitespace-nowrap tabular-nums">
        {totalBase}
      </p>
    </div>
    <p className="text-[10px] text-white/40 whitespace-nowrap overflow-hidden text-ellipsis">
      eleitores cadastrados
    </p>
  </CardContent>
</Card>
```

**Substituição completa do card Pendentes (linhas 276-305):**

```tsx
<Card
  className="bg-[#2563eb] border-0 overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
  onClick={() => navigate("/oficios")}
>
  <CardContent className="p-4 flex flex-col justify-between min-h-[108px]">
    {/* Badge urgente no canto */}
    <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#dc2626] text-white text-[10px] font-medium px-2 py-1 rounded-[5px] whitespace-nowrap z-10">
      <AlertTriangle className="h-2.5 w-2.5" />
      {pendingCount > 5 ? "Atenção" : "Sob controle"}
    </span>
    <div>
      <p className="text-[10.5px] text-white/60 pr-24 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
        Demandas pendentes
      </p>
      <p className="text-[28px] font-medium text-white tracking-tight leading-none mt-1.5 whitespace-nowrap tabular-nums">
        {pendingCount}
      </p>
    </div>
    <p className="text-[10px] text-white/40 whitespace-nowrap overflow-hidden text-ellipsis">
      aguardando resolução
    </p>
  </CardContent>
</Card>
```

### 1B — KPI cards secundários: Aniversariantes e Bairro (linhas 309-342)

**Substituição do card Aniversariantes (linhas 311-325):**

```tsx
<Card
  className="overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none bg-white border-[0.5px] border-slate-200"
  onClick={() => setAniversariantesSheetOpen(true)}
>
  <CardContent className="p-4 flex flex-col justify-between min-h-[108px]">
    {/* Badge no canto */}
    {(useMock ? aniversariantes.length : aniversariantesReais.length) > 0 && (
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#ffedd5] text-[#ea580c] text-[10px] font-medium px-2 py-1 rounded-[5px] whitespace-nowrap z-10">
        hoje
      </span>
    )}
    <div>
      <div className="w-[22px] h-[22px] rounded-[6px] bg-[#fff7ed] flex items-center justify-center mb-1.5">
        <Cake className="h-3 w-3 text-[#ea580c]" />
      </div>
      <p className="text-[10.5px] text-slate-400 pr-16 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
        Aniversariantes
      </p>
      <p className="text-[28px] font-medium text-slate-900 tracking-tight leading-none mt-1 whitespace-nowrap tabular-nums">
        {useMock ? aniversariantes.length : aniversariantesReais.length}
      </p>
    </div>
    <p className="text-[10px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
      contatar hoje
    </p>
  </CardContent>
</Card>
```

**Substituição do card Bairro mais ativo (linhas 328-341):**

```tsx
<Card
  className="overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none bg-white border-[0.5px] border-slate-200"
  onClick={() => setBairroSheetOpen(true)}
>
  <CardContent className="p-4 flex flex-col justify-between min-h-[108px]">
    {/* Badge no canto */}
    {topBairro.total > 0 && (
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#dcfce7] text-[#16a34a] text-[10px] font-medium px-2 py-1 rounded-[5px] whitespace-nowrap z-10">
        +{Math.round((topBairro.total / Math.max(totalBase, 1)) * 100)}%
      </span>
    )}
    <div>
      <div className="w-[22px] h-[22px] rounded-[6px] bg-[#eff6ff] flex items-center justify-center mb-1.5">
        <MapPin className="h-3 w-3 text-[#2563eb]" />
      </div>
      <p className="text-[10.5px] text-slate-400 pr-16 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
        Bairro mais ativo
      </p>
      <p className="text-[15px] font-medium text-slate-900 leading-tight mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {topBairro.bairro}
      </p>
    </div>
    <p className="text-[10px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
      {topBairro.total > 0 ? `${topBairro.total} eleitores` : "sem dados"}
    </p>
  </CardContent>
</Card>
```

### 1C — Card "Últimos Eleitores" — rows (linhas 631-648)

```tsx
// ATUAL — div com hover:border-primary/30
className="flex items-center justify-between p-3 min-h-[48px] rounded-lg border cursor-pointer hover:border-primary/30 transition-colors"

// NOVO — border sutil, padding uniforme, sem empilhamento
className="flex items-center gap-2.5 p-3 min-h-[44px] rounded-lg border-[0.5px] border-slate-200 cursor-pointer hover:border-[#2563eb]/30 hover:bg-slate-50 transition-colors"
```

### 1D — Card "Últimas Demandas" — rows (linhas 535-554)

```tsx
// ATUAL
className="flex items-center justify-between p-3 min-h-[48px] rounded-lg border cursor-pointer hover:border-primary/30 transition-colors"

// NOVO
className="flex items-center gap-2.5 p-3 min-h-[44px] rounded-lg border-[0.5px] border-slate-200 cursor-pointer hover:border-[#2563eb]/30 hover:bg-slate-50 transition-colors"
```

### 1E — Badges nas rows de demandas e eleitores

Localizar todos os `<Badge variant="...">` dentro dos cards de lista e substituir:

```tsx
// Badges de situação — substituir variant por className explícito

// Urgente / Destruttivo
<Badge className="text-[9.5px] font-medium px-2 py-0.5 rounded-[4px] bg-[#fef2f2] text-[#dc2626] border-[0.5px] border-[#fecaca] whitespace-nowrap flex-shrink-0">
  {d.status || "Pendente"}
</Badge>

// Resolvida / Positivo
<Badge className="text-[9.5px] font-medium px-2 py-0.5 rounded-[4px] bg-[#f0fdf4] text-[#16a34a] border-[0.5px] border-[#bbf7d0] whitespace-nowrap flex-shrink-0">
  Resolvida
</Badge>
```

---

## TAREFA 2 — `src/pages/DashboardAssessor.tsx`

### 2A — KPI cards de métricas (linhas 183-199)

```tsx
// ATUAL — Card sem cor, sem badge
<Card key={label} className="bg-card rounded-2xl shadow-sm border-0 cursor-pointer...">
  <CardContent className="p-4 text-center">
    <p className="text-2xl font-medium text-primary">{value}</p>
    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mt-1">{label}</p>

// NOVO — padding uniforme, sem uppercase, sem center no texto, badge no canto
{[
  { value: meusEleitores.length, label: "Meus cadastros", route: "/eleitores", badgeBg: "bg-[#dcfce7]", badgeText: "text-[#16a34a]", badgeLabel: `${meusEleitores.length}` },
  { value: pendencias, label: "Pendências", alert: pendencias > 0, route: "/oficios", badgeBg: pendencias > 0 ? "bg-[#fef2f2]" : "bg-[#f0fdf4]", badgeText: pendencias > 0 ? "text-[#dc2626]" : "text-[#16a34a]", badgeLabel: pendencias > 0 ? "Atenção" : "Ok" },
  { value: oficiosGerados, label: "Ofícios gerados", route: "/oficios", badgeBg: "bg-[#eff6ff]", badgeText: "text-[#2563eb]", badgeLabel: "este mês" },
].map(({ value, label, alert, route, badgeBg, badgeText, badgeLabel }) => (
  <Card
    key={label}
    className="bg-white border-[0.5px] border-slate-200 rounded-xl overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
    onClick={() => navigate(route)}
  >
    <CardContent className="p-4 flex flex-col justify-between min-h-[96px]">
      <span className={`absolute top-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5 rounded-[4px] whitespace-nowrap ${badgeBg} ${badgeText}`}>
        {badgeLabel}
      </span>
      <p className="text-[10.5px] text-slate-400 pr-16 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
        {label}
      </p>
      <p className="text-[26px] font-medium text-slate-900 tracking-tight leading-none whitespace-nowrap tabular-nums">
        {value}
      </p>
      {alert && (
        <p className="text-[10px] text-[#dc2626] whitespace-nowrap overflow-hidden text-ellipsis">
          Requer atenção
        </p>
      )}
    </CardContent>
  </Card>
))}
```

### 2B — Card de demandas (linhas 230-254)

```tsx
// ATUAL — Card sem onClick clicável como um todo
<Card key={o.id} className="rounded-2xl shadow-sm border-0 bg-card cursor-pointer active:scale-95...">

// NOVO — borda sutil, padding 14px, badge de status no canto sem empilhar
<Card
  key={o.id}
  className="bg-white border-[0.5px] border-slate-200 rounded-xl overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
  onClick={() => navigate("/oficios")}
>
  <CardContent className="p-3.5">
    <div className="flex items-center justify-between gap-2 min-w-0">
      <p className="text-[11.5px] font-medium text-slate-900 truncate flex-1 min-w-0">{o.titulo}</p>
      <Badge className={`text-[9.5px] font-medium px-2 py-0.5 rounded-[4px] whitespace-nowrap flex-shrink-0 ${
        atrasado
          ? "bg-[#fef2f2] text-[#dc2626] border-[0.5px] border-[#fecaca]"
          : o.status === "resolvido"
          ? "bg-[#f0fdf4] text-[#16a34a] border-[0.5px] border-[#bbf7d0]"
          : "bg-[#eff6ff] text-[#2563eb] border-[0.5px] border-[#bfdbfe]"
      }`}>
        {atrasado && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
        {statusConf?.label || o.status}
      </Badge>
    </div>
    <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
      Nº {o.numero} · {o.bairro}
    </p>
    <div className="mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#2563eb] rounded-full"
        style={{ width: `${demandaProgress}%` }}
      />
    </div>
  </CardContent>
</Card>
```

### 2C — Card de eleitores recentes (linhas 332-356)

```tsx
// ATUAL — Card sem onClick no card inteiro
<Card key={e.id} className="rounded-2xl shadow-sm border-0 bg-card cursor-pointer...">

// NOVO — card clicável para perfil, WhatsApp com stopPropagation
<Card
  key={e.id}
  className="bg-white border-[0.5px] border-slate-200 rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
  onClick={() => navigate(`/eleitores/${e.id}`)}
>
  <CardContent className="p-3.5 flex items-center justify-between gap-2">
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      <div className="flex h-7 w-7 min-w-7 items-center justify-center bg-[#eff6ff] text-[#1d4ed8] rounded-full shrink-0 text-[9.5px] font-medium uppercase">
        {(e.nome || "?").charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-medium text-slate-900 truncate">{e.nome}</p>
        <p className="text-[10px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
          {e.bairro} · {e.situacao}
        </p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 rounded-xl"
      onClick={(ev) => ev.stopPropagation()}
      asChild
    >
      <a href={`https://wa.me/${(e.whatsapp || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-3.5 w-3.5 text-[#2563eb]" />
      </a>
    </Button>
  </CardContent>
</Card>
```

### 2D — Card de aniversariante (linhas 202-217)

```tsx
// ATUAL — Card não clicável
<Card className="animate-fade-up rounded-2xl shadow-sm border-0 bg-card">

// NOVO — clicável, sem empilhamento
<Card
  className="animate-fade-up bg-white border-[0.5px] border-[#fed7aa] rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
  onClick={() => navigate("/eleitores")}
>
  <CardContent className="p-3.5 flex items-center gap-3">
    <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-xl bg-[#fff7ed] shrink-0">
      <Cake className="h-4 w-4 text-[#ea580c]" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11.5px] font-medium text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">
        {aniversariantes.length} aniversariante{aniversariantes.length > 1 ? "s" : ""} hoje
      </p>
      <p className="text-[10px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
        Envie uma mensagem de parabéns
      </p>
    </div>
    <span className="text-[10px] font-medium text-[#ea580c] whitespace-nowrap flex-shrink-0 bg-[#ffedd5] px-2 py-0.5 rounded-[4px]">
      Hoje
    </span>
  </CardContent>
</Card>
```

---

## TAREFA 3 — `src/pages/Index.tsx` (DashboardSecretaria)

### 3A — KPI cards da Secretaria (linhas 43-47)

Localizar o componente `MockStatCard` (linhas 688-707) e substituir:

```tsx
// ATUAL
function MockStatCard({ icon, value, label, highlight, isText, onClick }: {...}) {
  return (
    <Card onClick={onClick} className={onClick ? "cursor-pointer active:scale-95..." : ""}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${highlight ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
          {icon}
        </div>
        <div>
          <p className={`${isText ? "text-sm" : "text-lg"} font-medium text-foreground whitespace-nowrap`}>{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>

// NOVO — ícone colorido, número grande, label pequeno, sem empilhamento
function MockStatCard({ icon, value, label, highlight, isText, onClick }: {
  icon: React.ReactNode; value: string; label: string; highlight?: boolean; isText?: boolean; onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={`bg-white border-[0.5px] overflow-hidden relative ${
        highlight ? "border-[#fecaca]" : "border-slate-200"
      } rounded-xl ${onClick ? "cursor-pointer active:scale-95 transition-transform touch-manipulation select-none" : ""}`}
    >
      <CardContent className="p-4 flex flex-col justify-between min-h-[96px]">
        <div className={`flex h-[22px] w-[22px] items-center justify-center rounded-[6px] ${
          highlight ? "bg-[#fef2f2]" : "bg-[#eff6ff]"
        }`}>
          <span className={highlight ? "text-[#dc2626]" : "text-[#2563eb]"}>{icon}</span>
        </div>
        <div>
          <p className={`${isText ? "text-[14px]" : "text-[26px]"} font-medium tracking-tight leading-none whitespace-nowrap tabular-nums ${
            highlight ? "text-[#dc2626]" : "text-slate-900"
          }`}>{value}</p>
          <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Checklist de validação

### Build
- [ ] `npm run build` passa com 0 erros

### Dashboard admin — verificar no browser
- [ ] Card eleitores: fundo azul #2563eb, badge verde no canto
- [ ] Card pendentes: fundo azul #2563eb, badge vermelho no canto
- [ ] Badge nunca sobrepõe texto — `pr-20` no label garante isso
- [ ] Card aniversariantes: fundo branco, ícone laranja, badge "hoje" no canto
- [ ] Card bairro: fundo branco, ícone azul, badge % no canto
- [ ] Rows de eleitores: borda sutil, truncate no nome, badge flex-shrink-0
- [ ] Rows de demandas: borda sutil, badge colorido por status

### Dashboard assessor — verificar
- [ ] 3 cards de métricas: branco com badge no canto, sem uppercase
- [ ] Cards de demanda: clicáveis, badge de status sem empilhar
- [ ] Cards de eleitor: clicáveis, WhatsApp com stopPropagation
- [ ] Card aniversariante: clicável, badge "Hoje" no canto direito

### Dashboard secretaria — verificar
- [ ] 4 KPI cards: ícone + número grande + label, sem empilhamento
- [ ] Card urgente (ofícios pendentes): borda vermelha sutil

### Mobile 375px
- [ ] Todos os cards cabem em 2 colunas sem overflow
- [ ] Nenhum badge quebra linha
- [ ] Números não quebram linha (whitespace-nowrap)

### O que NÃO deve mudar
- [ ] BottomSheets continuam abrindo ao clicar nos KPIs
- [ ] Navegação para /eleitores, /oficios continua
- [ ] Dados reais vs mock continuam funcionando
- [ ] DemandaDetailDrawer e EleitorDetailDrawer continuam funcionando

---

## 📌 Ordem de implementação
1. `src/pages/Dashboard.tsx` — tarefas 1A, 1B, 1C, 1D, 1E
2. `src/pages/DashboardAssessor.tsx` — tarefas 2A, 2B, 2C, 2D
3. `src/pages/Index.tsx` — tarefa 3A (MockStatCard)
4. `npm run build` — deve passar
5. Testar cada dashboard no browser

## 🚫 O que NÃO fazer
- Não alterar lógica de useMock, hooks ou queries
- Não remover onClick handlers existentes
- Não usar gradientes (zero gradient-to-*)
- Não usar shadow-xl ou shadow-2xl
- Não usar font-bold ou font-semibold
- Não usar uppercase em labels
- Não empilhar badge sobre texto — sempre usar position absolute com pr-* no texto
