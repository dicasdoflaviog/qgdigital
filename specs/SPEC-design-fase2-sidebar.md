# SPEC — Design Fase 2: Sidebar e Navegação
> Versão: 1.0 | Março 2026
> Pré-requisito: SPEC-design-fase1-tokens implementada e build passando
> Arquivos: AppSidebar.tsx, MobileDrawer.tsx, BottomBar.tsx, AppLayout.tsx

---

## Regras absolutas desta SPEC
- NÃO alterar lógica de role/permissão
- NÃO alterar lógica de navegação (rotas, NavLink, activeClassName)
- NÃO alterar z-index
- Apenas classes CSS e estrutura visual
- Nenhuma informação empilhada — cada elemento em sua linha

---

## TAREFA 1 — `src/components/layout/AppSidebar.tsx`

### 1A — Item ativo da sidebar (linha ~175)

```tsx
// ATUAL
className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
  collapsed ? "justify-center px-0" : ""
} ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}

// NOVO — item ativo: fundo azul claro, texto azul escuro
//        item inativo: cinza discreto, hover azul claro suave
className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
  collapsed ? "justify-center px-0" : ""
} ${active
  ? "bg-[#eff6ff] text-[#1d4ed8] font-medium"
  : "text-slate-500 hover:bg-[#f8fafc] hover:text-slate-700"
}`}
```

### 1B — Ícone do item ativo (mesma linha do className acima)
O ícone deve herdar a cor do texto — nenhuma alteração necessária pois usa `stroke="currentColor"`.

### 1C — Adicionar card de upgrade na sidebar (antes do bloco do user profile, linha ~330)

Localizar o comentário `{/* ── RODAPÉ: Configurações, Perfil, Sair ── */}` e adicionar ANTES do `renderFooterLink` de Configurações:

```tsx
{/* ── Upgrade Card — visível para L1-L4 ── */}
{!isL5 && !collapsed && (
  <div className="mx-2 mb-3 rounded-xl bg-[#1e293b] p-3">
    <p className="text-[11.5px] font-medium text-white leading-tight">
      Plano Básico
    </p>
    <p className="text-[10px] text-white/45 leading-relaxed mt-1">
      Relatórios avançados e IA no Pro.
    </p>
    <button
      className="mt-2.5 w-full rounded-lg bg-[#2563eb] py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-[#1d4ed8] active:bg-[#1e40af]"
      onClick={() => navigate("/plano")}
    >
      Fazer upgrade
    </button>
  </div>
)}
```

> ⚠️ `navigate` já está disponível no componente via `useNavigate` — não importar de novo.
> Se `navigate` não existir no AppSidebar, adicionar: `const navigate = useNavigate();`

### 1D — Separador visual entre grupos (renderGroup)

Nenhuma alteração necessária — os grupos já têm separação via `SidebarGroupLabel`.

### 1E — Footer link de Configurações (linha ~332)

```tsx
// ATUAL — renderFooterLink usa as mesmas classes do item ativo
// Ajustar para usar as mesmas classes novas:

// LOCALIZAR dentro de renderFooterLink:
className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
  collapsed ? "justify-center px-0" : ""
} ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}

// SUBSTITUIR por:
className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
  collapsed ? "justify-center px-0" : ""
} ${active
  ? "bg-[#eff6ff] text-[#1d4ed8] font-medium"
  : "text-slate-500 hover:bg-[#f8fafc] hover:text-slate-700"
}`}
```

### 1F — User profile link no footer (linha ~365)

```tsx
// ATUAL
className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
  collapsed ? "justify-center px-0" : ""
} ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}

// SUBSTITUIR por:
className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
  collapsed ? "justify-center px-0" : ""
} ${active
  ? "bg-[#eff6ff] text-[#1d4ed8] font-medium"
  : "text-slate-500 hover:bg-[#f8fafc] hover:text-slate-700"
}`}
```

### 1G — Botões Sugerir Melhoria e Sair (linhas ~400-416)

```tsx
// Sugerir Melhoria — ATUAL
className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-all ...`}

// NOVO
className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-500 hover:bg-[#f8fafc] hover:text-slate-700 transition-all ${collapsed ? "justify-center px-0" : ""}`}

// Sair — ATUAL
className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ...`}

// MANTER IGUAL — cor vermelha do sair está correta
```

---

## TAREFA 2 — `src/components/layout/MobileDrawer.tsx`

### 2A — Item ativo do drawer (linha ~85)

```tsx
// ATUAL
className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
  active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
}`}

// NOVO
className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
  active
    ? "bg-[#eff6ff] text-[#1d4ed8] font-medium"
    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
}`}
```

### 2B — Adicionar card de upgrade no MobileDrawer (antes do Separator no final)

Localizar `<Separator />` no rodapé do drawer e adicionar ANTES dele:

