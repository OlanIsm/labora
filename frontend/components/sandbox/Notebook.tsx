"use client";
import { useState } from "react";
import { Action, Entity, LabState } from "@/lib/sandbox/types";
import { download } from "@/services/labRepository";
export default function Notebook({
  state,
  entity,
  dispatch,
  onNote,
}: {
  state: LabState;
  entity?: Entity;
  dispatch: (a: Action) => void;
  onNote: () => void;
}) {
  const [hypothesis, setHypothesis] = useState(""),
    [observation, setObservation] = useState(""),
    [conclusion, setConclusion] = useState("");
  const text = state.notes
    .map(
      (n) =>
        `Waktu: ${n.time.toFixed(1)} s\nHipotesis: ${n.hypothesis}\nPengamatan: ${n.observation}\nKesimpulan: ${n.conclusion}\nAlat ukur: ${JSON.stringify(n.snapshot)}`,
    )
    .join("\n\n");
  return (
    <section id="sandbox-notebook" className="sandbox-notebook">
      <details>
        <summary>Buku Catatan Lab · opsional ({state.notes.length})</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({
              type: "note",
              note: {
                hypothesis,
                observation,
                conclusion,
                snapshot: { ...entity?.measurements },
              },
            });
            setObservation("");
            onNote();
          }}
        >
          <label>
            Hipotesis
            <textarea
              rows={2}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="Apa yang ingin kamu uji?"
            />
          </label>
          <label>
            Pengamatan
            <textarea
              rows={2}
              required
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Apa yang terlihat atau terukur?"
            />
          </label>
          <label>
            Kesimpulan
            <textarea
              rows={2}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Apa yang kamu simpulkan?"
            />
          </label>
          <button className="button primary" type="submit">
            Simpan catatan + snapshot alat ukur
          </button>
        </form>
        <div className="sandbox-action-row">
          <button
            disabled={!state.notes.length}
            onClick={() => download("catatan-labora.txt", text)}
          >
            Ekspor teks
          </button>
          <button disabled={!state.notes.length} onClick={() => window.print()}>
            Cetak / simpan PDF
          </button>
        </div>
        <ol>
          {state.notes.map((n) => (
            <li key={n.id}>
              <strong>{n.observation}</strong>
              <p>Hipotesis: {n.hypothesis || "Belum ditulis"}</p>
              <p>Kesimpulan: {n.conclusion || "Belum ditulis"}</p>
              <small>
                {n.time.toFixed(1)} s ·{" "}
                {Object.entries(n.snapshot)
                  .map(([k, v]) => `${k}: ${v.toFixed(3)}`)
                  .join(" · ")}
              </small>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
