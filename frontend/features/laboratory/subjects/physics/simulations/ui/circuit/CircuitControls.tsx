"use client";
import { useDraggable } from "@dnd-kit/core";
import { COMPONENT_NAMES } from "../../domain/circuit/editor";
import type { ComponentKind } from "../../domain/circuit/engine";
import type {
  CircuitPreset,
  PlacedComponent,
} from "../../domain/circuit/presets";
import { CircuitSymbol } from "./CircuitCanvas";

export type CircuitControlsState = { presetId: string; showMeters: boolean };

function RackComponent({
  kind,
  disabled,
  onAdd,
}: {
  kind: ComponentKind;
  disabled: boolean;
  onAdd: (kind: ComponentKind) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `circuit-rack:${kind}`, data: { kind }, disabled });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      disabled={disabled}
      className={`circuit-rack-item ${isDragging ? "dragging" : ""}`}
      onClick={() => onAdd(kind)}
      aria-label={`Tambahkan ${COMPONENT_NAMES[kind]}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      <svg viewBox="-40 -40 80 80" aria-hidden="true">
        <CircuitSymbol kind={kind} />
      </svg>
      <span>{COMPONENT_NAMES[kind]}</span>
    </button>
  );
}

export default function CircuitControls({
  state,
  onChange,
  presets,
  selectedComponent: c,
  onToggleSwitch,
  onReplaceComponent,
  current,
  power,
  voltage,
  onAdd,
  onRemove,
  onRotate,
  onMove,
  onUpdate,
  hasBattery,
}: {
  state: CircuitControlsState;
  onChange: (next: Partial<CircuitControlsState>) => void;
  presets: CircuitPreset[];
  selectedComponent: PlacedComponent | null;
  onToggleSwitch: (id: string) => void;
  onReplaceComponent: (id: string) => void;
  current: number | null;
  power: number | null;
  voltage: number | null;
  onAdd: (kind: ComponentKind) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onMove: (id: string, dc: number, dr: number) => void;
  onUpdate: (id: string, values: Partial<PlacedComponent>) => void;
  hasBattery: boolean;
}) {
  const broken = c && (c.blown || c.burnedOut);
  return (
    <div className="sim-controls-inner">
      <fieldset className="sim-fieldset">
        <legend>Rak komponen</legend>
        <p className="sim-hint">
          Seret ke meja atau klik untuk menambahkan. Gunakan satu baterai
          sebagai sumber tegangan.
        </p>
        <div className="circuit-rack">
          {(Object.keys(COMPONENT_NAMES) as ComponentKind[]).map((kind) => (
            <RackComponent
              key={kind}
              kind={kind}
              disabled={kind === "battery" && hasBattery}
              onAdd={onAdd}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Mulai dari contoh</legend>
        <div className="sim-level-row">
          <button
            type="button"
            className="sim-chip"
            aria-pressed={state.presetId === "empty"}
            onClick={() => onChange({ presetId: "empty" })}
          >
            Meja kosong
          </button>
          {presets
            .filter((p) => p.id !== "shortCircuit")
            .map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="sim-chip"
                aria-pressed={state.presetId === preset.id}
                onClick={() => onChange({ presetId: preset.id })}
              >
                {preset.label}
              </button>
            ))}
        </div>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>
          {c ? `${COMPONENT_NAMES[c.kind]} terpilih` : "Komponen terpilih"}
        </legend>
        {!c && (
          <p className="sim-hint">
            Pilih komponen untuk mengubah nilainya. Seret komponen di meja untuk
            memindahkannya; kabel yang terpasang ikut bergerak.
          </p>
        )}
        {c && (
          <>
            {c.kind === "battery" && (
              <label className="sim-field">
                Tegangan baterai: {c.voltage} V
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={c.voltage}
                  onChange={(e) =>
                    onUpdate(c.id, { voltage: Number(e.target.value) })
                  }
                />
              </label>
            )}
            {(c.kind === "lamp" || c.kind === "resistor") && (
              <label className="sim-field">
                Hambatan: {c.resistance} Ω
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={c.resistance}
                  onChange={(e) =>
                    onUpdate(c.id, { resistance: Number(e.target.value) })
                  }
                />
              </label>
            )}
            {c.kind === "fuse" && (
              <label className="sim-field">
                Batas arus sekring: {c.fuseRatingAmps} A
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={c.fuseRatingAmps}
                  onChange={(e) =>
                    onUpdate(c.id, { fuseRatingAmps: Number(e.target.value) })
                  }
                />
              </label>
            )}
            {c.kind === "lamp" && (
              <p className="sim-hint">
                Batas daya lampu: {c.maxPowerWatts} W.{" "}
                {c.burnedOut
                  ? "Lampu putus karena kelebihan daya."
                  : "Terang lampu mengikuti daya listriknya."}
              </p>
            )}
            {current !== null && (
              <dl className="sim-data-grid">
                <div>
                  <dt>Arus (I)</dt>
                  <dd>{Math.abs(current).toFixed(2)} A</dd>
                </div>
                {voltage !== null && (
                  <div>
                    <dt>Tegangan (V)</dt>
                    <dd>{voltage.toFixed(2)} V</dd>
                  </div>
                )}
                {power !== null && (
                  <div>
                    <dt>Daya (P)</dt>
                    <dd>{power.toFixed(2)} W</dd>
                  </div>
                )}
              </dl>
            )}
            <div className="circuit-edit-actions">
              <button
                className="button ghost small"
                onClick={() => onRotate(c.id)}
              >
                Putar 90°
              </button>
              <button
                className="button ghost small"
                onClick={() => onRemove(c.id)}
              >
                Hapus komponen
              </button>
            </div>
            <div
              className="circuit-move-actions"
              role="group"
              aria-label="Pindahkan komponen satu titik"
            >
              <button className="sim-chip" onClick={() => onMove(c.id, -1, 0)}>
                Kiri
              </button>
              <button className="sim-chip" onClick={() => onMove(c.id, 0, -1)}>
                Atas
              </button>
              <button className="sim-chip" onClick={() => onMove(c.id, 0, 1)}>
                Bawah
              </button>
              <button className="sim-chip" onClick={() => onMove(c.id, 1, 0)}>
                Kanan
              </button>
            </div>
            {c.kind === "switch" && (
              <button
                className="button ghost small"
                onClick={() => onToggleSwitch(c.id)}
              >
                {c.closed ? "Buka saklar" : "Tutup saklar"}
              </button>
            )}
            {broken && (
              <button
                className="button primary small"
                onClick={() => onReplaceComponent(c.id)}
              >
                Ganti Komponen
              </button>
            )}
          </>
        )}
      </fieldset>
      <label className="sim-field sim-field-inline">
        <input
          type="checkbox"
          checked={state.showMeters}
          onChange={(e) => onChange({ showMeters: e.target.checked })}
        />
        Tampilkan arus dan daya semua komponen
      </label>
    </div>
  );
}
