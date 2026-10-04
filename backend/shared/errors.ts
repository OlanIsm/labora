import type { ApiErrorBody, ErrorCode } from "@contracts/api";

const definitions: Record<
  ErrorCode,
  { status: number; message: string; retryable: boolean }
> = {
  BAD_REQUEST: {
    status: 400,
    message: "Permintaan tidak dapat dibaca.",
    retryable: false,
  },
  UNAUTHENTICATED: {
    status: 401,
    message: "Masuk untuk melanjutkan.",
    retryable: false,
  },
  INVALID_CREDENTIALS: {
    status: 401,
    message: "Email atau kata sandi belum sesuai.",
    retryable: false,
  },
  FORBIDDEN: {
    status: 403,
    message: "Kamu tidak memiliki akses untuk tindakan ini.",
    retryable: false,
  },
  NOT_FOUND: {
    status: 404,
    message: "Data tidak ditemukan atau tidak dapat diakses.",
    retryable: false,
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: "Metode permintaan belum didukung untuk alamat ini.",
    retryable: false,
  },
  REVISION_CONFLICT: {
    status: 409,
    message:
      "Ada versi pekerjaan yang lebih baru. Muat ulang sebelum menyimpan.",
    retryable: false,
  },
  IDEMPOTENCY_CONFLICT: {
    status: 409,
    message: "Permintaan ini pernah digunakan dengan data berbeda.",
    retryable: false,
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: "Data yang dikirim terlalu besar.",
    retryable: false,
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    message: "Format data belum didukung.",
    retryable: false,
  },
  VALIDATION_ERROR: {
    status: 422,
    message: "Periksa data yang kamu kirim.",
    retryable: false,
  },
  RATE_LIMITED: {
    status: 429,
    message: "Terlalu banyak permintaan. Coba lagi sebentar.",
    retryable: true,
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: "Layanan belum dapat dihubungi. Coba lagi sebentar.",
    retryable: true,
  },
  NOT_CONFIGURED: {
    status: 503,
    message: "Akun sekolah belum terhubung. Mode demo tetap tersedia.",
    retryable: false,
  },
  INTERNAL_ERROR: {
    status: 500,
    message: "Terjadi kendala saat memproses permintaan.",
    retryable: false,
  },
};

export class AppError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  constructor(
    readonly code: ErrorCode,
    readonly fieldErrors?: Record<string, string[]>,
    readonly retryAfter?: number,
  ) {
    const definition = definitions[code];
    super(definition.message);
    this.status = definition.status;
    this.retryable = definition.retryable;
  }
}

export function errorResponse(error: unknown, requestId: string): Response {
  const safe =
    error instanceof AppError ? error : new AppError("INTERNAL_ERROR");
  const body: ApiErrorBody = {
    error: {
      code: safe.code,
      message: safe.message,
      retryable: safe.retryable,
      ...(safe.fieldErrors ? { fieldErrors: safe.fieldErrors } : {}),
    },
    requestId,
  };
  return Response.json(body, {
    status: safe.status,
    headers: {
      "X-Request-Id": requestId,
      "Cache-Control": "no-store",
      ...(safe.retryAfter ? { "Retry-After": String(safe.retryAfter) } : {}),
    },
  });
}
