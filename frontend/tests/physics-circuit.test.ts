import { strict as assert } from "node:assert";
import {
  Component,
  lampBrightness,
  MIN_RESISTANCE,
  shouldFuseBlow,
  shouldLampBurnOut,
  solveCircuit,
} from "../lib/physics-sims/circuit/engine";

// Simple series circuit: battery -> resistor -> back to battery.
// Node 0 = ground/negative terminal, node 1 = positive terminal / across resistor.
// I = V/R: 12V battery, 4 ohm resistor -> I = 3A.
{
  const components: Component[] = [
    { id: "battery", kind: "battery", nodeA: 1, nodeB: 0, voltage: 12 },
    { id: "r1", kind: "resistor", nodeA: 1, nodeB: 0, resistance: 4 },
  ];
  const solution = solveCircuit(components, 2);
  assert.ok(Math.abs(solution.branchCurrents.r1 - 3) < 1e-6, `expected I=3A, got ${solution.branchCurrents.r1}`);
}

// Series circuit with two resistors: battery -> R1 -> R2 -> ground.
// 12V, R1=2, R2=4 (total 6 ohm) -> I = 2A through both (same current in series).
{
  const components: Component[] = [
    { id: "battery", kind: "battery", nodeA: 1, nodeB: 0, voltage: 12 },
    { id: "r1", kind: "resistor", nodeA: 1, nodeB: 2, resistance: 2 },
    { id: "r2", kind: "resistor", nodeA: 2, nodeB: 0, resistance: 4 },
  ];
  const solution = solveCircuit(components, 3);
  assert.ok(Math.abs(solution.branchCurrents.r1 - 2) < 1e-6, `R1 current should be 2A, got ${solution.branchCurrents.r1}`);
  assert.ok(Math.abs(solution.branchCurrents.r2 - 2) < 1e-6, `R2 current should be 2A, got ${solution.branchCurrents.r2}`);
}

// Parallel circuit: battery across two resistors in parallel.
// 12V, R1=6, R2=3 -> I1=2A, I2=4A, total current from battery = 6A.
// Equivalent resistance = (6*3)/(6+3) = 2 ohm, total I = 12/2 = 6A.
{
  const components: Component[] = [
    { id: "battery", kind: "battery", nodeA: 1, nodeB: 0, voltage: 12 },
    { id: "r1", kind: "resistor", nodeA: 1, nodeB: 0, resistance: 6 },
    { id: "r2", kind: "resistor", nodeA: 1, nodeB: 0, resistance: 3 },
  ];
  const solution = solveCircuit(components, 2);
  assert.ok(Math.abs(solution.branchCurrents.r1 - 2) < 1e-6, `R1 (6 ohm) should carry 2A, got ${solution.branchCurrents.r1}`);
  assert.ok(Math.abs(solution.branchCurrents.r2 - 4) < 1e-6, `R2 (3 ohm) should carry 4A, got ${solution.branchCurrents.r2}`);
  assert.ok(Math.abs(solution.branchCurrents.battery - 6) < 1e-6, `total battery current should be 6A, got ${solution.branchCurrents.battery}`);
}

// Open switch should block current entirely (series circuit with an open switch).
{
  const components: Component[] = [
    { id: "battery", kind: "battery", nodeA: 1, nodeB: 0, voltage: 12 },
    { id: "sw", kind: "switch", nodeA: 1, nodeB: 2, closed: false },
    { id: "r1", kind: "resistor", nodeA: 2, nodeB: 0, resistance: 4 },
  ];
  const solution = solveCircuit(components, 3);
  assert.ok(Math.abs(solution.branchCurrents.r1) < 1e-6, `open switch should block current, got ${solution.branchCurrents.r1}`);
}

// Closed switch should behave like a wire (negligible resistance, same
// current as if it were a direct connection).
{
  const components: Component[] = [
    { id: "battery", kind: "battery", nodeA: 1, nodeB: 0, voltage: 12 },
    { id: "sw", kind: "switch", nodeA: 1, nodeB: 2, closed: true },
    { id: "r1", kind: "resistor", nodeA: 2, nodeB: 0, resistance: 4 },
  ];
  const solution = solveCircuit(components, 3);
  assert.ok(Math.abs(solution.branchCurrents.r1 - 3) < 1e-3, `closed switch should pass full current (3A), got ${solution.branchCurrents.r1}`);
}

