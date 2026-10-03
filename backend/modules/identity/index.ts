import "server-only";
import type { AccountProfile } from "@contracts/api";
import { AppError } from "../../shared/errors";
import { readJson } from "../../shared/http";
import { authConfiguration, serverSupabase } from "../../shared/supabase";
import { credentials, profileUpdate } from "./validation";

export { authConfiguration };

function authError(status: number | undefined) {
  if (status === 429) return new AppError("RATE_LIMITED", undefined, 60);
  if (!status || status >= 500) return new AppError("SERVICE_UNAVAILABLE");
  return new AppError("INVALID_CREDENTIALS");
}

export async function requireIdentity() {
  const client = await serverSupabase();
  const { data, error } = await client.auth.getUser();
  if (error?.status === 429) throw new AppError("RATE_LIMITED", undefined, 60);
  if (
    error &&
    error.name !== "AuthSessionMissingError" &&
    (!error.status || error.status >= 500)
  )
    throw new AppError("SERVICE_UNAVAILABLE");
  if (error || !data.user) throw new AppError("UNAUTHENTICATED");
  return { client, user: data.user };
}

export async function getProfile(): Promise<AccountProfile> {
  const { client, user } = await requireIdentity();
  const [profile, memberships] = await Promise.all([
    client
      .from("profiles")
      .select("display_name, preferences")
      .eq("id", user.id)
      .maybeSingle(),
    client
      .from("school_members")
      .select("school_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("joined_at"),
  ]);
  if (profile.error || memberships.error)
    throw new AppError("SERVICE_UNAVAILABLE");
  if (!profile.data) throw new AppError("SERVICE_UNAVAILABLE");
  const preferred = profile.data.preferences?.active_school_id;
  const membership =
    memberships.data?.find((m) => m.school_id === preferred) ||
    memberships.data?.[0];
  return {
    id: user.id,
    email: user.email || "",
    name: profile.data.display_name,
    role: membership?.role === "teacher" ? "teacher" : "student",
    mode: "account",
    ...(membership ? { schoolId: membership.school_id } : {}),
  };
}

export async function login(request: Request) {
  const input = credentials(await readJson(request));
  const client = await serverSupabase();
  const { error } = await client.auth.signInWithPassword(input);
  if (error) throw authError(error.status);
  return getProfile();
}

export async function register(request: Request) {
  const input = credentials(await readJson(request), true);
  const client = await serverSupabase();
  const callback = new URL(
    "/api/v1/auth/confirm",
    process.env.APP_URL || request.url,
  ).toString();
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name }, emailRedirectTo: callback },
  });
  if (error) {
    if (error.status === 429 || !error.status || error.status >= 500)
      throw authError(error.status);
    throw new AppError("VALIDATION_ERROR", {
      form: [
        "Akun belum bisa dibuat. Periksa email dan persyaratan kata sandi.",
      ],
    });
  }
  return {
    confirmationRequired: !data.session,
    user: data.session ? await getProfile() : null,
  };
}

export async function logout() {
  if (authConfiguration().configured) {
    const client = await serverSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw new AppError("SERVICE_UNAVAILABLE");
  }
  return { signedOut: true };
}

export async function updateProfile(request: Request) {
  const input = profileUpdate(await readJson(request));
  const { client, user } = await requireIdentity();
  const { data, error } = await client
    .from("profiles")
    .update(input)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw new AppError("SERVICE_UNAVAILABLE");
  if (!data) throw new AppError("NOT_FOUND");
  return getProfile();
}

export async function confirm(request: Request) {
  const params = new URL(request.url).searchParams;
  const client = await serverSupabase();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const response = code
    ? await client.auth.exchangeCodeForSession(code)
    : tokenHash && type === "signup"
      ? await client.auth.verifyOtp({ token_hash: tokenHash, type: "signup" })
      : null;
  if (!response || response.error) throw new AppError("BAD_REQUEST");
  return { confirmed: true };
}
