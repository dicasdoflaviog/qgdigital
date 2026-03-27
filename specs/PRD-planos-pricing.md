# PRD — Planos & Pricing (QG Digital)

## Objetivo
Reestruturar o sistema de planos comerciais do QG Digital para refletir 3 tiers públicos
focados no Vereador (N3) como cliente principal. N4 é canal enterprise/oculto (negociação
pessoal, adicionado manualmente pelo N5). Nenhum usuário N1/N2/N3 deve saber da existência
do N4 ou de suas features exclusivas.

---

## Contexto técnico

### Banco de dados
- Tabela `subscriptions` com enum `plan_type: bronze | silver | gold`
- Campo `status: active | trialing | pending | past_due | canceled`
- Um registro por gabinete (UNIQUE gabinete_id)
- Pagamento via Mercado Pago (campos mp_*) ou ativação manual L5

### Mapeamento interno → público
| DB enum  | Nome público  | Preço     |
|----------|---------------|-----------|
| bronze   | Essencial     | R$ 197/mês |
| silver   | Profissional  | R$ 497/mês |
| gold     | Completo      | R$ 997/mês |

> Não criar novos enums. Manter bronze/silver/gold no DB, renomear apenas na UI.

### Features por plano

#### Essencial (bronze — R$ 197)
- Dashboard com KPIs
- Eleitores (até 500 cadastros)
- Agenda de reuniões
- Guia de Soluções
- Entrada por voz (campo)
- App offline
- 3 usuários (1 vereador + 2 assessores)

#### Profissional (silver — R$ 497) ★ Mais popular
- Tudo do Essencial
- Eleitores ilimitados
- Perfil Eleitoral (demografias: sexo, faixa etária, bairros)
- Mapa de Calor (geolocalização)
- Equipe & Ranking de assessores
- Calendário político
- Ofícios (ciclo completo)
- Identidade do Gabinete (branding)
- IA de Demandas (triagem automática)
- IA de Ofícios (redação automática)
- Geração de mensagens personalizadas
- Relatórios em PDF
- 10 usuários

#### Completo (gold — R$ 997)
- Tudo do Profissional
- Observatório BI (análises avançadas)
- Emendas parlamentares
- Banco de Instituições estratégicas
- Usuários ilimitados
- Suporte prioritário via WhatsApp
- Onboarding dedicado

### N4 — Canal oculto
- NÃO aparece na página de planos
- NÃO é mencionado em nenhum lugar visível para N1/N2/N3
- Features N4 (Observatório Legislativo, Gestão de Base): acessíveis somente via URL
  direta quando o role_level do usuário for 4 — mas precisam de proteção de rota
- N5 adiciona N4 manualmente via Sistema Master (SubscricoesPanel)

---

## Arquivos existentes relevantes

### src/hooks/useSubscription.ts
- `PLAN_PRICES`: bronze=0, silver=197, gold=297 → **MUDAR: bronze=197, silver=497, gold=997**
- Falta: `PLAN_LABELS` (nomes públicos), `PLAN_FEATURES` (features por plano)
- `useSubscription(gabineteId?)`: busca sub do gabinete atual
- `useAllSubscriptions()`: L5, lista tudo
- `createMpPreference()`, `upsert()`: mutations

### src/components/subscription/PlanoFaturamentoTab.tsx
- Já existe, mostra plano atual + cards de upgrade
- Usa bronze/silver/gold com nomes antigos → **redesenhar completamente**
- Precisa: 3 cards visuais (Essencial/Profissional/Completo), destaque no plano atual,
  checklist de features por plano, botão de upgrade com MP

### src/pages/Plano.tsx
- Wrapper simples que renderiza `PlanoFaturamentoTab`
- Header: "Plano e faturamento" → **manter, ajustar subtítulo**

### src/App.tsx
- Rotas `/observatorio` e `/gestao-base` sem proteção de nível mínimo
- **Adicionar guards: minLevel=4 para essas rotas**

### src/components/layout/AppSidebar.tsx
- Grupo `estrategico` com `exactLevels: [4, 5]` → já filtrado
- **Verificar**: não há nenhuma menção visual de "N4" ou "Estratégico" para N<4

### src/components/admin/SubscricoesPanel.tsx
- Tabela admin de subs — usa labels bronze/silver/gold
- **Atualizar labels**: mostrar "Essencial", "Profissional", "Completo"

---

## Padrões do projeto a seguir
- Mobile-first, viewport 375px primeiro
- Sentence case nos títulos (nunca CAPS)
- font-medium (500) apenas, nunca font-bold
- whitespace-nowrap em KPIs e preços
- Cores: qg-blue-*, qg-green-*, qg-amber-*, qg-red-*
- Cards com bordas suaves (rounded-2xl), sem sombras excessivas
- Botões h-12 (48px) mínimo
- Ícones disponíveis lucide-react@0.462.0: Crown, Zap, Star, Check, X, Lock, CreditCard, Sparkles
