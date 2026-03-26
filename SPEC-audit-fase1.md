# SPEC — Audit Fase 1: console.log + type any seguros
> Versão: 1.0 | Data: Março 2026
> Zero risco de quebrar lógica. Apenas limpeza cirúrgica.

---

## Regras desta SPEC

- **NÃO alterar lógica de negócio**
- **NÃO refatorar estrutura de componentes**
- **NÃO mexer em arquivos não listados aqui**
- Apenas remover `console.log/warn/error` e substituir `any` por tipos corretos
- Build deve passar com 0 erros após cada arquivo

---

## Resumo das tarefas

| # | Arquivo | console.log | type any | Ação |
|---|---------|-------------|----------|------|
| 1 | `pages/PerfilEleitor.tsx` | 3 | 1 | Modificar |
| 2 | `pages/Eleitores.tsx` | 1 | 3 | Modificar |
| 3 | `pages/Setup.tsx` | 0 | 1 | Modificar |
| 4 | `pages/LogSugestoes.tsx` | 0 | 1 | Modificar |
| 5 | `pages/MapaCalor.tsx` | 0 | 1 | Modificar |
| 6 | `hooks/useVoiceInput.ts` | 1 | 4 | Modificar |
| 7 | `components/chat/ChatAguia.tsx` | 1 | 2 | Modificar — ATENÇÃO especial |

---

## TAREFA 1 — `src/pages/PerfilEleitor.tsx`

### 1A — Remover console.log (linhas 132, 145, 167)

**Linha 132** — dentro do `queryFn` do useQuery:
```tsx
// REMOVER esta linha:
console.log("[PerfilEleitor] Buscando eleitor", { id });
```

**Linha 140** — `console.error` dentro do if(error):
```tsx
// REMOVER esta linha:
console.error("[PerfilEleitor] Erro Supabase", error);
// Manter apenas o throw error abaixo
```

**Linha 145** — `console.warn` após verificar !data:
```tsx
// REMOVER esta linha:
console.warn("[PerfilEleitor] Sem retorno no Supabase, usando fallback local quando disponível", { id });
```

**Linha 167** — `console.warn` no catch do sessionStorage:
```tsx
// REMOVER esta linha:
console.warn("[PerfilEleitor] Falha ao salvar fallback local", storageError);
// O catch pode ficar vazio ou com comentário silencioso
```

### 1B — Tipar `any` (linha 75)

```tsx
// ATUAL
function normalizeEleitor(source: any): PerfilEleitorRecord | null {

// CORRETO — source pode ser qualquer coisa vinda de JSON.parse ou location.state
function normalizeEleitor(source: unknown): PerfilEleitorRecord | null {
  if (!source || typeof source !== "object") return null;
  const s = source as Record<string, unknown>;

  const id = s.id ? String(s.id) : "";
  const nome = s.nome ? String(s.nome) : "";
  if (!id || !nome) return null;

  const createdAt = s.created_at ?? (s.criadoEm ? `${s.criadoEm}T12:00:00Z` : new Date().toISOString());
  const updatedAt = s.updated_at ?? createdAt;

  return {
    id,
    nome,
    whatsapp: String(s.whatsapp ?? ""),
    bairro: String(s.bairro ?? ""),
    data_nascimento: (s.data_nascimento ?? s.dataNascimento ?? null) as string | null,
    situacao: String(s.situacao ?? "Novo Cadastro"),
    is_leader: Boolean(s.is_leader ?? false),
    assessor_id: (s.assessor_id ?? s.assessorId ?? null) as string | null,
    created_at: String(createdAt),
    updated_at: String(updatedAt),
    image_urls: (s.image_urls ?? null) as string[] | null,
  };
}
```

---

## TAREFA 2 — `src/pages/Eleitores.tsx`

### 2A — Remover console.warn (linha 81)

```tsx
// REMOVER esta linha dentro do catch do openPerfil:
console.warn("[Eleitores] Falha ao salvar fallback local", storageError);
// O catch pode ficar vazio
```

