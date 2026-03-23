import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get requesting user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get user role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roleData?.role;

    // 1. Backup profile data before deactivation
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      await adminClient.from("backup_exclusoes").insert({
        tabela_origem: "profiles",
        dados_originais: { ...profileData, role, email: user.email },
        excluido_por: user.id,
      });
    }

    // 2. Role-specific logic
    if (role === "admin") {
      // Vereador/Admin: archive gabinete data
      // Mark all records linked to their gabinete_id as archived
      const gabineteId = profileData?.gabinete_id;
      if (gabineteId) {
        // Archive eleitores linked to this gabinete
        await adminClient
          .from("eleitores")
          .update({ situacao: "Arquivado" })
          .eq("gabinete_id", gabineteId);

        // Archive instituicoes
        await adminClient
          .from("instituicoes")
          .update({ tipo: "arquivado" })
          .eq("gabinete_id", gabineteId);

        // Archive emendas
        await adminClient
          .from("emendas")
          .update({ status: "Arquivado" })
          .eq("gabinete_id", gabineteId);
      }
    }
    // For assessor/secretaria: data stays intact, just deactivate

    // 3. Deactivate user profile
    await adminClient
      .from("profiles")
      .update({ is_active: false })
      .eq("id", user.id);

    // 4. Ban the user in auth (prevents login)
    await adminClient.auth.admin.updateUserById(user.id, {
      ban_duration: "876600h", // ~100 years
    });

    // 5. Sign out the user
    await adminClient.auth.admin.signOut(user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Conta desativada com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
