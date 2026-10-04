"use client";

import type { Assignment } from "@/features/assignments/model";
import { useEffect, useState, useRef } from "react";
import type {
  SessionDTO,
  EventOutcome,
  ResultDTO,
} from "@contracts/laboratory";
import type { Answer } from "../domain/engine";
import { apiFetch, ApiError } from "@/shared/infrastructure/api";
import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { act, answer, initialRuntime } from "../domain/engine";
import type { Experiment, Runtime } from "../model";
import type { RuntimeRepository } from "../repository";

function applyAction(
  exp: Experiment,
  state: Runtime,
  action: string,
  item: string,
) {
  const step = exp.steps[state.step];
  const prepared =
    exp.subject !== "chemistry" &&
    action !== "place" &&
    step?.item === item &&
    !state.placed.includes(item)
      ? act(exp, state, "place", item)
      : state;
  return act(exp, prepared, action, item);
}

export function useGuidedExperiment(
  exp: Experiment,
  assignment: Assignment | undefined,
  runtimes: RuntimeRepository,
  accountId?: string,
) {
  const [state, setState] = useState<Runtime>(initialRuntime);
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [interaction, setInteraction] = useState(0);
  const [feedbackError, setFeedbackError] = useState(false);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const session = useRef<SessionDTO | null>(null);
  const pendingEvent = useRef<{
    path: string;
    body: Record<string, unknown>;
  } | null>(null);
  const pendingKey = `labora-pending-v1:${accountId}:${exp.id}:${assignment?.id || "practice"}`;
  useEffect(() => {
    let active = true;
    setHydrated(false);
    setFeedbackError(false);
    session.current = null;
    pendingEvent.current = null;
    if (!accountId) {
      setState(runtimes.load(exp.id) || initialRuntime());
      setHydrated(true);
      return;
    }
    async function initialize() {
      try {
        const all = await apiFetch<SessionDTO[]>("/sessions?limit=100");
        let current = all.find(
          (s) =>
            s.mode === "guided" &&
            s.status === "active" &&
            s.experimentId === exp.id &&
            s.assignmentId === assignment?.id,
        );
        if (!current)
          current = await apiFetch<SessionDTO>("/sessions", {
            method: "POST",
            body: JSON.stringify({
              experimentId: exp.id,
              assignmentId: assignment?.id,
              eventId: crypto.randomUUID(),
            }),
          });
        if (!active) return;
        const queued = browserStorage.read<{
          path: string;
          body: Record<string, unknown>;
        } | null>(pendingKey, null);
        if (queued && queued.path.startsWith(`/sessions/${current.id}/`)) {
          try {
            const outcome = await apiFetch<EventOutcome>(queued.path, {
              method: "POST",
              body: JSON.stringify(queued.body),
            });
            current = outcome.session;
            browserStorage.remove(pendingKey);
          } catch (error) {
            if (
              error instanceof ApiError &&
              error.code === "REVISION_CONFLICT"
            ) {
              current = await apiFetch<SessionDTO>(`/sessions/${current.id}`);
              browserStorage.remove(pendingKey);
            } else pendingEvent.current = queued;
          }
        }
        if (!active) return;
        session.current = current;
        setState(current.state);
        setHydrated(true);
      } catch (error) {
        if (active) {
          setFeedbackError(true);
          setState((s) => ({
            ...s,
            feedback:
              error instanceof Error
                ? error.message
                : "Sesi belum bisa dimuat. Muat ulang untuk mencoba lagi.",
          }));
        }
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [exp.id, runtimes, accountId, assignment?.id, pendingKey, loadAttempt]);
  useEffect(() => {
    if (hydrated && !accountId) runtimes.save(exp.id, state);
  }, [state, exp.id, hydrated, runtimes, accountId]);

  async function remote(
    kind: "actions" | "answers",
    payload: Record<string, unknown>,
  ) {
    if (!session.current || locked.current || !hydrated) return;
    const confirmedState = session.current.state;
    locked.current = true;
    setPending(true);
    const path = `/sessions/${session.current.id}/${kind}`;
    const event = pendingEvent.current || {
      path,
      body: {
        ...payload,
        eventId: crypto.randomUUID(),
        revision: session.current.revision,
      },
    };
    pendingEvent.current = event;
    browserStorage.write(pendingKey, event);
    if (
      event.path.endsWith("/actions") &&
      typeof event.body.action === "string" &&
      typeof event.body.item === "string"
    ) {
      const action = event.body.action;
      const item = event.body.item;
      const definition = session.current.definition || exp;
      setState((s) => applyAction(definition, s, action, item));
      setFeedbackError(false);
      setInteraction((n) => n + 1);
    }
    try {
      const outcome = await apiFetch<EventOutcome>(event.path, {
        method: "POST",
        body: JSON.stringify(event.body),
      });
      session.current = outcome.session;
      setState(outcome.session.state);
      setFeedbackError(!outcome.accepted);
      pendingEvent.current = null;
      browserStorage.remove(pendingKey);
    } catch (error) {
      if (error instanceof ApiError && error.code === "REVISION_CONFLICT") {
        try {
          const canonical = await apiFetch<SessionDTO>(
            `/sessions/${session.current.id}`,
          );
          session.current = canonical;
          setState({
            ...canonical.state,
            feedback:
              "Sesi diperbarui dari perangkat lain. Lanjutkan dari langkah terbaru.",
          });
          pendingEvent.current = null;
          browserStorage.remove(pendingKey);
        } catch {
          setState({
            ...confirmedState,
            feedback: "Sesi belum tersinkron. Coba lagi setelah koneksi pulih.",
          });
          setFeedbackError(true);
        }
      } else {
        setState({
          ...confirmedState,
          feedback:
            error instanceof Error
              ? `${error.message} Tekan tindakan lagi untuk mengirim ulang.`
              : "Koneksi terputus. Tindakan masih menunggu pengiriman.",
        });
        setFeedbackError(true);
      }
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  const activeExperiment = session.current?.definition || exp;
  const base = activeExperiment.steps[state.step];
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
  const needed = activeExperiment.items.find((i) => i.id === current?.item);
  const selectedItem = activeExperiment.items.find((i) => i.id === selected);
  const progress = Math.round(
    (state.step / activeExperiment.steps.length) * 100,
  );
  function flagError() {
    setFeedbackError(true);
  }
  function doAction(action: string, item: string) {
    if (!hydrated || locked.current) return;
    if (accountId) {
      void remote("actions", {
        action,
        item,
        parameters: {
          voltage: state.voltage,
          resistance: state.resistance,
          angle: state.angle,
          speed: state.speed,
          length: state.length,
          zoom: state.zoom,
        },
      });
      setSelected(null);
      setHint(false);
      return;
    }
    setInteraction((n) => n + 1);
    if (current && (current.action !== action || current.item !== item))
      flagError();
    else setFeedbackError(false);
    setState((s) => applyAction(activeExperiment, s, action, item));
    setHint(false);
    setSelected(null);
  }
  async function doAnswer(choice: number) {
    if (!hydrated || locked.current) return;
    if (accountId) {
      await remote("answers", { choice });
      return;
    }
    if (!assignment) {
      locked.current = true;
      setPending(true);
      try {
        const graded = await apiFetch<Answer>("/practice/answers", {
          method: "POST",
          body: JSON.stringify({
            experimentId: exp.id,
            step: state.step,
            choice,
          }),
        });
        setState((s) => ({
          ...s,
          step: s.step + 1,
          done: [...s.done, s.step],
          answers: { ...s.answers, [s.step]: graded },
          feedback: `${graded.correct ? "Benar!" : "Belum tepat, nggak apa-apa."} ${graded.explanation}`,
        }));
        setFeedbackError(!graded.correct);
        setInteraction((n) => n + 1);
      } catch (error) {
        setState((s) => ({
          ...s,
          feedback:
            error instanceof Error
              ? error.message
              : "Jawaban belum bisa diperiksa. Coba lagi.",
        }));
        setFeedbackError(true);
      } finally {
        locked.current = false;
        setPending(false);
      }
      return;
    }
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
  async function reset() {
    if (locked.current) return;
    if (
      state.step &&
      !window.confirm("Mulai dari awal? Langkah eksperimen ini akan dihapus.")
    )
      return;
    if (accountId && session.current) {
      locked.current = true;
      setPending(true);
      try {
        await apiFetch(`/sessions/${session.current.id}`, { method: "DELETE" });
        const next = await apiFetch<SessionDTO>("/sessions", {
          method: "POST",
          body: JSON.stringify({
            experimentId: exp.id,
            assignmentId: assignment?.id,
            eventId: crypto.randomUUID(),
          }),
        });
        session.current = next;
        browserStorage.remove(pendingKey);
        pendingEvent.current = null;
        setState(next.state);
      } catch (error) {
        setState((s) => ({
          ...s,
          feedback:
            error instanceof Error
              ? error.message
              : "Sesi belum dapat diulang.",
        }));
        return;
      } finally {
        locked.current = false;
        setPending(false);
      }
    } else setState(initialRuntime());
    setSelected(null);
    setHint(false);
    runtimes.clear(exp.id);
    setFeedbackError(false);
    setInteraction(0);
  }

  async function submit(): Promise<ResultDTO | undefined> {
    if (!accountId) return undefined;
    if (!session.current || locked.current) throw new Error("Sesi belum siap.");
    return apiFetch<ResultDTO>(`/sessions/${session.current.id}/submit`, {
      method: "POST",
      body: JSON.stringify({ revision: session.current.revision }),
    });
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
    pending,
    hydrated,
    retryLoad: () => setLoadAttempt((attempt) => attempt + 1),
    submit,
    activeExperiment,
  };
}
