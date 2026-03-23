# ⚡ QG Digital - Design System

> CRM Eleitoral para vereadores, assessores e equipes políticas.
> **FOCO PRINCIPAL: Mobile-first** — assessores usam na rua, em campo.

---

## 🚨 REGRAS ABSOLUTAS - LER PRIMEIRO

**ANTES de escrever qualquer código, o Claude DEVE seguir estas regras:**

### ❌ PROIBIDO - NUNCA FAZER:
1. **NUNCA** usar CAPS LOCK em títulos (usar sentence case: "Gestão de ofícios")
2. **NUNCA** adicionar FABs extras - apenas UM botão flutuante por tela (+ o ChatIA)
3. **NUNCA** usar modal centralizado na tela - usar BottomSheet (vem de baixo)
4. **NUNCA** deixar espaço em branco abaixo da bottom navigation
5. **NUNCA** deixar texto/números quebrar linha em KPI cards
6. **NUNCA** usar font-size menor que 16px em inputs (causa zoom no iOS)
7. **NUNCA** usar z-index arbitrário - seguir escala definida
8. **NUNCA** usar cores fora da paleta `qg-*`
9. **NUNCA** usar font-weight 600 ou 700 (apenas 400 e 500)
10. **NUNCA** usar sombras pesadas (shadow-xl, shadow-2xl)
11. **NUNCA** hardcodar nome do assistente IA (usar campo dinâmico)

### ✅ OBRIGATÓRIO - SEMPRE FAZER:
1. **SEMPRE** testar layout em viewport 375px primeiro
2. **SEMPRE** usar BottomSheet para formulários e ações
3. **SEMPRE** usar `whitespace-nowrap` em números/KPIs
4. **SEMPRE** usar `pb-safe` na bottom navigation
5. **SEMPRE** usar touch targets de no mínimo 44x44px
6. **SEMPRE** usar `inputMode` correto em inputs (tel, email, numeric)
7. **SEMPRE** posicionar ações principais na thumb zone (parte inferior)
8. **SEMPRE** usar a paleta de cores `qg-blue`, `qg-green`, `qg-amber`, `qg-red`
9. **SEMPRE** usar `font-medium` (500) para títulos, nunca `font-bold` (700)

### 📐 Z-INDEX OBRIGATÓRIO:
```
header:        z-40
fab:           z-45
bottom-nav:    z-50
detail-sheet:  z-60
backdrop:      z-70
modal/dialog:  z-80
toast:         z-90
```

---

## 👥 NÍVEIS DE ACESSO DO SISTEMA

O QG Digital possui 5 níveis de acesso hierárquicos:

| Nível | Role ID | Nome | Descrição |
|-------|---------|------|-----------|
| N1 | `secretaria` | Secretária | Acesso básico, cadastros |
| N2 | `assessor` | Assessor | Cadastro e atendimento em campo |
| N3 | `vereador` | Vereador | Visão do gabinete completa |
| N4 | `lider_politico` | Líder Político | Gestão regional |
| N5 | `super_admin` | System Master | Acesso total + simulação de níveis |

### Regras de permissão:
```tsx
// Verificar nível do usuário
const { effectiveRole } = useRoleSimulator();

// Mostrar apenas para N3+
{effectiveRole >= 3 && <VereadorSection />}

// Mostrar apenas para N5
{effectiveRole === 5 && <SystemMasterSection />}
```

### RoleSwitcher (apenas N5):
- Componente no header para simular outros níveis
- Permite testar a visualização como outros usuários veriam
- Indicador visual "Simulando" quando ativo
- Reset automático ao fazer refresh

---

## 🤖 ASSISTENTE IA - NOME DINÂMICO

O assistente de IA **NÃO deve ter nome hardcoded**. O nome vem das configurações:

```tsx
// ❌ ERRADO - Nome fixo:
const name = "AGUIA";
<h1>AGUIA</h1>

// ✅ CORRETO - Nome dinâmico:
const name = gabConfig?.ia_nome || profile?.assistant_name || "Assistente";
<h1>{name}</h1>
```

### Prioridade de fallback:
1. `gabinete_config.ia_nome` (configuração do gabinete)
2. `profiles.assistant_name` (preferência do usuário)
3. `"Assistente"` (fallback neutro)

### Onde o nome aparece:
- Botão flutuante do chat (ex: "JARVIS IA")
- Header do chat
- Mensagens de sistema
- Menções nas respostas

---

## 🎯 Contexto do Produto

