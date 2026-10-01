import { Entity } from "./types";
import { materials } from "./catalog";
import { Portion } from "./types";

export function mixtureHeatCapacity(contents: Portion[]): number {
  // TODO-REVIEW-GURU: aqueous solutions use water's specific heat; unspecified solids use 0.8 J/(g K).
  return contents.reduce((capacity, portion) => {
    const material = materials[portion.material];
    const specific =
      material?.heatCapacity ?? (material?.phase === "liquid" ? 4.18 : 0.8);
    return capacity + portion.mass * specific;
  }, 0);
}
export function equilibriumTemperature(
  first: number,
  firstCapacity: number,
  second: number,
  secondCapacity: number,
): number {
  const total = firstCapacity + secondCapacity;
  return total > 0
    ? (first * firstCapacity + second * secondCapacity) / total
    : first;
}

export const G = 9.8;
export const R = 8.314462618;
export const molarGasVolume = (temperature: number) =>
  ((R * (temperature + 273.15)) / 101325) * 1e6;
export const heatChange = (
  joules: number,
  massG: number,
  heatCapacity = 4.18,
) => (massG > 0 ? joules / (massG * heatCapacity) : 0);
export const ohm = (voltage: number, resistance: number) =>
  resistance > 0 ? voltage / resistance : 0;
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
  return (
    2 *
    Math.PI *
    Math.sqrt(Math.max(0, length) / G) *
    (1 + (radians * radians) / 16)
  );
}
export function projectile(speed: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    range: (speed * speed * Math.sin(2 * rad)) / G,
    height: (speed * Math.sin(rad)) ** 2 / (2 * G),
    duration: (2 * speed * Math.sin(rad)) / G,
  };
}
export function buoyancy(density: number, volume: number) {
  return density * G * volume;
}
export function totalVolume(e: Entity) {
  return e.contents.reduce((n, p) => n + p.volume, 0);
}
export function totalMass(e: Entity) {
  return e.contents.reduce((n, p) => n + p.mass, 0);
}
export function ph(e: Entity) {
  const liters = totalVolume(e) / 1000;
  if (liters <= 0) return 7;
  let balance = 0;
  const acids: { c: number; ka: number }[] = [];
  const bases: { c: number; ka: number }[] = [];
  for (const p of e.contents) {
    const m = materials[p.material];
    if (!m) continue;
    const c = p.moles / liters;
    if (m.id === "acetate") {
      balance += c;
      acids.push({ c, ka: m.ka! });
    } else if (m.id === "ammonium") {
      balance -= c;
      bases.push({ c, ka: 1e-14 / m.kb! });
    } else if (m.ka) acids.push({ c, ka: m.ka });
    else if (m.kb) bases.push({ c, ka: 1e-14 / m.kb });
    else if (m.id === "nahco3") {
      acids.push({ c, ka: 4.7e-11 });
      bases.push({ c, ka: 4.3e-7 });
    } else balance += c * ((m.base || 0) - (m.acid || 0));
  }
  // TODO-REVIEW-GURU: H2SO4 uses two acid equivalents; second dissociation is approximated as complete.
  const residual = (h: number) =>
    h +
    balance +
    bases.reduce((n, b) => n + (b.c * h) / (h + b.ka), 0) -
    1e-14 / h -
    acids.reduce((n, a) => n + (a.c * a.ka) / (h + a.ka), 0);
  let low = 1e-15,
    high = 10;
  for (let i = 0; i < 120; i++) {
    const mid = Math.sqrt(low * high);
    if (residual(mid) > 0) high = mid;
    else low = mid;
  }
  return Math.max(0, Math.min(14, -Math.log10(Math.sqrt(low * high))));
}
export function indicatorColor(kind: string, pH: number) {
  const colors: Record<string, [number, string][]> = {
    universal: [
      [2, "#db5361"],
      [4, "#e49042"],
      [6, "#e2c147"],
      [8, "#63a16f"],
      [11, "#5091b8"],
      [15, "#8255aa"],
    ],
    pp: [
      [8.2, "#d5edf7"],
      [10, "#df9abe"],
      [15, "#c64c91"],
    ],
    mo: [
      [3.1, "#db5361"],
      [4.4, "#e49042"],
      [15, "#e2c147"],
    ],
    btb: [
      [6, "#e2c147"],
      [7.6, "#63a16f"],
      [15, "#5091b8"],
    ],
    litmus: [
      [7, "#db5361"],
      [15, "#5091b8"],
    ],
    cabbage: [
      [3, "#d475a4"],
      [7, "#8255aa"],
      [9, "#5091b8"],
      [11, "#63a16f"],
      [15, "#e2c147"],
    ],
  };
  return (
    (colors[kind] || colors.universal).find(([limit]) => pH < limit)?.[1] ||
    "#8255aa"
  );
}
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function punnett(
  dihybrid: boolean,
  testCross: boolean,
  seed: number,
  n = 160,
) {
  const random = seeded(seed);
  const counts = Array(dihybrid ? 4 : 2).fill(0) as number[];
  for (let i = 0; i < n; i++) {
    const dominant = random() < (testCross ? 0.5 : 0.75);
    const second = !dihybrid || random() < (testCross ? 0.5 : 0.75);
    counts[
      dihybrid ? (dominant ? 0 : 2) + (second ? 0 : 1) : dominant ? 0 : 1
    ]++;
  }
  return counts;
}
