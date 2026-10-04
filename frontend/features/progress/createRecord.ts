import type { User } from "@/features/auth/model";
import { score } from "@/features/experiments/index";
import type { Experiment, Runtime } from "@/features/experiments/model";
import type { RecordEntry } from "./model";

export function createRecord(
  experiment: Experiment,
  runtime: Runtime,
  user: User | null,
): RecordEntry {
  return {
    definition: experiment,
    experimentId: experiment.id,
    completedAt: new Date().toISOString(),
    score: score(experiment, runtime).total,
    runtime,
    userName: user?.name,
    className: user?.className,
  };
}