- **Produto**: QG Digital - CRM Eleitoral
- **Usuários principais**: Vereadores e assessores (pouco técnicos)
- **Contexto de uso**: 80% mobile, em campo, muitas vezes com sol forte
- **Tom**: Profissional mas acessível
- **Telas críticas**: Dashboard, Mapa de Calor, Lista de Eleitores

---

## 📱 REGRA #1: MOBILE-FIRST SEMPRE

### Princípios Fundamentais

```
✅ Projetar primeiro para tela de 375px
✅ Touch targets mínimo 44x44px (idealmente 48px)
✅ Textos legíveis ao sol (contraste alto)
✅ Ações principais na "thumb zone" (parte inferior)
✅ Uma ação por tela sempre que possível
✅ Feedback tátil e visual imediato
✅ Funcionar bem em conexões lentas

❌ NUNCA fazer hover states essenciais (não existe hover no mobile)
❌ NUNCA usar fontes menores que 14px para body
❌ NUNCA colocar ações críticas no topo da tela
❌ NUNCA depender de gestos complexos
```

### Thumb Zone - Áreas de Alcance

```
┌─────────────────────┐
│   DIFÍCIL ALCANCE   │  ← Informações, títulos
│                     │
│   ALCANCE MÉDIO     │  ← Conteúdo secundário
│                     │
│   FÁCIL ALCANCE     │  ← AÇÕES PRINCIPAIS AQUI
│  (zona do polegar)  │
└─────────────────────┘
```

**Regra**: Botões de ação principal (salvar, enviar, novo) SEMPRE na parte inferior da tela.

---

## 🎨 Paleta de Cores

### Cores Primárias

```css
/* Azul QG Digital - Identidade da marca */
--qg-blue-900: #1E3A8A;     /* Textos importantes, headers */
--qg-blue-700: #1D4ED8;     /* Links, ações secundárias */
--qg-blue-600: #2563EB;     /* CTAs principais, botões */
--qg-blue-500: #3B82F6;     /* Hover states (desktop) */
--qg-blue-100: #DBEAFE;     /* Backgrounds sutis, badges */
--qg-blue-50: #EFF6FF;      /* Backgrounds de cards ativos */
```

### Cores de Status - CRÍTICAS para CRM

```css
/* Sucesso - Eleitor ativo, ação concluída */
--qg-green-700: #15803D;
--qg-green-600: #16A34A;
--qg-green-100: #DCFCE7;
--qg-green-50: #F0FDF4;

/* Alerta - Pendente, requer atenção */
--qg-amber-700: #B45309;
--qg-amber-600: #D97706;
--qg-amber-100: #FEF3C7;
--qg-amber-50: #FFFBEB;

/* Erro/Urgente - Crise, atrasado */
--qg-red-700: #B91C1C;
--qg-red-600: #DC2626;
--qg-red-100: #FEE2E2;
--qg-red-50: #FEF2F2;

/* Info - Neutro, em análise */
--qg-slate-700: #334155;
--qg-slate-600: #475569;
--qg-slate-400: #94A3B8;
--qg-slate-200: #E2E8F0;
--qg-slate-100: #F1F5F9;
--qg-slate-50: #F8FAFC;
```

### Cores para Gráficos e Mapas

```css
/* Mapa de calor - Prioridade de demandas */
--heat-low: #3B82F6;      /* Azul - baixa prioridade */
--heat-medium: #F59E0B;   /* Âmbar - média prioridade */
--heat-high: #EF4444;     /* Vermelho - alta prioridade */

/* Gráficos de barras - Sempre usar nesta ordem */
--chart-1: #2563EB;       /* Primário */
--chart-2: #16A34A;       /* Secundário */
--chart-3: #D97706;       /* Terciário */
--chart-4: #7C3AED;       /* Quaternário */
```

---

## 📝 Tipografia

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Por que Inter?** Excelente legibilidade em telas pequenas, suporta números tabulares.

### Escala de Tamanhos - MOBILE FIRST

```css
/* Mobile (base) */
--text-xs: 12px;      /* Labels mínimos, timestamps */
--text-sm: 14px;      /* Textos secundários, hints */
--text-base: 16px;    /* Body principal - MÍNIMO para leitura */
--text-lg: 18px;      /* Subtítulos, destaques */
--text-xl: 20px;      /* Títulos de seção */
--text-2xl: 24px;     /* Títulos de página */
--text-3xl: 30px;     /* Números grandes (KPIs) */

/* Line Heights */
--leading-tight: 1.25;    /* Títulos */
--leading-normal: 1.5;    /* Body */
--leading-relaxed: 1.625; /* Textos longos */

/* Font Weights - APENAS DOIS */
--font-normal: 400;   /* Body text */
--font-medium: 500;   /* Títulos, labels, botões */
```

