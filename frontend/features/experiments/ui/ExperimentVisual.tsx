"use client";

import type { Experiment } from "@/features/experiments/domain/definitions";
import type { Runtime } from "@/features/experiments/domain/engine";
import {
  ohmsLaw,
  pendulumPeriod,
  projectileRange,
} from "@/features/experiments/domain/science";
import { useDroppable } from "@dnd-kit/core";
import { useEffect, useState } from "react";

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
  const completed = exp.steps.slice(0, state.step);
  const ready =
    preview ||
    completed.some(
      (step) =>
        step.item ===
          (exp.visual === "ph"
            ? "indicator"
            : exp.visual === "mixture"
              ? "reagent"
              : "water") && step.action !== "place",
    );
  const filled = preview || completed.some((step) => step.action === "pour");
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
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
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
        <div
          className={`microscope-field ${ready ? "focused" : ""} ${exp.visual}`}
        >
          <div
            className="cell-pattern"
            style={{
              transform: `scale(${state.zoom === 400 ? 2.2 : state.zoom === 100 ? 1.4 : 1})`,
            }}
          >
            <svg
              viewBox="0 0 240 240"
              role="img"
              aria-label={
                exp.visual === "blood"
                  ? "Skema sel darah merah, sel darah putih, dan trombosit"
                  : "Skema sel tumbuhan dengan dinding sel, vakuola, dan inti sel"
              }
            >
              {exp.visual === "blood" ? (
                <>
                  {[
                    [35, 40],
                    [104, 30],
                    [183, 45],
                    [57, 108],
                    [194, 114],
                    [26, 177],
                    [105, 191],
                    [185, 195],
                  ].map(([x, y], i) => (
                    <g key={i} transform={`translate(${x} ${y})`}>
                      <circle
                        r="22"
                        fill="#e58b98"
                        stroke="#a63d59"
                        strokeWidth="2"
                      />
                      <ellipse rx="11" ry="9" fill="#f9d8dc" />
                    </g>
                  ))}
                  <circle
                    cx="126"
                    cy="112"
                    r="30"
                    fill="#f5effb"
                    stroke="#735396"
                    strokeWidth="2"
                  />
                  <path
                    d="M111 101 Q121 89 130 103 Q151 100 144 120 Q134 130 124 117 Q108 123 111 101"
                    fill="#735396"
                  />
                  {[
                    [73, 63],
                    [151, 164],
                    [51, 217],
                  ].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="#735396" />
                  ))}
                </>
              ) : (
                <>
                  {Array.from({ length: 12 }, (_, i) => (
                    <g
                      key={i}
                      transform={`translate(${(i % 3) * 84 - 8} ${Math.floor(i / 3) * 65 - 8})`}
                    >
                      <rect
                        width="82"
                        height="63"
                        rx="8"
                        fill="#d6ecc3"
                        stroke="#4c7835"
                        strokeWidth="3"
                      />
                      <rect
                        x="10"
                        y="9"
                        width="59"
                        height="42"
                        rx="10"
                        fill="#eff8e7"
                        stroke="#93b97b"
                      />
                      <ellipse cx="65" cy="41" rx="9" ry="11" fill="#735396" />
                      <circle cx="66" cy="41" r="3" fill="#f5effb" />
                    </g>
                  ))}
                </>
              )}
            </svg>
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
          {ready && !preview && (
            <span className="biology-key">
              {exp.visual === "blood"
                ? "Cakram merah: eritrosit · Inti ungu: leukosit · Titik kecil: trombosit"
                : "Batas hijau: dinding sel · Ruang terang: vakuola · Ungu: inti sel"}
              <br />
              Skema pembelajaran, bukan foto preparat.
            </span>
          )}
        </div>
      </div>
    );
  }
  if (exp.visual === "projectile") {
    const range = projectileRange(state.speed, state.angle);
    const radians = (state.angle * Math.PI) / 180;
    const duration = (2 * state.speed * Math.sin(radians)) / 9.81;
    const axisRange = projectileRange(state.speed, 45);
    const scale = 480 / axisRange;
    const coordinates = Array.from({ length: 41 }, (_, i) => {
      const t = (duration * i) / 40;
      return [
        40 + state.speed * Math.cos(radians) * t * scale,
        250 -
          (state.speed * Math.sin(radians) * t - (9.81 * t * t) / 2) * scale,
      ];
    });
    const points = coordinates.map(
      ([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`,
    );
    const distances = [0];
    for (let i = 1; i < coordinates.length; i++) {
      distances.push(
        distances[i - 1] +
          Math.hypot(
            coordinates[i][0] - coordinates[i - 1][0],
            coordinates[i][1] - coordinates[i - 1][1],
          ),
      );
    }
    const trajectory = `M${points.join(" L")}`;
    const launched = state.launched || preview;
    const animate = state.launched && !preview && !reducedMotion;
    return (
      <div className="visual projectile-visual">
        <svg
          viewBox="0 0 580 300"
          role="img"
          aria-label={`Lintasan gerak parabola, sudut ${state.angle} derajat dan kecepatan ${state.speed} meter per detik`}
        >
          <path
            d="M40 10 V250 H550"
            fill="none"
            stroke="#806500"
            strokeWidth="2"
          />
          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick} className="projectile-axis-label">
              <path d={`M${40 + tick * 120} 250 v6`} stroke="#806500" />
              <text x={40 + tick * 120} y="278" textAnchor="middle">
                {((axisRange * tick) / 4).toFixed(1)} m
              </text>
            </g>
          ))}
          {[1, 2].map((tick) => (
            <text
              key={tick}
              className="projectile-axis-label"
              x="30"
              y={255 - tick * 120}
              textAnchor="end"
            >
              {((axisRange * tick) / 4).toFixed(1)}
            </text>
          ))}
          {has("launcher") && (
            <g transform={`translate(40 250) rotate(${-state.angle})`}>
              <rect
                x="-12"
                y="-10"
                width="38"
                height="20"
                rx="4"
                fill="#ffd84d"
                stroke="#806500"
                strokeWidth="2"
              />
            </g>
          )}
          {launched && (
            <path
              className="projectile-trajectory"
              d={trajectory}
              fill="none"
              stroke="#806500"
              strokeWidth="4"
              strokeDasharray="8 6"
            />
          )}
          {has("ball") && (
            <circle
              key={`${state.speed}:${state.angle}:${animate}`}
              className="projectile-ball"
              cx={animate ? 0 : launched ? 40 + range * scale : 40}
              cy={animate ? 0 : 250}
              r="8"
              fill="#d45689"
              stroke="#806500"
              strokeWidth="2"
            >
              {animate && (
                <animateMotion
                  path={trajectory}
                  dur={`${duration}s`}
                  calcMode="linear"
                  keyPoints={distances
                    .map((distance) => distance / distances[40])
                    .join(";")}
                  keyTimes={points.map((_, i) => i / 40).join(";")}
                  fill="freeze"
                />
              )}
            </circle>
          )}
        </svg>
        <div className="science-readout">
          <strong>
            {state.launched || preview ? range.toFixed(1) : "Belum diluncurkan"}
            {state.launched || preview ? " m" : ""}
          </strong>
          <span>
            {launched
              ? `Waktu terbang ${duration.toFixed(2)} s · Tanpa hambatan udara`
              : has("launcher")
                ? has("ball")
                  ? "Bola siap · luncurkan pelontar"
                  : "Pelontar siap · masukkan bola"
                : "Letakkan pelontar untuk mulai"}
          </span>
        </div>
      </div>
    );
  }
  if (exp.visual === "pendulum")
    return (
      <div className="visual pendulum-visual">
        <div className="pendulum-frame">
          <div
            className={
              exp.steps
                .slice(0, state.step)
                .some((step) => step.action === "activate") && !preview
                ? "pendulum-swing"
                : ""
            }
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
      <svg
        className="transpiration-diagram"
        viewBox="0 0 320 230"
        role="img"
        aria-label={
          has("bag")
            ? "Daun dibungkus kantong bening; uap air mengembun di dalam kantong"
            : has("plant")
              ? "Tumbuhan dalam pot, belum dibungkus kantong"
              : "Tempat tumbuhan, belum ada alat dipasang"
        }
      >
        {has("plant") ? (
          <>
            <path
              d="M138 176 Q145 114 162 47"
              fill="none"
              stroke="#427a29"
              strokeWidth="6"
            />
            <path
              d="M150 112 Q104 110 100 75 Q144 76 150 112 M157 81 Q200 81 212 44 Q172 43 157 81 M142 145 Q101 142 92 110 Q132 110 142 145"
              fill="#98cf78"
              stroke="#427a29"
              strokeWidth="2"
            />
            <path
              d="M120 173 H169 L162 214 H128 Z"
              fill="#dfb181"
              stroke="#855c36"
              strokeWidth="2"
            />
            <path d="M124 179 H165" stroke="#855c36" strokeWidth="4" />
          </>
        ) : (
          <text x="160" y="115" textAnchor="middle" fill="#365f27">
            Letakkan tumbuhan
          </text>
        )}
        {has("water") && (
          <path
            d="M130 185 Q145 178 160 185"
            fill="none"
            stroke="#155c7b"
            strokeWidth="3"
          />
        )}
        {has("bag") && (
          <g>
            <path
              d="M87 35 Q151 20 226 31 L235 139 Q193 163 142 151 L87 35 Z"
              fill="#eaf9ff"
              fillOpacity=".5"
              stroke="#155c7b"
              strokeWidth="2"
            />
            <path d="M139 147 L156 155" stroke="#855c36" strokeWidth="4" />
            {[
              [107, 53],
              [200, 47],
              [219, 97],
              [176, 130],
              [119, 85],
            ].map(([x, y], i) => (
              <path
                key={i}
                d={`M${x} ${y} q-7 10 0 10 q7 0 0-10`}
                fill="#3987ad"
              />
            ))}
            <path
              d="M164 68 q10-9 18-3 m-15 36 q10-9 18-3"
              fill="none"
              stroke="#155c7b"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          </g>
        )}
      </svg>
      <div className="science-readout">
        <strong>
          {has("bag")
            ? "Tetes air di dalam kantong"
            : has("plant")
              ? has("water")
                ? "Tumbuhan disiram"
                : "Tumbuhan siap"
              : "Siapkan tumbuhan"}
        </strong>
        <span>
          {has("bag")
            ? "Uap air dari daun mengembun · Waktu dipercepat dalam skema ini"
            : has("water")
              ? "Bungkus daun untuk mengamati transpirasi"
              : "Siram tumbuhan, lalu bungkus daunnya"}
        </span>
      </div>
    </div>
  );
}
