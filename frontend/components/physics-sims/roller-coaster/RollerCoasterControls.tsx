"use client";
import Slider from "../shared/Slider";
import { TrackPreset } from "../../../lib/physics-sims/roller-coaster/presets";

export type RollerCoasterControlsState = {
  presetId: string;
  mass: number;
  frictionCoefficient: number;
};

export default function RollerCoasterControls({
  state,
  onChange,
  presets,
  onRelease,
  canRelease,
  editable,
  onToggleEditable,
}: {
  state: RollerCoasterControlsState;
  onChange: (next: Partial<RollerCoasterControlsState>) => void;
  presets: TrackPreset[];
  onRelease: () => void;
  canRelease: boolean;
  editable: boolean;
  onToggleEditable: () => void;
}) {
  return (
    <div className="sim-controls-inner">
      <fieldset className="sim-fieldset">
        <legend>Pilih lintasan</legend>
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
        <label className="sim-field sim-field-inline">
          <input type="checkbox" checked={editable} onChange={onToggleEditable} />
          Ubah lintasan (seret titik ungu)
        </label>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Pengaturan kereta</legend>
        <Slider
          label="Massa kereta"
          value={state.mass}
          min={1}
          max={50}
          step={1}
          unit="kg"
          onChange={(value) => onChange({ mass: value })}
        />
        <Slider
          label="Koefisien gesekan (μ)"
          value={state.frictionCoefficient}
          min={0}
          max={0.3}
          step={0.01}
          unit=""
          onChange={(value) => onChange({ frictionCoefficient: value })}
          formatValue={(v) => v.toFixed(2)}
        />
      </fieldset>
      <button className="button primary full" onClick={onRelease} disabled={!canRelease}>
        Lepas Kereta
      </button>
    </div>
  );
}
