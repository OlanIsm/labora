import { createServerClient } from "@supabase/ssr";
import { supabaseConfiguration } from "@backend/shared/config";
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, AppError } from "@backend/shared/errors";

export async function middleware(request: NextRequest) {
  const config = supabaseConfiguration();
  if (request.nextUrl.pathname.startsWith("/api/v1/auth/"))
    return NextResponse.next();
  if (
    !config ||
    !request.cookies
      .getAll()
      .some((cookie) => cookie.name.includes("-auth-token"))
  )
    return NextResponse.next();
  let response = NextResponse.next({ request });
  const client = createServerClient(config.url, config.key, {
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values)
          response.cookies.set(name, value, options);
      },
    },
  });
  try {
    await client.auth.getClaims();
  } catch {
    return errorResponse(
      new AppError("SERVICE_UNAVAILABLE"),
      crypto.randomUUID(),
    );
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/api/v1/:path*"] };
