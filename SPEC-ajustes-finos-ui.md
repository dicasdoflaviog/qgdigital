# SPEC - Ajustes Finos UI/UX Mobile

> **Baseado em:** PRD-ajustes-finos-ui.md
> **Ação:** Implementar conforme especificado abaixo
> **Método:** SDD (Spec-Driven Development)

---

## TAREFA 1: Corrigir textos CAPS LOCK restantes

### 1.1 GestaoBase.tsx
```
ARQUIVO: src/pages/GestaoBase.tsx

BUSCAR E SUBSTITUIR:

"FILTROS DE SEGMENTAÇÃO" → "Filtros de segmentação"
"EXPORTAR CONTATOS PARA LISTA DE TRANSMISSÃO" → "Exportar contatos para lista de transmissão"
"WHATSAPP EM MASSA" → "WhatsApp em massa"

BUSCAR em TableHeader ou <th>:
"NOME" → "Nome"
"WHATSAPP" → "WhatsApp"  
"AÇÃO" → "Ação"

REMOVER classes como:
- uppercase
- tracking-wider (quando junto com uppercase)
- font-bold (usar font-medium)
```

### 1.2 LogSugestoes.tsx
```
ARQUIVO: src/pages/LogSugestoes.tsx

BUSCAR E SUBSTITUIR:
"FEEDBACKS DA EQUIPE PARA O ROADMAP DO QG DIGITAL" 
→ "Feedbacks da equipe para o roadmap do QG Digital"

REMOVER classes uppercase do subtítulo.
```

### 1.3 Modal Sugerir Melhoria
```
ARQUIVO: src/components/SugerirMelhoria.tsx (ou onde estiver o modal)

BUSCAR E SUBSTITUIR:
"SUGERIR MELHORIA" → "Sugerir melhoria"
"PREFIRO DIGITAR" → "Prefiro digitar"

REMOVER classes uppercase.
```

### 1.4 Modal Novo Cadastro
```
ARQUIVO: src/components/NovoEleitor.tsx ou NovoEleitores.tsx ou similar

BUSCAR E SUBSTITUIR:
"NOVO CADASTRO" → "Novo cadastro"

REMOVER classes uppercase do título.
```

---

## TAREFA 2: Corrigir KPI Cards quebrando texto

### 2.1 Equipe.tsx
```
ARQUIVO: src/pages/Equipe.tsx

BUSCAR os KPI cards e adicionar whitespace-nowrap:

ANTES:
<span className="text-2xl font-medium">{count}</span>
<span className="text-sm text-muted-foreground">{label}</span>

DEPOIS:
<span className="text-2xl font-medium whitespace-nowrap">{count}</span>
<span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>

TAMBÉM adicionar min-w-0 no container do card se necessário:
<div className="... min-w-0">
```

### 2.2 Verificar grid dos KPIs
```
BUSCAR o grid que contém os KPIs:

ANTES (provavelmente):
<div className="grid grid-cols-3 gap-2">

DEPOIS (garantir espaço):
<div className="grid grid-cols-3 gap-3">

OU usar flex com wrap:
<div className="flex gap-3 overflow-x-auto">
```

---

## TAREFA 3: Converter Modais para BottomSheet

### 3.1 Verificar/criar componente BottomSheet
```
ARQUIVO: src/components/ui/bottom-sheet.tsx (criar se não existir)

Se já existir um Dialog, criar variante BottomSheet:

export function BottomSheet({ children, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        fixed 
        bottom-0 
        left-0 
        right-0 
        top-auto
        translate-y-0
        rounded-t-3xl
        rounded-b-none
        max-h-[90vh]
        overflow-y-auto
        pb-safe
        animate-slide-up
      ">
        {/* Handle visual */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4 mt-2" />
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### 3.2 Atualizar Modal Sugerir Melhoria
```
ARQUIVO: src/components/SugerirMelhoria.tsx

SUBSTITUIR Dialog/Modal por BottomSheet.

Se usar DialogContent, adicionar classes:
className="
  fixed bottom-0 left-0 right-0 top-auto
  rounded-t-3xl rounded-b-none
  max-h-[90vh] overflow-y-auto
  pb-safe
"
```

### 3.3 Atualizar Modal Novo Cadastro
```
ARQUIVO: src/components/NovoEleitor.tsx

MESMO PADRÃO - converter para BottomSheet.
Formulário longo deve ter scroll interno.
```

---

## TAREFA 4: Corrigir Safe Area

### 4.1 AppLayout ou Layout principal
```
ARQUIVO: src/components/AppLayout.tsx ou src/layouts/AppLayout.tsx

VERIFICAR se o main tem padding correto:

<main className="
  min-h-screen
  pt-safe           /* Respeitar notch */
  pb-20             /* Espaço para bottom nav (h-16 + margem) */
">
  {children}
</main>
```

### 4.2 BottomNav / BottomBar
```
ARQUIVO: src/components/BottomNav.tsx ou BottomBar.tsx

GARANTIR safe area no bottom:

<nav className="
  fixed bottom-0 left-0 right-0
  h-16
  bg-background/95 backdrop-blur
  border-t
  z-50
  pb-safe           /* CRÍTICO - safe area */
">
```

### 4.3 CSS necessário (se não existir)
```
ARQUIVO: src/styles/globals.css ou src/index.css

