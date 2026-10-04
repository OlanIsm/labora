import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfiguration } from "./config";
import { AppError } from "./errors";
import type { Database, Json } from "@contracts/database";

export function adminDatabase() {
  const config = supabaseConfiguration();
  const secret =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !secret) throw new AppError("NOT_CONFIGURED");
  return createClient<Database>(config.url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
export function toJson(value: unknown): NonNullable<Json> {
  const result = JSON.parse(JSON.stringify(value));
  if (result === null) throw new AppError("BAD_REQUEST");
  return result as NonNullable<Json>;
}

export function databaseError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) return;
  const allowed = [
    "NOT_FOUND",
    "FORBIDDEN",
    "VALIDATION_ERROR",
    "REVISION_CONFLICT",
    "IDEMPOTENCY_CONFLICT",
  ] as const;
  const code = allowed.find((code) => error.message === code);
  if (code) throw new AppError(code);
  if (error.code === "23505") throw new AppError("REVISION_CONFLICT");
  if (error.code === "23503" || error.code === "23514")
    throw new AppError("VALIDATION_ERROR");
  throw new AppError("SERVICE_UNAVAILABLE");
}
