import { Material } from "./types";
import { chemistryMaterials, chemistryContainers, chemistryTools, chemistryProducts } from "../../features/chemistry/catalog";
import { physicsCatalog } from "../../features/physics/catalog";
import { biologyCatalog, biologyContainers } from "../../features/biology/catalog";
import { chemistryDefaults } from "../../features/chemistry/defaults";
import { physicsDefaults } from "../../features/physics/defaults";
import { biologyDefaults } from "../../features/biology/defaults";

export { specimens } from "../../features/biology/catalog";

// Keep inventory order and IDs compatible with existing benches.
export const catalog: Material[] = [
  ...chemistryMaterials, ...chemistryContainers, ...biologyContainers,
  ...chemistryTools, ...physicsCatalog, ...biologyCatalog,
];
export const materials = Object.fromEntries(
  [...catalog, ...chemistryProducts].map((m) => [m.id, m]),
);
// All defaults stay available for cross-subject experiments and saved benches.
export const defaultParams = (material: Material): Record<string, number> => ({
  ...chemistryDefaults, ...physicsDefaults(material), ...biologyDefaults,
  amount: material.phase === "solid" ? 1 : 10,
  time: 0,
});
