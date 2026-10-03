import type { AuthInput } from "@contracts/api";
import { AppError } from "../../shared/errors";

export function credentials(
  body: Record<string, unknown>,
  registration = false,
): AuthInput {
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const errors: Record<string, string[]> = {};
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = ["Isi email yang valid."];
  if (
    !password ||
    (registration && password.length < 8) ||
    Buffer.byteLength(password) > 72
  )
    errors.password = [
      registration
        ? "Gunakan kata sandi minimal 8 karakter dan tidak terlalu panjang."
        : "Isi kata sandimu.",
    ];
  if (registration && (!name || name.length > 100))
    errors.name = ["Isi nama sepanjang 1–100 karakter."];
  const allowed = registration
    ? ["email", "password", "name"]
    : ["email", "password"];
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    errors.form = ["Ada data yang tidak dikenali."];
  if (Object.keys(errors).length)
    throw new AppError("VALIDATION_ERROR", errors);
  return { email, password, ...(registration ? { name } : {}) };
}

export function profileUpdate(body: Record<string, unknown>): {
  display_name: string;
} {
  if (Object.keys(body).some((key) => key !== "name"))
    throw new AppError("VALIDATION_ERROR", {
      form: ["Hanya nama profil yang dapat diubah melalui pengaturan ini."],
    });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100)
    throw new AppError("VALIDATION_ERROR", {
      name: ["Isi nama sepanjang 1–100 karakter."],
    });
  return { display_name: name };
}
