// Pure physics for the submarine buoyancy simulation. No DOM access.
// Vertical dynamics only: the submarine moves straight up/down based on the
// net of weight, buoyancy, and fluid drag.

export type SubmarineParams = {
  gravity: number; // m/s^2
  fluidDensity: number; // kg/m^3
  dragCoefficient: number; // tuned per fluid, see shared/config FLUIDS
  hullVolume: number; // m^3, total displaced volume when fully submerged
  hullMass: number; // kg, mass of the empty hull/structure
  surfaceY: number; // m, world-space y of the fluid surface (0 = seabed reference)
};

export type SubmarineState = {
  depthBelowSurface: number; // m, positive = submerged, negative = above surface
  velocity: number; // m/s, positive = sinking (moving toward seabed)
  ballastWaterFraction: number; // 0..1, how much of ballast tank volume is filled with water (vs air)
};

export const BALLAST_TANK_VOLUME_FRACTION = 0.15; // ballast tank is 15% of hull volume

export function initialSubmarineState(): SubmarineState {
  return { depthBelowSurface: 0, velocity: 0, ballastWaterFraction: 0 };
}

// Fraction of hull volume currently displacing fluid, given how deep the
// submarine is relative to its own height. For simplicity the hull is
// treated as a vertical cylinder of effective height `hullHeight`, so
// partial submersion (crossing the surface) displaces a fraction of volume
// proportional to how much of that height is underwater.
export function submergedVolumeFraction(depthBelowSurface: number, hullHeight: number): number {
  if (depthBelowSurface >= hullHeight / 2) return 1;
  if (depthBelowSurface <= -hullHeight / 2) return 0;
  return (depthBelowSurface + hullHeight / 2) / hullHeight;
}

export function totalMass(state: SubmarineState, params: SubmarineParams): number {
  const ballastVolume = params.hullVolume * BALLAST_TANK_VOLUME_FRACTION;
  const ballastWaterMass = ballastVolume * state.ballastWaterFraction * params.fluidDensity;
  return params.hullMass + ballastWaterMass;
}

export function weightForce(state: SubmarineState, params: SubmarineParams): number {
  return totalMass(state, params) * params.gravity;
}

export function buoyancyForce(
  state: SubmarineState,
  params: SubmarineParams,
  hullHeight: number,
): number {
  const fraction = submergedVolumeFraction(state.depthBelowSurface, hullHeight);
  return params.fluidDensity * params.hullVolume * fraction * params.gravity;
}

export function hydrostaticPressure(depthBelowSurface: number, params: SubmarineParams, atmosphericPressure = 101325): number {
  return atmosphericPressure + params.fluidDensity * params.gravity * Math.max(0, depthBelowSurface);
}

export type SubmarineStatus = "sinking" | "floating" | "neutral";

export function classifyStatus(netForce: number, velocity: number): SubmarineStatus {
  if (Math.abs(netForce) < 0.5 && Math.abs(velocity) < 0.02) return "neutral";
  return netForce > 0 ? "sinking" : "floating";
}

const SEABED_DEPTH = 40; // m, below which the submarine cannot sink further

// Semi-implicit Euler integration of vertical motion. Net force = Weight
// (down, positive depth direction) - Buoyancy (up) - Drag (opposes
// velocity). Drag uses a linear-in-speed model tuned per fluid (not
// quadratic) so the submarine settles smoothly instead of oscillating,
// matching the task's "tidak bergetar" requirement.
export function stepSubmarine(
  state: SubmarineState,
  params: SubmarineParams,
  hullHeight: number,
  propellerForce: number,
  dt: number,
): SubmarineState {
  const mass = totalMass(state, params);
  const weight = weightForce(state, params);
  const buoyancy = buoyancyForce(state, params, hullHeight);
  const dragForce = params.dragCoefficient * state.velocity;
  const netForce = weight - buoyancy - dragForce - propellerForce;
  const acceleration = netForce / mass;
  const nextVelocity = state.velocity + acceleration * dt;
  let nextDepth = state.depthBelowSurface + nextVelocity * dt;

  let clampedVelocity = nextVelocity;
  if (nextDepth > SEABED_DEPTH) {
    nextDepth = SEABED_DEPTH;
    clampedVelocity = Math.min(0, nextVelocity);
  }
  const maxHeightAboveSurface = hullHeight / 2;
  if (nextDepth < -maxHeightAboveSurface) {
    nextDepth = -maxHeightAboveSurface;
    clampedVelocity = Math.max(0, nextVelocity);
  }

  return { depthBelowSurface: nextDepth, velocity: clampedVelocity, ballastWaterFraction: state.ballastWaterFraction };
}

export const CHALLENGE_TOLERANCE = 0.5; // m, how close to target depth counts as "holding"
export const CHALLENGE_HOLD_DURATION = 5; // s, how long the sub must hold within tolerance
