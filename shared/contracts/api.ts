export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "REVISION_CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "NOT_CONFIGURED"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
    retryable: boolean;
  };
  requestId: string;
};
export type ApiResponse<T> = { data: T; requestId: string };

export type AccountProfile = {
  avatarUrl?: string;
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
  mode: "account";
  schoolId?: string;
  className?: string;
};

export type AuthConfiguration = { configured: boolean };
export type AuthInput = { email: string; password: string; name?: string };
