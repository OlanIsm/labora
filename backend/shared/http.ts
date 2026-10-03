import { randomUUID } from "node:crypto";
import { AppError, errorResponse } from "./errors";

export function requireSameOrigin(request: Request): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.APP_URL || request.url).origin;
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    !origin ||
    origin !== expected
  )
    throw new AppError("FORBIDDEN");
}

export async function readJson(
  request: Request,
  maxBytes = 32_768,
): Promise<Record<string, unknown>> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new AppError("UNSUPPORTED_MEDIA_TYPE");
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) throw new AppError("PAYLOAD_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("BAD_REQUEST");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new AppError("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let body: unknown;
  try {
    body = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)),
    );
  } catch {
    throw new AppError("BAD_REQUEST");
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new AppError("BAD_REQUEST");
  return body as Record<string, unknown>;
}

export function apiHandler<T>(
  handler: (request: Request) => Promise<T>,
  status = 200,
) {
  return async (request: Request): Promise<Response> => {
    const requestId = randomUUID();
    try {
      requireSameOrigin(request);
      const data = await handler(request);
      return Response.json(
        { data, requestId },
        {
          status,
          headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" },
        },
      );
    } catch (error) {
      if (!(error instanceof AppError))
        console.error(
          JSON.stringify({
            event: "api_error",
            requestId,
            method: request.method,
            path: new URL(request.url).pathname,
          }),
        );
      return errorResponse(error, requestId);
    }
  };
}

export const unsupportedMethod = apiHandler(async () => {
  throw new AppError("METHOD_NOT_ALLOWED");
});
