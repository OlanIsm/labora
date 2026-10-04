import type { User } from "@/features/auth/model";
import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { canSync } from "@/shared/infrastructure/cloudSession";
import { apiFetch, ApiError } from "@/shared/infrastructure/api";
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
    if (!canSync(user)) return null;
    return apiFetch<RecordEntry[]>("/progress");
  },
  async saveRemote(record, user) {
    if (!canSync(user)) return;
    // Account results will come from session submission in Phase 4, never a client score upload.
    throw new ApiError(
      "FORBIDDEN",
      "Hasil akun sekolah harus disimpan melalui sesi eksperimen.",
      403,
    );
  },
};
