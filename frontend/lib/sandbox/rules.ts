import { chemistryRules } from "../../features/chemistry/rules";
import { physicsRules } from "../../features/physics/rules";
import { biologyRules } from "../../features/biology/rules";

export const rules = [...chemistryRules, ...physicsRules, ...biologyRules];
export const ruleCounts = {
  chemistry: chemistryRules.length,
  physics: physicsRules.length,
  biology: biologyRules.length,
};
