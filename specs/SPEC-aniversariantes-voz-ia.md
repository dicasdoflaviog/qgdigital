# SPEC — Aniversariantes da Rede + IA Voz do Vereador

> **Baseado em:** PRD-aniversariantes-voz-ia.md | **Data:** 2026-03-27

---

## Ordem de Implementação

```
ANIV-01 → ANIV-02 → ANIV-03 → ANIV-04 → ANIV-05 → ANIV-06 → ANIV-07
(migration  (migration  (hook)    (página)   (widget   (config   (edge fn
 genero)     voz)                            dashboard) voz UI)   stub)
```

---

## ANIV-01 — Migration: `genero` em `profiles` + backfill automático

**Arquivo:** `supabase/migrations/20260327210000_profiles_genero.sql`

```sql
-- Adiciona coluna genero em profiles (mesma convenção de eleitores.sexo)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS genero CHAR(1) CHECK (genero IN ('M', 'F', 'O')) DEFAULT NULL;

COMMENT ON COLUMN public.profiles.genero IS
  'Gênero detectado automaticamente pelo nome: M=Masculino, F=Feminino, O=Outro/Não identificado';

CREATE INDEX IF NOT EXISTS idx_profiles_genero ON public.profiles(genero);
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date);

-- Nota: backfill do genero é feito no frontend via detectarSexo.ts
-- (lógica em JS, não em SQL — biblioteca de nomes já existente no projeto)
```

---

## ANIV-02 — Migration: colunas de voz IA em `gabinete_config`

**Arquivo:** `supabase/migrations/20260327210001_gabinete_config_voice.sql`

```sql
-- Infraestrutura para clonagem de voz IA (ElevenLabs ou similar)
ALTER TABLE public.gabinete_config
  ADD COLUMN IF NOT EXISTS voice_clone_id       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS voice_sample_url     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS voice_provider       TEXT DEFAULT 'elevenlabs'
    CHECK (voice_provider IN ('elevenlabs', 'playht', 'cartesia')),
  ADD COLUMN IF NOT EXISTS voice_configured_at  TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.gabinete_config.voice_clone_id IS
  'ID do voice clone na API de TTS (ex: ElevenLabs voice ID)';
COMMENT ON COLUMN public.gabinete_config.voice_sample_url IS
  'URL do sample de voz no Supabase Storage (bucket: voice-samples)';
COMMENT ON COLUMN public.gabinete_config.voice_provider IS
  'Provedor de clonagem de voz: elevenlabs | playht | cartesia';
COMMENT ON COLUMN public.gabinete_config.voice_configured_at IS
  'Timestamp de quando a voz foi configurada/atualizada';
```

---

## ANIV-03 — Hook: `useAniversariantesRede.ts`

