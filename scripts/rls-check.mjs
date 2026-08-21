#!/usr/bin/env node
/**
 * RLS / storage regression check (repo-owned, no external files).
 *
 * Every check prints an explicit PASS/FAIL line plus the underlying provider
 * error, so a red CI job names its own root cause instead of "exit 1".
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("::error title=Missing CI secrets::rls-check needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Add them to the repository secrets.");
  process.exit(1);
}

const anon = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const failures = [];

function report(ok, name, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push({ name, detail });
}

// 1. Anonymous callers must not read privileged tables.
for (const table of ["orders", "profiles", "user_roles", "signup_otps", "security_audit_logs", "storage_upload_logs"]) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  const leaked = !error && (data ?? []).length > 0;
  report(!leaked, `anon cannot read ${table}`, leaked ? `${data.length} row(s) returned without auth` : error?.message || "blocked");
}

// 2. Storefront surface must stay readable (guards against over-locking).
for (const table of ["products", "categories", "hero_slides", "promo_banners", "blog_posts"]) {
  const { error } = await anon.from(table).select("id").limit(1);
  report(!error, `public can read ${table}`, error?.message || "readable");
}

// 3. Privilege escalation attempt must be rejected.
{
  const { error } = await anon.from("user_roles").insert({ user_id: "00000000-0000-0000-0000-000000000000", role: "admin" });
  report(Boolean(error), "anon cannot self-grant admin", error?.message || "INSERT SUCCEEDED — privilege escalation");
}

// 4. Storage: the product bucket must exist and reject anonymous writes.
{
  const probe = `ci-probe/${Date.now()}.png`;
  const { error } = await anon.storage.from("product-images").upload(probe, new Blob([new Uint8Array([137, 80, 78, 71])]), { contentType: "image/png" });
  report(Boolean(error), "anon cannot write to product-images bucket", error?.message || "UPLOAD SUCCEEDED — bucket is world-writable");
  if (error && /bucket not found/i.test(error.message)) {
    failures.push({ name: "product-images bucket missing", detail: "Storage bucket 'product-images' does not exist in this environment." });
  }
}

if (failures.length) {
  console.error(`\n::group::rls-check failures (${failures.length})`);
  for (const f of failures) console.error(`::error title=${f.name}::${f.detail}`);
  console.error("::endgroup::");
  process.exit(1);
}
console.log("\nrls-check: all checks passed.");
