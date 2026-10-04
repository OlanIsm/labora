import type { Runtime } from "@/features/experiments/model";
import type { Experiment } from "@contracts/experiment";

export type RecordEntry = {
  definition?: Experiment;
  id?: string;
  sessionId?: string;
  assignmentId?: string;
  studentId?: string;
  accuracy?: number;
  quiz?: number;
  experimentId: string;
  completedAt: string;
  score: number;
  runtime: Runtime;
  userName?: string;
  className?: string;
};
