"use client";

import type { Assignment } from "@/features/assignments/model";
import { useEffect, useState } from "react";
import { act, answer, initialRuntime } from "../domain/engine";
import type { Experiment, Runtime } from "../model";
import type { RuntimeRepository } from "../repository";

export function useGuidedExperiment(
  exp: Experiment,
  assignment: Assignment | undefined,
  runtimes: RuntimeRepository,
) {
  const [state, setState] = useState<Runtime>(initialRuntime);
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [interaction, setInteraction] = useState(0);
  const [feedbackError, setFeedbackError] = useState(false);
  useEffect(() => {
    setState(runtimes.load(exp.id) || initialRuntime());
    setHydrated(true);
  }, [exp.id, runtimes]);
  useEffect(() => {
    if (hydrated) runtimes.save(exp.id, state);
  }, [state, exp.id, hydrated, runtimes]);

  const base = exp.steps[state.step];
  const stage = assignment?.stages[state.step];
  const current =
    base?.question && stage
      ? {
          ...base,
          question: {
            ...base.question,
            prompt: stage.question || base.question.prompt,
            options: stage.options,
            answer: stage.answer,
          },
        }
      : base;
  const needed = exp.items.find((i) => i.id === current?.item);
  const selectedItem = exp.items.find((i) => i.id === selected);
  const progress = Math.round((state.step / exp.steps.length) * 100);
  function flagError() {
    setFeedbackError(true);
  }
  function doAction(action: string, item: string) {
    setInteraction((n) => n + 1);
    if (current && (current.action !== action || current.item !== item))
      flagError();
    else setFeedbackError(false);
    setState((s) => {
      const prepared =
        exp.subject !== "chemistry" &&
        action !== "place" &&
        current?.item === item &&
        !s.placed.includes(item)
          ? act(exp, s, "place", item)
          : s;
      return act(exp, prepared, action, item);
    });
    setHint(false);
    setSelected(null);
  }
  function doAnswer(choice: number) {
    setInteraction((n) => n + 1);
    setFeedbackError(choice !== current?.question?.answer);
    setState((s) =>
      answer(
        {
          ...exp,
          steps: exp.steps.map((step, i) =>
            i === s.step && current ? current : step,
          ),
        },
        s,
        choice,
      ),
    );
    setHint(false);
  }
  function reset() {
    if (
      state.step &&
      !window.confirm("Mulai dari awal? Langkah eksperimen ini akan dihapus.")
    )
      return;
    setState(initialRuntime());
    setSelected(null);
    setHint(false);
    runtimes.clear(exp.id);
    setFeedbackError(false);
    setInteraction(0);
  }

  return {
    state,
    setState,
    selected,
    setSelected,
    hint,
    setHint,
    interaction,
    setInteraction,
    feedbackError,
    setFeedbackError,
    stage,
    current,
    needed,
    selectedItem,
    progress,
    flagError,
    doAction,
    doAnswer,
    reset,
  };
}
