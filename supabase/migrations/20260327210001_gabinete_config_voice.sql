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
