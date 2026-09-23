// Rollout switch for the v2 app shell. A `?v2=1` / `?v2=0` query parameter sets or
// clears a cookie so the owner can opt in before everyone is switched over; the
// deployment default comes from the server-only `V2_DEFAULT` environment variable.

export const V2_COOKIE = "sprechen-v2";
export const V2_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export type FlagOverride = "on" | "off" | null;

export function readV2Override(params: URLSearchParams): FlagOverride {
  const value = params.get("v2");
  if (value === "1" || value === "true") return "on";
  if (value === "0" || value === "false") return "off";
  return null;
}

export function isV2Enabled(cookieValue: string | undefined, envDefault: string | undefined): boolean {
  if (cookieValue === "1") return true;
  if (cookieValue === "0") return false;
  return envDefault === "true";
}
