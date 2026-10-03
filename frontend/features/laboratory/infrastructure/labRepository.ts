import { materials } from "@/features/laboratory/domain/catalog";
import { initialLab } from "@/features/laboratory/domain/engine";
import { RACK_SLOTS } from "@/features/laboratory/domain/rack";
import type { LabState } from "@/features/laboratory/domain/types";

// TODO-BACKEND: synchronize versioned bench configurations and notebooks per authenticated account.
// TODO-BACKEND: synchronize optional introduction preferences per account.
const memory = new Map<string, string>();
export function readLocal(key: string): string | null {
  try {
    return typeof window === "undefined"
      ? null
      : (memory.get(key) ?? window.localStorage.getItem(key) ?? null);
  } catch {
    return memory.get(key) ?? null;
  }
}
export function writeLocal(key: string, value: string): boolean {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
export function isLabState(value: unknown): value is LabState {
  if (!value || typeof value !== "object") return false;
  const s = value as LabState;
  if (
    s.version !== 1 ||
    !["chemistry", "physics", "biology", "free"].includes(s.discipline) ||
    !Array.isArray(s.entities) ||
    s.entities.length > 200 ||
    !Array.isArray(s.notes) ||
    !Array.isArray(s.events) ||
    !Array.isArray(s.samples) ||
    !Number.isFinite(s.time) ||
    !Number.isInteger(s.nextId) ||
    !s.environment ||
    ![
      s.environment.temperature,
      s.environment.pressure,
      s.environment.gravity,
      s.seed,
    ].every(Number.isFinite) ||
    s.nextId < 1
  )
    return false;
  const ids = new Set<string>();
  const rackSlots = new Set<string>();
  for (const e of s.entities) {
    if (
      !e ||
      typeof e.id !== "string" ||
      ids.has(e.id) ||
      !materials[e.material] ||
      typeof e.label !== "string" ||
      !Number.isFinite(e.x) ||
      !Number.isFinite(e.y) ||
      !Number.isFinite(e.temperature) ||
      !Array.isArray(e.contents) ||
      !Array.isArray(e.connections) ||
      !e.params ||
      !e.measurements ||
      !e.applied ||
      typeof e.active !== "boolean" ||
      typeof e.sealed !== "boolean" ||
      typeof e.status !== "string" ||
      typeof e.color !== "string" ||
      typeof e.precipitate !== "string"
    )
      return false;
    if (
      ![
        ...Object.values(e.params),
        ...Object.values(e.measurements),
        ...Object.values(e.applied),
        e.gas,
      ].every(Number.isFinite)
    )
      return false;
    if (
      e.contents.some(
        (p) =>
          !p ||
          !materials[p.material] ||
          ![p.mass, p.moles, p.volume].every(
            (n) => Number.isFinite(n) && n >= 0,
          ),
      )
    )
      return false;
    ids.add(e.id);
    if (e.rackPlacement !== undefined) {
      const placement = e.rackPlacement;
      if (
        !placement ||
        e.material !== "test-tube" ||
        typeof placement.rack !== "string" ||
        !Number.isInteger(placement.slot) ||
        placement.slot < 0 ||
        placement.slot >= RACK_SLOTS ||
        !s.entities.some(
          (rack) => rack?.id === placement.rack && rack.material === "rack",
        )
      )
        return false;
      const slotKey = `${placement.rack}:${placement.slot}`;
      if (rackSlots.has(slotKey)) return false;
      rackSlots.add(slotKey);
    }
  }
  return (
    s.entities.every((e) => e.connections.every((id) => ids.has(id))) &&
    s.notes.every(
      (n) =>
        n &&
        typeof n.hypothesis === "string" &&
        typeof n.observation === "string" &&
        typeof n.conclusion === "string" &&
        n.snapshot &&
        Object.values(n.snapshot).every(Number.isFinite),
    ) &&
    s.events.every(
      (e) => e && typeof e.message === "string" && Number.isFinite(e.time),
    ) &&
    s.samples.every(
      (x) =>
        x &&
        typeof x.entity === "string" &&
        Number.isFinite(x.time) &&
        x.values &&
        Object.values(x.values).every(Number.isFinite),
    )
  );
}
export function loadBench(
  discipline: LabState["discipline"],
  slot = "autosave",
): LabState {
  try {
    const parsed = JSON.parse(
      readLocal(`labora-sandbox-v1-${discipline}-${slot}`) || "null",
    );
    return isLabState(parsed) && parsed.discipline === discipline
      ? parsed
      : initialLab(discipline);
  } catch {
    return initialLab(discipline);
  }
}
export function saveBench(state: LabState, slot = "autosave"): boolean {
  return writeLocal(
    `labora-sandbox-v1-${state.discipline}-${slot}`,
    JSON.stringify(state),
  );
}
export function download(
  name: string,
  content: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