```tsx
{/* Upgrade card mobile */}
<div className="mx-3 mb-3 rounded-xl bg-[#1e293b] p-3">
  <p className="text-[11.5px] font-medium text-white">Plano Básico</p>
  <p className="text-[10px] text-white/45 leading-relaxed mt-1">
    Relatórios avançados e IA no Pro.
  </p>
  <button
    className="mt-2.5 w-full rounded-lg bg-[#2563eb] py-2 text-[11px] font-medium text-white active:bg-[#1e40af]"
    onClick={() => { onOpenChange(false); navigate("/plano"); }}
  >
    Fazer upgrade
  </button>
</div>
```

> ⚠️ `navigate` já existe no MobileDrawer via `useNavigate` — não importar de novo.

---

## TAREFA 3 — `src/components/layout/BottomBar.tsx`

### 3A — Item ativo da bottom nav (linha ~33)

```tsx
// ATUAL — dentro do componente NavItem
<div className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${active ? "bg-primary/10" : ""}`}>
  <item.icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
</div>
<span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>

// NOVO — fundo azul 50 no item ativo, texto azul
<div className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${active ? "bg-[#eff6ff]" : ""}`}>
  <item.icon className={`h-5 w-5 ${active ? "text-[#2563eb]" : "text-slate-400"}`} />
</div>
<span className={`text-[10px] font-medium ${active ? "text-[#2563eb]" : "text-slate-400"}`}>
```

### 3B — FAB central da bottom nav (linha ~58)

```tsx
// ATUAL
className="flex items-center justify-center h-14 w-14 -mt-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-transform"

// NOVO — mesmo visual mas com cor explícita e rounded-2xl (16px)
className="flex items-center justify-center h-14 w-14 -mt-4 rounded-2xl bg-[#2563eb] text-white shadow-lg shadow-blue-600/25 active:scale-95 transition-transform touch-manipulation"
```

---

## TAREFA 4 — `src/components/layout/AppLayout.tsx`

### 4A — Adicionar toggle de tema no header

Localizar o bloco do header onde estão `NotificationBell` e `RoleSwitcher` (linha ~90):

```tsx
// ADICIONAR import no topo do arquivo:
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

// ADICIONAR dentro do componente AppLayout (após os useState existentes):
const { theme, setTheme } = useTheme();

// ADICIONAR no header, ANTES do NotificationBell:
<button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
  aria-label="Alternar tema"
>
  {theme === "dark"
    ? <Sun className="h-4 w-4" />
    : <Moon className="h-4 w-4" />
  }
</button>
```

> ⚠️ `next-themes` já está instalado (`"next-themes": "^0.3.0"` no package.json).
> Verificar se `ThemeProvider` já envolve o app em `main.tsx` — se não, adicionar.

---

## ✅ Checklist de validação

### Build
- [ ] `npm run build` passa com 0 erros

### Visual desktop — verificar no browser
- [ ] Sidebar: item ativo com fundo `#eff6ff` e texto `#1d4ed8`
- [ ] Sidebar: itens inativos em `text-slate-500`
- [ ] Sidebar: hover suave sem cor agressiva
- [ ] Sidebar: card de upgrade visível no rodapé (apenas L1-L4, não L5)
- [ ] Sidebar: card de upgrade OCULTO quando collapsed
- [ ] Toggle de tema no header, lado direito
- [ ] Toggle funciona: alterna entre ☀️ e 🌙

### Visual mobile — verificar em 375px
- [ ] MobileDrawer: item ativo com mesmo visual da sidebar
- [ ] MobileDrawer: card de upgrade visível
- [ ] BottomBar: item ativo com fundo `#eff6ff` e ícone `#2563eb`
- [ ] FAB central azul com cantos arredondados

### Funcional
- [ ] Navegação entre páginas continua funcionando
- [ ] Role-based filtering da sidebar não quebrou
- [ ] Botão de upgrade navega para `/plano`

### O que NÃO deve mudar
- [ ] Nenhuma rota quebrou
- [ ] RoleSwitcher no header continua visível
- [ ] NotificationBell continua funcionando
- [ ] Lógica de simulação de roles (N5) intacta

---

## 📌 Ordem de implementação
1. `AppSidebar.tsx` — tarefas 1A até 1G
2. `MobileDrawer.tsx` — tarefas 2A e 2B
3. `BottomBar.tsx` — tarefas 3A e 3B
4. `AppLayout.tsx` — tarefa 4A (toggle de tema)
5. `npm run build` — deve passar
6. Testar em desktop e mobile

## 🚫 O que NÃO fazer
- Não alterar rotas ou lógica de permissão
- Não remover o RoleSwitcher
- Não adicionar novos FABs (só o existente + o de chat)
- Não usar font-bold ou font-semibold
- Não usar CAPS em labels