### ⚠️ Regras Críticas de Tipografia

```
❌ NUNCA usar font-weight 600 ou 700 (muito pesado)
❌ NUNCA usar font-bold ou font-semibold
❌ NUNCA usar texto menor que 12px
❌ NUNCA usar CAPS LOCK em títulos
❌ NUNCA usar uppercase em títulos ou labels
❌ NUNCA centralizar textos longos

✅ SEMPRE usar sentence case (primeira letra maiúscula)
✅ SEMPRE usar font-medium (500) para destaque
✅ SEMPRE manter contraste mínimo 4.5:1
✅ SEMPRE usar números tabulares em tabelas
```

---

## 📐 Sistema de Espaçamento

### Grid de 4px (Mobile-Friendly)

```css
--space-1: 4px;    /* Micro ajustes */
--space-2: 8px;    /* Gap mínimo entre elementos */
--space-3: 12px;   /* Padding interno de badges */
--space-4: 16px;   /* Padding padrão de cards */
--space-5: 20px;   /* Separação de seções */
--space-6: 24px;   /* Padding de containers */
--space-8: 32px;   /* Separação de blocos */
--space-10: 40px;  /* Margens de página mobile */
--space-12: 48px;  /* Altura de headers mobile */
```

### Safe Areas - Mobile

```css
/* Respeitar notch e home indicator */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

---

## 🔘 Componentes Mobile-First

### Botões

```tsx
// Botão primário - SEMPRE 48px de altura no mobile
<Button className="
  w-full h-12                    /* Altura mínima 48px */
  bg-qg-blue-600 
  active:bg-qg-blue-700          /* Active state, não hover */
  text-white text-base font-medium
  rounded-xl                      /* Bordas mais arredondadas no mobile */
  flex items-center justify-center gap-2
  touch-manipulation              /* Otimiza para touch */
  select-none                     /* Evita seleção de texto */
">
  <PlusIcon className="w-5 h-5" />
  Novo eleitor
</Button>

// Botão secundário
<Button className="
  w-full h-12
  bg-transparent
  border-2 border-qg-blue-600
  text-qg-blue-600
  active:bg-qg-blue-50
  rounded-xl
  font-medium
">
  Cancelar
</Button>

// Botão de ação rápida (FAB)
<Button className="
  fixed bottom-24 right-4        /* Acima da bottom nav */
  w-14 h-14                       /* 56px - fácil de tocar */
  bg-qg-blue-600 
  active:bg-qg-blue-700
  rounded-full
  shadow-lg
  flex items-center justify-center
  z-fab                           /* z-45 */
">
  <PlusIcon className="w-6 h-6 text-white" />
</Button>
```

### KPI Cards - COM whitespace-nowrap

```tsx
// ✅ CORRETO - Números nunca quebram linha
function KPICard({ icon, iconBg, iconColor, value, label, highlight }) {
  return (
    <div className={`
      p-4 rounded-2xl border min-w-0
      ${highlight 
        ? 'bg-qg-red-50 border-qg-red-200' 
        : 'bg-white border-slate-200'
      }
    `}>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-2xl font-medium text-slate-900 whitespace-nowrap">
        {value}
      </p>
      <p className="text-sm font-medium text-slate-500 whitespace-nowrap">
        {label}
      </p>
    </div>
  );
}
```

### Bottom Navigation

```tsx
<nav className="
  fixed bottom-0 left-0 right-0
  h-16
  bg-white border-t border-slate-200
  flex items-center justify-around
  z-bottom-nav                    /* z-50 */
  pb-safe                         /* Safe area */
">
  <NavItem icon={<HomeIcon />} label="Painel" active />
  <NavItem icon={<MapIcon />} label="Mapa" />
  <NavItem icon={<UsersIcon />} label="Eleitores" badge={5} />
  <NavItem icon={<FileTextIcon />} label="Ofícios" />
  <NavItem icon={<TrophyIcon />} label="Ranking" />