### 2B — Tipar `any` (linhas 18, 75, 147)

**Linha 18** — função `toEleitorProfileSnapshot`:
```tsx
// ATUAL
const toEleitorProfileSnapshot = (e: any) => {

// CORRETO
interface EleitorRaw {
  id: string;
  nome: string;
  whatsapp?: string;
  bairro?: string;
  data_nascimento?: string | null;
  dataNascimento?: string | null;
  situacao?: string;
  is_leader?: boolean;
  assessor_id?: string | null;
  assessorId?: string | null;
  created_at?: string;
  criadoEm?: string;
  updated_at?: string;
  image_urls?: string[] | null;
}

const toEleitorProfileSnapshot = (e: EleitorRaw) => {
```

**Linha 75** — parâmetro `e` no `.map()`:
```tsx
// ATUAL
{filtered.map((e: any) => {

// CORRETO — EleitorRaw já definida acima
{filtered.map((e: EleitorRaw) => {
```

**Linha 147** — parâmetro `openPerfil`:
```tsx
// ATUAL
const openPerfil = (eleitor: any) => {

// CORRETO
const openPerfil = (eleitor: EleitorRaw) => {
```

---

## TAREFA 3 — `src/pages/Setup.tsx`

### 3A — Tipar `any` (linha 35)

```tsx
// ATUAL
} catch (err: any) {
  toast({ title: "Erro", description: err.message, variant: "destructive" });

// CORRETO
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Erro desconhecido";
  toast({ title: "Erro", description: message, variant: "destructive" });
```

---

## TAREFA 4 — `src/pages/LogSugestoes.tsx`

### 4A — Tipar `any` (linha 53)

```tsx
// ATUAL
profiles.forEach((p: any) => { map[p.id] = p.full_name; });

// CORRETO — profiles já tem tipo inferido do useQuery como { id: string; full_name: string }[]
// Adicionar interface local:
interface ProfileBasic {
  id: string;
  full_name: string | null;
}

// E trocar o forEach:
profiles.forEach((p: ProfileBasic) => { map[p.id] = p.full_name ?? ""; });
```

**Atenção:** O useQuery de profiles retorna `data || []` sem tipagem explícita. Adicionar o tipo no useQuery também:
```tsx
const { data: profiles = [] } = useQuery<ProfileBasic[]>({
  queryKey: ["profiles-for-feedbacks"],
  queryFn: async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    return (data || []) as ProfileBasic[];
  },
});
```

---

## TAREFA 5 — `src/pages/MapaCalor.tsx`

### 5A — Tipar `any` (linha 256)

```tsx
// ATUAL
} catch (err: any) {
  toast({ title: "Erro na geocodificação", description: err.message, variant: "destructive" });

// CORRETO
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "Erro desconhecido";
  toast({ title: "Erro na geocodificação", description: message, variant: "destructive" });
```

---

## TAREFA 6 — `src/hooks/useVoiceInput.ts`

### 6A — Remover console.log (linha 53)

```tsx
// REMOVER esta linha dentro do recognition.onend:
console.log("Speech recognition ended due to silence, restarting...");
```

### 6B — Tipar `any` nas declarações globais e refs (linhas 5, e refs)

**Linha 5** — `window.webkitSpeechRecognition` e `window.SpeechRecognition`:
```tsx
// ATUAL
interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

// CORRETO — usar interface mínima para o que realmente é usado
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;
    SpeechRecognition: SpeechRecognitionConstructor | undefined;
  }
}
```

**Refs que usam `any`:**
```tsx
// ATUAL
const recognitionRef = useRef<any>(null);

// CORRETO
const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
```

**Callback `onresult` e `onerror`** — já tipados pelas interfaces acima, remover os `any` inline:
```tsx
// ATUAL
recognition.onresult = (event: any) => {

// CORRETO — event já é SpeechRecognitionEvent pela interface
recognition.onresult = (event: SpeechRecognitionEvent) => {

// ATUAL
recognition.onerror = (event: any) => {

// CORRETO
recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
```

