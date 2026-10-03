import type { User } from "@/features/auth/model";
import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { canSync } from "@/shared/infrastructure/cloudSession";
import { supabase } from "@/shared/infrastructure/supabase";
import type { Assignment } from "./model";

export interface AssignmentRepository {
  listLocal(): Assignment[];
  loadRemote(user: User): Promise<Assignment[] | null>;
  save(assignment: Assignment, user: User | null): Promise<void>;
}

export const assignmentRepository: AssignmentRepository = {
  listLocal: () => browserStorage.read<Assignment[]>("labora-assignments", []),
  async loadRemote(user) {
    if (!canSync(user) || !supabase) return null;
    const { data, error } = await supabase.from("assignments").select("data");
    if (error) throw error;
    return (data || []).map((row) => row.data as Assignment);
  },
  async save(assignment, user) {
    if (canSync(user) && supabase) {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();
      if (!sessionUser) throw new Error("Sign in to share assignments.");
      const { error } = await supabase.from("assignments").insert({
        id: assignment.id,
        teacher_id: sessionUser.id,
        class_name: assignment.className,
        data: assignment,
      });
      if (error) throw error;
    }
    browserStorage.write("labora-assignments", [
      assignment,
      ...this.listLocal(),
    ]);
  },
};
