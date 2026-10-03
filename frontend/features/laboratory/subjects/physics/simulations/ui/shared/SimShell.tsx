"use client";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useId, useState } from "react";

// Shared chrome for every physics simulation: title, Reset/Pause controls,
// a mute toggle, a collapsible "Rumus & Penjelasan" panel, and a slot for
// the canvas/SVG stage plus a slot for discipline-specific controls.
export default function SimShell({
  title,
  curriculumBadge,
  paused,
  onTogglePause,
  onReset,
  muted,
  onToggleMute,
  formula,
  stage,
  controls,
  dataPanel,
  mascot,
  quiz,
  objective,
  interactionHint,
  explanation,
}: {
  title: string;
  curriculumBadge: string;
  paused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  muted: boolean;
  onToggleMute: () => void;
  formula: React.ReactNode;
  stage: React.ReactNode;
  controls: React.ReactNode;
  dataPanel?: React.ReactNode;
  mascot?: React.ReactNode;
  quiz?: React.ReactNode;
  objective: string;
  interactionHint: string;
  explanation: string;
}) {
  const [formulaOpen, setFormulaOpen] = useState(false);
  const formulaId = useId();
  const [guideVisible, setGuideVisible] = useState(true);
  return (
    <div className="sim-shell">
      <div className="sim-heading">
        <div>
          <span className="sim-badge">{curriculumBadge}</span>
          <h1>{title}</h1>
          <p className="sim-objective">
            <strong>Misi percobaan:</strong> {objective}
          </p>
        </div>
        <div className="sim-toolbar">
          <button
            className="button ghost small"
            onClick={onTogglePause}
            aria-pressed={!paused}
            aria-label={paused ? "Lanjutkan simulasi" : "Hentikan sementara"}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
            {paused ? "Lanjutkan" : "Jeda"}
          </button>
          <button
            className="button ghost small"
            onClick={onReset}
            aria-label="Reset simulasi"
          >
            <RotateCcw size={18} />
            Reset
          </button>
          <button
            className="icon-button"
            onClick={onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Aktifkan suara" : "Matikan suara"}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>
      {mascot && (
        <div className="sim-guide">
          {guideVisible && mascot}
          <button
            className="button ghost small"
            onClick={() => setGuideVisible((visible) => !visible)}
            aria-expanded={guideVisible}
          >
            {guideVisible ? "Sembunyikan panduan" : "Tampilkan panduan Ellie"}
          </button>
        </div>
      )}
      <div className="sim-layout">
        <div className="sim-stage-column">
          <p className="sim-affordance-hint">{interactionHint}</p>
          <div className="sim-stage">{stage}</div>
          {dataPanel && <div className="sim-data-panel">{dataPanel}</div>}
        </div>
        <aside className="sim-controls" aria-label="Kontrol simulasi">
          {controls}
        </aside>
      </div>
      <section className="sim-experiment-explanation">
        <h2>Apa yang terjadi?</h2>
        <p>{explanation}</p>
      </section>
      <details
        className="sim-formula"
        open={formulaOpen}
        onToggle={(event) => setFormulaOpen(event.currentTarget.open)}
      >
        <summary id={formulaId}>Rumus & Penjelasan</summary>
        <div className="sim-formula-body">{formula}</div>
      </details>
      {quiz}
    </div>
  );
}
