// Grid-based circuit layout and editable examples.
// Components snap to a grid; each has grid-cell endpoints
// that map to electrical nodes once two endpoints occupy the same cell.
import { Component, ComponentKind } from "./engine";

export type GridPoint = { col: number; row: number };

export type PlacedComponent = {
  id: string;
  kind: ComponentKind;
  from: GridPoint;
  to: GridPoint;
  voltage?: number;
  resistance?: number;
  closed?: boolean;
  fuseRatingAmps?: number;
  blown?: boolean;
  maxPowerWatts?: number;
  burnedOut?: boolean;
};

const GRID_KEY = (p: GridPoint) => `${p.col},${p.row}`;

// Assign a unique electrical node number to every distinct grid point that
// appears as an endpoint of at least one component, so overlapping
// endpoints (two wires meeting at a corner) automatically share a node.
export function assignNodes(placed: PlacedComponent[]): { nodeOf: Map<string, number>; nodeCount: number } {
  const nodeOf = new Map<string, number>();
  let next = 0;
  for (const component of placed) {
    for (const point of [component.from, component.to]) {
      const key = GRID_KEY(point);
      if (!nodeOf.has(key)) {
        nodeOf.set(key, next);
        next += 1;
      }
    }
  }
  return { nodeOf, nodeCount: next };
}

export function toElectricalComponents(placed: PlacedComponent[]): Component[] {
  const { nodeOf } = assignNodes(placed);
  return placed.map((p) => ({
    id: p.id,
    kind: p.kind,
    nodeA: nodeOf.get(GRID_KEY(p.from))!,
    nodeB: nodeOf.get(GRID_KEY(p.to))!,
    voltage: p.voltage,
    resistance: p.resistance,
    closed: p.closed,
    fuseRatingAmps: p.fuseRatingAmps,
    blown: p.blown,
    maxPowerWatts: p.maxPowerWatts,
    burnedOut: p.burnedOut,
  }));
}

export type CircuitPreset = { id: string; label: string; components: PlacedComponent[] };

// Series: battery -> lamp -> switch -> back to battery, one loop.
const SERIES_PRESET: PlacedComponent[] = [
  { id: "battery", kind: "battery", from: { col: 1, row: 1 }, to: { col: 1, row: 4 }, voltage: 9 },
  { id: "wire1", kind: "wire", from: { col: 1, row: 1 }, to: { col: 3, row: 1 } },
  { id: "lamp1", kind: "lamp", from: { col: 3, row: 1 }, to: { col: 5, row: 1 }, resistance: 8, maxPowerWatts: 25 },
  { id: "lamp2", kind: "lamp", from: { col: 5, row: 1 }, to: { col: 7, row: 1 }, resistance: 12, maxPowerWatts: 25 },
  { id: "wireRight", kind: "wire", from: { col: 7, row: 1 }, to: { col: 7, row: 3 } },
  { id: "switch1", kind: "switch", from: { col: 7, row: 3 }, to: { col: 7, row: 4 }, closed: true },
  { id: "wire2", kind: "wire", from: { col: 7, row: 4 }, to: { col: 1, row: 4 } },
];

// Parallel: battery feeds two lamps in parallel branches.
const PARALLEL_PRESET: PlacedComponent[] = [
  { id: "battery", kind: "battery", from: { col: 1, row: 1 }, to: { col: 1, row: 4 }, voltage: 9 },
  { id: "wireTop", kind: "wire", from: { col: 1, row: 1 }, to: { col: 4, row: 1 } },
  { id: "lamp1", kind: "lamp", from: { col: 4, row: 1 }, to: { col: 4, row: 4 }, resistance: 8, maxPowerWatts: 25 },
  { id: "wireTopBranch", kind: "wire", from: { col: 4, row: 1 }, to: { col: 7, row: 1 } },
  { id: "lamp2", kind: "lamp", from: { col: 7, row: 1 }, to: { col: 7, row: 4 }, resistance: 12, maxPowerWatts: 25 },
  { id: "wireBottomBranch", kind: "wire", from: { col: 7, row: 4 }, to: { col: 4, row: 4 } },
  { id: "wireBottom", kind: "wire", from: { col: 4, row: 4 }, to: { col: 1, row: 4 } },
];

// Short circuit: a bare wire directly across the battery terminals, in
// series with a fuse. Used to demonstrate overload and fuse protection.
const SHORT_CIRCUIT_PRESET: PlacedComponent[] = [
  { id: "battery", kind: "battery", from: { col: 0, row: 0 }, to: { col: 0, row: 2 }, voltage: 9 },
  { id: "fuse", kind: "fuse", from: { col: 0, row: 0 }, to: { col: 1, row: 0 }, fuseRatingAmps: 5, resistance: 1e-4 },
  { id: "shortWire", kind: "wire", from: { col: 1, row: 0 }, to: { col: 1, row: 2 } },
  { id: "wireBack", kind: "wire", from: { col: 1, row: 2 }, to: { col: 0, row: 2 } },
];

export const CIRCUIT_PRESETS: CircuitPreset[] = [
  { id: "series", label: "Rangkaian seri", components: SERIES_PRESET },
  { id: "parallel", label: "Rangkaian paralel", components: PARALLEL_PRESET },
  { id: "shortCircuit", label: "Demo korsleting", components: SHORT_CIRCUIT_PRESET },
];
