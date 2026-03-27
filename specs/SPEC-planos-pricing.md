# SPEC — Planos & Pricing (QG Digital)

> Baseado em: specs/PRD-planos-pricing.md
> Ordem de implementação: 1 → 6

---

## Checklist de validação (executar ao final)
- [ ] Preços corretos na UI: R$197 / R$497 / R$997
- [ ] Nomes corretos: Essencial / Profissional / Completo (nunca bronze/silver/gold na UI)
- [ ] Plano atual do gabinete destacado visualmente
- [ ] Features corretas listadas por plano
- [ ] N4 features SEM menção para N<4
- [ ] `/observatorio` redireciona N<4 para `/`
- [ ] `/gestao-base` redireciona N<4 para `/`
- [ ] Admin L5 vê "Essencial/Profissional/Completo" no SubscricoesPanel
- [ ] TypeScript sem erros
- [ ] Design mobile-first (375px)

---

## TAREFA 1 — `src/hooks/useSubscription.ts`
**Ação:** Modificar

### O que fazer:
1. Atualizar `PLAN_PRICES`: bronze=197, silver=497, gold=997
2. Adicionar constante `PLAN_LABELS` — mapa de DB enum → nome público
3. Adicionar constante `PLAN_FEATURES` — features por plano para renderizar na UI
4. Adicionar constante `PLAN_USER_LIMITS` — limite de usuários por plano
5. Adicionar constante `PLAN_VOTER_LIMITS` — limite de eleitores (500 ou null=ilimitado)
6. Exportar tipo `PlanKey = "bronze" | "silver" | "gold"`

### Code snippet:
```typescript
export type PlanKey = "bronze" | "silver" | "gold";

export const PLAN_PRICES: Record<PlanKey, number> = {
  bronze: 197,
  silver: 497,
  gold: 997,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  bronze: "Essencial",
  silver: "Profissional",
  gold: "Completo",
};

export const PLAN_USER_LIMITS: Record<PlanKey, number | null> = {
  bronze: 3,
  silver: 10,
  gold: null, // ilimitado
};

export const PLAN_VOTER_LIMITS: Record<PlanKey, number | null> = {
  bronze: 500,
  silver: null, // ilimitado
  gold: null,
};

export const PLAN_FEATURES: Record<PlanKey, string[]> = {
  bronze: [
    "Dashboard com KPIs",
    "Cadastro de eleitores (até 500)",
    "Agenda de reuniões",
    "Guia de Soluções",
    "Entrada por voz (campo)",
    "App offline",
    "Até 3 usuários",
  ],
  silver: [
    "Tudo do Essencial",
    "Eleitores ilimitados",
    "Mapa de Calor (geolocalização)",
    "Perfil Eleitoral (sexo, idade, bairro)",
    "Equipe & Ranking de assessores",
    "Calendário político",
    "Ofícios (rascunho → resolução)",
    "Identidade do Gabinete",
    "IA de Demandas (triagem automática)",
    "IA de Ofícios (redação automática)",
    "Mensagens personalizadas",
    "Relatórios em PDF",
    "Até 10 usuários",
  ],
  gold: [
    "Tudo do Profissional",
    "Observatório BI (análises avançadas)",
    "Emendas parlamentares",
    "Banco de Instituições estratégicas",
    "Usuários ilimitados",
    "Suporte prioritário via WhatsApp",
    "Onboarding dedicado",
  ],
};

// Features que NÃO estão no plano (para mostrar como locked)
export const PLAN_LOCKED_FEATURES: Record<PlanKey, string[]> = {
  bronze: [
    "Mapa de Calor",
    "Perfil Eleitoral",
    "Ofícios",
    "IA de Demandas",
    "IA de Ofícios",
    "Relatórios PDF",
    "Observatório BI",
    "Emendas",
  ],
  silver: [
    "Observatório BI",
    "Emendas",
    "Banco de Instituições",
    "Usuários ilimitados",
    "Suporte prioritário",
  ],
  gold: [],
};
```

---

## TAREFA 2 — `src/components/subscription/PlanoFaturamentoTab.tsx`
**Ação:** Modificar (redesenho completo)

### O que fazer:
Substituir o conteúdo por nova UI com:

1. **Header de plano atual** — card com nome do plano, status (ativo/trial/pendente), 
   data de renovação, badge colorido
2. **Seção de uso** — "X de Y usuários", "X de Y eleitores" (barras de progresso simples)
3. **3 cards de plano** — lado a lado em grid (ou stacked no mobile)
   - Plano atual: borda destacada (qg-blue-600), badge "Plano atual"
   - Outros planos: mostrar features + botão upgrade
   - "Mais popular": badge âmbar no Profissional
4. **Cada card** deve ter:
   - Nome público (Essencial/Profissional/Completo)
   - Preço com whitespace-nowrap
   - Lista de features com ícones ✓
   - Features bloqueadas (com ícone de cadeado) no plano inferior
   - Botão de upgrade (chama createMpPreference ou exibe contato)
5. **Seção de pagamento** — método atual, última cobrança, próxima cobrança
6. **NÃO mencionar N4** em nenhum lugar

