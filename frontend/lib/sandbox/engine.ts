import { Action, Entity, LabState, Portion } from "./types";
import { catalog, defaultParams, materials } from "./catalog";
import { rules } from "./rules";
import { canDipLitmus, isLitmus } from "./litmus";
import { separate, vaporize } from "./separation";
import { G, heatChange, equilibriumTemperature, mixtureHeatCapacity, totalMass, totalVolume } from "./measurements";
import { emit, join, has } from "./simulation-utils";
import { chemical, chromatography, testLitmus } from "../../features/chemistry/simulation";
import { heatChemistryContainer } from "../../features/chemistry/heating";
import { physics } from "../../features/physics/simulation";
import { biology } from "../../features/biology/simulation";

export const initialLab = (discipline: LabState["discipline"] = "chemistry"): LabState => ({
  version: 1, discipline,
  environment: { temperature: 25, pressure: 1, gravity: G },
  time: 0, nextId: 1, seed: 42, entities: [], events: [], notes: [], samples: [],
});
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const positive = (value: number) => Math.max(0, finite(value));
function portion(id: string, amount: number): Portion {
  const m = materials[id];
  const liquid = m.phase === "liquid";
  const mass = liquid ? amount * (m.density || 1) : amount;
  return {
    material: id,
    moles: liquid && m.concentration ? (m.concentration * amount) / 1000 : mass / (m.molarMass || 100),
    mass, volume: liquid ? amount : amount / (m.density || 2),
  };
}

function evaluate(s: LabState, dt: number, advancingTime = false) {
  for (const e of s.entities) {
    const m = materials[e.material];
    if (!m) continue;
    if (e.active) e.params.time = (e.params.time || 0) + dt;
    if (m.kind === "container") {
      const heater = s.entities.find((x) => e.connections.includes(x.id) && ["burner", "heater"].includes(x.material) && x.active);
      if (s.discipline === "chemistry") heatChemistryContainer(s, e, heater, dt, advancingTime);
      else if (heater) e.temperature += heatChange(heater.params.power * dt, Math.max(1, totalMass(e)));
      else e.temperature += (s.environment.temperature - e.temperature) * (1 - Math.exp(-dt / 120));
      chemical(s, e, dt);
      // Shared containers also support the existing cross-subject experiments.
      if (has(e, "yeast")) biology(s, e, dt, "fermentation");
      if (has(e, "saliva") && has(e, "starch")) biology(s, e, dt, "amylase");
      if (e.material === "aquarium") biology(s, e, dt, "ecosystem");
    }
    if (m.discipline === "physics" && m.model) physics(s, e, dt, m.model);
    if (m.model === "chromatography") chromatography(s, e, dt);
    if (m.discipline === "biology" && m.model) biology(s, e, dt, m.model);
    if (isLitmus(e.material)) testLitmus(s, e);
    for (const r of rules.filter((r) => r.model === `${m.discipline}:${m.model}`)) e.applied[r.id] = 1;
    e.measurements["Suhu (°C)"] = e.temperature;
  }
  for (const instrument of s.entities.filter((e) => materials[e.material]?.kind === "instrument" || ["electrolyte-tester", "balloon", "stopwatch"].includes(e.material))) {
    if (s.discipline === "chemistry" && instrument.material === "stopwatch") {
      instrument.measurements = { "Waktu (s)": instrument.params.time || 0 };
      continue;
    }
    const target = s.entities.find((e) => instrument.connections.includes(e.id) && materials[e.material]?.kind !== "instrument");
    if (target) instrument.measurements = { ...target.measurements };
    else instrument.measurements = {};
    instrument.measurements["Waktu (s)"] = s.time;
  }
}

