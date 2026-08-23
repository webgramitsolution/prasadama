import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Server-side only env lookup. The service-role key is deliberately NOT read from a
 * `VITE_`-prefixed variable, so Vite can never inline it into a browser bundle.
 */
function serverEnv(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const deno = (globalThis as { Deno?: { env?: { get(k: string): string | undefined } } }).Deno;
  return proc?.env?.[name] ?? deno?.env?.get(name);
}

/** Anonymous admin client for writing to the audit log — never returned to tools. */
function adminClient(): SupabaseClient {
  const url = serverEnv("SUPABASE_URL");
  const key = serverEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Server credentials unavailable");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** SHA-256 hex of a JSON-serialised input, so we can review activity without leaking payloads. */
async function hashInput(input: unknown): Promise<string> {
  const json = JSON.stringify(input ?? {});
  const buf = new TextEncoder().encode(json);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Non-secret summary of top-level input keys for the audit trail. */
function summariseInput(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    out[k] =
      v == null
        ? "null"
        : typeof v === "string"
          ? `string(len=${v.length})`
          : Array.isArray(v)
            ? `array(len=${v.length})`
            : typeof v;
  }
  return out;
}

/**
 * Log a single MCP tool invocation. Fire-and-forget — audit failures must never
 * break a working tool call, and never surface user data or the raw bearer token.
 */
export async function recordMcpCall(params: {
  toolName: string;
  input: unknown;
  ctx: ToolContext;
  durationMs: number;
  status: "ok" | "error";
  error?: string;
}) {
  try {
    const supabase = adminClient();
    const input_hash = await hashInput(params.input);
    await supabase.from("mcp_audit_log").insert({
      tool_name: params.toolName,
      user_id: params.ctx.isAuthenticated() ? params.ctx.getUserId() : null,
      client_id: params.ctx.getClientId?.() ?? null,
      input_hash,
      input_summary: summariseInput(params.input),
      duration_ms: params.durationMs,
      status: params.status,
      error: params.error?.slice(0, 500) ?? null,
    });
  } catch {
    // audit must never crash a tool
  }
}
