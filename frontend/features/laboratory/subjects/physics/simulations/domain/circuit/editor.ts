import type { ComponentKind } from "./engine";
import type { GridPoint, PlacedComponent } from "./presets";

export const CIRCUIT_COLUMNS = 8;
export const CIRCUIT_ROWS = 5;
export const CIRCUIT_CELL = 70;
export const CIRCUIT_MARGIN = 40;
export const CIRCUIT_WIDTH =
  CIRCUIT_COLUMNS * CIRCUIT_CELL + CIRCUIT_MARGIN * 2;
export const CIRCUIT_HEIGHT = CIRCUIT_ROWS * CIRCUIT_CELL + CIRCUIT_MARGIN * 2;
export const COMPONENT_NAMES: Record<ComponentKind, string> = {
  battery: "Baterai",
  lamp: "Lampu",
  resistor: "Resistor",
  switch: "Saklar",
  fuse: "Sekring",
  wire: "Kabel",
};

export function snapPoint(col: number, row: number): GridPoint {
  return {
    col: Math.max(0, Math.min(CIRCUIT_COLUMNS, Math.round(col))),
    row: Math.max(0, Math.min(CIRCUIT_ROWS, Math.round(row))),
  };
}

export function samePoint(a: GridPoint, b: GridPoint): boolean {
  return a.col === b.col && a.row === b.row;
}

export function createComponent(
  kind: ComponentKind,
  id: string,
  point: GridPoint,
): PlacedComponent {
  const from = snapPoint(Math.min(point.col, CIRCUIT_COLUMNS - 2), point.row);
  return {
    id,
    kind,
    from,
    to: { col: from.col + 2, row: from.row },
    ...(kind === "battery" ? { voltage: 9 } : {}),
    ...(kind === "lamp" ? { resistance: 8, maxPowerWatts: 25 } : {}),
    ...(kind === "resistor" ? { resistance: 10 } : {}),
    ...(kind === "switch" ? { closed: true } : {}),
    ...(kind === "fuse" ? { fuseRatingAmps: 5, resistance: 1e-4 } : {}),
  };
}

export function connectPoints(
  components: PlacedComponent[],
  id: string,
  from: GridPoint,
  to: GridPoint,
): PlacedComponent[] {
  if (
    samePoint(from, to) ||
    components.some(
      (c) =>
        c.kind === "wire" &&
        ((samePoint(c.from, from) && samePoint(c.to, to)) ||
          (samePoint(c.from, to) && samePoint(c.to, from))),
    )
  )
    return components;
  return [
    ...components,
    { id, kind: "wire", from: { ...from }, to: { ...to } },
  ];
}

export function repositionComponent(
  components: PlacedComponent[],
  id: string,
  from: GridPoint,
  to: GridPoint,
): PlacedComponent[] {
  const selected = components.find((c) => c.id === id);
  const inside = (p: GridPoint) =>
    Number.isInteger(p.col) &&
    Number.isInteger(p.row) &&
    p.col >= 0 &&
    p.col <= CIRCUIT_COLUMNS &&
    p.row >= 0 &&
    p.row <= CIRCUIT_ROWS;
  if (!selected || !inside(from) || !inside(to) || samePoint(from, to))
    return components;
  return components
    .map((c) => {
      if (c.id === id) return { ...c, from, to };
      if (c.kind !== "wire" || selected.kind === "wire") return c;
      const follow = (p: GridPoint) =>
        samePoint(p, selected.from) ? from : samePoint(p, selected.to) ? to : p;
      return { ...c, from: follow(c.from), to: follow(c.to) };
    })
    .filter((c) => !samePoint(c.from, c.to));
}

export function moveComponent(
  components: PlacedComponent[],
  id: string,
  colDelta: number,
  rowDelta: number,
): PlacedComponent[] {
  const c = components.find((c) => c.id === id);
  if (!c) return components;
  const dc = Math.max(
    -Math.min(c.from.col, c.to.col),
    Math.min(
      CIRCUIT_COLUMNS - Math.max(c.from.col, c.to.col),
      Math.round(colDelta),
    ),
  );
  const dr = Math.max(
    -Math.min(c.from.row, c.to.row),
    Math.min(
      CIRCUIT_ROWS - Math.max(c.from.row, c.to.row),
      Math.round(rowDelta),
    ),
  );
  return repositionComponent(
    components,
    id,
    { col: c.from.col + dc, row: c.from.row + dr },
    { col: c.to.col + dc, row: c.to.row + dr },
  );
}

export function rotateComponent(
  components: PlacedComponent[],
  id: string,
): PlacedComponent[] {
  const c = components.find((c) => c.id === id);
  if (!c) return components;
  const to = {
    col: c.from.col - (c.to.row - c.from.row),
    row: c.from.row + (c.to.col - c.from.col),
  };
  const dc =
    Math.max(0, -Math.min(c.from.col, to.col)) -
    Math.max(0, Math.max(c.from.col, to.col) - CIRCUIT_COLUMNS);
  const dr =
    Math.max(0, -Math.min(c.from.row, to.row)) -
    Math.max(0, Math.max(c.from.row, to.row) - CIRCUIT_ROWS);
  return repositionComponent(
    components,
    id,
    { col: c.from.col + dc, row: c.from.row + dr },
    { col: to.col + dc, row: to.row + dr },
  );
}
