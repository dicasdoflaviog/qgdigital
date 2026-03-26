import { supabase } from "@/integrations/supabase/client";

/**
 * Log an error to the error_logs table for Super Admin visibility.
 * Fails silently — never throws.
 */
export async function logError(
  message: string,
  context: string = "",
  details: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("error_logs" as any) as any).insert({
      user_id: user.id,
      message,
      context,
      details,
    });
  } catch {
    console.error("[logError] Failed to log:", message);
  }
}
