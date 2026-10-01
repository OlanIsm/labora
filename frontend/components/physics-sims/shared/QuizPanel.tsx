"use client";
import { useId, useState } from "react";
import { CheckCircle2, CircleHelp } from "lucide-react";

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
};

// Collapsible mini-quiz (2-3 questions) at the bottom of a simulation,
// reusing the same disclosure visual language as the "Rumus & Penjelasan"
// panel in SimShell. Scored client-side; explanation shown immediately
// after each answer, matching the chemistry feature's quiz pattern.
export default function QuizPanel({ title, questions }: { title: string; questions: QuizQuestion[] }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const summaryId = useId();

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0),
    0,
  );

  return (
    <details className="sim-quiz" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary id={summaryId}>
        {title}
        {answeredCount === questions.length && (
          <span className="sim-quiz-score">
            {correctCount}/{questions.length} benar
          </span>
        )}
      </summary>
      <div className="sim-quiz-body">
        <p>Coba jawab setelah bereksperimen. Setiap jawaban disertai penjelasan; ini latihan, bukan penilaian kelas.</p>
        {questions.map((question, qIndex) => {
          const chosen = answers[qIndex];
          const hasAnswered = chosen !== undefined;
          return (
            <div className="sim-quiz-question" key={qIndex}>
              <p className="sim-quiz-prompt">
                <CircleHelp size={16} />
                {question.prompt}
              </p>
              <div className="sim-quiz-options">
                {question.options.map((option, oIndex) => {
                  const isChosen = chosen === oIndex;
                  const isCorrectOption = oIndex === question.answer;
                  const showState = hasAnswered && (isChosen || isCorrectOption);
                  return (
                    <button
                      key={oIndex}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))}
                      className={`sim-quiz-option ${
                        showState ? (isCorrectOption ? "correct" : isChosen ? "incorrect" : "") : ""
                      }`}
                    >
                      {showState && isCorrectOption && <CheckCircle2 size={15} />}
                      {option}
                    </button>
                  );
                })}
              </div>
              {hasAnswered && (
                <p className="sim-quiz-explanation" role="status">
                  {chosen === question.answer ? "Betul! " : "Belum tepat. "}
                  {question.explanation}
                </p>
              )}
            </div>
          );
        })}
        {answeredCount > 0 && <button className="button ghost small" onClick={() => setAnswers({})}>Ulangi kuis</button>}
      </div>
    </details>
  );
}
