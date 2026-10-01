// Minimal 2D vector math. No DOM, no React: safe to unit test directly.
export type Vector2 = { x: number; y: number };

export const vec2 = (x: number, y: number): Vector2 => ({ x, y });

export const add = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y });

export const sub = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y });

export const scale = (a: Vector2, s: number): Vector2 => ({ x: a.x * s, y: a.y * s });

export const length = (a: Vector2): number => Math.sqrt(a.x * a.x + a.y * a.y);

export const normalize = (a: Vector2): Vector2 => {
  const len = length(a);
  return len > 1e-9 ? scale(a, 1 / len) : vec2(0, 0);
};

export const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;
