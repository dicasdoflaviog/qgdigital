# PRD — Aniversariantes da Rede + IA Voz do Vereador

> **Versão:** 1.0 | **Data:** 2026-03-27 | **Método:** SDD

---

## Problema

N4 (líder político) não tem visibilidade de aniversários dos usuários do sistema (vereadores e assessores da rede). Além disso, não existe mecanismo para que o vereador envie uma mensagem personalizada de parabéns — especialmente em formato de áudio com sua própria voz clonada por IA.

---

## Objetivo

**Fase 1 (implementar agora):** Página de aniversariantes da rede para N4 com alerta no dashboard e envio manual via WhatsApp.

**Fase 2 (pré-construir infraestrutura):** Todo o scaffolding para que, quando a API de clonagem de voz estiver configurada (ElevenLabs), o vereador possa gravar um sample de voz e o sistema gere automaticamente um áudio personalizado de parabéns.

---

## Escopo Confirmado

- **Quem:** Usuários do sistema (`profiles`) — vereadores (N3) e assessores/secretárias (N1/N2)
- **Quem vê:** N4 (líder político) e N5 (system master)
- **Notificação:** Alerta visual no dashboard + botão WhatsApp manual (Fase 1) + áudio IA (Fase 2)
- **Gênero:** Detectado automaticamente via `src/lib/detectarSexo.ts` pelo `full_name`

---

## Achados Técnicos (Research)

### Existente — reutilizar
| Componente | Uso |
|-----------|-----|
| `profiles.birth_date` DATE | Campo de aniversário já existe |
| `profiles.whatsapp` TEXT | Contato para wa.me/ |
| `profiles.gabinete_id` UUID | Link com gabinete |
| `src/lib/detectarSexo.ts` | Detecção de gênero por nome (~95% cobertura BR) |
| `GabinetesRedePanel` + `useGabinetesCidade` | Lista de gabinetes N4 — reutilizar para filtro |
| `AniversarianteCard` pattern | Padrão de card + WhatsApp existente (para eleitores) |
| `gabinete_config` table | Configurações por gabinete — adicionar colunas de voz aqui |
| `supabase/functions/process-voice/` | Edge Function de voz já existe — estrutura de referência |
| Supabase Storage | Já usado para avatares — usar para samples de voz |

### Lacunas — criar
| O que falta | Solução |
|------------|---------|
| `profiles.genero` não existe | Migration: ADD COLUMN + backfill via detectarSexo |
| `gabinete_config.voice_clone_id` não existe | Migration: ADD COLUMNs de voz |
| Página de aniversariantes N4 | `src/pages/AniversariantesRede.tsx` |
| Hook de aniversariantes | `src/hooks/useAniversariantesRede.ts` |
| Storage bucket para voz | `voice-samples` bucket no Supabase Storage |
| Edge Function de voz IA | `supabase/functions/generate-birthday-voice/index.ts` (stub) |
| UI de configuração de voz | Seção "Voz IA" em ConfiguracaoGabinete.tsx |
| Widget de alerta N4 | Card no dashboard do N4 |

### Campos sensíveis de voz em `gabinete_config`
```sql
voice_clone_id        TEXT    -- ID do voice clone na ElevenLabs (ex: "abc123")
voice_sample_url      TEXT    -- URL do sample de voz no Supabase Storage
voice_configured_at   TIMESTAMPTZ -- Quando foi configurado
voice_provider        TEXT    -- 'elevenlabs' | 'playht' | 'cartesia' (futuro)
```

### Fluxo de voz IA (Fase 2 — infra pronta, API plugável)
```
N3 grava sample (30s)
       ↓
Upload → Supabase Storage (bucket: voice-samples)
       ↓
N3 cola o voice_clone_id da ElevenLabs → salvo em gabinete_config
       ↓
N4 vê aniversariante → clica "Enviar áudio IA"
       ↓
Edge Function generate-birthday-voice:
  - Lê voice_clone_id do gabinete
  - Chama ElevenLabs TTS API: "Olá [Nome], parabéns! [Vereador] manda um abraço!"
  - Salva o .mp3 no Supabase Storage (birthday-audios/)
  - Retorna URL pública do áudio
       ↓
WhatsApp link com URL do áudio OU link de download
```

---

## Design System (CLAUDE.md)
- `font-medium` apenas (nunca `font-bold`)
- Sentence case nos títulos
- Paleta `qg-blue`, `qg-green`, `qg-amber`
- BottomSheet para detalhes (`z-60`)
- Touch targets ≥ 44px
- `whitespace-nowrap` em números/KPIs

---

## Fora do Escopo (Fase 1)
- Envio automático de WhatsApp
- Integração com API de clonagem (só scaffold)
- Notificação push/email
- Aniversariantes de eleitores (já existe no dashboard atual)
