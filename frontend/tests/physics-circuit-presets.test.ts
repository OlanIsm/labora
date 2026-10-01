import { strict as assert } from "node:assert";
import { solveCircuit, shouldFuseBlow } from "../lib/physics-sims/circuit/engine";
import { assignNodes, CIRCUIT_PRESETS, toElectricalComponents } from "../lib/physics-sims/circuit/presets";

// Series preset: battery(9V) -> lamp(8ohm) -> closed switch -> back.
// Total resistance ~8 ohm (switch/wire negligible) -> I = 9/8 = 1.125A.
{
  const preset = CIRCUIT_PRESETS.find((p) => p.id === "series")!;
  const { nodeCount } = assignNodes(preset.components);
  const electrical = toElectricalComponents(preset.components);
  const solution = solveCircuit(electrical, nodeCount);
  const expected = 9 / 8;
  assert.ok(
    Math.abs(solution.branchCurrents.lamp1 - expected) / expected < 0.01,
    `series preset lamp current should be ~${expected}A, got ${solution.branchCurrents.lamp1}`,
  );
}

// Parallel preset: battery(9V) across lamp1(8ohm) and lamp2(12ohm) in parallel.
// I1 = 9/8 = 1.125A, I2 = 9/12 = 0.75A.
{
  const preset = CIRCUIT_PRESETS.find((p) => p.id === "parallel")!;
  const { nodeCount } = assignNodes(preset.components);
  const electrical = toElectricalComponents(preset.components);
  const solution = solveCircuit(electrical, nodeCount);
  assert.ok(Math.abs(solution.branchCurrents.lamp1 - 1.125) < 0.01, `lamp1 should carry ~1.125A, got ${solution.branchCurrents.lamp1}`);
  assert.ok(Math.abs(solution.branchCurrents.lamp2 - 0.75) < 0.01, `lamp2 should carry ~0.75A, got ${solution.branchCurrents.lamp2}`);
}

// Short-circuit preset: battery(9V) -> fuse(5A rating) -> direct short wire.
// Current should massively exceed the fuse rating, confirming the demo
// circuit actually overloads the fuse as intended.
{
  const preset = CIRCUIT_PRESETS.find((p) => p.id === "shortCircuit")!;
  const { nodeCount } = assignNodes(preset.components);
  const electrical = toElectricalComponents(preset.components);
  const solution = solveCircuit(electrical, nodeCount);
  const fuseComponent = electrical.find((c) => c.id === "fuse")!;
  const current = solution.branchCurrents.fuse;
  assert.ok(Number.isFinite(current), `short-circuit demo current must be finite, got ${current}`);
  assert.ok(shouldFuseBlow(fuseComponent, current), `short-circuit preset should overload its own fuse, current was ${current}`);
}

console.log(
  "Circuit preset checks passed: series lamp current, parallel current division across two lamps, short-circuit preset overloads its own fuse.",
);
