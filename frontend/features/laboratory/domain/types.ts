export type Discipline = "chemistry" | "physics" | "biology" | "free";
export type Material = {
  id: string;
  name: string;
  discipline: Discipline;
  kind: "material" | "container" | "apparatus" | "instrument";
  phase?: "solid" | "liquid" | "gas";
  color?: string;
  molarMass?: number;
  density?: number;
  concentration?: number;
  acid?: number;
  base?: number;
  ka?: number;
  kb?: number;
  ions?: number;
  soluble?: boolean;
  solubility?: number;
  capacity?: number;
  model?: string;
  heatCapacity?: number;
  tags?: string[];
};
export type Portion = {
  material: string;
  moles: number;
  mass: number;
  volume: number;
};
export type Entity = {
  id: string;
  material: string;
  label: string;
  x: number;
  y: number;
  contents: Portion[];
  temperature: number;
  params: Record<string, number>;
  active: boolean;
  sealed: boolean;
  color: string;
  gas: number;
  precipitate: string;
  status: string;
  measurements: Record<string, number>;
  applied: Record<string, number>;
  connections: string[];
  rackPlacement?: { rack: string; slot: number };
};
export type EventType =
  | "reaction.started"
  | "gas.formed"
  | "precipitate.formed"
  | "indicator.changed"
  | "flame.changed"
  | "solid.dissolved"
  | "metal.deposited"
  | "mixture.layered"
  | "mixture.emulsified"
  | "mixture.mixed"
  | "mixture.separated"
  | "mixture.empty"
  | "mixture.stirred"
  | "instrument.read"
  | "observation.changed"
  | "observation.unchanged"
  | "container.overflow"
  | "fuse.blown"
  | "circuit.short"
  | "lamp.broken"
  | "apparatus.added"
  | "apparatus.changed"
  | "connection.removed"
  | "connection.added"
  | "material.spilled"
  | "motion.started"
  | "solvent.evaporated"
  | "sample.spotted";
export type LabEvent = {
  id: number;
  time: number;
  type: EventType;
  entity: string;
  message: string;
};
export type Note = {
  id: number;
  hypothesis: string;
  observation: string;
  conclusion: string;
  snapshot: Record<string, number>;
  time: number;
};
export type LabState = {
  version: 1;
  discipline: Discipline;
  environment: { temperature: number; pressure: number; gravity: number };
  time: number;
  nextId: number;
  seed: number;
  entities: Entity[];
  events: LabEvent[];
  notes: Note[];
  samples: { time: number; entity: string; values: Record<string, number> }[];
};
export type Rule = {
  id: string;
  label: string;
  discipline: Exclude<Discipline, "free">;
  trigger: string[];
  model: string;
  minTemperature?: number;
  maxTemperature?: number;
  minLight?: number;
  stoichiometry?: number[];
  products?: [string, number][];
  gas?: string;
  gasRatio?: number;
  heat?: number;
  rate?: number;
  color?: string;
  precipitate?: string;
  event: EventType;
  observation: string;
  parameter?: number;
};
export type Action =
  | { type: "add"; material: string; x?: number; y?: number }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "pour"; source: string; target: string; amount: number }
  | { type: "set"; id: string; key: string; value: number }
  | { type: "label"; id: string; label: string }
  | { type: "toggle"; id: string; key: "active" | "sealed" }
  | { type: "connect"; source: string; target: string }
  | {
      type: "operate";
      id: string;
      operation:
        | "stir"
        | "filter"
        | "decant"
        | "evaporate"
        | "distill"
        | "magnet"
        | "measure"
        | "launch";
    }
  | { type: "tick"; dt: number }
  | { type: "note"; note: Omit<Note, "id" | "time"> }
  | { type: "remove"; id: string };
