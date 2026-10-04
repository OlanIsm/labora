import assert from "node:assert/strict";
import { experiments } from "../../backend/modules/catalog/definitions";
import { validateStages } from "../../backend/modules/assignments/draft";
import { assignmentExperiment } from "../../shared/experiment-engine/assignment";
import {
  act,
  answer,
  initialRuntime,
  score,
} from "../../shared/experiment-engine/engine";

const base = experiments[0];
const actions = base.steps.flatMap((step, sourceStep) =>
  step.question
    ? []
    : [
        {
          kind: "action",
          sourceStep,
          instruction: step.instruction,
          hint: step.hint,
          question: "",
          options: [],
        },
      ],
);
const reading = {
  kind: "instruction",
  instruction: "Catat perubahan warna.",
  hint: "",
  question: "",
  options: [],
};
const quiz = {
  kind: "quiz",
  instruction: "Jawab kuis.",
  hint: "",
  question: "Apa sifat larutan?",
  options: ["Asam", "Basa"],
  answer: 0,
};
const stages = validateStages([reading, quiz, ...actions, reading, quiz], base);
const exp = assignmentExperiment(base, { stages });
let state = initialRuntime();
assert.equal(
  act(exp, state, "place", "beaker").step,
  0,
  "Reading cannot be skipped by placing equipment",
);
state = act(exp, state, "continue", "instruction");
assert.equal(
  act(exp, state, "continue", "instruction").step,
  1,
  "Continue cannot skip a quiz",
);
state = answer(exp, state, 0);
for (const step of exp.steps.slice(2, 5))
  state = act(exp, state, step.action, step.item!);
state = act(exp, state, "continue", "instruction");
state = answer(exp, state, 1);
assert.equal(state.step, 7);
assert.deepEqual(score(exp, state), { accuracy: 100, quiz: 50, total: 70 });
const noQuiz = assignmentExperiment(base, {
  stages: validateStages(actions, base),
});
state = initialRuntime();
for (const step of noQuiz.steps)
  state = act(noQuiz, state, step.action, step.item!);
assert.equal(score(noQuiz, state).total, 100);
const legacy = base.steps.map((step) => ({
  instruction: step.instruction,
  hint: step.hint,
  question: step.question?.prompt || "",
  options: step.question?.options || [],
  answer: step.question?.answer,
}));
assert.equal(
  assignmentExperiment(base, { stages: validateStages(legacy, base) }).steps
    .length,
  base.steps.length,
);
assert.equal(
  assignmentExperiment(base, {
    stages: stages.map(({ answer, explanation, ...stage }) => stage),
  }).steps[1].question?.answer,
  undefined,
  "Public definitions contain no answer key",
);
for (const invalid of [
  [],
  [{ ...quiz, options: ["Asam"] }],
  [{ ...quiz, answer: 2 }],
  [{ ...reading, kind: "hack" }],
  [{ ...actions[0], sourceStep: 999 }],
  [{ ...quiz, action: "continue" }],
  Array(101).fill(reading),
])
  assert.throws(() => validateStages(invalid, base));
console.log(
  "Dynamic assignments passed: optional/multiple quizzes, extra steps, legacy tasks, grading, and invalid drafts.",
);
