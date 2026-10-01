"use client";
import { Entity, LabState } from "@/lib/sandbox/types";
import { materials } from "@/lib/sandbox/catalog";
import { Shape } from "./Workbench";
import { instrumentReadings } from "@/lib/sandbox/feedback";
import { isLitmus, litmusExplanation } from "@/lib/sandbox/litmus";
import { illustrativeTools } from "@/features/chemistry/equipmentGuides";
import MeasurementGraph from "@/features/chemistry/MeasurementGraph";
import { electrolysisIndicator } from "@/features/chemistry/ElectrolysisShape";
export default function Observations({
  entity,
  state,
  compact = false,
}: {
  entity?: Entity;
  state: LabState;
  compact?: boolean;
}) {
  const paper = entity && isLitmus(entity.material);
  const paperResult = entity && paper ? litmusExplanation(entity) : undefined;
  const container = entity && materials[entity.material]?.kind === "container";
  const meters = entity
    ? state.entities.filter(
        (x) =>
          entity.connections.includes(x.id) &&
          materials[x.material]?.kind === "instrument",
      )
    : [];
  const illustrative = state.discipline === "chemistry" && entity && illustrativeTools.includes(entity.material);
  const heating = state.discipline === "chemistry" && entity && state.entities.some(e => entity.connections.includes(e.id) && ["burner", "heater"].includes(e.material));
  const cell = state.discipline === "chemistry" && entity?.material === "electrolysis" ? electrolysisIndicator(entity, state) : undefined;
  const observed = cell?.vessel || entity;
  const readings = Object.entries((cell ? cell.vessel?.measurements : entity?.measurements) || {}).filter(([key]) => !paper && !illustrative && (
    cell ? cell.copper ? key.startsWith("Cu ") : key.startsWith("H₂") || key.startsWith("O₂") : instrumentReadings[entity?.material || ""]
      ? instrumentReadings[entity!.material].includes(key)
      : !container ||
        key === "Volume (mL)" ||
          key === "Gas terbentuk (mL)" ||
          (state.discipline === "chemistry" && (key === "Pelarut menguap (mL)" || key === "Massa menguap (g)")) ||
         (heating && key === "Suhu (°C)") ||
        meters.some(
          (m) =>
            (m.material === "ph-meter" && key === "pH") ||
            (m.material === "thermometer" && key === "Suhu (°C)") ||
            (m.material === "balance" && key === "Massa isi (g)"),
        ) ||
        key.includes("katoda") ||
         key.includes("anoda")),
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
    <section id="sandbox-observations" className={`sandbox-observations${compact ? " sandbox-observations-compact" : ""}`} aria-label="Pengamatan benda">
      {!compact && <h2>Pengamatan</h2>}
      {entity ? <div className="sandbox-observation-result">
        {paper && <div className="sandbox-observation-paper" aria-hidden="true"><Shape entity={entity} state={state} /></div>}
        <div className="sandbox-observation-copy">
          {compact ? <h3>{entity.label}</h3> : <p>{entity.label}</p>}
          {paper && <>
            <strong className="sandbox-observation-conclusion">{paperResult?.summary || "Kertas belum diuji."}</strong>
            <p>{paperResult?.reason || "Warna strip masih warna awal. Seret kertas ke wadah terbuka berisi cairan untuk menguji sifat larutan."}</p>
            {paperResult && <p className="sandbox-observation-hint">{paperResult.hint}</p>}
          </>}
          {!paper && entity.status && <strong className="sandbox-status">{entity.status}</strong>}
        </div>
      </div> : <p>Pilih alat atau wadah di meja untuk melihat hasilnya.</p>}
      {cell && <p className="sandbox-small">{cell.vessel ? `Hasil elektrolisis pada ${cell.vessel.label}.` : "Sambungkan sel ke wadah, nyalakan sel, lalu jalankan waktu untuk melihat hasil elektrolisis."}</p>}
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
      {readings.length > 0 && <dl>
        {readings.slice(0, 3).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {Math.abs(value) >= 1e5 || (state.discipline === "chemistry" && value !== 0 && Math.abs(value) < .001)
                ? value.toExponential(2)
                : value.toLocaleString("id-ID", { maximumFractionDigits: 3 })}
            </dd>
          </div>
        ))}
      </dl>}
      {readings.length > 3 && (
        <details>
          <summary>Semua hasil pengukuran</summary>
          <dl>
            {readings.slice(3).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {state.discipline === "chemistry" && value !== 0 && Math.abs(value) < .001 ? value.toExponential(2) : value.toLocaleString("id-ID", { maximumFractionDigits: 3 })}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {state.discipline === "chemistry" && observed && readings.length > 0 && <MeasurementGraph key={`${entity!.id}-${observed.id}`} state={state} entity={observed} readings={readings} />}
      {state.discipline !== "chemistry" && samples.length > 1 && (
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
      <details className="sandbox-observation-history">
        <summary>Riwayat meja ({state.events.length})</summary>
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
