import { writeFileSync } from "node:fs";
import { experiments } from "../../backend/modules/catalog/definitions";
const publicDefinitions = experiments.map((exp) => ({
  ...exp,
  steps: exp.steps.map((step) => ({
    ...step,
    ...(step.question
      ? {
          question: {
            prompt: step.question.prompt,
            options: step.question.options,
            phase: step.question.phase,
          },
        }
      : {}),
  })),
}));
writeFileSync(
  "../shared/experiment-engine/catalog.ts",
  `// Generated public catalog. Never add answer keys here.\nimport type { Experiment } from "../contracts/experiment";\nexport const experiments: Experiment[] = ${JSON.stringify(publicDefinitions, null, 2)};\nexport const getExperiment = (id: string) => experiments.find(exp => exp.id === id);\n`,
);
writeFileSync(
  "features/experiments/domain/definitions.ts",
  'export { experiments, getExperiment } from "@engine/catalog";\nexport type { Experiment, Item, Question, Step, Subject } from "@contracts/experiment";\n',
);
