import type { AssignmentRepository } from "@/features/assignments/index";
import { assignmentRepository } from "@/features/assignments/index";
import { sessionRepository } from "@/features/auth/index";
import type { SessionRepository } from "@/features/auth/model";
import type { RuntimeRepository } from "@/features/experiments/index";
import { runtimeRepository } from "@/features/experiments/index";
import type { ProgressRepository } from "@/features/progress/index";
import { progressRepository } from "@/features/progress/index";

export interface ApplicationServices {
  auth: SessionRepository;
  assignments: AssignmentRepository;
  progress: ProgressRepository;
  runtimes: RuntimeRepository;
}

export const applicationServices: ApplicationServices = {
  auth: sessionRepository,
  assignments: assignmentRepository,
  progress: progressRepository,
  runtimes: runtimeRepository,
};
