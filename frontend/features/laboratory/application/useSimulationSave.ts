"use client";
import { useCloudSnapshot } from "@/shared/infrastructure/useCloudSnapshot";
type Snapshot<T> = {
  version: 1;
  discipline: "physics" | "biology";
  simulation: string;
  data: T;
};
export function useSimulationSave<T>(
  simulation: string,
  data: T,
  restore: (data: T) => void,
  validate: (data: unknown) => data is T,
  discipline: "physics" | "biology" = "physics",
) {
  const snapshot: Snapshot<T> = { version: 1, discipline, simulation, data };
  return useCloudSnapshot<Snapshot<T>>({
    subject: discipline,
    simulationKey: simulation,
    value: snapshot,
    restore: (s) => restore(s.data),
    validate: (s: unknown): s is Snapshot<T> => {
      if (!s || typeof s !== "object") return false;
      const candidate = s as Snapshot<T>;
      return (
        candidate.version === 1 &&
        candidate.discipline === discipline &&
        candidate.simulation === simulation &&
        validate(candidate.data)
      );
    },
  });
}
