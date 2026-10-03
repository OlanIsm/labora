import { strict as assert } from "node:assert";
import {
  buoyancyForce,
  classifyStatus,
  hydrostaticPressure,
  initialSubmarineState,
  stepSubmarine,
  submergedVolumeFraction,
  totalMass,
  weightForce,
} from "../features/laboratory/subjects/physics/simulations/domain/submarine/engine";
import {
  FLUIDS,
  PLANETS,
} from "../features/laboratory/subjects/physics/simulations/domain/shared/config";

const EARTH_G = PLANETS.earth.gravity;
const HULL_HEIGHT = 4; // m
const HULL_VOLUME = 20; // m^3

// F_a = ρ_fluid * V_submerged * g; fully submerged with hullMass chosen so
// density matches water exactly should sit in neutral equilibrium (F_a = W).
{
  const water = FLUIDS.water;
  const neutralMass = water.density * HULL_VOLUME; // mass that makes average density == fluid density
  const params = {
    gravity: EARTH_G,
    fluidDensity: water.density,
    dragCoefficient: water.dragCoefficient,
    hullVolume: HULL_VOLUME,
    hullMass: neutralMass,
    surfaceY: 0,
  };
  const state = { depthBelowSurface: 10, velocity: 0, ballastWaterFraction: 0 }; // fully submerged
  const weight = weightForce(state, params);
  const buoyancy = buoyancyForce(state, params, HULL_HEIGHT);
  assert.ok(
    Math.abs(weight - buoyancy) / weight < 1e-9,
    `at matched density, weight and buoyancy should be equal: W=${weight} Fa=${buoyancy}`,
  );
  assert.equal(classifyStatus(weight - buoyancy, 0), "neutral");
}

// A submarine denser than the fluid (heavier hull, same volume) must sink:
// weight > buoyancy, net downward force.
{
  const water = FLUIDS.water;
  const heavyMass = water.density * HULL_VOLUME * 1.2; // 20% denser than water
  const params = {
    gravity: EARTH_G,
    fluidDensity: water.density,
    dragCoefficient: water.dragCoefficient,
    hullVolume: HULL_VOLUME,
    hullMass: heavyMass,
    surfaceY: 0,
  };
  const state = { depthBelowSurface: 10, velocity: 0, ballastWaterFraction: 0 };
  const weight = weightForce(state, params);
  const buoyancy = buoyancyForce(state, params, HULL_HEIGHT);
  assert.ok(
    weight > buoyancy,
    "denser-than-fluid sub should have weight > buoyancy",
  );
  assert.equal(classifyStatus(weight - buoyancy, 0), "sinking");
}

// A submarine lighter than the fluid must float: buoyancy > weight.
{
  const water = FLUIDS.water;
  const lightMass = water.density * HULL_VOLUME * 0.8;
  const params = {
    gravity: EARTH_G,
    fluidDensity: water.density,
    dragCoefficient: water.dragCoefficient,
    hullVolume: HULL_VOLUME,
    hullMass: lightMass,
    surfaceY: 0,
  };
  const state = { depthBelowSurface: 10, velocity: 0, ballastWaterFraction: 0 };
  const weight = weightForce(state, params);
  const buoyancy = buoyancyForce(state, params, HULL_HEIGHT);
  assert.ok(
    buoyancy > weight,
    "lighter-than-fluid sub should have buoyancy > weight",
  );
  assert.equal(classifyStatus(weight - buoyancy, 0), "floating");
}

