import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Per-user rate limits and per-tool quotas for the MCP endpoint. Enforced by
 * the mcp_check_rate_limit() Postgres function so bursts across multiple
 * concurrent tool calls all see the same authoritative counters.
 */

/**
 * Server-side only env lookup. The service-role key is deliberately NOT read from a
 * `VITE_`-prefixed variable, so Vite can never inline it into a browser bundle.
 */
function serverEnv(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const deno = (globalThis as { Deno?: { env?: { get(k: string): string | undefined } } }).Deno;
  return proc?.env?.[name] ?? deno?.env?.get(name);
}

function adminClient(): SupabaseClient {
  const url = serverEnv("SUPABASE_URL");
  const key = serverEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Server credentials unavailable");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function checkRateLimit(
  toolName: string,
  ctx: ToolContext,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!ctx.isAuthenticated()) return { ok: true };
  try {
    const supabase = adminClient();
    const { data, error } = await supabase.rpc("mcp_check_rate_limit", {
      _user: ctx.getUserId(),
      _tool: toolName,
    });
    if (error) return { ok: true }; // fail-open on infra errors
    const result = data as { ok?: boolean; reason?: string } | null;
    if (result && result.ok === false) {
      return { ok: false, reason: result.reason ?? "Rate limit exceeded." };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