ADICIONAR se não existir:

.pt-safe {
  padding-top: env(safe-area-inset-top);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

.pl-safe {
  padding-left: env(safe-area-inset-left);
}

.pr-safe {
  padding-right: env(safe-area-inset-right);
}
```

---

## TAREFA 5: Corrigir elementos cortados

### 5.1 Calendário - Evento cortado
```
ARQUIVO: src/pages/Calendario.tsx

BUSCAR o container do evento/popover que aparece cortado.

ADICIONAR overflow e padding:

<div className="
  ... 
  mx-4              /* Margem lateral */
  max-w-[calc(100%-2rem)]  /* Não ultrapassar tela */
">
```

### 5.2 GestaoBase - Botão cortado
```
ARQUIVO: src/pages/GestaoBase.tsx

O botão "EXPORTAR CONTATOS..." está cortando.

SOLUÇÃO A - Truncar texto:
<Button className="... truncate max-w-full">
  Exportar contatos...
</Button>

SOLUÇÃO B - Quebrar linha (se botão full-width):
<Button className="w-full whitespace-normal text-center">
  Exportar contatos para lista de transmissão
</Button>

SOLUÇÃO C - Scroll horizontal (se múltiplos botões):
<div className="flex gap-2 overflow-x-auto px-4 -mx-4">
  <Button>...</Button>
</div>
```

---

## TAREFA 6: Ajustar FABs sobrepostos

### 6.1 Verificar posicionamento dos FABs
```
ARQUIVO: src/components/AppLayout.tsx ou onde FABs são renderizados

REGRA: Máximo 2 FABs (principal + IA)

POSICIONAMENTO CORRETO:
- FAB principal (+): bottom-24 right-4
- FAB IA (JARVIS): bottom-40 right-4 (ou bottom-6 right-20)

<div className="fixed bottom-24 right-4 z-fab flex flex-col gap-3">
  <FAB_IA />      {/* JARVIS - menor ou secundário */}
  <FAB_Principal />  {/* + Novo - maior */}
</div>

OU empilhar verticalmente:
<FAB_IA className="fixed bottom-40 right-4" />
<FAB_Principal className="fixed bottom-24 right-4" />
```

### 6.2 Modal Novo Cadastro - FABs dentro do modal
```
ARQUIVO: src/components/NovoEleitor.tsx

Se há FABs dentro do modal (microfone, IA), garantir que não sobreponham:

- FAB de microfone: posicionar inline ou ao lado do campo
- FAB de IA: pode ficar oculto durante cadastro

Alternativa: Microfone como botão inline:
<div className="relative">
  <textarea ... />
  <button className="absolute right-3 top-3">
    <MicIcon />
  </button>
</div>
```

---

## TAREFA 7: Ajustar Badges desproporcionais

### 7.1 Calendário - Badge "OFÍCIOS"
```
ARQUIVO: src/pages/Calendario.tsx

BUSCAR badge de categoria e reduzir:

ANTES:
<Badge className="px-4 py-2 text-sm border-2 border-red-500">
  OFÍCIOS
</Badge>

DEPOIS:
<Badge variant="outline" className="px-2 py-0.5 text-xs border-red-500 text-red-600">
  Ofícios
</Badge>
```

### 7.2 Padrão de badges compactos
```
CRIAR padrão consistente para badges de categoria:

// Badge de categoria (calendário, tags)
<Badge 
  variant="outline" 
  className="
    px-2 py-0.5 
    text-xs 
    font-medium
    rounded-full
  "
  style={{ borderColor: categoryColor, color: categoryColor }}
>
  {categoryName}
</Badge>
```

---

## ORDEM DE IMPLEMENTAÇÃO

1. ✅ TAREFA 1 - Textos CAPS LOCK (mais fácil, alto impacto)
2. ✅ TAREFA 2 - KPI Cards (fácil)
3. ✅ TAREFA 4 - Safe Area (importante para mobile)
4. ✅ TAREFA 5 - Elementos cortados
5. ✅ TAREFA 7 - Badges
6. ✅ TAREFA 6 - FABs
7. ✅ TAREFA 3 - Modais → BottomSheet (mais complexo)

---

## VALIDAÇÃO FINAL

Após implementar, testar em viewport 375px:

### Textos
- [ ] GestaoBase: "Filtros de segmentação" (não CAPS)
- [ ] GestaoBase: Tabela com "Nome", "WhatsApp", "Ação"
- [ ] LogSugestoes: Subtítulo em sentence case
- [ ] Modal Sugerir: "Sugerir melhoria"
- [ ] Modal Cadastro: "Novo cadastro"

### KPIs
- [ ] Equipe: "136 Total", "136 Ativos", "0 Pendentes" (sem quebra)

### Safe Area
- [ ] Nenhum elemento atrás da status bar
- [ ] Bottom nav não tem espaço extra abaixo
- [ ] Calendário: evento não corta na lateral

### Modais
- [ ] Sugerir Melhoria: vem de baixo
- [ ] Novo Cadastro: vem de baixo

### FABs
- [ ] Não se sobrepõem
- [ ] Espaçamento adequado

### Badges
- [ ] Calendário: badges compactos

---

*SPEC gerada para implementação direta pelo Claude Code / GitHub Copilot*
