import { Field } from "../../lib/sandbox/controlFields";

export const chemistryFields: Record<string, Field[]> = {
  chromatography: [
    ["paperLength", "Panjang kertas (mm)", 20, 150, 5],
    ["rf1", "Rf pigmen 1 (model ilustratif)", 0, 1, 0.05],
    ["rf2", "Rf pigmen 2 (model ilustratif)", 0, 1, 0.05],
    ["rf3", "Rf pigmen 3 (model ilustratif)", 0, 1, 0.05],
  ],
};
