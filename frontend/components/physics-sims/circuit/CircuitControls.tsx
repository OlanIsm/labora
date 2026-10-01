"use client";
import { PlacedComponent } from "../../../lib/physics-sims/circuit/presets";
import { CircuitPreset } from "../../../lib/physics-sims/circuit/presets";

export type CircuitControlsState = {
  presetId: string;
  showMeters: boolean;
};

export default function CircuitControls({
  state,
  onChange,
  presets,
  selectedComponent,
  onToggleSwitch,
  onReplaceComponent,
  current,
  power,
}: {
  state: CircuitControlsState;
  onChange: (next: Partial<CircuitControlsState>) => void;
  presets: CircuitPreset[];
  selectedComponent: PlacedComponent | null;
  onToggleSwitch: (id: string) => void;
  onReplaceComponent: (id: string) => void;
  current: number | null;
  power: number | null;
}) {
  const isBroken = selectedComponent && (selectedComponent.blown || selectedComponent.burnedOut);
  return (
    <div className="sim-controls-inner">
      <fieldset className="sim-fieldset">
        <legend>Pilih rangkaian</legend>
        <div className="sim-level-row">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`sim-chip ${state.presetId === preset.id ? "active" : ""}`}
              onClick={() => onChange({ presetId: preset.id })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Benda terpilih</legend>
        {!selectedComponent && <p className="sim-hint">Klik salah satu komponen di rangkaian untuk melihat detailnya.</p>}
        {selectedComponent && (
          <>
            <p className="sim-hint">
              {selectedComponent.kind === "battery" && `Baterai ${selectedComponent.voltage}V`}
              {selectedComponent.kind === "lamp" && `Lampu ${selectedComponent.resistance}Ω, maks ${selectedComponent.maxPowerWatts}W`}
              {selectedComponent.kind === "switch" && `Saklar (${selectedComponent.closed ? "tertutup" : "terbuka"})`}
              {selectedComponent.kind === "fuse" && `Sekring ${selectedComponent.fuseRatingAmps}A`}
              {selectedComponent.kind === "resistor" && `Resistor ${selectedComponent.resistance}Ω`}
              {selectedComponent.kind === "wire" && "Kabel"}
            </p>
            {current !== null && (
              <dl className="sim-data-grid">
                <div>
                  <dt>Arus (I)</dt>
                  <dd>{Math.abs(current).toFixed(2)} A</dd>
                </div>
                {power !== null && (
                  <div>
                    <dt>Daya (P)</dt>
                    <dd>{power.toFixed(1)} W</dd>
                  </div>
                )}
              </dl>
            )}
            {selectedComponent.kind === "switch" && (
              <button className="button ghost small" onClick={() => onToggleSwitch(selectedComponent.id)}>
                {selectedComponent.closed ? "Buka saklar" : "Tutup saklar"}
              </button>
            )}
            {isBroken && (
              <button className="button primary small" onClick={() => onReplaceComponent(selectedComponent.id)}>
                Ganti Komponen
              </button>
            )}
          </>
        )}
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Tampilan</legend>
        <label className="sim-field sim-field-inline">
          <input
            type="checkbox"
            checked={state.showMeters}
            onChange={(event) => onChange({ showMeters: event.target.checked })}
          />
          Tampilkan voltmeter/amperemeter semua komponen
        </label>
      </fieldset>
    </div>
  );
}
