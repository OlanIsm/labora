import "server-only";
import { serverSupabase } from "../../shared/supabase";
import { AppError } from "../../shared/errors";
import { readJson } from "../../shared/http";
import { fields, text } from "../../shared/validation";
import { requireIdentity } from "./index";
export async function recover(request: Request) {
  const body = await readJson(request);
  fields(body, ["email"]);
  const email = text(body.email, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError("VALIDATION_ERROR");
  const client = await serverSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: new URL(
      "/api/v1/auth/confirm?recovery=1",
      process.env.APP_URL || request.url,
    ).toString(),
  });
  if (error && (!error.status || error.status >= 500))
    throw new AppError("SERVICE_UNAVAILABLE");
  return {
    message: "Jika akun tersedia, tautan pemulihan akan dikirim ke emailmu.",
  };
}
export async function changePassword(request: Request) {
  const body = await readJson(request);
  fields(body, ["password"]);
  const password = text(body.password, "password", 72);
  if (password.length < 8 || new TextEncoder().encode(password).length > 72)
    throw new AppError("VALIDATION_ERROR", {
      password: ["Gunakan kata sandi 8–72 karakter."],
    });
  const { client } = await requireIdentity();
  const { error } = await client.auth.updateUser({ password });
  if (error)
    throw new AppError("VALIDATION_ERROR", {
      password: [
        "Kata sandi belum dapat diubah. Gunakan kata sandi yang lebih kuat.",
      ],
    });
  return { updated: true };
}
