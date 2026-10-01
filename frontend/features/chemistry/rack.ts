import { History, HistoryAction, historyReducer, reduceLab } from "../../lib/sandbox/engine";
import { LabState } from "../../lib/sandbox/types";

export const RACK_SLOTS = 3;

export function placeTubeInRack(
  state: LabState,
  rackId: string,
  slot: number,
  source: { entity: string } | { material: string },
): LabState | null {
  const rack = state.entities.find((e) => e.id === rackId && e.material === "rack");
  if (!rack || !Number.isInteger(slot) || slot < 0 || slot >= RACK_SLOTS ||
    state.entities.some((e) => e.rackPlacement?.rack === rackId && e.rackPlacement.slot === slot)) return null;
  let next = state;
  let tubeId: string;
  if ("material" in source) {
    if (source.material !== "test-tube") return null;
    tubeId = `e${state.nextId}`;
    next = reduceLab(state, { type: "add", material: "test-tube", x: rack.x, y: rack.y });
  } else tubeId = source.entity;
  if (!next.entities.some((e) => e.id === tubeId && e.material === "test-tube")) return null;
  return {
    ...next,
    entities: next.entities.map((e) => e.id === tubeId ? {
      ...e, x: rack.x, y: rack.y, rackPlacement: { rack: rackId, slot },
    } : e),
  };
}

export function releaseTubeFromRack(state: LabState, tubeId: string): LabState | null {
  const tube = state.entities.find((e) => e.id === tubeId);
  if (!tube?.rackPlacement) return null;
  return {
    ...state,
    entities: state.entities.map((e) => {
      if (e.id !== tubeId) return e;
      const { rackPlacement, ...released } = e;
      return { ...released, x: Math.min(76, e.x + rackPlacement!.slot * 12), y: Math.min(72, e.y + 32) };
    }),
  };
}

// Rack placement belongs to the workbench, not the scientific simulation.
export function workbenchHistoryReducer(history: History, action: HistoryAction): History {
  const next = historyReducer(history, action);
  if (action.type !== "move" && action.type !== "remove") return next;
  return {
    ...next,
    present: {
      ...next.present,
      entities: next.present.entities.map((e) => {
        if (!e.rackPlacement) return e;
        const rack = next.present.entities.find((r) => r.id === e.rackPlacement!.rack);
        if (!rack || action.type === "move" && action.id === e.id) {
          const { rackPlacement, ...released } = e;
          return !rack ? { ...released, x: Math.min(76, e.x + rackPlacement.slot * 12), y: Math.min(72, e.y + 32) } : released;
        }
        return { ...e, x: rack.x, y: rack.y };
      }),
    },
  };
}
