import type { User } from "@/features/auth/model";
import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { canSync } from "@/shared/infrastructure/cloudSession";
import { apiFetch, ApiError } from "@/shared/infrastructure/api";
import { isDemoUser } from "@/shared/identity";
import type { Assignment } from "./model";

export interface AssignmentRepository {
  listLocal(): Assignment[];
  loadRemote(user: User): Promise<Assignment[] | null>;
  save(assignment: Assignment, user: User | null): Promise<void>;
}

export const assignmentRepository: AssignmentRepository = {
  listLocal: () => browserStorage.read<Assignment[]>("labora-assignments", []),
  async loadRemote(user) {
    if (!canSync(user)) return null;
    return apiFetch<Assignment[]>("/assignments");
  },
  async save(assignment, user) {
    if (canSync(user)) {
      await apiFetch("/assignments", {
        method: "POST",
        body: JSON.stringify(assignment),
      });
      return;
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
