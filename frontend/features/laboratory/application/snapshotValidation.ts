export function numeric(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}
export function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function point(value: unknown): boolean {
  return (
    object(value) &&
    numeric(value.x, -10000, 10000) &&
    numeric(value.y, -10000, 10000)
  );
}
