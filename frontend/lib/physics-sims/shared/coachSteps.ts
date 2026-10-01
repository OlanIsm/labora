"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type CoachStep<TState> = {
  id: string;
  message: (state: TState) => string;
  isDone: (state: TState) => boolean;
};

export function useCoachSteps<TState>(steps: CoachStep<TState>[]) {
  const [stepIndex, setStepIndex] = useState(0);
  const completedRef = useRef<Set<string>>(new Set());
  const latestState = useRef<TState | null>(null);

  const evaluate = useCallback((state: TState) => {
    latestState.current = state;
  }, []);

  useEffect(() => {
    const current = steps[stepIndex];
    const state = latestState.current;
    if (current && state && current.isDone(state) && !completedRef.current.has(current.id)) {
      completedRef.current.add(current.id);
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    }
  });

  const reset = useCallback(() => {
    setStepIndex(0);
    completedRef.current = new Set();
  }, []);

  const activeStep = steps[Math.min(stepIndex, steps.length - 1)];
  const allDone = stepIndex >= steps.length - 1 && activeStep ? completedRef.current.has(activeStep.id) : false;

  return { activeStep, evaluate, reset, stepIndex, allDone };
}
