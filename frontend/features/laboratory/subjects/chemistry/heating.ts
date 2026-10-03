import { mixtureHeatCapacity } from "@/features/laboratory/domain/measurements";
import { emit } from "@/features/laboratory/domain/simulation-utils";
import type { Entity, LabState } from "@/features/laboratory/domain/types";
import { latentHeat, solventBoilingPoint, vaporize } from "./separation";

export function heatChemistryContainer(
  state: LabState,
  entity: Entity,
  heater: Entity | undefined,
  dt: number,
  advancingTime = true,
) {
  if (!(dt > 0)) return;
  const capacity = Math.max(1, mixtureHeatCapacity(entity.contents));
  const target = Math.max(
    25,
    Math.min(200, heater?.params.targetTemperature ?? 120),
  );
  const boilingPoint = entity.sealed
    ? Infinity
    : Math.min(
        ...entity.contents.map((p) => solventBoilingPoint(p) ?? Infinity),
      );
  const powerEnergy =
    Math.max(0, Math.min(1000, heater?.params.power ?? 100)) * dt;
  const joules =
    heater && entity.temperature <= target
      ? Math.min(
          powerEnergy,
          target >= boilingPoint
            ? powerEnergy
            : Math.max(0, target - entity.temperature) * capacity,
        )
      : 0;
  const maximumTemperature = Math.max(target, entity.temperature);
  if (!advancingTime) {
    if (heater)
      entity.temperature += Math.min(
        joules / capacity,
        Math.max(0, target - entity.temperature),
      );
    else
      entity.temperature +=
        (state.environment.temperature - entity.temperature) *
        (1 - Math.exp(-dt / 120));
    return;
  }
  if (entity.temperature + joules / capacity >= boilingPoint) {
    const sensible = Math.max(0, boilingPoint - entity.temperature) * capacity;
    const available =
      Math.max(0, joules - sensible) +
      Math.max(0, entity.temperature - boilingPoint) * capacity;
    entity.temperature = boilingPoint;
    const vapor = vaporize(entity, available);
    const used = vapor.reduce(
      (sum, p) => sum + p.mass * latentHeat(p.material),
      0,
    );
    entity.temperature +=
      Math.max(0, available - used) /
      Math.max(1, mixtureHeatCapacity(entity.contents));
    if (vapor.length) {
      entity.measurements["Pelarut menguap (mL)"] =
        (entity.measurements["Pelarut menguap (mL)"] || 0) +
        vapor.reduce((sum, p) => sum + p.volume, 0);
      entity.measurements["Massa menguap (g)"] =
        (entity.measurements["Massa menguap (g)"] || 0) +
        vapor.reduce((sum, p) => sum + p.mass, 0);
      emit(
        state,
        entity,
        "solvent.evaporated",
        "Pelarut menguap bertahap; volume dan massa isi berkurang, zat terlarut tertinggal.",
      );
    }
  } else if (heater) {
    entity.temperature += Math.min(
      joules / capacity,
      Math.max(0, target - entity.temperature),
    );
  }
  if (!heater || entity.temperature > target)
    entity.temperature +=
      (state.environment.temperature - entity.temperature) *
      (1 - Math.exp(-dt / 120));
  entity.temperature = Math.min(200, maximumTemperature, entity.temperature);
}