// A direct short circuit (wire straight across the battery terminals, no
// load) must not produce NaN or Infinity: the minimum-resistance trick
// bounds the current to a large but finite value.
{
  const components: Component[] = [
    { id: "battery", kind: "battery", nodeA: 1, nodeB: 0, voltage: 12 },
    { id: "wire", kind: "wire", nodeA: 1, nodeB: 0 },
  ];
  const solution = solveCircuit(components, 2);
  const current = solution.branchCurrents.wire;
  assert.ok(Number.isFinite(current), `short-circuit current must be finite, got ${current}`);
  assert.ok(Math.abs(current) > 1000, `short-circuit current should be very large, got ${current}`);
  const expected = 12 / MIN_RESISTANCE;
  assert.ok(Math.abs(current - expected) / expected < 0.01, `short current should match V/R_min, got ${current} expected ~${expected}`);
}

// Fuse blow threshold: a fuse should blow when current exceeds its rating,
// and remain intact below it.
{
  const fuseOk: Component = { id: "f1", kind: "fuse", nodeA: 0, nodeB: 1, fuseRatingAmps: 5, resistance: MIN_RESISTANCE };
  assert.equal(shouldFuseBlow(fuseOk, 3), false, "3A should not blow a 5A fuse");
  assert.equal(shouldFuseBlow(fuseOk, 6), true, "6A should blow a 5A fuse");
  assert.equal(shouldFuseBlow({ ...fuseOk, blown: true }, 100), false, "an already-blown fuse should not re-trigger");
}

// Lamp burnout threshold and brightness: brightness should scale with
// power up to the rated max, and the lamp should burn out above it.
{
  const lamp: Component = { id: "l1", kind: "lamp", nodeA: 0, nodeB: 1, resistance: 10, maxPowerWatts: 20 };
  assert.ok(Math.abs(lampBrightness(lamp, 10) - 0.5) < 1e-9, "half-rated power should give half brightness");
  assert.ok(Math.abs(lampBrightness(lamp, 20) - 1) < 1e-9, "rated power should give full brightness");
  assert.equal(shouldLampBurnOut(lamp, 15), false, "below-rated power should not burn out the lamp");
  assert.equal(shouldLampBurnOut(lamp, 25), true, "above-rated power should burn out the lamp");
}

// Full lifecycle: a short circuit should overload a fuse in series with it,
// and after the fuse is marked blown and the circuit re-solved, current
// through the rest of the circuit should drop to ~0.
{
  const baseComponents: Component[] = [
    { id: "battery", kind: "battery", nodeA: 1, nodeB: 0, voltage: 12 },
    { id: "fuse", kind: "fuse", nodeA: 1, nodeB: 2, fuseRatingAmps: 5, resistance: MIN_RESISTANCE },
    { id: "wire", kind: "wire", nodeA: 2, nodeB: 0 }, // direct short past the fuse
  ];
  const firstPass = solveCircuit(baseComponents, 3);
  const fuseComponent = baseComponents.find((c) => c.id === "fuse")!;
  const blows = shouldFuseBlow(fuseComponent, firstPass.branchCurrents.fuse);
  assert.ok(blows, `a short circuit should overload the fuse, current was ${firstPass.branchCurrents.fuse}`);

  const afterBlow = baseComponents.map((c) => (c.id === "fuse" ? { ...c, blown: true } : c));
  const secondPass = solveCircuit(afterBlow, 3);
  assert.ok(Math.abs(secondPass.branchCurrents.wire) < 1e-6, `after the fuse blows, current should drop to ~0, got ${secondPass.branchCurrents.wire}`);
}

console.log(
  "Circuit checks passed: series Ohm's law, series two-resistor, parallel current division, open/closed switch, finite short-circuit current, fuse blow threshold, lamp burnout and brightness, full fuse-blow lifecycle.",
);