export function reduceLab(state: LabState, action: Action): LabState {
  const s = clone(state);
  const find = (id: string) => s.entities.find((x) => x.id === id);
  if (action.type === "add") {
    const m = materials[action.material];
    if (!m || !catalog.some((x) => x.id === m.id)) return state;
    const id = `e${s.nextId++}`;
    const e: Entity = {
      id, material: m.id, label: m.name,
      x: Math.max(0, Math.min(100, finite(action.x ?? (s.entities.length % 4) * 22 + 5))),
      y: Math.max(0, Math.min(100, finite(action.y ?? Math.floor(s.entities.length / 4) * 20 + 5))),
      contents: m.kind === "material" ? [portion(m.id, m.phase === "solid" ? 10 : 100)] : [],
      temperature: 25, params: defaultParams(m), active: false, sealed: false,
      color: m.color || "#bde8f4", gas: 0, precipitate: "", status: "",
      measurements: {}, applied: {}, connections: [],
    };
    s.entities.push(e);
    emit(s, e, "apparatus.added", `${m.name} di meja.`);
  }
  if (action.type === "remove") {
    s.entities = s.entities.filter((x) => x.id !== action.id);
    s.entities.forEach((e) => (e.connections = e.connections.filter((id) => id !== action.id)));
  }
  if (action.type === "move") {
    const e = find(action.id);
    if (e) {
      e.x = Math.max(0, Math.min(100, finite(action.x)));
      e.y = Math.max(0, Math.min(100, finite(action.y)));
    }
  }
  if (action.type === "label") {
    const e = find(action.id);
    if (e) e.label = action.label.slice(0, 60);
  }
  if (action.type === "set") {
    const e = find(action.id);
    if (e) {
      if (action.key === "temperature") e.temperature = Math.max(-20, Math.min(200, finite(action.value)));
      else if (s.discipline === "chemistry" && e.material === "burner" && action.key === "targetTemperature") e.params.targetTemperature = Math.max(25, Math.min(200, finite(action.value, 120)));
      else e.params[action.key] = finite(action.value);
    }
  }
  if (action.type === "toggle") {
    const e = find(action.id);
    if (e) {
      e[action.key] = !e[action.key];
      if (action.key === "sealed" && !e.sealed) e.params.gasMass = 0;
      emit(s, e, "apparatus.changed", action.key === "sealed" ? e.sealed ? "Wadah tertutup." : "Wadah terbuka." : e.active ? "Alat dinyalakan." : "Alat dimatikan.");
    }
  }
  if (action.type === "connect") {
    const a = find(action.source), b = find(action.target);
    if (a && b && a !== b) {
      const paper = isLitmus(a.material) ? a : isLitmus(b.material) ? b : undefined;
      const vessel = paper === a ? b : a;
      if (paper && !paper.connections.includes(vessel.id)) {
        if (!canDipLitmus(vessel)) return state;
        for (const oldId of paper.connections) {
          const old = find(oldId);
          if (old) old.connections = old.connections.filter((id) => id !== paper.id);
        }
        paper.connections = [];
        paper.params.litmusTested = 0;
      }
      if (a.connections.includes(b.id)) {
        a.connections = a.connections.filter((id) => id !== b.id);
        b.connections = b.connections.filter((id) => id !== a.id);
        emit(s, a, "connection.removed", "Sambungan dilepas.");
      } else {
        a.connections.push(b.id);
        b.connections.push(a.id);
        emit(s, a, "connection.added", `${a.label} tersambung ke ${b.label}.`);
      }
    }
  }
  if (action.type === "pour") {
    const source = find(action.source), target = find(action.target);
    if (source && target && source !== target) {
      if (s.discipline === "chemistry" && (source.sealed || target.sealed)) return state;
      if (isLitmus(source.material) || isLitmus(target.material)) return state;
      const sourceMaterial = materials[source.material];
      const available = sourceMaterial.phase === "solid" ? totalMass(source) : totalVolume(source);
      const ratio = Math.min(1, positive(action.amount) / Math.max(0.00001, available));
      if (ratio > 0 && available > 0) {
        target.temperature = equilibriumTemperature(target.temperature, mixtureHeatCapacity(target.contents), source.temperature, mixtureHeatCapacity(source.contents) * ratio);
        source.contents.forEach((p) => {
          join(target, { ...p, moles: p.moles * ratio, mass: p.mass * ratio, volume: p.volume * ratio });
          p.moles *= 1 - ratio;
          p.mass *= 1 - ratio;
          p.volume *= 1 - ratio;
        });
        emit(s, target, "mixture.mixed", `${source.label} ditambahkan (${Math.min(available, positive(action.amount)).toFixed(1)} ${sourceMaterial.phase === "solid" ? "g" : "mL"}).`);
        if (target.material === "chromatography") emit(s, target, "sample.spotted", "Sampel ditotolkan pada kertas kromatografi.");
        else if (materials[target.material]?.kind !== "container") emit(s, target, "material.spilled", "Bahan berada di permukaan alat; tidak ada wadah penampung.");
      } else emit(s, target, "mixture.empty", "Tidak ada bahan yang berpindah.");
    }
  }
  if (action.type === "operate") {
    const e = find(action.id);
    if (e) {
      const op = action.operation;
      if (s.discipline === "chemistry" && e.sealed && ["filter", "decant", "distill", "evaporate", "magnet"].includes(op)) {
        emit(s, e, "observation.unchanged", "Buka wadah sebelum memisahkan atau menguapkan campuran.");
        return s;
      }
      if (op === "stir") { e.params.stirred = 1; emit(s, e, "mixture.stirred", "Isi wadah diaduk."); }
      if (op === "launch") { e.active = true; e.params.time = 0; emit(s, e, "motion.started", "Gerakan dimulai."); }
      if (["filter", "decant", "distill", "magnet"].includes(op)) {
        const receiver = s.entities.find((x) => e.connections.includes(x.id) && materials[x.material]?.kind === "container");
        if (receiver) {
          const moving = op === "distill" ? vaporize(e) : separate(e, op as "filter" | "decant" | "magnet");
          receiver.temperature = equilibriumTemperature(receiver.temperature, mixtureHeatCapacity(receiver.contents), e.temperature, mixtureHeatCapacity(moving));
          moving.forEach((p) => join(receiver, p));
          emit(s, e, moving.length ? "mixture.separated" : "observation.unchanged", moving.length ? `${op === "magnet" ? "Serbuk besi" : "Fraksi campuran"} dipindahkan ke ${receiver.label}.` : "Tidak ada fraksi yang berpindah pada kondisi ini.");
        } else emit(s, e, "observation.changed", "Belum ada wadah penerima tersambung.");
      }
      if (op === "evaporate") {
        const vapor = vaporize(e);
        if (s.discipline === "chemistry" && vapor.length) {
          e.measurements["Pelarut menguap (mL)"] = (e.measurements["Pelarut menguap (mL)"] || 0) + vapor.reduce((sum, p) => sum + p.volume, 0);
          e.measurements["Massa menguap (g)"] = (e.measurements["Massa menguap (g)"] || 0) + vapor.reduce((sum, p) => sum + p.mass, 0);
        }
        emit(s, e, vapor.length ? "solvent.evaporated" : "observation.unchanged", vapor.length ? "Pelarut menguap; zat terlarut tertinggal." : "Tidak ada penguapan teramati; periksa suhu dan pelarut.");
      }
      if (op === "measure") emit(s, e, "instrument.read", "Pembacaan alat diperbarui.");
    }
  }
  if (action.type === "tick") {
    const dt = Math.min(5, positive(action.dt));
    // Keep numerical integration identical at 1×, 2× and 5× playback.
    const steps = Math.floor((dt + 1e-9) / 0.2);
    for (let i = 0; i < steps; i++) { s.time += 0.2; evaluate(s, 0.2, true); }
    const remainder = dt - steps * 0.2;
    if (remainder > 1e-9) { s.time += remainder; evaluate(s, remainder, true); }
    if (!s.samples.length || s.time - s.samples[s.samples.length - 1].time >= 1) {
      for (const e of s.entities.filter((e) => Object.keys(e.measurements).length)) {
        s.samples.push({ time: s.time, entity: e.id, values: { ...e.measurements } });
      }
      s.samples = s.samples.slice(-300);
    }
  } else evaluate(s, action.type === "pour" ? 0.25 : 0);
  if (action.type === "note") s.notes.push({ ...action.note, id: s.nextId++, time: s.time });
  if (action.type === "pour") {
    const target = find(action.target);
    if (target && s.events[s.events.length - 1]?.type === "mixture.mixed") emit(s, target, "observation.unchanged", "Tidak ada reaksi lain yang teramati saat ini.");
  }
  s.entities.forEach((e) => Object.keys(e.measurements).forEach((key) => (e.measurements[key] = finite(e.measurements[key]))));
  return s;
}

export type History = { past: LabState[]; present: LabState; future: LabState[] };
export type HistoryAction = Action | { type: "undo" } | { type: "redo" }
  | { type: "reset"; discipline: LabState["discipline"] } | { type: "load"; state: LabState };
export function historyReducer(h: History, a: HistoryAction): History {
  if (a.type === "undo") {
    if (!h.past.length) return h;
    return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future].slice(0, 40) };
  }
  if (a.type === "redo") {
    if (!h.future.length) return h;
    return { past: [...h.past, h.present].slice(-40), present: h.future[0], future: h.future.slice(1) };
  }
  if (a.type === "reset" || a.type === "load") return {
    past: [...h.past, h.present].slice(-40), present: a.type === "load" ? clone(a.state) : initialLab(a.discipline), future: [],
  };
  const present = reduceLab(h.present, a);
  return { past: a.type === "tick" ? h.past : [...h.past, h.present].slice(-40), present, future: a.type === "tick" ? h.future : [] };
}
