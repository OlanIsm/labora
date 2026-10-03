import { confirm } from "@backend/modules/identity";
import { apiHandler } from "@backend/shared/http";
import { NextResponse } from "next/server";
export const GET = async (request: Request) => {
  const response = await apiHandler(confirm)(request);
  if (!response.ok) return response;
  const redirect = NextResponse.redirect(
    new URL(
      new URL(request.url).searchParams.get("recovery") === "1" ||
        new URL(request.url).searchParams.get("type") === "recovery"
        ? "/dashboard?recovery=1"
        : "/dashboard",
      process.env.APP_URL || request.url,
    ),
    303,
  );
  redirect.headers.set("X-Request-Id", response.headers.get("X-Request-Id")!);
  redirect.headers.set("Cache-Control", "no-store");
  return redirect;
};
export {
  unsupportedMethod as POST,
  unsupportedMethod as PATCH,
  unsupportedMethod as PUT,
  unsupportedMethod as DELETE,
} from "@backend/shared/http";
