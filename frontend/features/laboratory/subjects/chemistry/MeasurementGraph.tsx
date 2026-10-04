"use client";
import type { Entity, LabState } from "@/features/laboratory/domain/types";
import { useState } from "react";

export function graphSamples(state: LabState, entity: Entity, key: string) {
  const samples = state.samples
    .filter((s) => s.entity === entity.id && Number.isFinite(s.values[key]))
    .slice(-49)
    .map((s) => ({ time: s.time, value: s.values[key] }));
  const value = entity.measurements[key];
  if (Number.isFinite(value)) {
    if (samples.at(-1)?.time === state.time)
      samples[samples.length - 1] = { time: state.time, value };
    else samples.push({ time: state.time, value });
  }
  return samples;
}

export default function MeasurementGraph({
  state,
  entity,
  readings,
}: {
  state: LabState;
  entity: Entity;
  readings: [string, number][];
}) {
  const [chosen, setChosen] = useState("");
  const key = readings.some(([key]) => key === chosen)
    ? chosen
    : readings.some(([key]) => key === "Suhu (°C)")
      ? "Suhu (°C)"
      : readings[0]?.[0];
  if (!key) return null;
  const samples = graphSamples(state, entity, key);
  const values = samples.map((s) => s.value);
  const min = Math.min(...values),
    max = Math.max(...values);
  const padding = Math.max(
    Math.abs(max) > 0 && Math.abs(max) < 0.01 ? Math.abs(max) * 0.1 : 0.5,
    (max - min) * 0.1,
  );
  const low =
      min >= 0 && key !== "Suhu (°C)"
        ? Math.max(0, min - padding)
        : min - padding,
    high = max + padding;
  const start = samples[0]?.time || 0,
    end = Math.max(start + 0.001, state.time);
  const x = (time: number) => 52 + ((time - start) / (end - start)) * 328;
  const y = (value: number) => 112 - ((value - low) / (high - low)) * 88;
  const path = samples
    .map((s, index) => `${index ? "L" : "M"}${x(s.time)},${y(s.value)}`)
    .join(" ");
  const number = (value: number) =>
    value !== 0 && Math.abs(value) < 0.001
      ? value.toExponential(2)
      : value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  return (
    <details className="chemistry-measurement-graph" open>
      <summary>Grafik pengukuran langsung</summary>
      <label className="chemistry-graph-field">
        Besaran grafik{" "}
        <select value={key} onChange={(event) => setChosen(event.target.value)}>
          {readings.map(([key]) => (
            <option key={key}>{key}</option>
          ))}
        </select>
      </label>
      {samples.length < 2 ? (
        <p>Jalankan waktu simulasi untuk merekam perubahan.</p>
      ) : (
        <figure>
          <svg
            viewBox="0 0 400 150"
            role="img"
            aria-label={`Grafik ${key} terhadap waktu`}
          >
            <path d="M52 20V112H380" stroke="#76859a" fill="none" />
            <text x="46" y="28" textAnchor="end">
              {number(high)}
            </text>
            <text x="46" y="112" textAnchor="end">
              {number(low)}
            </text>
            <text x="52" y="132">
              {number(start)} s
            </text>
            <text x="380" y="132" textAnchor="end">
              {number(state.time)} s
            </text>
            <path
              className="chemistry-graph-trace"
              d={path}
              stroke="#155c7b"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx={x(samples.at(-1)!.time)}
              cy={y(samples.at(-1)!.value)}
              r="3"
              fill="#155c7b"
            />
          </svg>
          <figcaption>
            {key} · nilai terbaru {number(samples.at(-1)!.value)} · waktu{" "}
            {number(state.time)} s
          </figcaption>
        </figure>
      )}
    </details>
  );
}
