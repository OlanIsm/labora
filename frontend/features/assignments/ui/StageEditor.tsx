import type { Assignment } from "../model";
import type { Experiment } from "@contracts/experiment";
import { Plus, Trash2 } from "lucide-react";

type Stage = Assignment["stages"][number];

export function StageEditor({
  stage,
  index,
  experiment,
  onChange,
  onRemove,
  onAddQuiz,
}: {
  stage: Stage;
  index: number;
  experiment: Experiment;
  onChange: (stage: Stage) => void;
  onRemove?: () => void;
  onAddQuiz: () => void;
}) {
  const quiz = stage.kind === "quiz";
  function removeOption(index: number) {
    const answer = stage.answer ?? 0;
    onChange({
      ...stage,
      options: stage.options.filter((_, i) => i !== index),
      answer: answer === index ? 0 : answer > index ? answer - 1 : answer,
    });
  }
  return (
    <div className="builder-stage">
      <span className="builder-stage-num">{index + 1}</span>
      <div>
        <div className="builder-stage-heading">
          <h3>
            {quiz ? "Kuis" : "Langkah"} {index + 1}
          </h3>
          {onRemove && (
            <button
              type="button"
              className="icon-button"
              aria-label={`Hapus ${quiz ? "kuis" : "langkah"} ${index + 1}`}
              onClick={onRemove}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        {!quiz && (
          <label>
            Jenis langkah
            <select
              value={
                stage.kind === "instruction"
                  ? "instruction"
                  : String(stage.sourceStep)
              }
              onChange={(e) => {
                if (e.target.value === "instruction")
                  onChange({
                    ...stage,
                    kind: "instruction",
                    sourceStep: undefined,
                  });
                else {
                  const sourceStep = Number(e.target.value),
                    base = experiment.steps[sourceStep];
                  onChange({
                    ...stage,
                    kind: "action",
                    sourceStep,
                    instruction: base.instruction,
                    hint: base.hint,
                  });
                }
              }}
            >
              <option value="instruction">
                Bacaan atau pengamatan — tombol Lanjutkan
              </option>
              {experiment.steps.map(
                (step, i) =>
                  !step.question && (
                    <option key={i} value={i}>
                      {step.instruction}
                    </option>
                  ),
              )}
            </select>
          </label>
        )}
        {!quiz && (
          <>
            <label>
              Instruksi
              <input
                required
                maxLength={1000}
                value={stage.instruction}
                onChange={(e) =>
                  onChange({ ...stage, instruction: e.target.value })
                }
              />
            </label>
            <label>
              Petunjuk (opsional)
              <input
                maxLength={1000}
                value={stage.hint}
                onChange={(e) => onChange({ ...stage, hint: e.target.value })}
              />
            </label>
          </>
        )}
        {quiz && (
          <div className="stage-question">
            <label>
              Pertanyaan
              <input
                required
                maxLength={500}
                value={stage.question}
                onChange={(e) =>
                  onChange({ ...stage, question: e.target.value })
                }
              />
            </label>
            {stage.options.map((option, optionIndex) => (
              <div className="builder-option" key={optionIndex}>
                <label>
                  Pilihan {optionIndex + 1}
                  <input
                    required
                    maxLength={300}
                    value={option}
                    onChange={(e) =>
                      onChange({
                        ...stage,
                        options: stage.options.map((value, i) =>
                          i === optionIndex ? e.target.value : value,
                        ),
                      })
                    }
                  />
                </label>
                {stage.options.length > 2 && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Hapus pilihan ${optionIndex + 1} pada kuis ${index + 1}`}
                    onClick={() => removeOption(optionIndex)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            {stage.options.length < 6 && (
              <button
                type="button"
                className="button ghost small"
                onClick={() =>
                  onChange({ ...stage, options: [...stage.options, ""] })
                }
              >
                <Plus size={16} /> Tambah pilihan
              </button>
            )}
            <label>
              Jawaban benar
              <select
                value={stage.answer ?? 0}
                onChange={(e) =>
                  onChange({ ...stage, answer: Number(e.target.value) })
                }
              >
                {stage.options.map((option, i) => (
                  <option key={i} value={i}>
                    {option || `Pilihan ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Penjelasan setelah menjawab (opsional)
              <textarea
                maxLength={4000}
                value={stage.explanation || ""}
                onChange={(e) =>
                  onChange({ ...stage, explanation: e.target.value })
                }
              />
            </label>
          </div>
        )}
        <button
          type="button"
          className="button ghost small builder-add-quiz"
          onClick={onAddQuiz}
        >
          <Plus size={16} /> Tambah kuis setelah ini
        </button>
      </div>
    </div>
  );
}
