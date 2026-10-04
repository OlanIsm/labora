"use client";

import type { Assignment } from "@/features/assignments/model";
import { actionLabel } from "@/features/experiments/actionLabel";
import type { Experiment } from "@/features/experiments/domain/definitions";
import type { Runtime } from "@/features/experiments/domain/engine";
import { dilution } from "@/features/experiments/domain/science";
import { DraggableItem } from "@/features/experiments/ui/DraggableItem";
import { Icon } from "@/features/experiments/ui/EquipmentIcon";
import { Workspace } from "@/features/experiments/ui/Workspace";
import { path } from "@/shared/routes";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Lightbulb,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RuntimeRepository } from "../repository";
import type { ResultDTO } from "@contracts/laboratory";

import { useGuidedExperiment } from "../application/useGuidedExperiment";

export function Lab({
  exp,
  assignment,
  onComplete,
  runtimes,
  accountId,
}: {
  exp: Experiment;
  assignment?: Assignment;
  onComplete: (runtime: Runtime, result?: ResultDTO) => Promise<void>;
  runtimes: RuntimeRepository;
  accountId?: string;
}) {
  const {
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
    retryLoad,
    submit,
    activeExperiment,
  } = useGuidedExperiment(exp, assignment, runtimes, accountId);
  exp = activeExperiment;
  const [dragging, setDragging] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [saving, setSaving] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => {
      if (drawerRef.current?.matches(":modal")) drawerRef.current.close();
      setMobile(media.matches);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  function drop(e: DragEndEvent) {
    setDragging(null);
    const item = String(e.active.id);
    if (exp.subject !== "chemistry") {
      if (e.over?.id === "workspace") doAction("place", item);
      return;
    }
    const target = current?.action === "place" ? "workspace" : "vessel";
    if (current?.item === item && e.over?.id === target)
      doAction(current.action, item);
    else {
      setState((s) => ({
        ...s,
        feedback:
          current?.item === item
            ? `Geser ${needed?.name.toLowerCase()} ${target === "workspace" ? "ke meja" : "ke dalam gelas"}. Kamu juga bisa memakai tombol tindakan.`
            : `Belum cocok. ${current?.instruction || "Eksperimen sudah selesai."}`,
      }));
      setInteraction((n) => n + 1);
      flagError();
    }
  }
  function select(id: string) {
    setSelected(id);
    setFeedbackError(false);
    const item = exp.items.find((item) => item.id === id);
    setState((s) => ({
      ...s,
      feedback:
        id === needed?.id
          ? `${item?.name} dipilih. Tekan tombol tindakan untuk memakainya.`
          : `${item?.name} dipilih. Langkah ini membutuhkan ${needed?.name.toLowerCase() || "jawaban dari pengamatanmu"}.`,
    }));
    if (mobile) drawerRef.current?.close();
  }
  const inventory = (
    <>
      <div className="inventory-heading">
        <h2>Alat & bahan</h2>
        {mobile && (
          <button
            className="icon-button"
            onClick={() => drawerRef.current?.close()}
            aria-label="Tutup alat dan bahan"
          >
            <X size={22} />
          </button>
        )}
      </div>
      <p className="inventory-help">
        Pilih yang berlabel “Pakai sekarang”, lalu tekan tombol tindakan. Kamu
        juga bisa menggesernya ke meja.
      </p>
      {(["tool", "material"] as const).map((kind) => (
        <div className="inventory-group" key={kind}>
          <h3>{kind === "tool" ? "Alat" : "Bahan"}</h3>
          <div className="inventory-grid">
            {exp.items
              .filter((i) => i.kind === kind)
              .map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  needed={item.id === needed?.id}
                  selected={item.id === selected}
                  onSelect={() => select(item.id)}
                />
              ))}
          </div>
        </div>
      ))}
    </>
  );
  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDragging(String(e.active.id))}
      onDragCancel={() => setDragging(null)}
      onDragEnd={drop}
    >
      <div className="lab-shell">
        <div className="lab-bar">
          <Link
            href={path(exp.id)}
            className="back-link"
            aria-label="Tentang eksperimen"
          >
            <ArrowLeft size={19} />
            <span>Tentang eksperimen</span>
          </Link>
          <strong>{exp.title}</strong>
          <button
            onClick={reset}
            disabled={pending || !hydrated}
            className="button ghost small"
          >
            <RotateCcw size={17} />
            Ulangi
          </button>
        </div>
        {accountId && !hydrated && feedbackError && (
          <p role="alert">
            {state.feedback}{" "}
            <button className="button ghost small" onClick={retryLoad}>
              Coba muat sesi
            </button>
          </p>
        )}
        <div className="lab-layout">
          <div className="lab-primary">
            <div className="lab-progress">
              <span>
                {current
                  ? `Langkah ${state.step + 1} dari ${exp.steps.length}`
                  : "Semua langkah selesai"}
              </span>
              <span>{progress}%</span>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Progres eksperimen"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            <section className="step-panel">
              <div className="step-panel-heading">
                {current && (
                  <h2>{stage?.instruction || current.instruction}</h2>
                )}
                {current && (
                  <button
                    className="hint-button"
                    aria-expanded={hint}
                    onClick={() => setHint(!hint)}
                  >
                    <Lightbulb size={18} />
                    {hint ? "Tutup petunjuk" : "Butuh petunjuk?"}
                  </button>
                )}
              </div>
              {current ? (
                <>
                  {assignment?.instructions && state.step === 0 && (
                    <p>{assignment.instructions}</p>
                  )}
                  {hint && (
                    <div className="hint-box">
                      <Lightbulb size={20} />
                      <span>{stage?.hint || current.hint}</span>
                    </div>
                  )}
                  {current.question ? (
                    <div className="question-block">
                      <h3>{current.question.prompt}</h3>
                      <div className="answer-grid">
                        {current.question.options.map((option, i) => (
                          <button
                            key={i}
                            disabled={pending || !hydrated}
                            onClick={() => doAnswer(i)}
                          >
                            <span>{String.fromCharCode(65 + i)}</span>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="step-actions">
                      {needed && (
                        <button
                          className="button primary"
                          disabled={pending || !hydrated}
                          onClick={() => doAction(current.action, needed.id)}
                        >
                          <Icon name={needed.icon} size={19} />
                          {actionLabel(current.action, exp)}{" "}
                          {needed.name.toLowerCase()}
                        </button>
                      )}
                      <button
                        className="button ghost mobile-tools"
                        onClick={() => drawerRef.current?.showModal()}
                      >
                        Pilih alat lain
                      </button>
                      {selectedItem && selectedItem.id !== needed?.id && (
                        <button
                          className="button ghost"
                          onClick={() => doAction("place", selectedItem.id)}
                        >
                          Letakkan {selectedItem.name.toLowerCase()}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2>Pengamatanmu sudah lengkap!</h2>
                  <p>Baca penjelasannya dan lihat hasil pemahamanmu.</p>
                  <button
                    className="button primary"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await onComplete(state, await submit());
                      } catch {
                        setState((s) => ({
                          ...s,
                          feedback:
                            "Hasil belum bisa disimpan. Coba tekan Lihat hasil lagi.",
                        }));
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? "Menyimpan hasil..." : "Lihat hasil eksperimen"}{" "}
                    <ArrowRight size={18} />
                  </button>
                </>
              )}
              <div
                className={`feedback-line ${feedbackError || state.answers[state.step - 1]?.correct === false ? "feedback-error" : ""}`}
                role="status"
              >
                {feedbackError ||
                state.answers[state.step - 1]?.correct === false ? (
                  <CircleHelp size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                )}
                <span>{state.feedback}</span>
              </div>
            </section>
            <Workspace
              exp={exp}
              state={state}
              dragging={dragging}
              dropError={feedbackError}
              interaction={interaction}
            />
            {[
              "circuit",
              "projectile",
              "pendulum",
              "cell",
              "blood",
              "dilution",
            ].includes(exp.visual) && (
              <div className="lab-controls">
                {exp.visual === "circuit" ? (
                  <>
                    <label>
                      Tegangan <strong>{state.voltage} V</strong>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={state.voltage}
                        onChange={(e) =>
                          setState((s) => ({ ...s, voltage: +e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Hambatan <strong>{state.resistance} Ω</strong>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={state.resistance}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            resistance: +e.target.value,
                          }))
                        }
                      />
                    </label>
                    <span className="formula">I = V / R</span>
                  </>
                ) : exp.visual === "cell" || exp.visual === "blood" ? (
                  <div className="zoom-control">
                    <span>Perbesaran</span>
                    {[40, 100, 400].map((z) => (
                      <button
                        key={z}
                        className={state.zoom === z ? "active" : ""}
                        aria-pressed={state.zoom === z}
                        onClick={() => setState((s) => ({ ...s, zoom: z }))}
                      >
                        {z}×
                      </button>
                    ))}
                  </div>
                ) : exp.visual === "projectile" ? (
                  <>
                    <label>
                      Sudut peluncuran <strong>{state.angle}°</strong>
                      <input
                        type="range"
                        min="15"
                        max="75"
                        value={state.angle}
                        onChange={(e) =>
                          setState((s) => ({ ...s, angle: +e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Kecepatan <strong>{state.speed} m/s</strong>
                      <input
                        type="range"
                        min="5"
                        max="20"
                        value={state.speed}
                        onChange={(e) =>
                          setState((s) => ({ ...s, speed: +e.target.value }))
                        }
                      />
                    </label>
                  </>
                ) : exp.visual === "pendulum" ? (
                  <label>
                    Panjang tali <strong>{state.length.toFixed(1)} m</strong>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={state.length}
                      onChange={(e) =>
                        setState((s) => ({ ...s, length: +e.target.value }))
                      }
                    />
                  </label>
                ) : (
                  <span>
                    Konsentrasi awal: 1,0 M · Setelah air ditambahkan:{" "}
                    {dilution(1, 10, 20).toFixed(1)} M
                  </span>
                )}
              </div>
            )}
            <details className="lab-checklist">
              <summary>
                Semua langkah eksperimen{" "}
                <span>
                  {state.step}/{exp.steps.length}
                </span>
              </summary>
              <ol>
                {exp.steps.map((step, i) => (
                  <li
                    key={i}
                    className={
                      i < state.step
                        ? "done"
                        : i === state.step
                          ? "current"
                          : ""
                    }
                  >
                    {i < state.step ? (
                      <Check size={17} />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                    {assignment?.stages[i]?.instruction || step.instruction}
                  </li>
                ))}
              </ol>
            </details>
          </div>
          <dialog
            ref={drawerRef}
            className="inventory"
            open={!mobile}
            aria-label="Alat dan bahan eksperimen"
          >
            {inventory}
          </dialog>
        </div>
      </div>
    </DndContext>
  );
}
