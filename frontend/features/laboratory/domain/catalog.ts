import { biologyCatalog, biologyContainers } from "../subjects/biology/catalog";
import { biologyDefaults } from "../subjects/biology/defaults";
import {
  chemistryContainers,
  chemistryMaterials,
  chemistryProducts,
  chemistryTools,
} from "../subjects/chemistry/catalog";
import { chemistryDefaults } from "../subjects/chemistry/defaults";
import { physicsCatalog } from "../subjects/physics/catalog";
import { physicsDefaults } from "../subjects/physics/defaults";
import type { Material } from "./types";

export { specimens } from "../subjects/biology/catalog";

// Keep inventory order and IDs compatible with existing benches.
export const catalog: Material[] = [
  ...chemistryMaterials,
  ...chemistryContainers,
  ...biologyContainers,
  ...chemistryTools,
  ...physicsCatalog,
  ...biologyCatalog,
];
export const materials = Object.fromEntries(
  [...catalog, ...chemistryProducts].map((m) => [m.id, m]),
);
// All defaults stay available for cross-subject experiments and saved benches.
export const defaultParams = (material: Material): Record<string, number> => ({
  ...chemistryDefaults,
  ...physicsDefaults(material),
  ...biologyDefaults,
  amount: material.phase === "solid" ? 1 : 10,
  time: 0,
});
