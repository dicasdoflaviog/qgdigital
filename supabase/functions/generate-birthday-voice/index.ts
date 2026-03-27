/**
 * Edge Function: generate-birthday-voice
 * 
 * STATUS: SCAFFOLD — aguardando configuração da API de voz.
 * 
 * Para ativar (Fase 2):
 * 1. Crie conta no ElevenLabs (elevenlabs.io)
 * 2. Clone a voz do vereador e obtenha o voice_id
 * 3. Configure o voice_clone_id em ConfiguracaoGabinete → Voz IA
 * 4. Set o secret: supabase secrets set ELEVENLABS_API_KEY=sk_...
 * 5. Descomente o bloco marcado abaixo
 * 6. Crie os buckets no Storage: voice-samples (privado) e birthday-audios (público)
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

    if (configError || !(config as any)?.voice_clone_id) {
      return new Response(
        JSON.stringify({ error: "Voz IA não configurada para este gabinete. Acesse Configurações → Voz IA." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Busca nome do vereador para personalizar mensagem
    const { data: gabinete } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", gabinete_id)
      .single();

    const nomeVereador = (gabinete as any)?.full_name ?? "seu vereador";

    // 3. Monta texto de parabéns personalizado
    const primeiroNome = recipient_name.split(" ")[0];
    const texto = recipient_genero === "F"
      ? `Olá ${primeiroNome}! Quero te desejar um feliz aniversário! Que você tenha um dia incrível e cheio de realizações. Um carinhoso abraço de ${nomeVereador}!`
      : `Olá ${primeiroNome}! Quero te desejar um feliz aniversário! Que você tenha um dia incrível e cheio de realizações. Um forte abraço de ${nomeVereador}!`;

    // ================================================================
    // SCAFFOLD — Integração com ElevenLabs (descomentar na Fase 2)
    // Requer: supabase secrets set ELEVENLABS_API_KEY=sk_...
    //         Storage buckets: voice-samples (privado), birthday-audios (público)
    // ================================================================
    //
    // const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    // if (!ELEVENLABS_API_KEY) {
    //   return new Response(
    //     JSON.stringify({ error: "ELEVENLABS_API_KEY não configurada." }),
    //     { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    //   );
    // }
    //
    // const ttsResponse = await fetch(
    //   `https://api.elevenlabs.io/v1/text-to-speech/${(config as any).voice_clone_id}`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "xi-api-key": ELEVENLABS_API_KEY,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       text: texto,
    //       model_id: "eleven_multilingual_v2",
    //       voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    //     }),
    //   }
    // );
    //
    // if (!ttsResponse.ok) {
    //   const err = await ttsResponse.text();
    //   throw new Error(`ElevenLabs error: ${err}`);
    // }
    //
    // const audioBuffer = await ttsResponse.arrayBuffer();
    // const fileName = `${gabinete_id}/${Date.now()}-${primeiroNome.toLowerCase()}.mp3`;
    //
    // const { error: uploadError } = await supabase.storage
    //   .from("birthday-audios")
    //   .upload(fileName, audioBuffer, { contentType: "audio/mpeg", upsert: true });
    //
    // if (uploadError) throw uploadError;
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
        message: "Voz IA em modo scaffold. Configure ELEVENLABS_API_KEY para ativar.",
        texto,
        voice_clone_id: (config as any).voice_clone_id,
        voice_provider: (config as any).voice_provider,
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
