import { strict as assert } from "node:assert";
import {
  solveCircuit,
  shouldFuseBlow,
} from "../features/laboratory/subjects/physics/simulations/domain/circuit/engine";
import {
  assignNodes,
  CIRCUIT_PRESETS,
  toElectricalComponents,
} from "../features/laboratory/subjects/physics/simulations/domain/circuit/presets";
import {
  connectPoints,
  createComponent,
  moveComponent,
  rotateComponent,
} from "../features/laboratory/subjects/physics/simulations/domain/circuit/editor";

// Two lamps in series must carry the same current.
{
  const preset = CIRCUIT_PRESETS.find((p) => p.id === "series")!;
  const { nodeCount } = assignNodes(preset.components);
  const electrical = toElectricalComponents(preset.components);
  const solution = solveCircuit(electrical, nodeCount);
  const expected = 9 / (8 + 12);
  assert.ok(
    Math.abs(solution.branchCurrents.lamp1 - expected) / expected < 0.01,
    `series preset lamp current should be ~${expected}A, got ${solution.branchCurrents.lamp1}`,
  );
  assert.ok(Math.abs(solution.branchCurrents.lamp2 - expected) < 0.001);
}

// Build, move, rotate, and rewire a user-made circuit with the editor operations.
{
  const battery = createComponent("battery", "source", { col: 1, row: 1 });
  const lamp1 = createComponent("lamp", "first", { col: 1, row: 3 });
  const lamp2 = createComponent("lamp", "second", { col: 1, row: 5 });
  let circuit = [battery, lamp1, lamp2];
  const solve = (placed: typeof circuit) =>
    solveCircuit(toElectricalComponents(placed), assignNodes(placed).nodeCount);
  assert.equal(
    solve(circuit).branchCurrents.first,
    0,
    "Unconnected lamps must not light",
  );
  circuit = connectPoints(circuit, "lead", battery.from, lamp1.from);
  assert.ok(
    Math.abs(solve(circuit).branchCurrents.first) < 1e-6,
    "A lamp with only one terminal connected must not light",
  );
  circuit = connectPoints(circuit, "middle", lamp1.to, lamp2.from);
  circuit = connectPoints(circuit, "return", lamp2.to, battery.to);
  const series = solve(circuit);
  assert.ok(Math.abs(series.branchCurrents.first - 9 / 16) < 0.001);
  assert.ok(
    Math.abs(series.branchCurrents.first - series.branchCurrents.second) < 1e-6,
  );
  const moved = moveComponent(circuit, "first", 4, 0);
  assert.ok(
    Math.abs(solve(moved).branchCurrents.first - series.branchCurrents.first) <
      0.001,
    "Attached wires must follow a moved lamp",
  );
  const rotated = rotateComponent(moved, "first");
  assert.ok(
    Math.abs(
      solve(rotated).branchCurrents.first - series.branchCurrents.first,
    ) < 0.001,
    "Rotation must preserve attached wires",
  );
  const bounded = moveComponent(rotated, "first", -100, 100);
  for (const c of bounded)
    for (const p of [c.from, c.to])
      assert.ok(p.col >= 0 && p.col <= 8 && p.row >= 0 && p.row <= 5);
  assert.equal(
    connectPoints(circuit, "zero", battery.from, battery.from),
    circuit,
  );
  assert.equal(
    connectPoints(circuit, "duplicate", lamp1.from, battery.from),
    circuit,
  );
  circuit = circuit.filter((c) => c.id !== "middle");
  circuit = connectPoints(circuit, "branch", battery.from, lamp2.from);
  circuit = connectPoints(circuit, "return-first", lamp1.to, battery.to);
  const parallel = solve(circuit);
  assert.ok(Math.abs(parallel.branchCurrents.first - 9 / 8) < 0.001);
  assert.ok(Math.abs(parallel.branchCurrents.second - 9 / 8) < 0.001);
  assert.ok(Math.abs(parallel.branchCurrents.source - 9 / 4) < 0.001);
  const removed = solve(circuit.filter((c) => c.id !== "first"));
  assert.ok(
    Math.abs(removed.branchCurrents.second - 9 / 8) < 0.001,
    "Removing one parallel lamp must leave the other powered",
  );
}

// Parallel preset: battery(9V) across lamp1(8ohm) and lamp2(12ohm) in parallel.
// I1 = 9/8 = 1.125A, I2 = 9/12 = 0.75A.
{
  const preset = CIRCUIT_PRESETS.find((p) => p.id === "parallel")!;
  const { nodeCount } = assignNodes(preset.components);
  const electrical = toElectricalComponents(preset.components);
  const solution = solveCircuit(electrical, nodeCount);
  assert.ok(
    Math.abs(solution.branchCurrents.lamp1 - 1.125) < 0.01,
    `lamp1 should carry ~1.125A, got ${solution.branchCurrents.lamp1}`,
  );
  assert.ok(
    Math.abs(solution.branchCurrents.lamp2 - 0.75) < 0.01,
    `lamp2 should carry ~0.75A, got ${solution.branchCurrents.lamp2}`,
  );
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
  assert.ok(
    Number.isFinite(current),
    `short-circuit demo current must be finite, got ${current}`,
  );
  assert.ok(
    shouldFuseBlow(fuseComponent, current),
    `short-circuit preset should overload its own fuse, current was ${current}`,
  );
}

console.log(
  "Circuit preset checks passed: series lamp current, parallel current division across two lamps, short-circuit preset overloads its own fuse.",
);
