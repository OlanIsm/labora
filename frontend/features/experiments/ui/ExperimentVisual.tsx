"use client";

import type { Experiment } from "@/features/experiments/domain/definitions";
import type { Runtime } from "@/features/experiments/domain/engine";
import {
  ohmsLaw,
  pendulumPeriod,
  projectileRange,
} from "@/features/experiments/domain/science";
import { useDroppable } from "@dnd-kit/core";
import { Leaf } from "lucide-react";

export function ChemistryVisual({
  exp,
  state,
  preview = false,
  dragging,
}: {
  exp: Experiment;
  state: Runtime;
  preview?: boolean;
  dragging?: string | null;
}) {
  const current = exp.steps[state.step];
  const active = !preview && ["pour", "add"].includes(current?.action || "");
  const { setNodeRef, isOver } = useDroppable({
    id: "vessel",
    disabled: !active,
  });
  const ready = preview || state.step >= 3;
  const filled = preview || state.step >= 2;
  const visible =
    preview ||
    state.placed.includes(exp.visual === "dilution" ? "cylinder" : "beaker");
  const observation =
    exp.visual === "ph"
      ? ready
        ? "pH 3 · Asam"
        : "pH belum diketahui"
      : exp.visual === "mixture"
        ? ready
          ? "Endapan terbentuk"
          : "Belum ada endapan"
        : ready
          ? "0,5 M"
          : filled
            ? "1,0 M"
            : "Belum diisi";
  return (
    <div
      className={`visual chemistry-visual ${exp.visual} ${preview ? "preview" : ""}`}
    >
      <div
        ref={setNodeRef}
        className={`vessel-target ${visible ? "visible" : ""} ${active && dragging ? "drop-ready" : ""} ${isOver ? "drop-over" : ""}`}
      >
        <div
          className={`science-beaker ${filled ? "filled" : ""} ${ready ? "reacted" : ""}`}
        >
          <div className="beaker-liquid" />
          <span className="beaker-mark one" />
          <span className="beaker-mark two" />
          <span className="beaker-mark three" />
          {exp.visual === "mixture" && ready && (
            <div className="precipitate">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
        {!visible && !preview && (
          <span className="vessel-placeholder">Tempat gelasmu</span>
        )}
      </div>
      <div className="science-readout" aria-live="polite">
        <strong>{observation}</strong>
        <span>
          {exp.visual === "ph"
            ? ready
              ? "Merah setelah diberi indikator"
              : filled
                ? "Larutan A · belum diberi indikator"
                : visible
                  ? "Gelas siap · tuangkan Larutan A"
                  : "Letakkan gelas beker untuk mulai"
            : exp.visual === "mixture"
              ? ready
                ? "Larutan berubah keruh"
                : filled
                  ? "Larutan A masih jernih"
                  : visible
                    ? "Gelas siap · tuangkan Larutan A"
                    : "Letakkan gelas beker untuk mulai"
              : ready
                ? "Volume bertambah, konsentrasi turun"
                : "Amati konsentrasi larutan"}
        </span>
      </div>
    </div>
  );
}

export function Visual({
  exp,
  state,
  preview = false,
  dragging,
}: {
  exp: Experiment;
  state: Runtime;
  preview?: boolean;
  dragging?: string | null;
}) {
  if (["ph", "mixture", "dilution"].includes(exp.visual))
    return (
      <ChemistryVisual
        exp={exp}
        state={state}
        preview={preview}
        dragging={dragging}
      />
    );
  const has = (id: string) => state.placed.includes(id) || preview;
  if (exp.visual === "circuit") {
    const complete = ["battery", "resistor", "lamp", "wire"].every(has);
    return (
      <div className="visual circuit-visual">
        <svg
          viewBox="0 0 520 260"
          role="img"
          aria-label={
            complete
              ? "Rangkaian tertutup dengan lampu menyala"
              : "Rangkaian listrik belum lengkap"
          }
        >
          <path
            d="M90 60 H420 V200 H90 Z"
            fill="none"
            stroke={complete ? "#806500" : "#8793a7"}
            strokeWidth="4"
            strokeDasharray={complete ? undefined : "8 8"}
          />
          {complete && !preview && (
            <path
              className="current-flow"
              d="M90 60 H420 V200 H90 Z"
              fill="none"
              stroke="#e0ad00"
              strokeWidth="5"
              strokeDasharray="12 30"
            />
          )}
          <rect
            x="66"
            y="100"
            width="48"
            height="56"
            rx="8"
            fill={has("battery") ? "#ffdf70" : "#e9eef5"}
            stroke="#806500"
            strokeWidth="2"
          />
          <text x="90" y="136" textAnchor="middle" fontSize="24" fill="#1f2430">
            +
          </text>
          <rect
            x="205"
            y="44"
            width="90"
            height="32"
            rx="7"
            fill={has("resistor") ? "#ffeeb2" : "#e9eef5"}
            stroke="#806500"
            strokeWidth="2"
          />
          <path
            d="M217 60 l8 -8 10 16 10 -16 10 16 10 -16 8 8"
            fill="none"
            stroke="#806500"
            strokeWidth="2"
          />
          <circle
            cx="420"
            cy="130"
            r="33"
            fill={complete ? "#ffd84d" : "#e9eef5"}
            stroke="#806500"
            strokeWidth="3"
          />
          <path
            d="M407 117 L433 143 M433 117 L407 143"
            stroke="#806500"
            strokeWidth="3"
          />
          <text x="90" y="235" textAnchor="middle">
            Baterai
          </text>
          <text x="250" y="105" textAnchor="middle">
            Resistor
          </text>
          <text x="420" y="190" textAnchor="middle">
            Lampu
          </text>
        </svg>
        <div className="science-readout">
          <strong>
            {complete
              ? ohmsLaw(state.voltage, state.resistance).toFixed(2)
              : "0,00"}{" "}
            A
          </strong>
          <span>
            {complete
              ? "Rangkaian tertutup · arus mengalir"
              : "Pasang komponen dan sambungkan kabel"}
          </span>
        </div>
      </div>
    );
  }
  if (exp.visual === "cell" || exp.visual === "blood") {
    const ready = state.observed || preview;
    return (
      <div className="visual biology-visual">
        <div className={`microscope-field ${ready ? "focused" : ""}`}>
          <div
            className="cell-pattern"
            style={{
              transform: `scale(${state.zoom === 400 ? 2.2 : state.zoom === 100 ? 1.4 : 1})`,
            }}
          >
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={exp.visual === "blood" ? "blood-cell" : "plant-cell"}
              >
                <span />
              </div>
            ))}
          </div>
          {!ready && (
            <span className="microscope-wait">
              {has("microscope")
                ? "Fokuskan mikroskop untuk mengamati"
                : "Siapkan preparat terlebih dahulu"}
            </span>
          )}
        </div>
        <div className="science-readout">
          <strong>{state.zoom}×</strong>
          <span>
            {ready
              ? exp.visual === "blood"
                ? "Sampel sel darah"
                : "Sampel sel tumbuhan"
              : "Menunggu pengamatan"}
          </span>
        </div>
      </div>
    );
  }
  if (exp.visual === "projectile") {
    const range = projectileRange(state.speed, state.angle);
    return (
      <div className="visual projectile-visual">
        <svg
          viewBox="0 0 580 290"
          role="img"
          aria-label="Lintasan gerak parabola"
        >
          <path d="M30 245 H550" stroke="#8793a7" strokeWidth="2" />
          <path
            d={`M40 245 Q ${Math.min(270, range * 8)} ${state.launched || preview ? 20 : 245} ${Math.min(520, range * 14 + 40)} 245`}
            fill="none"
            stroke="#806500"
            strokeWidth="4"
            strokeDasharray="8 6"
          />
          <circle cx="40" cy="245" r="14" fill="#806500" />
          <circle
            cx={state.launched || preview ? Math.min(520, range * 14 + 40) : 40}
            cy="245"
            r="10"
            fill="#d45689"
          />
        </svg>
        <div className="science-readout">
          <strong>
            {state.launched || preview ? range.toFixed(1) : "Belum diluncurkan"}
            {state.launched || preview ? " m" : ""}
          </strong>
          <span>Jangkauan ideal, tanpa hambatan udara</span>
        </div>
      </div>
    );
  }
  if (exp.visual === "pendulum")
    return (
      <div className="visual pendulum-visual">
        <div className="pendulum-frame">
          <div
            className={state.step >= 3 && !preview ? "pendulum-swing" : ""}
            style={{ animationDuration: `${pendulumPeriod(state.length)}s` }}
          >
            <div className="pendulum-string" />
            <div className="pendulum-ball" />
          </div>
        </div>
        <div className="science-readout">
          <strong>
            {has("bob")
              ? `${pendulumPeriod(state.length).toFixed(2)} s`
              : "Belum dipasang"}
          </strong>
          <span>Periode: waktu untuk satu ayunan penuh</span>
        </div>
      </div>
    );
  return (
    <div className="visual plant-visual">
      <div className="plant-specimen">
        <Leaf size={120} strokeWidth={1.3} />
        {has("bag") && (
          <div className="plant-bag">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
      <div className="science-readout">
        <strong>
          {has("bag") ? "Tetes air terlihat" : "Siapkan tumbuhan"}
        </strong>
        <span>Amati uap air dari daun</span>
      </div>
    </div>
  );
}
