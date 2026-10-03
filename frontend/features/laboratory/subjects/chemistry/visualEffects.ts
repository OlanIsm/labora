import { materials } from "@/features/laboratory/domain/catalog";
import type { Entity, LabState } from "@/features/laboratory/domain/types";

export function chemistryVisualEffects(entity: Entity, state: LabState) {
  const liquid = entity.contents.some(
    (p) => materials[p.material]?.phase === "liquid" && p.volume > 0,
  );
  const boilingWater =
    entity.temperature >= 100 &&
    entity.contents.some((p) => p.material === "water" && p.mass > 0);
  const recent = (type: "gas.formed" | "solvent.evaporated") =>
    state.events.some(
      (event) =>
        event.entity === entity.id &&
        event.type === type &&
        state.time - event.time >= 0 &&
        state.time - event.time <= 1,
    );
  return {
    bubbles: liquid && (boilingWater || recent("gas.formed")),
    steam:
      liquid &&
      !entity.sealed &&
      (entity.temperature > 70 || recent("solvent.evaporated")),
  };
}
