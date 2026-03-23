# Spec: página "Plano e faturamento"

> Objetivo: criar uma rota dedicada `/plano`, acessível pelo menu lateral,
> que exibe o componente `PlanoFaturamentoTab` já existente.
> Corrigir o alerta vermelho indevido para usuários Bronze (plano gratuito).

---

## Contexto

| Item | Estado atual |
|---|---|
| `PlanoFaturamentoTab` | ✅ existe em `src/components/subscription/PlanoFaturamentoTab.tsx` |
| Página `Plano.tsx` | ❌ não existe |
| Rota `/plano` | ❌ não existe em `App.tsx` |
| Item no menu | ❌ não existe em `AppSidebar.tsx` |
| Plano acessível via | `/configuracao-gabinete` → aba "Plano" |
| Bug: Bronze + alerta vermelho | `useSubscription.ts` linha 130 |

---

## Arquivo 1 — `src/hooks/useSubscription.ts`

### Problema
Linha 130 define `isActive` sem considerar que Bronze é o plano gratuito padrão.
Resultado: usuário Bronze sem registro de assinatura vê alerta vermelho de "assinatura inativa".

### Mudança — linha 130

```diff
- const isActive = query.data?.status === "active" || query.data?.status === "trialing";
+ const isActive = plan === "bronze" || query.data?.status === "active" || query.data?.status === "trialing";
```

> ⚠️ `plan` (linha 132) usa `|| "bronze"` como fallback, portanto é seguro
> referenciar `plan` antes de `isActive` — a ordem de declaração já está correta.

**Nenhuma outra linha muda neste arquivo.**

---

## Arquivo 2 — `src/pages/Plano.tsx` (CRIAR — não existe)

Caminho completo: `src/pages/Plano.tsx`

```tsx
import { PlanoFaturamentoTab } from "@/components/subscription/PlanoFaturamentoTab";

export default function Plano() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-medium text-foreground">Plano e faturamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie sua assinatura e recursos disponíveis
        </p>
      </div>
      <div className="px-4">
        <PlanoFaturamentoTab />
      </div>
    </div>
  );
}
```

### Regras CLAUDE.md aplicadas
- Título em sentence case: "Plano e faturamento" ✅
- `font-medium` (não `font-bold`) ✅
- `pb-20` para não esconder conteúdo atrás da bottom nav ✅
- Sem FAB extra ✅

---

## Arquivo 3 — `src/App.tsx`

### Mudança A — linha 37 (bloco de imports de páginas)

Inserir linha após a linha 37 (`import ConfiguracaoGabinete from "./pages/ConfiguracaoGabinete";`):

```diff
  import ConfiguracaoGabinete from "./pages/ConfiguracaoGabinete";
+ import Plano from "./pages/Plano";
```

> Resultado: nova linha 38. As linhas seguintes sobem 1.

### Mudança B — linha 86 (bloco de rotas protegidas)

Inserir após `/sistema` (atualmente linha 86, após shift passa a ser linha 87):

```diff
          <Route path="/sistema" element={<Sistema />} />
+         <Route path="/plano" element={<Plano />} />
          <Route path="*" element={<NotFound />} />
```

**Nenhuma outra linha muda neste arquivo.**

---

## Arquivo 4 — `src/components/layout/AppSidebar.tsx`

### Mudança A — linha 5 (imports de ícones Lucide)

Adicionar `CreditCard` ao import existente:

```diff
- import {
-   LayoutDashboard, Users, MapPin, Trophy, CalendarDays, CalendarRange, FileText, Settings,
-   Zap, Radio, BookOpen, CloudOff, Database, MessageSquarePlus, Building2, Landmark,
-   Archive, Server, Scale, ShieldCheck, DollarSign, Lock, BarChart3, LogOut, Paintbrush,
- } from "lucide-react";
+ import {
+   LayoutDashboard, Users, MapPin, Trophy, CalendarDays, CalendarRange, FileText, Settings,
+   Zap, Radio, BookOpen, CloudOff, Database, MessageSquarePlus, Building2, Landmark,
+   Archive, Server, Scale, ShieldCheck, DollarSign, Lock, BarChart3, LogOut, Paintbrush,
+   CreditCard,
+ } from "lucide-react";
```

### Mudança B — linha 59 (array `operacionalNavItems`)

Inserir após a linha 56 (`"Guia de Soluções"`), antes de `"Instituições"`:

```diff
   { title: "Guia de Soluções", url: "/guia", icon: BookOpen, roles: ["admin", "super_admin", "secretaria", "assessor"], group: "operacional" },
+  { title: "Plano", url: "/plano", icon: CreditCard, roles: ["admin", "super_admin"], group: "operacional" },
   { title: "Instituições", url: "/instituicoes", icon: Building2, roles: ["admin", "super_admin"], group: "operacional" },
```

