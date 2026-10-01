import { chemistryGuides } from "../../features/chemistry/equipmentGuides";
import { biologyGuides } from "../../features/biology/equipmentGuides";

export type EquipmentGuide = { purpose: string; usage: string; limitation?: string };
export const equipmentGuides: Record<string, EquipmentGuide> = { ...chemistryGuides, ...biologyGuides };
