import type { Runtime } from "@/features/experiments/model";

export type RecordEntry = {
  experimentId: string;
  completedAt: string;
  score: number;
  runtime: Runtime;
  userName?: string;
  className?: string;
};