> Posicionamento: após "Guia de Soluções" (linha 56) e antes de "Instituições" (linha 57).
> Roles: `admin` e `super_admin` apenas — secretaria e assessor não gerenciam faturamento.
> Sem `exactLevels` — visível para todos os niveis de admin/super_admin.

**Nenhuma outra linha muda neste arquivo.**

---

## Arquivo 5 — `src/pages/ConfiguracaoGabinete.tsx` (remoção de aba duplicada)

> **Status: recomendado mas opcional.** Pode ser feito depois da validação em produção.

### Mudança A — linha 15 (import)

```diff
- import { PlanoFaturamentoTab } from "@/components/subscription/PlanoFaturamentoTab";
```
_Remover completamente — não será mais usada nesta página._

### Mudança B — linha 160 (subtítulo da página)

```diff
- <p className="text-sm text-muted-foreground mt-1">Gerencie a identidade, plano e equipe do seu mandato</p>
+ <p className="text-sm text-muted-foreground mt-1">Gerencie a identidade e equipe do seu mandato</p>
```

### Mudança C — linha 164 (TabsList grid)

```diff
- <TabsList className="w-full grid grid-cols-2 h-11">
+ <TabsList className="w-full grid grid-cols-1 h-11">
```

### Mudança D — linhas 165–170 (TabsTrigger "identidade" e "plano")

Remover o `TabsTrigger` do plano e corrigir violações de CLAUDE.md no que resta:

```diff
- <TabsTrigger value="identidade" className="gap-1.5 text-xs font-bold uppercase tracking-wider min-h-[44px]">
-   <Building2 className="h-3.5 w-3.5" /> Identidade
- </TabsTrigger>
- <TabsTrigger value="plano" className="gap-1.5 text-xs font-bold uppercase tracking-wider min-h-[44px]">
-   <Crown className="h-3.5 w-3.5" /> Plano
- </TabsTrigger>
+ <TabsTrigger value="identidade" className="gap-1.5 text-xs font-medium min-h-[44px]">
+   <Building2 className="h-3.5 w-3.5" /> Identidade
+ </TabsTrigger>
```

> Remoção de: `font-bold`, `uppercase`, `tracking-wider` — violações das regras #1 e #9.

### Mudança E — linhas 460–462 (TabsContent "plano")

```diff
- <TabsContent value="plano" className="mt-4">
-   <PlanoFaturamentoTab />
- </TabsContent>
```
_Remover completamente._

### Mudança F — linha 2 (import de ícone `Crown`)

Verificar se `Crown` é usado em outro lugar do arquivo. Se não for:

```diff
- import { Upload, Save, Loader2, Palette, Building2, Users, Image, Camera, Brain, Handshake, Swords, Shield, Crown } from "lucide-react";
+ import { Upload, Save, Loader2, Palette, Building2, Users, Image, Camera, Brain, Handshake, Swords, Shield } from "lucide-react";
```

---

## Resumo de mudanças por arquivo

| Arquivo | Tipo | Linhas alteradas |
|---|---|---|
| `useSubscription.ts` | editar 1 linha | 130 |
| `pages/Plano.tsx` | criar arquivo novo | — |
| `App.tsx` | inserir 2 linhas | após 37, após 86 |
| `AppSidebar.tsx` | inserir 2 linhas | 3–6, após 56 |
| `ConfiguracaoGabinete.tsx` | remover 7 linhas, editar 3 | 2, 15, 160, 164–170, 460–462 |

---

## Ordem de implementação

```
1. useSubscription.ts   → fix Bronze bug (sem dependências)
2. Plano.tsx            → criar página (depende de PlanoFaturamentoTab existente)
3. App.tsx              → registrar rota (depende de Plano.tsx)
4. AppSidebar.tsx       → adicionar item de menu (depende de rota existir)
5. ConfiguracaoGabinete → remover aba duplicada (pode ser feito por último, opcional)
```

---

## Checklist de validação

- [ ] Bronze sem assinatura: sem alerta vermelho
- [ ] Silver/Gold ativos: `isActive = true`, sem alerta
- [ ] Silver/Gold cancelados: alerta vermelho aparece corretamente
- [ ] Rota `/plano` carrega sem erro 404
- [ ] Item "Plano" aparece no menu para `admin` e `super_admin`
- [ ] Item "Plano" NÃO aparece para `secretaria` e `assessor`
- [ ] Título "Plano e faturamento" em sentence case, font-medium
- [ ] Sem `uppercase`, `font-bold`, `font-semibold` nos componentes alterados
- [ ] `pb-20` garante conteúdo acima da bottom nav no mobile
