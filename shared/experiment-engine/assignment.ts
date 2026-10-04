import type { Experiment } from "../contracts/experiment";
import type { AssignmentDTO } from "../contracts/laboratory";

/** Old assignments use the template's original step positions. */
export function assignmentExperiment(
  experiment: Experiment,
  assignment: Pick<AssignmentDTO, "stages">,
): Experiment {
  return {
    ...experiment,
    steps: assignment.stages.map((stage, index) => {
      const base = experiment.steps[stage.sourceStep ?? index];
      const kind = stage.kind ?? (base?.question ? "quiz" : "action");
      return {
        instruction: stage.instruction,
        hint: stage.hint,
        action:
          kind === "action"
            ? base.action
            : kind === "quiz"
              ? "answer"
              : "continue",
        ...(kind === "action" ? { item: base.item } : {}),
        ...(kind === "quiz"
          ? {
              question: {
                prompt: stage.question,
                options: stage.options,
                answer: stage.answer,
                explanation: stage.explanation,
              },
            }
          : {}),
      };
    }),
  };
}
