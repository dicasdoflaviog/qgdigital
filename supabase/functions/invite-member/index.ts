import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // Verify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();

    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller role
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["admin", "super_admin"])
      .limit(1)
      .single();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem convidar membros" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get caller's gabinete_id to propagate to new member
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("gabinete_id")
      .eq("id", caller.id)
      .single();

    const callerGabineteId = callerProfile?.gabinete_id;

    const ROLE_LEVEL_MAP: Record<string, number> = {
      assessor: 1,
      secretaria: 2,
      admin: 3,
      super_admin: 5,
    };

    const { email, full_name, role, whatsapp } = await req.json();

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "Email, nome e cargo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (role === "super_admin" && callerRole.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Apenas super admins podem criar outros super admins" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with admin API
    const tempPassword = `Temp${crypto.randomUUID().slice(0, 8)}!`;
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        user_metadata: { full_name },
        email_confirm: true,
      });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The handle_new_user trigger creates profile with default 'assessor' role.
    // Update profile: set gabinete_id from caller + first_login = true
    const profileUpdate: Record<string, unknown> = { first_login: true };
    if (callerGabineteId) {
      profileUpdate.gabinete_id = callerGabineteId;
    }
    if (whatsapp) {
      profileUpdate.whatsapp = whatsapp;
    }
    await adminClient
      .from("profiles")
      .update(profileUpdate)
      .eq("id", newUser.user.id);

    // Update role and role_level
    const targetRoleLevel = ROLE_LEVEL_MAP[role] ?? 1;
    if (role !== "assessor" || targetRoleLevel !== 1) {
      await adminClient
        .from("user_roles")
        .update({ role, role_level: targetRoleLevel })
        .eq("user_id", newUser.user.id);
    } else {
      // Even for default assessor, ensure role_level = 1
      await adminClient
        .from("user_roles")
        .update({ role_level: 1 })
        .eq("user_id", newUser.user.id);
    }

    // If role is assessor, also create entry in assessores table
    if (role === "assessor") {
      await adminClient.from("assessores").insert({
        nome: full_name,
        user_id: newUser.user.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        temp_password: tempPassword,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
