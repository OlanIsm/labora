import { AppError } from "./errors";
export function text(
  value: unknown,
  field: string,
  max = 200,
  optional = false,
): string {
  if (optional && (value === undefined || value === "")) return "";
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new AppError("VALIDATION_ERROR", {
      [field]: [`Isi ${field} dengan benar (maksimal ${max} karakter).`],
    });
  return value.trim();
}
export function uuid(value: unknown, field = "id"): string {
  const result = text(value, field, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      result,
    )
  )
    throw new AppError("VALIDATION_ERROR", { [field]: ["ID tidak valid."] });
  return result;
}
export function integer(
  value: unknown,
  field: string,
  min = 0,
  max = 1000000,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    throw new AppError("VALIDATION_ERROR", {
      [field]: ["Angka di luar batas."],
    });
  return value;
}
export function fields(body: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    throw new AppError("VALIDATION_ERROR", {
      form: ["Ada kolom yang tidak didukung."],
    });
}
export function page(request: Request) {
  const params = new URL(request.url).searchParams;
  const offset = Number(params.get("offset") || 0),
    limit = Number(params.get("limit") || 50);
  return {
    offset: integer(offset, "offset", 0, 10000),
    limit: integer(limit, "limit", 1, 100),
  };
}
