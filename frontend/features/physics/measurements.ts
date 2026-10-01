export const G = 9.8;
export const ohm = (voltage: number, resistance: number) => resistance > 0 ? voltage / resistance : 0;
export function snell(n1: number, n2: number, angle: number) {
  const sine = (n1 / n2) * Math.sin((angle * Math.PI) / 180);
  return Math.abs(sine) > 1 ? null : (Math.asin(sine) * 180) / Math.PI;
}
export function lens(f: number, s: number) {
  const denominator = s - f;
  return Math.abs(denominator) < 1e-9
    ? { distance: Infinity, magnification: Infinity }
    : { distance: (f * s) / denominator, magnification: -f / denominator };
}
export function pendulum(length: number, amplitude = 0) {
  const radians = (amplitude * Math.PI) / 180;
  return 2 * Math.PI * Math.sqrt(Math.max(0, length) / G) * (1 + (radians * radians) / 16);
}
export function projectile(speed: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    range: (speed * speed * Math.sin(2 * rad)) / G,
    height: (speed * Math.sin(rad)) ** 2 / (2 * G),
    duration: (2 * speed * Math.sin(rad)) / G,
  };
}
export function buoyancy(density: number, volume: number) { return density * G * volume; }
