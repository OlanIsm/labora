import { strict as assert } from "node:assert";
import {
  buildTrackPolyline,
  buildTrackTable,
  computeEnergy,
  initialCarState,
  sampleAt,
  stepCar,
  totalTrackLength,
} from "../features/laboratory/subjects/physics/simulations/domain/roller-coaster/engine";
import { TRACK_PRESETS } from "../features/laboratory/subjects/physics/simulations/domain/roller-coaster/presets";
import {
  PLANETS,
  PHYSICS_DT,
} from "../features/laboratory/subjects/physics/simulations/domain/shared/config";

const EARTH_G = PLANETS.earth.gravity;
const simpleHill = TRACK_PRESETS.find((p) => p.id === "simple-hill")!;
const loopTrack = TRACK_PRESETS.find((p) => p.id === "with-loop")!;

function buildTable(controlPoints: typeof simpleHill.controlPoints) {
  const polyline = buildTrackPolyline(controlPoints);
  return buildTrackTable(polyline);
}

// With zero friction, total mechanical energy (EP + EK) must stay constant
// (within numerical tolerance) as the car travels the track.
{
  const table = buildTable(simpleHill.controlPoints);
  const trackLength = totalTrackLength(table);
  const params = { gravity: EARTH_G, mass: 10, frictionCoefficient: 0 };
  const referenceHeight = sampleAt(table, 0).position.y - 100; // arbitrary low baseline so PE is always positive
  let state = initialCarState();
  const initialEnergy = computeEnergy(
    state,
    table,
    params,
    referenceHeight,
  ).total;
  let maxDrift = 0;
  let steps = 0;
  while (!state.finished && !state.derailed && steps < 20000) {
    state = stepCar(state, table, params, trackLength, PHYSICS_DT);
    const energy = computeEnergy(state, table, params, referenceHeight);
    const drift = Math.abs(energy.total - initialEnergy) / initialEnergy;
    if (drift > maxDrift) maxDrift = drift;
    steps += 1;
  }
  assert.ok(
    steps > 10,
    "car should take more than a few steps to traverse the hill",
  );
  assert.ok(
    maxDrift < 0.03,
    `energy should stay ~constant with zero friction, max drift was ${maxDrift}`,
  );
}

// With friction enabled, heat generated must be > 0 and total energy must
// still be conserved (EP + EK + Heat = constant), i.e. mechanical energy
// alone decreases by exactly the heat generated.
{
  const table = buildTable(simpleHill.controlPoints);
  const trackLength = totalTrackLength(table);
  const params = { gravity: EARTH_G, mass: 10, frictionCoefficient: 0.08 };
  const referenceHeight = sampleAt(table, 0).position.y - 100;
  let state = initialCarState();
  const initialEnergy = computeEnergy(
    state,
    table,
    params,
    referenceHeight,
  ).total;
  let steps = 0;
  while (!state.finished && !state.derailed && steps < 20000) {
    state = stepCar(state, table, params, trackLength, PHYSICS_DT);
    steps += 1;
  }
  assert.ok(state.heatGenerated > 0, "friction should generate heat");
  const finalEnergy = computeEnergy(state, table, params, referenceHeight);
  const drift = Math.abs(finalEnergy.total - initialEnergy) / initialEnergy;
  assert.ok(
    drift < 0.05,
    `total energy (incl. heat) should still be conserved, drift was ${drift}`,
  );
}

// A car moving too slowly through a loop must derail (lose contact), per
// v^2 < g*r at the top of the loop.
{
  const table = buildTable(loopTrack.controlPoints);
  const trackLength = totalTrackLength(table);
  const params = { gravity: EARTH_G, mass: 10, frictionCoefficient: 0 };
  let state = {
    arcLength: 0,
    speed: 0.3,
    heatGenerated: 0,
    derailed: false,
    finished: false,
  };
  let steps = 0;
  let derailedAtSomePoint = false;
  while (!state.finished && steps < 20000) {
    state = stepCar(state, table, params, trackLength, PHYSICS_DT);
    if (state.derailed) {
      derailedAtSomePoint = true;
      break;
    }
    steps += 1;
  }
  assert.ok(
    derailedAtSomePoint,
    "a car launched too slowly should derail somewhere on the loop",
  );
}

// A car with enough starting speed should clear the same loop without derailing.
{
  const table = buildTable(loopTrack.controlPoints);
  const trackLength = totalTrackLength(table);
  const params = { gravity: EARTH_G, mass: 10, frictionCoefficient: 0 };
  let state = {
    arcLength: 0,
    speed: 14,
    heatGenerated: 0,
    derailed: false,
    finished: false,
  };
  let steps = 0;
  while (!state.finished && !state.derailed && steps < 20000) {
    state = stepCar(state, table, params, trackLength, PHYSICS_DT);
    steps += 1;
  }
  assert.ok(
    !state.derailed,
    "a car launched fast enough should clear the loop",
  );
  assert.ok(state.finished, "car should reach the end of the track");
}

console.log(
  "Roller coaster checks passed: energy conservation (frictionless), heat generation with friction, loop derailment at low speed, loop clearance at high speed.",
);
