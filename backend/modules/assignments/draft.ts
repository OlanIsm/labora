import type { Experiment } from "@contracts/experiment";
import type { AssignmentDTO } from "@contracts/laboratory";
import { AppError } from "../../shared/errors";
import { fields, integer, text } from "../../shared/validation";

export function validateStages(
  value: unknown,
  experiment: Experiment,
): AssignmentDTO["stages"] {
  if (!Array.isArray(value) || !value.length || value.length > 100)
    throw new AppError("VALIDATION_ERROR");
  return value.map((stage, index) => {
    if (!stage || typeof stage !== "object" || Array.isArray(stage))
      throw new AppError("VALIDATION_ERROR");
    fields(stage, [
      "kind",
      "sourceStep",
      "instruction",
      "hint",
      "question",
      "options",
      "answer",
      "explanation",
    ]);
    const sourceStep = integer(
      stage.sourceStep ?? index,
      "sourceStep",
      0,
      Math.max(experiment.steps.length - 1, index),
    );
    const base = experiment.steps[sourceStep];
    const kind = stage.kind ?? (base?.question ? "quiz" : "action");
    if (!["action", "instruction", "quiz"].includes(kind))
      throw new AppError("VALIDATION_ERROR");
    if (kind === "action" && (!base || base.question || !base.item))
      throw new AppError("VALIDATION_ERROR");
    const result: AssignmentDTO["stages"][number] = {
      kind,
      ...(kind === "action" ? { sourceStep } : {}),
      instruction: text(stage.instruction, "instruction", 1000),
      hint: text(stage.hint, "hint", 1000, true),
      question: "",
      options: [],
    };
    if (kind === "quiz") {
      if (
        !Array.isArray(stage.options) ||
        stage.options.length < 2 ||
        stage.options.length > 6
      )
        throw new AppError("VALIDATION_ERROR");
      result.question = text(stage.question, "question", 500);
      result.options = stage.options.map((option: unknown) =>
        text(option, "option", 300),
      );
      result.answer = integer(
        stage.answer ?? base?.question?.answer,
        "answer",
        0,
        result.options.length - 1,
      );
      result.explanation = text(
        stage.explanation ?? base?.question?.explanation ?? "",
        "explanation",
        4000,
        true,
      );
    }
    return result;
  });
}
