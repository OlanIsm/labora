import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AppError } from "./errors";
import { supabaseConfiguration } from "./config";
export { authConfiguration } from "./config";

export async function serverSupabase() {
  const config = supabaseConfiguration();
  if (!config) throw new AppError("NOT_CONFIGURED");
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values)
          cookieStore.set(name, value, options);
      },
    },
  });
}