---

## TAREFA 7 — `src/components/chat/ChatAguia.tsx`
### ⚠️ ATENÇÃO: Arquivo crítico — alterações mínimas e cirúrgicas

**NÃO alterar** a lógica de `as any` nos upserts do Supabase (linhas 185, 204, 213, 245).
Esses `as any` existem porque as tabelas `chat_messages` e `gabinete_config` podem não estar no tipo gerado do Supabase. **Remover esses casts pode quebrar o build.** Deixar como estão.

### 7A — Remover console.warn (linha 188)

```tsx
// ATUAL
console.warn("[ChatAguia] gabinete_config upsert falhou para L5 (não crítico):", msg);

// CORRETO — remover o console.warn, manter o catch silencioso
// O catch já captura o erro na variável msg — apenas não logar
```

O bloco catch fica assim:
```tsx
} catch (gabErr: unknown) {
  // upsert de gabinete_config para L5 é não-crítico, falha silenciosa intencional
}
```

### 7B — Tipar `any` (linha 235)

```tsx
// ATUAL
} catch (err: any) {
  setOnboardingDone(false);
  setShowOnboarding(true);
  toast({ title: "Falha ao registrar batismo. Tente novamente.", description: err?.message || "Erro desconhecido", variant: "destructive" });

// CORRETO
} catch (err: unknown) {
  setOnboardingDone(false);
  setShowOnboarding(true);
  const message = err instanceof Error ? err.message : "Erro desconhecido";
  toast({ title: "Falha ao registrar batismo. Tente novamente.", description: message, variant: "destructive" });
```

---

## ✅ Checklist de validação

### Após cada arquivo:
- [ ] `npm run build` passa com 0 erros
- [ ] Nenhuma lógica de negócio foi alterada
- [ ] Nenhum novo import foi adicionado desnecessariamente

### Final — verificar no browser:
- [ ] PerfilEleitor abre e carrega dados normalmente
- [ ] Lista de Eleitores filtra e navega normalmente
- [ ] Setup renderiza o formulário
- [ ] LogSugestoes exibe os feedbacks
- [ ] MapaCalor carrega o mapa
- [ ] Gravação de voz (useVoiceInput) funciona no CadastroModal
- [ ] ChatAguia abre e responde normalmente

### Verificação no console do browser:
- [ ] Zero `console.log` do código da aplicação (apenas Supabase internos são OK)
- [ ] Zero `console.warn` do código da aplicação

---

## 📌 Ordem de implementação

1. `hooks/useVoiceInput.ts` — hook isolado, zero dependências de UI
2. `pages/Setup.tsx` — página simples, 1 mudança
3. `pages/MapaCalor.tsx` — 1 mudança no catch
4. `pages/LogSugestoes.tsx` — 1 interface + tipagem do useQuery
5. `pages/Eleitores.tsx` — interface EleitorRaw + 3 pontos de uso
6. `pages/PerfilEleitor.tsx` — normalizeEleitor com unknown
7. `components/chat/ChatAguia.tsx` — último, mais delicado

**Rodar `npm run build` após cada arquivo.**

---

## 🚫 O que NÃO fazer

- Não remover os `as any` nos `.from("chat_messages" as any)` do ChatAguia
- Não remover os `as any` nos `.insert({...} as any)` do ChatAguia
- Não refatorar arquivos grandes (MapaCalor, Dashboard, SystemMaster)
- Não alterar lógica de try/catch — apenas trocar `any` por `unknown` e ajustar `.message`
- Não mexer em arquivos fora desta lista
- Não rodar a fase 2 nesta mesma sessão

---

## 📊 Impacto esperado no próximo audit

| Tipo | Antes | Depois |
|------|-------|--------|
| console.log | 7 | 0 |
| type any (fase 1) | ~18 | 0 |
| type any (fase 2 — admin) | ~110 | 110 (próxima fase) |
| **Total issues** | **151** | **~133** |