**Arquivo:** `src/hooks/useAniversariantesRede.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { detectarSexo } from "@/lib/detectarSexo";

export interface AniversarianteRede {
  id: string;
  full_name: string;
  whatsapp: string | null;
  birth_date: string;       // ISO date
  genero: "M" | "F" | "O" | null;
  gabinete_id: string | null;
  role: string;             // 'admin' | 'assessor' | 'secretaria'
  avatar_url: string | null;
  // Enriquecido no frontend:
  diasParaAniversario: number;  // 0 = hoje, 1 = amanhã, etc.
  idade: number | null;
  nomeGabinete?: string;
  // Voz IA (do gabinete_config):
  voice_clone_id?: string | null;
  voice_provider?: string | null;
  voice_configured?: boolean;
}

export interface AniversariantesFilters {
  gabineteId?: string | null;    // null = todos
  cargo?: "admin" | "assessor" | "secretaria" | "all";
  genero?: "M" | "F" | "all";
  diasAhead?: number;            // quantos dias à frente buscar (default 30)
}

export function useAniversariantesRede(filters: AniversariantesFilters = {}) {
  return useQuery({
    queryKey: ["aniversariantes-rede", filters],
    queryFn: async () => {
      // 1. Busca profiles com birth_date preenchido
      let q = supabase
        .from("profiles")
        .select("id, full_name, whatsapp, birth_date, genero, gabinete_id, avatar_url")
        .not("birth_date", "is", null)
        .eq("is_active", true);

      if (filters.gabineteId) {
        q = q.eq("gabinete_id", filters.gabineteId);
      }

      const { data: profiles, error } = await q;
      if (error) throw error;

      // 2. Busca roles de cada perfil
      const ids = (profiles ?? []).map((p) => p.id);
      const { data: roles } = ids.length > 0
        ? await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", ids)
        : { data: [] };

      const roleMap = Object.fromEntries((roles ?? []).map((r) => [r.user_id, r.role]));

      // 3. Busca voz IA dos gabinetes envolvidos
      const gabineteIds = [...new Set((profiles ?? []).map((p) => p.gabinete_id).filter(Boolean))];
      const { data: voiceConfigs } = gabineteIds.length > 0
        ? await supabase
            .from("gabinete_config")
            .select("gabinete_id, voice_clone_id, voice_provider")
            .in("gabinete_id", gabineteIds)
        : { data: [] };

      const voiceMap = Object.fromEntries(
        (voiceConfigs ?? []).map((v) => [v.gabinete_id, v])
      );

      // 4. Enriquece e calcula dias até aniversário
      const today = new Date();
      const diasAhead = filters.diasAhead ?? 30;

      const result: AniversarianteRede[] = (profiles ?? [])
        .map((p) => {
          const birth = new Date(p.birth_date + "T12:00:00");
          const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
          let diff = Math.round((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff < 0) diff += 365; // próximo ano

          const idade = today.getFullYear() - birth.getFullYear() -
            (today < thisYear ? 1 : 0);

          // Detecta gênero se não está salvo
          const genero = p.genero ?? detectarSexo(p.full_name.split(" ")[0]) ?? null;

          const voice = voiceMap[p.gabinete_id ?? ""] ?? null;

          return {
            ...p,
            genero: genero as "M" | "F" | "O" | null,
            role: roleMap[p.id] ?? "assessor",
            diasParaAniversario: diff,
            idade,
            voice_clone_id: voice?.voice_clone_id ?? null,
            voice_provider: voice?.voice_provider ?? null,
            voice_configured: Boolean(voice?.voice_clone_id),
          };
        })
        .filter((p) => p.diasParaAniversario <= diasAhead)
        .filter((p) => !filters.cargo || filters.cargo === "all" || p.role === filters.cargo)
        .filter((p) => !filters.genero || filters.genero === "all" || p.genero === filters.genero)
        .sort((a, b) => a.diasParaAniversario - b.diasParaAniversario);

      return result;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Hook específico para widget de alerta: apenas amanhã
export function useAniversariantesAmanha() {
  return useAniversariantesRede({ diasAhead: 1 });
}
```

---

## ANIV-04 — Página: `src/pages/AniversariantesRede.tsx`

**Rota:** `/aniversariantes-rede`  
**Acesso:** `exactLevels: [4, 5]`

### Estrutura da página
```tsx
// Header sticky
<div className="sticky top-0 z-40 bg-white border-b">
  <h1 font-medium>Aniversariantes da rede</h1>
  <p text-xs>{total} pessoas · próximos {diasAhead} dias</p>
</div>

// Filtros (colapsáveis)
<FiltersSection>
  <Select> Gabinete (todos / por vereador) </Select>
  <Select> Cargo (todos / vereador / assessor / secretária) </Select>
  <Select> Gênero (todos / masculino / feminino) </Select>
  <Select> Período (7 dias / 15 dias / 30 dias) </Select>
</FiltersSection>

// Lista agrupada por proximidade
<section "Hoje"> ... </section>
<section "Amanhã"> ... </section>
<section "Esta semana"> ... </section>
<section "Este mês"> ... </section>

// Card por aniversariante
<AniversarianteRedeCard
  nome={p.full_name}
  cargo={CARGO_LABEL[p.role]}
  nomeGabinete={...}
  diasParaAniversario={p.diasParaAniversario}
  idade={p.idade}
  whatsapp={p.whatsapp}
  genero={p.genero}
  voiceConfigured={p.voice_configured}
/>
```

### AniversarianteRedeCard — botões de ação
```tsx
// Botão 1 — sempre disponível
<Button onClick={() => window.open(`https://wa.me/${whatsapp}?text=${mensagem}`)}>
  Enviar parabéns via WhatsApp
</Button>

// Botão 2 — habilitado quando voice_configured = true
<Button
  disabled={!voiceConfigured}
  title={!voiceConfigured ? "Configure a voz IA no gabinete" : ""}
  onClick={handleSendVoice}
>
  {voiceConfigured ? "🎙️ Enviar áudio IA" : "🔒 Voz IA não configurada"}
</Button>
```

### Mensagem WhatsApp gerada automaticamente
```
// Masculino
"Olá [Nome]! 🎉 Parabéns pelo seu aniversário! [Vereador X] manda um forte abraço e deseja um dia especial!"

