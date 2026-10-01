"use client";
import { Action, Entity, LabState } from "@/lib/sandbox/types";
import { materials } from "@/lib/sandbox/catalog";
import { totalMass, totalVolume } from "@/lib/sandbox/measurements";
type Field = [string, string, number, number, number];
const mass: Field = ["mass", "Massa (kg)", 0.01, 10, 0.01],
  light: Field = ["light", "Cahaya relatif", 0, 1000, 10],
  temp: Field = ["temperature", "Suhu (°C)", -10, 120, 1];
const fields: Record<string, Field[]> = {
  chromatography: [
    ["paperLength", "Panjang kertas (mm)", 20, 150, 5],
    ["rf1", "Rf pigmen 1 (model ilustratif)", 0, 1, 0.05],
    ["rf2", "Rf pigmen 2 (model ilustratif)", 0, 1, 0.05],
    ["rf3", "Rf pigmen 3 (model ilustratif)", 0, 1, 0.05],
  ],
  incline: [
    mass,
    ["angle", "Sudut (°)", 0, 80, 1],
    ["friction", "Koefisien gesek", 0, 1, 0.01],
  ],
  friction: [
    mass,
    ["angle", "Sudut (°)", 0, 80, 1],
    ["friction", "Koefisien gesek", 0, 1, 0.01],
  ],
  fall: [mass],
  projectile: [
    ["speed", "Kecepatan awal (m/s)", 0, 40, 1],
    ["angle", "Sudut (°)", 0, 90, 1],
    ["topology", "Hambatan udara: 0 tanpa, 1 dengan", 0, 1, 1],
    ["friction", "Hambatan relatif", 0, 1, 0.01],
  ],
  newton: [mass, ["force", "Gaya (N)", 0, 50, 0.5]],
  spring: [
    mass,
    ["spring", "k pegas (N/m)", 1, 500, 1],
    ["force", "Gaya (N)", 0, 50, 0.5],
    ["topology", "Pegas: 0 tunggal, 1 seri, 2 paralel", 0, 2, 1],
  ],
  pendulum: [
    mass,
    ["length", "Panjang tali (m)", 0.1, 3, 0.1],
    ["amplitude", "Amplitudo (°)", 1, 60, 1],
  ],
  collision: [
    mass,
    ["mass2", "Massa troli kedua (kg)", 0.01, 10, 0.01],
    ["speed", "v₁ (m/s)", -10, 10, 0.1],
    ["speed2", "v₂ (m/s)", -10, 10, 0.1],
    ["restitution", "Koefisien restitusi", 0, 1, 0.05],
  ],
  buoyancy: [
    mass,
    ["density", "Massa jenis benda (kg/m³)", 100, 9000, 100],
    ["fluidDensity", "Massa jenis cairan (kg/m³)", 789, 1300, 1],
  ],
  hydrostatic: [
    ["depth", "Kedalaman (m)", 0, 5, 0.1],
    ["fluidDensity", "Massa jenis cairan (kg/m³)", 789, 1300, 1],
    ["force", "Gaya masuk (N)", 0, 100, 1],
    mass,
    ["mass2", "Rasio luas keluaran", 0.1, 10, 0.1],
  ],
  heat: [
    mass,
    ["mass2", "Massa logam Al (kg)", 0.01, 5, 0.01],
    ["amplitude", "Suhu logam (°C)", 0, 150, 1],
    ["power", "Daya (W)", 0, 2000, 10],
    temp,
  ],
  phase: [mass, ["power", "Daya (W)", 0, 2000, 10]],
  expansion: [["length", "Panjang awal (m)", 0.1, 3, 0.1], temp],
  radiation: [temp, ["polarity", "Permukaan: 1 hitam, -1 putih", -1, 1, 2]],
  circuit: [
    ["voltage", "Tegangan (V)", 0, 24, 0.5],
    ["resistance", "Hambatan (Ω)", 0.01, 1000, 1],
    ["topology", "Susunan: 0 seri, 2 paralel", 0, 2, 2],
  ],
  rc: [
    ["voltage", "Tegangan (V)", 0, 24, 0.5],
    ["resistance", "Hambatan (Ω)", 1, 10000, 10],
    ["capacitance", "Kapasitansi (F)", 0.0001, 0.01, 0.0001],
    ["polarity", "1 isi, -1 kosongkan", -1, 1, 2],
  ],
  led: [
    ["voltage", "Tegangan (V)", 0, 24, 0.5],
    ["resistance", "Hambatan (Ω)", 1, 1000, 1],
    ["polarity", "Polaritas", -1, 1, 2],
  ],
  magnet: [["polarity", "Kutub", -1, 1, 2]],
  induction: [
    ["turns", "Jumlah lilitan", 10, 1000, 10],
    ["motion", "Kecepatan magnet relatif", -10, 10, 0.5],
    ["voltage", "Tegangan (V)", 0, 24, 0.5],
    ["resistance", "Hambatan (Ω)", 1, 1000, 1],
  ],
  reflection: [["angle", "Sudut datang (°)", 0, 89, 1]],
  snell: [
    ["angle", "Sudut datang (°)", 0, 89, 1],
    ["n1", "Indeks bias awal", 1, 1.5, 0.01],
    ["n2", "Indeks bias kedua", 1, 1.5, 0.01],
  ],
  dispersion: [["angle", "Sudut (°)", 0, 89, 1]],
  lens: [
    ["focal", "Fokus (m)", -0.5, 0.5, 0.01],
    ["distance", "Jarak benda (m)", 0.01, 2, 0.01],
    ["length", "Fokus lensa kedua (m)", 0.01, 1, 0.01],
  ],
  wave: [
    ["frequency", "Frekuensi (Hz)", 1, 50, 1],
    ["wavelength", "Panjang gelombang (m)", 0.1, 5, 0.1],
    ["length", "Panjang tali (m)", 0.1, 10, 0.1],
  ],
  sound: [
    ["frequency", "Frekuensi (Hz)", 100, 2000, 10],
    ["motion", "Kecepatan sumber (m/s)", -100, 100, 1],
    ["fluidDensity", "Medium: 0 vakum, 1 udara", 0, 1, 1],
  ],
  microscope: [
    ["magnification", "Perbesaran (×)", 40, 400, 20],
    ["focus", "Fokus kasar / halus", -10, 10, 0.2],
    light,
  ],
  osmosis: [
    ["mass", "Massa awal sampel (kg)", 0.01, 1, 0.01],
    ["concentration", "Konsentrasi larutan (M)", 0, 1, 0.01],
    temp,
  ],
  photosynthesis: [
    light,
    ["distance", "Jarak lampu (m)", 0.1, 3, 0.1],
    ["polarity", "Warna: 1 putih/merah, -1 hijau", -1, 1, 2],
    temp,
  ],
  growth: [
    light,
    ["water", "Air: 0 tanpa, 1 tersedia", 0, 1, 1],
    ["angle", "Arah sumber cahaya (°)", -90, 90, 5],
    temp,
  ],
  transpiration: [
    light,
    ["wind", "Angin relatif", 0, 3, 0.1],
    ["humidity", "Kelembapan (%)", 0, 100, 5],
    temp,
  ],
  catalase: [temp, ["ph", "pH lingkungan", 0, 14, 0.1]],
  genetics: [
    ["genotype", "0 monohibrid, 1 dihibrid", 0, 1, 1],
    ["topology", "0 F₂, 1 uji silang", 0, 1, 1],
    ["seed", "Seed pengamatan", 1, 1000, 1],
  ],
  ecosystem: [
    light,
    ["fish", "Jumlah ikan", 0, 20, 1],
    ["plants", "Jumlah tanaman", 0, 20, 1],
    ["feed", "Pakan relatif", 0, 10, 1],
  ],
  soil: [["ph", "pH tanah", 0, 14, 0.1]],
};
export default function ApparatusControls({
  entity: e,
  state,
  dispatch,
  target,
  setTarget,
  onAction,
}: {
  entity?: Entity;
  state: LabState;
  dispatch: (a: Action) => void;
  target: string;
  setTarget: (id: string) => void;
  onAction: (type: string) => void;
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
            Pemisahan memindahkan fraksi ke wadah penerima yang tersambung.
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
