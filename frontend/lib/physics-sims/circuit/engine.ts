// Pure physics for the dynamic short-circuit simulator. No DOM access.
// Circuit solver via Modified Nodal Analysis (MNA): builds a conductance
// matrix from the component graph and solves for node voltages, which gives
// branch currents and power dissipation for every component.

export type ComponentKind = "battery" | "wire" | "switch" | "lamp" | "resistor" | "fuse";

export type Component = {
  id: string;
  kind: ComponentKind;
  nodeA: number;
  nodeB: number;
  voltage?: number; // for battery: EMF in volts
  resistance?: number; // for resistor/lamp/fuse: ohms; wire/switch use MIN_RESISTANCE unless open
  closed?: boolean; // for switch: true = conducting
  fuseRatingAmps?: number; // for fuse: current above this blows it
  blown?: boolean; // fuse state after solving, set by caller based on current
  maxPowerWatts?: number; // for lamp: burns out above this power
  burnedOut?: boolean;
};

// A real wire/closed switch has near-zero resistance, but exactly zero
// would make the conductance matrix singular (division by zero) and
// produce NaN/Infinity. This is the standard SPICE-style trick: a small
// but nonzero series resistance that is negligible next to any real load.
export const MIN_RESISTANCE = 1e-4;
// A broken component (open switch, blown fuse, burned-out lamp) is modeled
// as an extremely large resistance rather than literally removing it from
// the graph, which keeps the matrix well-defined.
export const OPEN_CIRCUIT_RESISTANCE = 1e9;

function componentConductance(component: Component): number {
  if (component.kind === "battery") return 1 / MIN_RESISTANCE; // battery's internal path, solved separately below
  if (component.kind === "switch") return 1 / (component.closed ? MIN_RESISTANCE : OPEN_CIRCUIT_RESISTANCE);
  if (component.kind === "wire") return 1 / MIN_RESISTANCE;
  if (component.kind === "fuse") return 1 / (component.blown ? OPEN_CIRCUIT_RESISTANCE : component.resistance || MIN_RESISTANCE);
  if (component.kind === "lamp") return 1 / (component.burnedOut ? OPEN_CIRCUIT_RESISTANCE : component.resistance || 1);
  return 1 / (component.resistance || 1); // resistor
}

export type CircuitSolution = {
  nodeVoltages: Record<number, number>;
  branchCurrents: Record<string, number>; // signed: positive = flowing from nodeA to nodeB
  branchPower: Record<string, number>;
};