// Feminino
"Olá [Nome]! 🎉 Parabéns pelo seu aniversário! [Vereador X] manda um carinhoso abraço e deseja um dia lindo!"
```

### Estado vazio
```tsx
<EmptyState
  icon={<CakeIcon />}
  title="Nenhum aniversariante encontrado"
  description="Verifique se as datas de nascimento estão cadastradas nos perfis dos usuários."
/>
```

---

## ANIV-05 — Widget de alerta no dashboard N4

**Arquivo:** Componente `AniversariantesAlertCard.tsx` + inserção no dashboard N4

```tsx
// src/components/dashboard/AniversariantesAlertCard.tsx
export function AniversariantesAlertCard() {
  const { data = [], isLoading } = useAniversariantesAmanha();

  if (data.length === 0) return null; // Não exibe se não há aniversariantes

  return (
    <Card className="border-qg-amber-200 bg-qg-amber-50 rounded-2xl shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-qg-amber-100 rounded-xl flex items-center justify-center">
            <Cake className="w-4 h-4 text-qg-amber-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-qg-amber-900">
              {data.length === 1
                ? "1 aniversariante amanhã"
                : `${data.length} aniversariantes amanhã`}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {data.slice(0, 3).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <p className="text-xs text-qg-amber-800 truncate">{p.full_name}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-qg-amber-700 shrink-0"
                asChild
              >
                <a
                  href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(gerarMensagem(p))}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <MessageCircle className="w-3 h-3 mr-1" /> Parabenizar
                </a>
              </Button>
            </div>
          ))}
        </div>
        {data.length > 3 && (
          <Link to="/aniversariantes-rede" className="text-xs text-qg-amber-700 font-medium mt-2 block">
            Ver todos ({data.length}) →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## ANIV-06 — UI de configuração de voz no gabinete

**Arquivo:** `src/pages/ConfiguracaoGabinete.tsx`

Adicionar nova seção "Voz IA do vereador":

```tsx
// Nova seção dentro da página de configuração
<section id="voz-ia">
  <h2 className="text-base font-medium text-slate-800 mb-1">Voz IA</h2>
  <p className="text-xs text-slate-500 mb-4">
    Configure a voz clonada do vereador para envio automático de mensagens personalizadas.
  </p>

  {/* Status atual */}
  <div className="flex items-center gap-2 mb-4">
    {voiceConfigured
      ? <Badge className="bg-qg-green-100 text-qg-green-700">✓ Voz configurada</Badge>
      : <Badge className="bg-slate-100 text-slate-500">Voz não configurada</Badge>
    }
  </div>

  {/* Passo 1: Upload do sample */}
  <div className="space-y-3">
    <label className="text-xs font-medium text-slate-600">
      1. Faça upload de um sample de voz (mín. 30 segundos)
    </label>
    <input type="file" accept="audio/*" onChange={handleVoiceUpload} />
    {voiceSampleUrl && (
      <audio controls src={voiceSampleUrl} className="w-full" />
    )}
  </div>

  {/* Passo 2: ID do clone */}
  <div className="space-y-2 mt-4">
    <label className="text-xs font-medium text-slate-600">
      2. Cole o ID do Voice Clone (ElevenLabs ou similar)
    </label>
    <Input
      value={voiceCloneId}
      onChange={(e) => setVoiceCloneId(e.target.value)}
      placeholder="ex: abc123def456"
      className="font-mono text-sm"
    />
    <Select value={voiceProvider} onValueChange={setVoiceProvider}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
        <SelectItem value="playht">PlayHT</SelectItem>
        <SelectItem value="cartesia">Cartesia</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <Button onClick={handleSaveVoice} className="mt-4 w-full min-h-[44px]">
    Salvar configuração de voz
  </Button>
</section>
```

---

## ANIV-07 — Edge Function stub: `generate-birthday-voice`

**Arquivo:** `supabase/functions/generate-birthday-voice/index.ts`

```typescript
/**
 * Edge Function: generate-birthday-voice
 * 
 * STATUS: SCAFFOLD — aguardando configuração da API de voz.
 * 
 * Fluxo (Fase 2):
 * 1. Recebe: { gabinete_id, recipient_name, recipient_genero }
 * 2. Busca: voice_clone_id e voice_provider em gabinete_config
 * 3. Monta texto personalizado de parabéns
 * 4. Chama ElevenLabs TTS API com o voice_clone_id
 * 5. Salva .mp3 no Supabase Storage (bucket: birthday-audios)
 * 6. Retorna: { audio_url: string }
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { gabinete_id, recipient_name, recipient_genero } = await req.json();

    if (!gabinete_id || !recipient_name) {
      return new Response(
        JSON.stringify({ error: "gabinete_id e recipient_name são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Busca configuração de voz do gabinete
    const { data: config, error: configError } = await supabase
      .from("gabinete_config")
      .select("voice_clone_id, voice_provider, gabinete_id")
      .eq("gabinete_id", gabinete_id)
      .single();

    if (configError || !config?.voice_clone_id) {
      return new Response(
        JSON.stringify({ error: "Voz IA não configurada para este gabinete." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Busca nome do vereador para personalizar mensagem
    const { data: vereador } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", gabinete_id)
      .single();

    // 3. Monta texto de parabéns personalizado
    const pronoun = recipient_genero === "F" ? "ela" : "ele";
    const texto = `Olá, ${recipient_name}! Quero te desejar um feliz aniversário! `
      + `Que ${pronoun} tenha um dia incrível e cheio de realizações. `
      + `Um forte abraço de ${vereador?.full_name ?? "seu vereador"}!`;

    // ================================================================
    // SCAFFOLD — Integração com ElevenLabs (descomentar na Fase 2)
    // ================================================================
    //
    // const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    // const response = await fetch(
    //   `https://api.elevenlabs.io/v1/text-to-speech/${config.voice_clone_id}`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "xi-api-key": ELEVENLABS_API_KEY!,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       text: texto,
    //       model_id: "eleven_multilingual_v2",
    //       voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    //     }),
    //   }
    // );
    // const audioBuffer = await response.arrayBuffer();
    //
    // const fileName = `birthday-audios/${gabinete_id}/${Date.now()}-${recipient_name}.mp3`;
    // const { data: upload } = await supabase.storage
    //   .from("birthday-audios")
    //   .upload(fileName, audioBuffer, { contentType: "audio/mpeg" });
    //
    // const { data: { publicUrl } } = supabase.storage
    //   .from("birthday-audios")
    //   .getPublicUrl(fileName);
    //
    // return new Response(JSON.stringify({ audio_url: publicUrl, texto }), {
    //   headers: { ...corsHeaders, "Content-Type": "application/json" },
    // });
    // ================================================================

    // Fase 1: retorna apenas o texto (sem áudio)
    return new Response(
      JSON.stringify({
        scaffold: true,
        message: "Integração de voz IA ainda não configurada. Configure ELEVENLABS_API_KEY.",
        texto,
        voice_clone_id: config.voice_clone_id,
        voice_provider: config.voice_provider,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## Rota + Sidebar — adicionar para N4/N5

**Arquivo:** `src/App.tsx`
```tsx
<Route path="/aniversariantes-rede" element={<AniversariantesRede />} />
```

**Arquivo:** `src/components/layout/AppSidebar.tsx`
```tsx
// Adicionar em estrategicoNavItems
{ title: "Aniversariantes", url: "/aniversariantes-rede", icon: Cake, exactLevels: [4, 5] }
```

---

## Supabase Storage — buckets necessários

```bash
# Criar via Supabase Dashboard ou migration
# 1. voice-samples  — samples de voz dos vereadores (privado)
# 2. birthday-audios — áudios gerados pela IA (público por 24h)
```

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/20260327210000_profiles_genero.sql` | CRIAR |
| `supabase/migrations/20260327210001_gabinete_config_voice.sql` | CRIAR |
| `src/hooks/useAniversariantesRede.ts` | CRIAR |
| `src/pages/AniversariantesRede.tsx` | CRIAR |
| `src/components/dashboard/AniversariantesAlertCard.tsx` | CRIAR |
| `supabase/functions/generate-birthday-voice/index.ts` | CRIAR (stub) |
| `src/pages/ConfiguracaoGabinete.tsx` | MODIFICAR (seção Voz IA) |
| `src/App.tsx` | MODIFICAR (nova rota) |
| `src/components/layout/AppSidebar.tsx` | MODIFICAR (novo item N4) |

---

## Validação final

- [ ] N4 vê aniversariantes de todos os gabinetes da rede
- [ ] N3 vê apenas aniversariantes do seu gabinete
- [ ] Gênero detectado automaticamente pelo nome
- [ ] Botão WhatsApp gera mensagem personalizada por gênero
- [ ] Botão "Voz IA" desabilitado quando não configurado
- [ ] Card de alerta aparece no dashboard N4 apenas quando há aniversariantes amanhã
- [ ] Seção "Voz IA" em ConfiguracaoGabinete salva voice_clone_id
- [ ] Edge Function stub responde com 200 e instrução clara de configuração
- [ ] Storage buckets documentados e prontos para criação