</nav>
```

---

## 🚫 O QUE NUNCA FAZER

### Visual
```
❌ Gradientes roxo/azul genéricos
❌ Sombras exageradas (shadow-xl, shadow-2xl)
❌ Bordas muito arredondadas (rounded-3xl)
❌ Ícones decorativos sem função
❌ Animações longas (>300ms)
❌ Muitas cores competindo na mesma tela
❌ Cards dentro de cards
❌ Texto branco em fundo claro
❌ CAPS LOCK ou uppercase em títulos
❌ font-bold, font-semibold, font-black
```

### Mobile Específico
```
❌ Hover states como única forma de feedback
❌ Menus dropdown tradicionais (usar bottom sheet)
❌ Scroll horizontal não óbvio
❌ Botões menores que 44x44px
❌ Formulários longos sem divisão em steps
❌ Modais centralizados (usar BottomSheet)
❌ Teclado cobrindo inputs ativos
❌ Gestos complexos sem alternativa
❌ FABs extras além do principal + ChatIA
```

### Código
```
❌ Misturar Tailwind com CSS inline
❌ Espaçamentos não padronizados (gap-3, gap-5, gap-7)
❌ Cores fora da paleta definida
❌ Componentes sem estados de loading
❌ Listas sem skeleton loading
❌ Formulários sem validação visual
❌ Nome do assistente IA hardcoded
❌ z-index arbitrário (usar escala)
```

---

## ✅ CHECKLIST ANTES DE IMPLEMENTAR

### Mobile
- [ ] Touch targets >= 44px
- [ ] Ações principais na thumb zone
- [ ] Formulários com inputMode correto
- [ ] Safe areas respeitadas
- [ ] Funciona offline (loading states)
- [ ] Texto >= 16px nos inputs (evita zoom iOS)

### Visual
- [ ] Contraste >= 4.5:1
- [ ] Máximo 2-3 cores por tela
- [ ] Hierarquia clara (o que olhar primeiro?)
- [ ] Feedback visual em todas as ações
- [ ] Estados de vazio tratados
- [ ] Estados de erro claros
- [ ] Títulos em sentence case (não CAPS)
- [ ] font-medium (não font-bold)

### Código
- [ ] Componentes reutilizáveis
- [ ] Classes Tailwind consistentes
- [ ] Sem CSS customizado desnecessário
- [ ] Responsivo (testar em 375px)
- [ ] whitespace-nowrap em KPIs
- [ ] z-index da escala definida

---

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/                     # Primitivos (Button, Input, Card)
│   ├── mobile/                 # Componentes mobile-specific
│   │   ├── BottomSheet.tsx
│   │   ├── BottomNav.tsx
│   │   └── PullToRefresh.tsx
│   ├── RoleSwitcher.tsx        # Dropdown de simulação N5
│   ├── ChatIA.tsx              # Chat do assistente (nome dinâmico)
│   ├── eleitores/
│   ├── mapa/
│   └── dashboard/
├── hooks/
│   ├── useRoleSimulator.ts     # Hook de simulação de níveis
│   └── useGabinete.ts          # Dados do gabinete
├── contexts/
│   └── RoleContext.tsx         # Context de roles/permissões
├── styles/
│   ├── globals.css
│   └── tokens.css
└── pages/
    └── ...
```

---

## 🔧 WORKFLOW DE DESENVOLVIMENTO (SDD)

Para novas features, seguir o método **Spec-Driven Development**:

### 1. RESEARCH (Pesquisa)
```
Prompt: "Pesquise sobre [feature]. Identifique:
- Arquivos afetados
- Padrões existentes no código
- Documentações relevantes
Gere um PRD.md"
```

### 2. SPEC (Planejamento)
```
Prompt: "Com base no PRD, gere uma SPEC.md com:
- Lista exata de arquivos a criar/modificar
- O que fazer em cada arquivo
- Code snippets específicos"
```

### 3. CODE (Implementação)
```
Prompt: "@SPEC-[nome].md
Implemente esta SPEC completamente.
Mostre cada alteração feita."
```

**Benefícios:**
- Context window otimizada
- Implementação one-shot
- Código mais assertivo
- Menos retrabalho

---

## 📜 HISTÓRICO DE CORREÇÕES

### v1.1 (Março 2026)
- ✅ Removido FAB roxo (RoleSimulatorFAB)
- ✅ Títulos convertidos para sentence case (13 arquivos)
- ✅ KPI cards com whitespace-nowrap
- ✅ font-bold → font-medium em todos os componentes
- ✅ Subtítulos removidos uppercase (Configurações, Calendário)
- ✅ Z-index organizado (dialog z-80, toast z-90)
- ✅ Bottom nav z-index corrigido
- ✅ Fallback do assistente IA: "Águia" → "Assistente"
- ✅ RoleSwitcher movido para header (pendente implementação)

---

## 🎨 Referências Visuais

- **Padrão de qualidade**: Linear, Notion, Stripe (mobile apps)
- **Não imitar**: Apps governamentais tradicionais, designs "enterprise"
- **Inspiração mobile**: iOS Human Interface Guidelines, Material 3

---

*Este documento deve ser seguido em TODAS as implementações. Mobile-first não é opcional.*
*Última atualização: Março 2026*