### Estrutura de dados:
```typescript
// Import do hook atualizado
import { 
  useSubscription, PLAN_LABELS, PLAN_PRICES, PLAN_FEATURES, 
  PLAN_LOCKED_FEATURES, PLAN_USER_LIMITS, type PlanKey 
} from "@/hooks/useSubscription";
```

### Layout mobile (375px):
```
┌─────────────────────────┐
│ SEU PLANO ATUAL          │
│ Profissional  [Ativo ✓] │
│ Renova em 15/04/2026    │
├─────────────────────────┤
│ USO                      │
│ Usuários: 4/10  ████░░░ │
│ Eleitores: ilimitado    │
├─────────────────────────┤
│ [ESSENCIAL] [PROFISS✓] [COMPLETO] │  ← tabs ou cards stack
│                          │
│ R$ 497/mês              │
│ ✓ Feature 1             │
│ ✓ Feature 2             │
│ 🔒 Feature bloqueada    │
│                          │
│ [Plano atual]           │
└─────────────────────────┘
```

### Ícones a usar (lucide-react@0.462.0):
- Crown → plano Completo
- Zap → plano Profissional  
- Star → plano Essencial
- Check (CheckCircle2) → feature incluída
- Lock → feature bloqueada
- Users → limite de usuários
- CalendarDays → data de renovação
- CreditCard → pagamento

---

## TAREFA 3 — `src/pages/Plano.tsx`
**Ação:** Modificar (mínimo)

### O que fazer:
Atualizar apenas o subtítulo para refletir os 3 novos planos:
```tsx
// Antes:
<p>Gerencie seu plano e faturamento</p>

// Depois:
<p>Escolha o plano ideal para o seu gabinete</p>
```

---

## TAREFA 4 — `src/App.tsx`
**Ação:** Modificar

### O que fazer:
Adicionar proteção de nível mínimo nas rotas de features N4, para que N1/N2/N3
não consigam acessar via URL direta. Usar o padrão `useAuth().roleLevel` com redirect.

### Code snippet:
Criar inline guard ou usar componente existente `ProtectedRoute`:
```tsx
// Verificar se ProtectedRoute em src/components/ProtectedRoute.tsx já aceita minLevel
// Se sim, usar:
<Route path="/observatorio" element={
  <ProtectedRoute minLevel={4}>
    <AppLayout><ObservatorioLegislativo /></AppLayout>
  </ProtectedRoute>
} />

<Route path="/gestao-base" element={
  <ProtectedRoute minLevel={4}>
    <AppLayout><GestaoBase /></AppLayout>
  </ProtectedRoute>
} />

// Se ProtectedRoute não aceita minLevel, adicionar redirect inline:
// Verificar auth.roleLevel < 4 → navigate("/")
```

### Verificar primeiro:
Ler src/components/ProtectedRoute.tsx para ver props disponíveis.
Se não tiver minLevel, adicionar prop `minLevel?: number` e redirect.

---

## TAREFA 5 — `src/components/admin/SubscricoesPanel.tsx`
**Ação:** Modificar

### O que fazer:
Substituir exibição de bronze/silver/gold pelos nomes públicos Essencial/Profissional/Completo.
Importar `PLAN_LABELS` do hook e usar para renderizar.

```typescript
import { PLAN_LABELS, type PlanKey } from "@/hooks/useSubscription";

// Onde renderiza o plan_type, trocar por:
{PLAN_LABELS[sub.plan_type as PlanKey] ?? sub.plan_type}

// No select de edição:
<SelectItem value="bronze">Essencial (R$ 197)</SelectItem>
<SelectItem value="silver">Profissional (R$ 497)</SelectItem>
<SelectItem value="gold">Completo (R$ 997)</SelectItem>
```

---

## TAREFA 6 — `src/components/subscription/PlanBadge.tsx` (se existir)
**Ação:** Modificar

### O que fazer:
Atualizar labels no badge para usar PLAN_LABELS ao invés de "Bronze"/"Prata"/"Ouro".
```typescript
import { PLAN_LABELS, type PlanKey } from "@/hooks/useSubscription";
const label = PLAN_LABELS[plan as PlanKey] ?? plan;
```

---

## Ordem de implementação

```
1. useSubscription.ts       ← Base de dados (sem deps)
2. PlanBadge.tsx            ← Usa PLAN_LABELS (deps: tarefa 1)
3. PlanoFaturamentoTab.tsx  ← Usa hook atualizado (deps: tarefa 1)
4. Plano.tsx                ← Wrapper (deps: tarefa 3)
5. SubscricoesPanel.tsx     ← Admin view (deps: tarefa 1)
6. App.tsx + ProtectedRoute ← Route guards (independente)
```

---

## Notas finais

- **NÃO mencionar N4** em nenhum texto da UI pública
- **NÃO mostrar** "Observatório Legislativo" ou "Gestão de Base" como feature em nenhum plano
- Manter DB enums bronze/silver/gold — só a UI muda
- O N5 continua vendo tudo no Sistema Master, inclusive gerenciando planos manualmente
- Não criar nova rota `/pricing` — usar a `/plano` existente (já no menu)
