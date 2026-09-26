// Recognises which kind of Supabase key is configured, without ever exposing the key.
// Writing learner progress needs the secret (service_role) key; the public (anon/publishable)
// key can read but is blocked from writing on purpose, so mixing them up looks like
// "permission denied" (Postgres error 42501).

export type KeyInfo = { kind: string; problem: string | null };

function jwtRole(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function describeServiceKey(key: string | undefined): KeyInfo {
  if (!key) return { kind: "missing", problem: "It is not set." };
  if (/\s/.test(key)) return { kind: "has-whitespace", problem: "It contains a space or line break. Paste it again without anything around it." };
  if (key.startsWith("sb_publishable_")) return { kind: "publishable", problem: "It is the public (publishable) key. Use the secret key." };
  if (key.startsWith("sb_secret_")) return { kind: "secret", problem: null };
  const role = jwtRole(key);
  if (role === "service_role") return { kind: "jwt-service_role", problem: null };
  if (role) return { kind: `jwt-${role}`, problem: `It is the "${role}" (public) key, not the service_role key.` };
  return { kind: "unknown", problem: null };
}
