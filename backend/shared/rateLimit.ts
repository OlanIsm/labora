import "server-only";
import { createHash } from "node:crypto";
import { adminDatabase, databaseError } from "./database";
import { AppError } from "./errors";
export async function throttle(key: string, quota = 120) {
  if (
    !process.env.SUPABASE_SECRET_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    if (process.env.NODE_ENV === "production")
      throw new AppError("NOT_CONFIGURED");
    return;
  }
  const { data, error } = await adminDatabase().rpc("labora_rate_limit", {
    scope_key: createHash("sha256").update(key).digest("hex"),
    quota,
  });
  databaseError(error);
  if (!data) throw new AppError("RATE_LIMITED", undefined, 60);
}
export function requestOriginKey(request: Request) {
  // Vercel overwrites this header. On other hosts, configure a trusted ingress before enabling TRUST_PROXY.
  const ip =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")
      : process.env.TRUST_PROXY === "1"
        ? request.headers.get("x-real-ip")
        : null;
  return ip?.split(",")[0].trim() || "shared-ingress";
}
