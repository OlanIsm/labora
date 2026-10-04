import { strict as assert } from "node:assert";
import {
  analyticFlightTime,
  analyticMaxHeight,
  analyticRange,
  hitsObstacle,
  hitsTarget,
  launchProjectile,
  simulateTrajectory,
  stepProjectile,
} from "../features/laboratory/subjects/physics/simulations/domain/projectile/engine";
import { PLANETS } from "../features/laboratory/subjects/physics/simulations/domain/shared/config";

const EARTH_G = PLANETS.earth.gravity;
const noDrag = {
  gravity: EARTH_G,
  mass: 1,
  dragEnabled: false,
  dragCoefficient: 0.47,
  airDensity: PLANETS.earth.airDensity,
  crossSectionArea: 0.01,
};

// Simulated no-drag range/height/time must match the closed-form formulas
// within numeric-integration tolerance.
const simmed45 = simulateTrajectory(45, 20, noDrag);
const analyticRange45 = analyticRange(45, 20, EARTH_G);
assert.ok(
  Math.abs(simmed45.range - analyticRange45) / analyticRange45 < 0.01,
  `range mismatch: sim=${simmed45.range} analytic=${analyticRange45}`,
);
const analyticHeight45 = analyticMaxHeight(45, 20, EARTH_G);
assert.ok(
  Math.abs(simmed45.maxHeight - analyticHeight45) / analyticHeight45 < 0.02,
  `height mismatch: sim=${simmed45.maxHeight} analytic=${analyticHeight45}`,
);
const analyticTime45 = analyticFlightTime(45, 20, EARTH_G);
assert.ok(
  Math.abs(simmed45.duration - analyticTime45) / analyticTime45 < 0.02,
  `time mismatch: sim=${simmed45.duration} analytic=${analyticTime45}`,
);

// 45 degrees gives the maximum range on level ground for a fixed speed.
const range30 = simulateTrajectory(30, 20, noDrag).range;
const range60 = simulateTrajectory(60, 20, noDrag).range;
assert.ok(simmed45.range > range30 && simmed45.range > range60);

// At the apex, vertical velocity must be (near) zero.
let state = launchProjectile(45, 20);
let apexVy = Infinity;
while (!state.landed) {
  const next = stepProjectile(state, noDrag);
  if (state.velocity.y > 0 && next.velocity.y <= 0) apexVy = next.velocity.y;
  state = next;
}
assert.ok(Math.abs(apexVy) < 0.5, `apex vy should be ~0, got ${apexVy}`);

// Drag must noticeably shorten range, and heavier mass under the same drag
// should travel farther than a lighter one (drag force is per-area, not
// per-mass, so acceleration from drag is inversely proportional to mass).
const dragLight = { ...noDrag, dragEnabled: true, mass: 0.5 };
const dragHeavy = { ...noDrag, dragEnabled: true, mass: 5 };
const rangeDragLight = simulateTrajectory(45, 20, dragLight).range;
const rangeDragHeavy = simulateTrajectory(45, 20, dragHeavy).range;
assert.ok(
  rangeDragLight < simmed45.range,
  "drag should reduce range vs no-drag",
);
assert.ok(
  rangeDragHeavy > rangeDragLight,
  `heavier mass should travel farther under drag: heavy=${rangeDragHeavy} light=${rangeDragLight}`,
);

// With drag disabled, mass must not affect the trajectory at all.
const massA = simulateTrajectory(45, 20, { ...noDrag, mass: 0.2 }).range;
const massB = simulateTrajectory(45, 20, { ...noDrag, mass: 50 }).range;
assert.ok(
  Math.abs(massA - massB) < 1e-6,
  "mass must not affect range when drag is off",
);

// Collision helpers.
assert.ok(hitsTarget({ x: 60, y: 0.5 }, { x: 60, y: 0, radius: 3 }));
assert.ok(!hitsTarget({ x: 70, y: 0 }, { x: 60, y: 0, radius: 3 }));
assert.ok(hitsObstacle({ x: 46, y: 2 }, { x: 45, y: 0, width: 4, height: 8 }));
assert.ok(!hitsObstacle({ x: 10, y: 2 }, { x: 45, y: 0, width: 4, height: 8 }));

console.log(
  "Projectile checks passed: analytic match, 45-degree optimum, apex vy=0, drag mass dependence, collisions.",
);
