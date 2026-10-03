// Physical constants shared across simulations. No magic numbers in engine code.

export type PlanetId = "earth" | "moon" | "mars" | "jupiter";

export type Planet = {
  id: PlanetId;
  label: string;
  gravity: number; // m/s^2
  airDensity: number; // kg/m^3, 0 disables drag entirely (airless)
};

export const PLANETS: Record<PlanetId, Planet> = {
  earth: { id: "earth", label: "Bumi", gravity: 9.8, airDensity: 1.225 },
  moon: { id: "moon", label: "Bulan", gravity: 1.62, airDensity: 0 },
  mars: { id: "mars", label: "Mars", gravity: 3.71, airDensity: 0.02 },
  jupiter: {
    id: "jupiter",
    label: "Jupiter",
    gravity: 24.79,
    airDensity: 0.16,
  },
};

export type FluidId = "water" | "seawater" | "oil" | "syrup";

export type Fluid = {
  id: FluidId;
  label: string;
  density: number; // kg/m^3
  dragCoefficient: number; // tuned per fluid so motion settles, not oscillates
};

export const FLUIDS: Record<FluidId, Fluid> = {
  water: {
    id: "water",
    label: "Air murni",
    density: 1000,
    dragCoefficient: 420,
  },
  seawater: {
    id: "seawater",
    label: "Air laut",
    density: 1025,
    dragCoefficient: 430,
  },
  oil: { id: "oil", label: "Minyak", density: 920, dragCoefficient: 520 },
  syrup: { id: "syrup", label: "Sirup", density: 1300, dragCoefficient: 900 },
};

// Fixed physics timestep. Decoupled from requestAnimationFrame render rate.
export const PHYSICS_DT = 1 / 120;
export const MAX_SUBSTEPS_PER_FRAME = 10; // guards against tab-switch time jumps
