import type { User } from "@/features/auth/model";
import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { canSync } from "@/shared/infrastructure/cloudSession";
import { apiFetch, ApiError } from "@/shared/infrastructure/api";
import { isDemoUser } from "@/shared/identity";
import type { Assignment } from "./model";

export interface AssignmentRepository {
  listLocal(): Assignment[];
  loadRemote(user: User): Promise<Assignment[] | null>;
  save(assignment: Assignment, user: User | null): Promise<Assignment | void>;
}

export const assignmentRepository: AssignmentRepository = {
  listLocal: () => browserStorage.read<Assignment[]>("labora-assignments", []),
  async loadRemote(user) {
    if (!canSync(user)) return null;
    return apiFetch<Assignment[]>("/assignments");
  },
  async save(assignment, user) {
    if (canSync(user)) {
      const existing = assignment.revision !== undefined;
      return apiFetch<Assignment>(
        existing ? `/assignments/${assignment.id}` : "/assignments",
        {
          method: existing ? "PATCH" : "POST",
          body: JSON.stringify({
            experimentId: assignment.experimentId,
            title: assignment.title,
            instructions: assignment.instructions,
            stages: assignment.stages,
            schoolId: user!.schoolId,
            dueAt: assignment.dueAt,
            ...(existing ? { revision: assignment.revision } : {}),
          }),
        },
      );
    }
    if (!isDemoUser(user))
      throw new ApiError(
        "UNAUTHENTICATED",
        "Masuk untuk menyimpan tugas.",
        401,
      );
    browserStorage.write("labora-assignments", [
      assignment,
      ...this.listLocal(),
    ]);
  },
};
