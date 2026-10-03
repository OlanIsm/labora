"use client";
import type {
  Action,
  Entity,
  LabState,
} from "@/features/laboratory/domain/types";
import { download } from "@/features/laboratory/infrastructure/labRepository";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/shared/infrastructure/api";
import type { Database } from "@contracts/database";
export default function Notebook({
  state,
  entity,
  dispatch,
  onNote,
  onFeedback,
  account = false,
  sessionId,
}: {
  state: LabState;
  entity?: Entity;
  dispatch: (a: Action) => void;
  onNote: () => void;
  onFeedback?: (message: string) => void;
  account?: boolean;
  sessionId?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef<{ id: string; payload: string } | null>(null);
  const [savedNotes, setSavedNotes] = useState<
    Database["public"]["Tables"]["lab_notes"]["Row"][]
  >([]);
  useEffect(() => {
    if (!account || !sessionId) return;
    let active = true;
    apiFetch<typeof savedNotes>(`/sessions/${sessionId}/notes`)
      .then((notes) => {
        if (active) setSavedNotes(notes);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [account, sessionId]);
  const [hypothesis, setHypothesis] = useState(""),
    [observation, setObservation] = useState(""),
    [conclusion, setConclusion] = useState("");
  const displayNotes =
    account && savedNotes.length
      ? savedNotes.map((note, index) => ({
          id: index,
          hypothesis: note.hypothesis,
          observation: note.observation,
          conclusion: note.conclusion,
          snapshot: note.measurement_snapshot,
          time: Number(
            (note.measurement_snapshot as Record<string, number>).labTime || 0,
          ),
        }))
      : state.notes;
  const text = displayNotes
    .map(
      (n) =>
        `Waktu: ${n.time.toFixed(1)} s\nHipotesis: ${n.hypothesis}\nPengamatan: ${n.observation}\nKesimpulan: ${n.conclusion}\nAlat ukur: ${JSON.stringify(n.snapshot)}`,
    )
    .join("\n\n");
  return (
    <section id="sandbox-notebook" className="sandbox-notebook">
      <details>
        <summary>Buku Catatan Lab · opsional ({displayNotes.length})</summary>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (account) {
              if (!sessionId) {
                setError("Muat simpanan akun sebelum menyimpan catatan.");
                return;
              }
              setBusy(true);
              setError("");
              const payload = JSON.stringify({
                hypothesis,
                observation,
                conclusion,
                measurements: { ...entity?.measurements, labTime: state.time },
              });
              const event =
                pending.current?.payload === payload
                  ? pending.current
                  : { id: crypto.randomUUID(), payload };
              pending.current = event;
              try {
                const note = await apiFetch<
                  Database["public"]["Tables"]["lab_notes"]["Row"]
                >(`/sessions/${sessionId}/notes`, {
                  method: "POST",
                  body: JSON.stringify({
                    ...JSON.parse(payload),
                    id: event.id,
                  }),
                });
                setSavedNotes((previous) => [
                  note,
                  ...previous.filter((existing) => existing.id !== note.id),
                ]);
                pending.current = null;
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Catatan belum tersimpan.",
                );
                return;
              } finally {
                setBusy(false);
              }
            }
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
              maxLength={4000}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="Apa yang ingin kamu uji?"
            />
          </label>
          <label>
            Pengamatan
            <textarea
              rows={2}
              maxLength={4000}
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
              maxLength={4000}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Apa yang kamu simpulkan?"
            />
          </label>
          <button className="button primary" type="submit" disabled={busy}>
            Simpan catatan + snapshot alat ukur
          </button>
        </form>
        <div className="sandbox-action-row">
          <button
            disabled={!displayNotes.length}
            onClick={() => {
              download("catatan-labora.txt", text);
              onFeedback?.("Ekspor catatan dimulai. Periksa unduhan browser.");
            }}
          >
            Ekspor teks
          </button>
          <button
            disabled={!displayNotes.length}
            onClick={() => {
              onFeedback?.(
                "Dialog cetak dibuka. Pilih printer atau Simpan PDF; catatan tetap tersimpan di meja.",
              );
              window.print();
            }}
          >
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
