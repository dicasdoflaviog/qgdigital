import { supabase } from "@/integrations/supabase/client";

/**
 * Log an error to the error_logs table for Super Admin visibility.
 * Fails silently — never throws.
 */
export async function logError(
  message: string,
  context: string = "",
  details: Record<string, any> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("error_logs" as any).insert({
      user_id: user.id,
      message,
      context,
      details,
    } as any);
  } catch {
    // Silent — we don't want error logging to cause more errors
    console.error("[logError] Failed to log:", message);
  }
}
