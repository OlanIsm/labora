import { biologyGuides } from "../subjects/biology/equipmentGuides";
import { chemistryGuides } from "../subjects/chemistry/equipmentGuides";

export type EquipmentGuide = {
  purpose: string;
  usage: string;
  limitation?: string;
};
export const equipmentGuides: Record<string, EquipmentGuide> = {
  ...chemistryGuides,
  ...biologyGuides,
};
