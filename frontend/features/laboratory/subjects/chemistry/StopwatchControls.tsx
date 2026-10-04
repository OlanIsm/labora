import type { Action, Entity } from "@/features/laboratory/domain/types";
export default function StopwatchControls({
  entity,
  send,
  playing,
  onRun,
}: {
  entity: Entity;
  send: (action: Action) => void;
  playing: boolean;
  onRun?: () => void;
}) {
  return (
    <section id="sandbox-controls" className="sandbox-controls">
      <h2>{entity.label}</h2>
      <output className="chemistry-stopwatch-time" aria-label="Waktu stopwatch">
        {(entity.params.time || 0).toFixed(1)} s
      </output>
      <p className="sandbox-small">
        Menghitung waktu simulasi sejak Mulai ditekan, bukan total umur meja.
        Kecepatan mengikuti 1×, 2×, atau 5×.
      </p>
      <div className="sandbox-action-row">
        <button
          onClick={() => {
            send({ type: "toggle", id: entity.id, key: "active" });
            if (!entity.active && !playing) onRun?.();
          }}
        >
          {entity.active ? "Hentikan stopwatch" : "Mulai stopwatch"}
        </button>
        <button
          onClick={() =>
            send({ type: "set", id: entity.id, key: "time", value: 0 })
          }
        >
          Nolkan stopwatch
        </button>
      </div>
      {!playing && entity.active && (
        <>
          <p>Waktu simulasi sedang dijeda. Stopwatch ikut dijeda.</p>
          {onRun && <button onClick={onRun}>Lanjutkan waktu</button>}
        </>
      )}
      <button onClick={() => send({ type: "remove", id: entity.id })}>
        Kembalikan ke rak
      </button>
    </section>
  );
}
