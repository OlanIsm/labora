import type { Entity, LabState, Portion } from "./types";

export function emit(
  s: LabState,
  e: Entity,
  type: LabState["events"][number]["type"],
  message: string,
) {
  const last = [...s.events].reverse().find((x) => x.entity === e.id);
  if (last?.message === message && s.time - last.time < 5) return;
  s.events.push({ id: s.nextId++, time: s.time, type, entity: e.id, message });
  s.events = s.events.slice(-100);
}
export function join(e: Entity, p: Portion) {
  const existing = e.contents.find((x) => x.material === p.material);
  if (existing) {
    existing.moles += p.moles;
    existing.mass += p.mass;
    existing.volume += p.volume;
  } else e.contents.push({ ...p });
}
export function has(e: Entity, id: string) {
  return e.contents.some(
    (p) => p.material === id && (p.moles > 1e-10 || p.mass > 1e-8),
  );
}
export function connected(s: LabState, e: Entity, id: string) {
  return e.connections.some(
    (k) => s.entities.find((x) => x.id === k)?.material === id,
  );
}
