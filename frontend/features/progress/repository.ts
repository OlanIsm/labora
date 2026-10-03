import type { User } from "@/features/auth/model";
import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { canSync } from "@/shared/infrastructure/cloudSession";
import { supabase } from "@/shared/infrastructure/supabase";
import type { RecordEntry } from "./model";

export interface ProgressRepository {
  listLocal(): RecordEntry[];
  saveLocal(record: RecordEntry): void;
  loadRemote(user: User): Promise<RecordEntry[] | null>;
  saveRemote(record: RecordEntry, user: User | null): Promise<void>;
}

export const progressRepository: ProgressRepository = {
  listLocal: () => browserStorage.read<RecordEntry[]>("labora-records", []),
  saveLocal(record) {
    browserStorage.write("labora-records", [
      record,
      ...this.listLocal().filter(
        (existing) => existing.experimentId !== record.experimentId,
      ),
    ]);
  },
  async loadRemote(user) {
    if (!canSync(user) || !supabase) return null;
    const { data, error } = await supabase
      .from("experiment_results")
      .select("data");
    if (error) throw error;
    return (data || []).map((row) => row.data as RecordEntry);
  },
  async saveRemote(record, user) {
    if (!canSync(user) || !supabase || !user) return;
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error("Sign in to save results.");
    const { error } = await supabase.from("experiment_results").upsert(
      {
        student_id: sessionUser.id,
        experiment_id: record.experimentId,
        class_name: user.className || "Science class",
        data: record,
      },
      { onConflict: "student_id,experiment_id" },
    );
    if (error) throw error;
  },
};
