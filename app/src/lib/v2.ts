import "server-only";
import { cookies } from "next/headers";
import { isV2Enabled, V2_COOKIE } from "./feature-flags";

export async function v2Enabled(): Promise<boolean> {
  const store = await cookies();
  return isV2Enabled(store.get(V2_COOKIE)?.value, process.env.V2_DEFAULT);
}
