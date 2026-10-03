import type { ApiErrorBody, ApiResponse, ErrorCode } from "@contracts/api";

export class ApiError extends Error {
  constructor(
    readonly code:
      | ErrorCode
      | "NETWORK_ERROR"
      | "TIMEOUT"
      | "CANCELLED"
      | "INVALID_RESPONSE",
    message: string,
    readonly status = 0,
    readonly requestId?: string,
    readonly fieldErrors?: Record<string, string[]>,
    readonly retryable = false,
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("API paths must be relative.");
  const timeout = AbortSignal.timeout(15_000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...Object.fromEntries(new Headers(options.headers)),
      },
    });
  } catch {
    if (options.signal?.aborted)
      throw new ApiError("CANCELLED", "Permintaan dibatalkan.");
    if (timeout.aborted)
      throw new ApiError(
        "TIMEOUT",
        "Permintaan terlalu lama. Coba lagi.",
        0,
        undefined,
        undefined,
        true,
      );
    throw new ApiError(
      "NETWORK_ERROR",
      "Koneksi terputus. Periksa jaringanmu.",
      0,
      undefined,
      undefined,
      true,
    );
  }
  let body: ApiResponse<T> | ApiErrorBody;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      "INVALID_RESPONSE",
      "Respons layanan belum dapat dibaca.",
      response.status,
    );
  }
  if (!body || typeof body !== "object" || typeof body.requestId !== "string")
    throw new ApiError(
      "INVALID_RESPONSE",
      "Respons layanan belum dapat dibaca.",
      response.status,
    );
  if (!response.ok) {
    if (
      !("error" in body) ||
      typeof body.error?.code !== "string" ||
      typeof body.error.message !== "string"
    )
      throw new ApiError(
        "INVALID_RESPONSE",
        "Respons layanan belum dapat dibaca.",
        response.status,
        body.requestId,
      );
    throw new ApiError(
      body.error.code,
      body.error.message,
      response.status,
      body.requestId,
      body.error.fieldErrors,
      body.error.retryable,
      Number(response.headers.get("retry-after")) || undefined,
    );
  }
  if (!("data" in body))
    throw new ApiError(
      "INVALID_RESPONSE",
      "Respons layanan belum dapat dibaca.",
      response.status,
      body.requestId,
    );
  return body.data;
}
