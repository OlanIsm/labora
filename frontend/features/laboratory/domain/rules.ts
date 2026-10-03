import { biologyRules } from "../subjects/biology/rules";
import { chemistryRules } from "../subjects/chemistry/rules";
import { physicsRules } from "../subjects/physics/rules";

export const rules = [...chemistryRules, ...physicsRules, ...biologyRules];
export const ruleCounts = {
  chemistry: chemistryRules.length,
  physics: physicsRules.length,
  biology: biologyRules.length,
};