// Solve the resistive network via nodal analysis. Battery components are
// treated as a fixed voltage source: the first battery's negative terminal
// (nodeB) is ground (0V) by convention, whatever node number it happens to
// be assigned, and its positive terminal (nodeA) is fixed to the battery's
// EMF relative to that ground. This is valid for simple series/parallel
// teaching circuits with a single voltage reference. All other
// (non-source) nodes are solved via conductance-matrix nodal analysis: sum
// of currents leaving each node = 0.
export function solveCircuit(components: Component[], nodeCount: number): CircuitSolution {
  const batteries = components.filter((c) => c.kind === "battery");
  const fixedVoltages = new Map<number, number>();
  for (const battery of batteries) {
    if (!fixedVoltages.has(battery.nodeB)) fixedVoltages.set(battery.nodeB, 0); // ground at this battery's negative terminal
    if (!fixedVoltages.has(battery.nodeA)) fixedVoltages.set(battery.nodeA, battery.voltage || 0);
  }
  if (fixedVoltages.size === 0) fixedVoltages.set(0, 0); // no battery at all: pin node 0 so the matrix is solvable

  const freeNodes = Array.from({ length: nodeCount }, (_, i) => i).filter((n) => !fixedVoltages.has(n));
  const indexOf = new Map(freeNodes.map((n, i) => [n, i]));
  const size = freeNodes.length;
  const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const b: number[] = new Array(size).fill(0);

  const resistiveComponents = components.filter((c) => c.kind !== "battery");
  for (const component of resistiveComponents) {
    const g = componentConductance(component);
    const { nodeA, nodeB } = component;
    const iA = indexOf.get(nodeA);
    const iB = indexOf.get(nodeB);
    const vA = fixedVoltages.get(nodeA);
    const vB = fixedVoltages.get(nodeB);

    if (iA !== undefined) {
      A[iA][iA] += g;
      if (iB !== undefined) A[iA][iB] -= g;
      else if (vB !== undefined) b[iA] += g * vB;
    }
    if (iB !== undefined) {
      A[iB][iB] += g;
      if (iA !== undefined) A[iB][iA] -= g;
      else if (vA !== undefined) b[iB] += g * vA;
    }
  }

  const solved = gaussianSolve(A, b);
  const nodeVoltages: Record<number, number> = {};
  for (const [node, v] of fixedVoltages) nodeVoltages[node] = v;
  for (const node of freeNodes) nodeVoltages[node] = solved[indexOf.get(node)!] ?? 0;

  const branchCurrents: Record<string, number> = {};
  const branchPower: Record<string, number> = {};
  for (const component of components) {
    if (component.kind === "battery") continue;
    const g = componentConductance(component);
    const vA = nodeVoltages[component.nodeA] ?? 0;
    const vB = nodeVoltages[component.nodeB] ?? 0;
    const current = (vA - vB) * g;
    branchCurrents[component.id] = current;
    branchPower[component.id] = Math.abs(current * (vA - vB));
  }
  // Battery current: sum of currents leaving its positive terminal through
  // every other component attached to that node (conservation of charge).
  for (const battery of batteries) {
    const outgoing = resistiveComponents
      .filter((c) => c.nodeA === battery.nodeA || c.nodeB === battery.nodeA)
      .reduce((sum, c) => {
        const sign = c.nodeA === battery.nodeA ? 1 : -1;
        return sum + sign * (branchCurrents[c.id] || 0);
      }, 0);
    branchCurrents[battery.id] = outgoing;
    branchPower[battery.id] = Math.abs(outgoing * (battery.voltage || 0));
  }

  return { nodeVoltages, branchCurrents, branchPower };
}

// Simple Gaussian elimination with partial pivoting. Circuits in this
// sandbox have at most a handful of nodes, so this is more than fast
// enough and keeps the dependency-free constraint from the task.
function gaussianSolve(A: number[][], b: number[]): number[] {
  const n = A.length;
  if (n === 0) return [];
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivotRow][col])) pivotRow = row;
    }
    [M[col], M[pivotRow]] = [M[pivotRow], M[col]];
    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-12) continue; // singular direction, leave as 0
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col] / pivot;
      for (let c = col; c <= n; c++) M[row][c] -= factor * M[col][c];
    }
  }
  return M.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]));
}

// A fuse blows when the current through it exceeds its rating. Applied by
// the caller after solving, then the circuit is re-solved with the fuse
// marked blown (open) to get the post-fuse-blow state.
export function shouldFuseBlow(component: Component, current: number): boolean {
  return component.kind === "fuse" && !component.blown && Math.abs(current) > (component.fuseRatingAmps || Infinity);
}

// A lamp burns out when its dissipated power exceeds its rated maximum.
export function shouldLampBurnOut(component: Component, power: number): boolean {
  return component.kind === "lamp" && !component.burnedOut && power > (component.maxPowerWatts || Infinity);
}

// Lamp brightness is proportional to dissipated power, normalized against
// its rated max so "100% brightness" means operating at its design power.
export function lampBrightness(component: Component, power: number): number {
  if (component.kind !== "lamp" || component.burnedOut) return 0;
  const rated = component.maxPowerWatts || 1;
  return Math.max(0, Math.min(1, power / rated));
}

export type CircuitTopologyPreset = "series" | "parallel" | "shortCircuit";
