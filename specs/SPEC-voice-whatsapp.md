# SPEC — Extração de WhatsApp via Voz
> Versão: 1.0 | Março 2026
> Objetivo: Adicionar extração automática de telefone/whatsapp da transcrição de voz
> Arquivos: supabase/functions/process-voice/index.ts + src/components/eleitores/CadastroModal.tsx

---

## Contexto
A função `process-voice` já extrai `nome`, `bairro`, `demanda` e `prioridade` via function calling.
Falta apenas adicionar `whatsapp` ao schema e consumir no formulário.

---

## TAREFA 1 — `supabase/functions/process-voice/index.ts`

### 1A — Adicionar instrução de extração no systemPrompt (linha ~55)

```ts
// ATUAL
const systemPrompt = `Você é a Sol, Estrategista do Mandato. Receba esta transcrição bruta de um assessor de rua e extraia as informações estruturadas.

REGRAS:
- Extraia o nome do eleitor mencionado. Se não houver nome, retorne string vazia.
- Extraia o bairro mencionado. Se não houver, retorne string vazia.
- Extraia a demanda/situação principal de forma clara e objetiva (máx 200 caracteres).
- Avalie a prioridade de 1 (baixa) a 5 (urgente) com base na gravidade.
- Se o áudio tiver ruído ou informação confusa, faça o melhor possível para interpretar o contexto.
- Responda APENAS com a chamada da função, sem texto adicional.`;

// NOVO — adicionar linha de whatsapp nas REGRAS
const systemPrompt = `Você é a Sol, Estrategista do Mandato. Receba esta transcrição bruta de um assessor de rua e extraia as informações estruturadas.

REGRAS:
- Extraia o nome do eleitor mencionado. Se não houver nome, retorne string vazia.
- Extraia o número de telefone/whatsapp mencionado. Retorne apenas os dígitos (ex: "73999991234"). Se não houver, retorne string vazia.
- Extraia o bairro mencionado. Se não houver, retorne string vazia.
- Extraia a demanda/situação principal de forma clara e objetiva (máx 200 caracteres).
- Avalie a prioridade de 1 (baixa) a 5 (urgente) com base na gravidade.
- Se o áudio tiver ruído ou informação confusa, faça o melhor possível para interpretar o contexto.
- Responda APENAS com a chamada da função, sem texto adicional.`;
```

### 1B — Adicionar campo `whatsapp` no schema do function calling (após propriedade `nome`, linha ~90)

```ts
// LOCALIZAR este bloco dentro de parameters.properties:
nome: {
  type: "string",
  description: "Nome do eleitor mencionado",
},
bairro: {

// SUBSTITUIR por (adicionar whatsapp entre nome e bairro):
nome: {
  type: "string",
  description: "Nome do eleitor mencionado",
},
whatsapp: {
  type: "string",
  description: "Número de telefone/whatsapp mencionado, somente dígitos (ex: 73999991234). String vazia se não mencionado.",
},
bairro: {
```

### 1C — Adicionar `whatsapp` no array `required` (linha ~107)

```ts
// ATUAL
required: ["nome", "bairro", "demanda", "prioridade"],

// NOVO
required: ["nome", "whatsapp", "bairro", "demanda", "prioridade"],
```

---

## TAREFA 2 — `src/components/eleitores/CadastroModal.tsx`

### 2A — Consumir `whatsapp` retornado pela IA (linha ~221)

```tsx
// ATUAL — dentro do processWithAI, após setProcessingVoice(true):
if (data.nome) setNome(data.nome);
if (data.bairro) {
  const match = BAIRROS.find(...)

// NOVO — adicionar linha do whatsapp ENTRE nome e bairro:
if (data.nome) setNome(data.nome);
if (data.whatsapp) setWhatsapp(formatWhatsApp(data.whatsapp));
if (data.bairro) {
  const match = BAIRROS.find(...)
```

> `formatWhatsApp` já existe no arquivo (linha 37) — formata os dígitos para `(73) 99999-1234`.
> Não importar nada novo.

### 2B — Melhorar o toast de confirmação (linha ~232)

```tsx
// ATUAL
toast({
  title: "Dados extraídos pela IA ✨",
  description: `Prioridade: ${data.prioridade}/5. Confirme os campos antes de salvar.`,
});

// NOVO — informar quais campos foram preenchidos
const camposPreenchidos = [
  data.nome && "nome",
  data.whatsapp && "telefone",
  data.bairro && "bairro",
].filter(Boolean).join(", ");

toast({
  title: "Dados extraídos pela IA ✨",
  description: camposPreenchidos
    ? `Preenchido: ${camposPreenchidos}. Prioridade: ${data.prioridade}/5. Confirme antes de salvar.`
    : `Prioridade: ${data.prioridade}/5. Confirme os campos antes de salvar.`,
});
```

---

## Deploy da Edge Function

Após salvar `supabase/functions/process-voice/index.ts`, é obrigatório fazer deploy:

```bash
supabase functions deploy process-voice
```

> ⚠️ Sem o deploy, a mudança na Edge Function não entra em produção.
> O CadastroModal.tsx é deploy automático via build normal.

---

## ✅ Checklist de validação

### Edge Function
- [ ] `supabase functions deploy process-voice` executado sem erro
- [ ] Testar no Supabase Dashboard → Edge Functions → process-voice → Test

### Teste de ponta a ponta
Abrir o CadastroModal, gravar áudio com este texto de teste:
```
"Dona Maria Silva, mora no Castelinho, telefone dela é 73 9 8888-7777, 
a rua dela está sem iluminação há duas semanas"
```

Clicar em "Extrair dados com IA" e verificar:
- [ ] Campo Nome preenchido: "Maria Silva"
- [ ] Campo WhatsApp preenchido: "(73) 98888-7777"
- [ ] Campo Bairro selecionado: "Castelinho"
- [ ] Campo Situação preenchido com a demanda
- [ ] Toast mostra "Preenchido: nome, telefone, bairro"
- [ ] Verificação de duplicata do WhatsApp dispara automaticamente

### Casos limite
- [ ] Áudio sem telefone → campo whatsapp fica vazio (não sobrescreve se já preenchido)
- [ ] Número com formato diferente ("setenta e três, nove, oito...") → dígitos extraídos corretamente
- [ ] Áudio só com demanda, sem nome/telefone/bairro → apenas demanda é preenchida

---

## 📌 Ordem de implementação
1. `supabase/functions/process-voice/index.ts` — tarefas 1A, 1B, 1C
2. `supabase functions deploy process-voice`
3. `src/components/eleitores/CadastroModal.tsx` — tarefas 2A, 2B
4. `npm run build` — deve passar com 0 erros
5. Testar com áudio real

## 🚫 O que NÃO fazer
- Não alterar a lógica de autenticação da Edge Function
- Não alterar o modelo de IA (`google/gemini-3-flash-preview`)
- Não alterar o `handleVoiceTranscript` — ele continua igual
- Não sobrescrever campo whatsapp se o usuário já digitou manualmente
  (o `if (data.whatsapp)` já garante isso — só preenche se a IA retornou algo)
