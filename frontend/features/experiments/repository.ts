import { browserStorage } from "@/shared/infrastructure/browserStorage";
import type { Runtime } from "./model";

export interface RuntimeRepository {
  load(id: string): Runtime | null;
  save(id: string, runtime: Runtime): void;
  clear(id: string): void;
}

export const runtimeRepository: RuntimeRepository = {
  load: (id) =>
    browserStorage.read<Runtime | null>(`labora-runtime-${id}`, null),
  save: (id, runtime) => browserStorage.write(`labora-runtime-${id}`, runtime),
  clear: (id) => browserStorage.remove(`labora-runtime-${id}`),
};
