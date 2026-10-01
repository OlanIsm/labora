import { Action, Entity, LabState } from "@/lib/sandbox/types";
import { canDipLitmus } from "./litmus";

export default function LitmusControls({ entity: e, state, target, setTarget, send }: {
  entity: Entity;
  state: LabState;
  target: string;
  setTarget: (id: string) => void;
  send: (action: Action) => void;
}) {
  const vessels = state.entities.filter(canDipLitmus);
  const attached = state.entities.find((v) => e.connections.includes(v.id));
  return (
    <section id="sandbox-controls" className="sandbox-controls">
      <h2>{e.label}</h2>
      <p className="sandbox-small">Seret dan lepaskan kertas di atas cairan untuk mencelupkan. Warna kertas diperbarui otomatis. Pilihan di bawah adalah alternatif tanpa drag.</p>
      {e.status && <p>{e.status}</p>}
      <label className="sandbox-field">Larutan yang diuji
        <select value={target} onChange={(event) => setTarget(event.target.value)}>
          <option value="">Pilih wadah berisi larutan</option>
          {vessels.map((v) => <option key={v.id} value={v.id}>{v.label} · {v.id}</option>)}
        </select>
      </label>
      {!vessels.length && <p className="sandbox-small">Isi wadah dengan larutan dan buka penutupnya terlebih dahulu.</p>}
      <div className="sandbox-action-row">
        <button disabled={!vessels.some((v) => v.id === target) || attached?.id === target} onClick={() => send({ type: "connect", source: e.id, target })}>Celupkan kertas</button>
        {attached && <button onClick={() => send({ type: "connect", source: e.id, target: attached.id })}>Angkat kertas</button>}
        <button className="sandbox-remove" onClick={() => send({ type: "remove", id: e.id })}>Kembalikan ke rak</button>
      </div>
    </section>
  );
}
