import { Entity, Portion } from "./types";
import { materials } from "./catalog";

export { G, ohm, snell, lens, pendulum, projectile, buoyancy } from "../../features/physics/measurements";
export { ph, indicatorColor } from "../../features/chemistry/measurements";
export { seeded, punnett } from "../../features/biology/measurements";

export function mixtureHeatCapacity(contents: Portion[]): number {
  // TODO-REVIEW-GURU: aqueous solutions use water's specific heat; unspecified solids use 0.8 J/(g K).
  return contents.reduce((capacity, portion) => {
    const material = materials[portion.material];
    const specific = material?.heatCapacity ?? (material?.phase === "liquid" ? 4.18 : 0.8);
    return capacity + portion.mass * specific;
  }, 0);
}
export function equilibriumTemperature(first: number, firstCapacity: number, second: number, secondCapacity: number): number {
  const total = firstCapacity + secondCapacity;
  return total > 0 ? (first * firstCapacity + second * secondCapacity) / total : first;
}
export const R = 8.314462618;
export const molarGasVolume = (temperature: number) => ((R * (temperature + 273.15)) / 101325) * 1e6;
export const heatChange = (joules: number, massG: number, heatCapacity = 4.18) => massG > 0 ? joules / (massG * heatCapacity) : 0;
export function totalVolume(e: Entity) { return e.contents.reduce((n, p) => n + p.volume, 0); }
export function totalMass(e: Entity) { return e.contents.reduce((n, p) => n + p.mass, 0); }