// Filling the ballast tank with water increases total mass and therefore
// weight, without changing hull volume (buoyancy at full submersion is
// unchanged), so a previously-floating sub should start sinking once
// ballast is filled.
{
  const water = FLUIDS.water;
  const lightMass = water.density * HULL_VOLUME * 0.8;
  const params = {
    gravity: EARTH_G,
    fluidDensity: water.density,
    dragCoefficient: water.dragCoefficient,
    hullVolume: HULL_VOLUME,
    hullMass: lightMass,
    surfaceY: 0,
  };
  const emptyBallast = {
    depthBelowSurface: 10,
    velocity: 0,
    ballastWaterFraction: 0,
  };
  const fullBallast = {
    depthBelowSurface: 10,
    velocity: 0,
    ballastWaterFraction: 1,
  };
  assert.ok(totalMass(fullBallast, params) > totalMass(emptyBallast, params));
  const buoyancyUnchanged =
    buoyancyForce(emptyBallast, params, HULL_HEIGHT) ===
    buoyancyForce(fullBallast, params, HULL_HEIGHT);
  assert.ok(
    buoyancyUnchanged,
    "buoyancy at full submersion should not depend on ballast fraction",
  );
}

// Hydrostatic pressure increases linearly with depth: P = P0 + rho*g*h.
{
  const water = FLUIDS.water;
  const params = {
    gravity: EARTH_G,
    fluidDensity: water.density,
    dragCoefficient: water.dragCoefficient,
    hullVolume: HULL_VOLUME,
    hullMass: 1000,
    surfaceY: 0,
  };
  const p0 = hydrostaticPressure(0, params);
  const p10 = hydrostaticPressure(10, params);
  const p20 = hydrostaticPressure(20, params);
  assert.ok(p10 > p0 && p20 > p10, "pressure should increase with depth");
  const expectedDelta = water.density * EARTH_G * 10;
  assert.ok(
    Math.abs(p10 - p0 - expectedDelta) < 1,
    `pressure delta should match rho*g*h: got ${p10 - p0}, expected ${expectedDelta}`,
  );
}

// Partial submersion: a hull straddling the surface should displace a
// fraction of its volume proportional to how much is underwater, and that
// fraction must be 0 fully above and 1 fully below.
{
  assert.equal(submergedVolumeFraction(100, HULL_HEIGHT), 1);
  assert.equal(submergedVolumeFraction(-100, HULL_HEIGHT), 0);
  const halfway = submergedVolumeFraction(0, HULL_HEIGHT);
  assert.ok(
    Math.abs(halfway - 0.5) < 1e-9,
    `straddling the surface should be ~50% submerged, got ${halfway}`,
  );
}

// A denser-than-fluid sub released from rest should settle into a steady
// (near-constant) sinking speed rather than oscillating, thanks to linear
// drag opposing velocity. Check that velocity does not overshoot and
// reverse sign repeatedly (no oscillation).
{
  const water = FLUIDS.water;
  const heavyMass = water.density * HULL_VOLUME * 1.1;
  const params = {
    gravity: EARTH_G,
    fluidDensity: water.density,
    dragCoefficient: water.dragCoefficient,
    hullVolume: HULL_VOLUME,
    hullMass: heavyMass,
    surfaceY: 0,
  };
  let state = { depthBelowSurface: 5, velocity: 0, ballastWaterFraction: 0 };
  let signFlips = 0;
  let lastVelocity = 0;
  // Stop before the seabed clamp engages (depth 40m): this checks the
  // free-sinking phase, not the clamp's own stop-at-floor behavior.
  for (let i = 0; i < 2000 && state.depthBelowSurface < 35; i++) {
    state = stepSubmarine(state, params, HULL_HEIGHT, 0, 1 / 120);
    if (
      lastVelocity !== 0 &&
      Math.sign(state.velocity) !== Math.sign(lastVelocity) &&
      Math.abs(state.velocity) > 0.01
    ) {
      signFlips += 1;
    }
    lastVelocity = state.velocity;
  }
  assert.ok(
    signFlips === 0,
    `velocity should not oscillate (sign flips), got ${signFlips} flips`,
  );
  assert.ok(
    state.velocity > 0,
    "a denser-than-fluid sub should settle into a sinking (positive) velocity",
  );
}

console.log(
  "Submarine checks passed: Archimedes equilibrium (Fa=W), sink/float classification, ballast effect, hydrostatic pressure, partial submersion, no oscillation.",
);
