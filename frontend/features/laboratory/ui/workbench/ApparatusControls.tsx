"use client";
import { materials } from "@/features/laboratory/domain/catalog";
import { isLitmus } from "@/features/laboratory/domain/litmus";
import {
  totalMass,
  totalVolume,
} from "@/features/laboratory/domain/measurements";
import type {
  Action,
  Entity,
  LabState,
} from "@/features/laboratory/domain/types";
import { biologyFields } from "@/features/laboratory/subjects/biology/controlFields";
import LitmusControls from "@/features/laboratory/subjects/chemistry/LitmusControls";
import StopwatchControls from "@/features/laboratory/subjects/chemistry/StopwatchControls";
import { chemistryFields } from "@/features/laboratory/subjects/chemistry/controlFields";
import { illustrativeTools } from "@/features/laboratory/subjects/chemistry/equipmentGuides";
import { physicsFields } from "@/features/laboratory/subjects/physics/controlFields";
const fields = { ...chemistryFields, ...physicsFields, ...biologyFields };
export default function ApparatusControls({
  entity: e,
  state,
  dispatch,
  target,
  setTarget,
  onAction,
  playing = false,
  onRun,
}: {
  entity?: Entity;
  state: LabState;
  dispatch: (a: Action) => void;
  target: string;
  setTarget: (id: string) => void;
  onAction: (type: string) => void;
  playing?: boolean;
  onRun?: () => void;
}) {
  if (!e)
    return (
      <section id="sandbox-controls" className="sandbox-controls">
        <h2>Pilih benda di meja</h2>
        <p>Pengaturan dan tindakan untuk benda itu akan muncul di sini.</p>
      </section>
    );
  const m = materials[e.material];
  const options = state.entities.filter((x) => x.id !== e.id);
  const unit = m.phase === "solid" ? "g" : "mL";
  const canTransfer = e.contents.some((portion) => portion.mass > 1e-8);
  const targetLabel =
    m.kind === "material"
      ? "Tuang ke"
      : m.kind === "instrument"
        ? "Benda yang diukur"
        : "Hubungkan dengan";
  function send(action: Action) {
    dispatch(action);
    onAction(action.type);
  }
  if (isLitmus(e.material)) {
    return (
      <LitmusControls
        entity={e}
        state={state}
        target={target}
        setTarget={setTarget}
        send={send}
      />
    );
  }
  if (state.discipline === "chemistry" && e.material === "stopwatch")
    return (
      <StopwatchControls
        entity={e}
        send={send}
        playing={playing}
        onRun={onRun}
      />
    );
  if (
    state.discipline === "chemistry" &&
    illustrativeTools.includes(e.material)
  ) {
    return (
      <section id="sandbox-controls" className="sandbox-controls">
        <h2>{e.label}</h2>
        <p className="sandbox-small">
          Alat ilustratif. Bisa dipindahkan, tetapi belum menjalankan proses
          atau menopang wadah di simulasi ini.
        </p>
        <button onClick={() => send({ type: "remove", id: e.id })}>
          Kembalikan ke rak
        </button>
      </section>
    );
  }
  return (
    <section id="sandbox-controls" className="sandbox-controls">
      <h2>{e.label}</h2>
      <p className="sandbox-small">
        {m.kind === "material"
          ? "Pilih wadah tujuan, lalu tuangkan bahannya."
          : m.kind === "instrument"
            ? "Sambungkan ke benda yang ingin kamu ukur."
            : m.kind === "container"
              ? "Tambahkan bahan, atau sambungkan alat ukur."
              : m.id === "microscope"
                ? "Sambungkan preparat untuk melihat sel."
                : "Ubah pengaturannya dan amati perubahannya."}
      </p>
      <div className="sandbox-action-row">
        {m.kind === "apparatus" &&
          !["microscope", "support", "filter", "transfer"].includes(
            m.model || "",
          ) && (
            <button
              onClick={() => send({ type: "toggle", id: e.id, key: "active" })}
            >
              {e.active ? "Matikan / hentikan" : "Nyalakan / jalankan"}
            </button>
          )}
        {m.kind === "container" && (
          <button
            onClick={() => send({ type: "toggle", id: e.id, key: "sealed" })}
          >
            {e.sealed ? "Buka wadah" : "Tutup wadah"}
          </button>
        )}
      </div>
      {state.discipline === "chemistry" && e.material === "burner" && (
        <label className="sandbox-field">
          Suhu target (°C)
          <input
            type="number"
            min="25"
            max="200"
            step="1"
            value={e.params.targetTemperature ?? 120}
            onChange={(event) =>
              send({
                type: "set",
                id: e.id,
                key: "targetTemperature",
                value: +event.target.value,
              })
            }
          />
          <small>
            Batas suhu wadah pada model, bukan suhu nyala api. Cairan mendidih
            memakai kalor untuk menguap.
          </small>
        </label>
      )}
      {canTransfer && (
        <label className="sandbox-field">
          Jumlah bahan ({unit})
          <input
            type="number"
            min="0"
            max={
              m.phase === "solid"
                ? Math.max(1, totalMass(e))
                : Math.max(1, totalVolume(e))
            }
            step=".1"
            value={e.params.amount}
            onChange={(event) =>
              send({
                type: "set",
                id: e.id,
                key: "amount",
                value: +event.target.value,
              })
            }
          />
        </label>
      )}
      <label className="sandbox-field">
        {targetLabel}
        <select
          aria-label={targetLabel}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        >
          <option value="">Pilih benda lain</option>
          {options.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
              {options.filter((other) => other.label === x.label).length > 1
                ? ` · ${options.filter((other) => other.label === x.label).findIndex((other) => other.id === x.id) + 1}`
                : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="sandbox-action-row">
        {canTransfer && (
          <button
            disabled={!target}
            onClick={() =>
              send({
                type: "pour",
                source: e.id,
                target,
                amount: e.params.amount,
              })
            }
          >
            Tuang / campur
          </button>
        )}
        <button
          disabled={!target}
          onClick={() => send({ type: "connect", source: e.id, target })}
        >
          {e.connections.includes(target) ? "Lepas sambungan" : "Sambungkan"}
        </button>
      </div>
      {m.kind === "container" && (
        <details>
          <summary>Perlakukan campuran</summary>
          <div className="sandbox-action-row">
            {(
              [
                "stir",
                "filter",
                "decant",
                "evaporate",
                "distill",
                "magnet",
              ] as const
            ).map((operation, i) => (
              <button
                key={operation}
                onClick={() => send({ type: "operate", id: e.id, operation })}
              >
                {
                  [
                    "Aduk",
                    "Saring",
                    "Dekantasi",
                    "Uapkan",
                    "Distilasi",
                    "Pisahkan magnet",
                  ][i]
                }
              </button>
            ))}
          </div>
          <p className="sandbox-small">
            {state.discipline === "chemistry"
              ? "Saring, Dekantasi, Distilasi, dan Pisahkan magnet membutuhkan wadah penerima tersambung. Uapkan memproses satu fraksi pelarut saat mencapai titik didih; pemanasan sambil waktu berjalan menguapkan pelarut bertahap secara otomatis."
              : "Pemisahan memindahkan fraksi ke wadah penerima yang tersambung."}
          </p>
        </details>
      )}
      <details open={m.id === "microscope" ? true : undefined}>
        <summary>
          {m.id === "microscope"
            ? "Fokus & perbesaran"
            : "Pengaturan lebih lanjut"}
        </summary>
        <label className="sandbox-field">
          Label benda
          <input
            value={e.label}
            onChange={(event) =>
              send({ type: "label", id: e.id, label: event.target.value })
            }
          />
        </label>
        {m.kind === "container" && (
          <label className="sandbox-field">
            Suhu virtual (°C)
            <input
              type="number"
              min="-10"
              max="120"
              value={+e.temperature.toFixed(1)}
              onChange={(event) =>
                send({
                  type: "set",
                  id: e.id,
                  key: "temperature",
                  value: +event.target.value,
                })
              }
            />
          </label>
        )}
        {(fields[m.model || ""] || []).map(([key, label, min, max, step]) => (
          <label className="sandbox-field" key={key}>
            {label}
            <span className="sandbox-reading" aria-hidden="true">
              {key === "temperature"
                ? e.temperature.toFixed(1)
                : Number(e.params[key] || 0).toFixed(step < 1 ? 2 : 0)}
            </span>
            <input
              type="range"
              aria-label={label}
              min={min}
              max={max}
              step={step}
              value={
                key === "temperature" ? e.temperature : (e.params[key] ?? min)
              }
              onChange={(event) =>
                send({ type: "set", id: e.id, key, value: +event.target.value })
              }
            />
          </label>
        ))}
      </details>
      <div className="sandbox-action-row">
        {m.kind === "instrument" && (
          <button
            onClick={() => {
              send({ type: "operate", id: e.id, operation: "measure" });
              onAction("measure");
            }}
          >
            Baca alat ukur
          </button>
        )}
        {m.discipline === "physics" && m.kind !== "instrument" && (
          <button
            onClick={() =>
              send({ type: "operate", id: e.id, operation: "launch" })
            }
          >
            Mulai gerakan / ulangi
          </button>
        )}
        <button
          className="sandbox-remove"
          onClick={() => send({ type: "remove", id: e.id })}
        >
          Kembalikan ke rak
        </button>
      </div>
      {!!e.contents.length && (
        <details>
          <summary>Isi benda ini</summary>
          <ul>
            {e.contents
              .filter((p) => p.mass > 0.00001)
              .map((p) => (
                <li key={p.material}>
                  {materials[p.material]?.name} · {p.mass.toFixed(2)} g ·{" "}
                  {p.volume.toFixed(1)} mL
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}
