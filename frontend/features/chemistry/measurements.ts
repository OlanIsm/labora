import { Entity } from "../../lib/sandbox/types";
import { materials } from "../../lib/sandbox/catalog";
import { totalVolume } from "../../lib/sandbox/measurements";
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
