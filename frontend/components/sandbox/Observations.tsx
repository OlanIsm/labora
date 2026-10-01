"use client";
import { Entity, LabState } from "@/lib/sandbox/types";
import { materials } from "@/lib/sandbox/catalog";
import { Shape } from "./Workbench";
import { instrumentReadings } from "@/lib/sandbox/feedback";
export default function Observations({
  entity,
  state,
}: {
  entity?: Entity;
  state: LabState;
}) {
  const container = entity && materials[entity.material]?.kind === "container";
  const meters = entity
    ? state.entities.filter(
        (x) =>
          entity.connections.includes(x.id) &&
          materials[x.material]?.kind === "instrument",
      )
    : [];
  const readings = Object.entries(entity?.measurements || {}).filter(([key]) =>
    instrumentReadings[entity?.material || ""]
      ? instrumentReadings[entity!.material].includes(key)
      : !container ||
        key === "Volume (mL)" ||
        key === "Gas terbentuk (mL)" ||
        meters.some(
          (m) =>
            (m.material === "ph-meter" && key === "pH") ||
            (m.material === "thermometer" && key === "Suhu (°C)") ||
            (m.material === "balance" && key === "Massa isi (g)"),
        ) ||
        key.includes("katoda") ||
        key.includes("anoda"),
  );
  const key = readings[0]?.[0];
  const samples = state.samples
    .filter(
      (x) => x.entity === entity?.id && key && Number.isFinite(x.values[key]),
    )
    .slice(-50);
  const values = samples.map((x) => x.values[key!]);
  const low = Math.min(...values),
    high = Math.max(...values);
  const path = samples
    .map(
      (x, i) =>
        `${i ? "L" : "M"}${10 + (i / Math.max(1, samples.length - 1)) * 280},${85 - ((x.values[key!] - low) / Math.max(0.001, high - low)) * 65}`,
    )
    .join(" ");
  return (
    <section id="sandbox-observations" className="sandbox-observations">
      <h2>Pengamatan</h2>
      <p>
        {entity
          ? entity.label
          : "Pilih alat atau wadah untuk melihat pengukuran."}
      </p>
      {entity?.status && (
        <strong className="sandbox-status">{entity.status}</strong>
      )}
      {entity?.material === "microscope" && (
        <div className="sandbox-specimen-preview">
          <Shape entity={entity} state={state} magnified />
          <small>
            Bidang pandang mikroskop · atur fokus dan perbesaran dari pengaturan
            benda.
          </small>
        </div>
      )}
      {container && !meters.length && (
        <p className="sandbox-small">
          Sambungkan pH meter, termometer, atau timbangan untuk membaca
          nilainya.
        </p>
      )}
      <dl>
        {readings.slice(0, 3).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {Math.abs(value) >= 1e5
                ? value.toExponential(2)
                : value.toLocaleString("id-ID", { maximumFractionDigits: 3 })}
            </dd>
          </div>
        ))}
      </dl>
      {readings.length > 3 && (
        <details>
          <summary>Semua hasil pengukuran</summary>
          <dl>
            {readings.slice(3).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {value.toLocaleString("id-ID", { maximumFractionDigits: 3 })}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {samples.length > 1 && (
        <details>
          <summary>Lihat grafik perubahan</summary>
          <figure>
            <svg
              viewBox="0 0 300 100"
              role="img"
              aria-label={`Grafik ${key} terhadap waktu`}
            >
              <path d="M10 10V85H290" stroke="#8091a5" fill="none" />
              <path d={path} stroke="#155c7b" strokeWidth="2" fill="none" />
            </svg>
            <figcaption>
              {key} terhadap waktu · {samples[0].time.toFixed(1)}–
              {samples[samples.length - 1].time.toFixed(1)} s
            </figcaption>
          </figure>
        </details>
      )}
      <details>
        <summary>Log kejadian ({state.events.length})</summary>
        <ol className="sandbox-event-log">
          {[...state.events]
            .reverse()
            .slice(0, 20)
            .map((e) => (
              <li key={e.id}>
                <time>{e.time.toFixed(1)} s</time> {e.message}
              </li>
            ))}
          {!state.events.length && <li>Belum ada kejadian.</li>}
        </ol>
      </details>
    </section>
  );
}
