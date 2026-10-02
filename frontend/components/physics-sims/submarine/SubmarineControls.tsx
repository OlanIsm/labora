"use client";
import Slider from "../shared/Slider";
import { FluidId, FLUIDS } from "../../../lib/physics-sims/shared/config";

export type SubmarineControlsState = {
  ballastWaterFraction: number;
  fluidId: FluidId;
  propellerForce: number;
  challengeMode: boolean;
  challengeTargetDepth: number;
};

export default function SubmarineControls({
  state,
  onChange,
  onReleaseFromSurface,
}: {
  state: SubmarineControlsState;
  onChange: (next: Partial<SubmarineControlsState>) => void;
  onReleaseFromSurface: () => void;
}) {
  return (
    <div className="sim-controls-inner">
      <fieldset className="sim-fieldset">
        <legend>Tangki pemberat</legend>
        <Slider
          label="Air di tangki (vs udara)"
          value={state.ballastWaterFraction * 100}
          min={0}
          max={100}
          step={1}
          unit="%"
          formatValue={(value) => value.toFixed(0)}
          onChange={(value) => onChange({ ballastWaterFraction: value / 100 })}
        />
        <p className="sim-hint">
          Lebih banyak air di tangki pemberat menambah massa kapal tanpa
          mengubah volume, sehingga kapal lebih mudah tenggelam.
        </p>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Jenis cairan</legend>
        <div className="sim-level-row">
          {Object.values(FLUIDS).map((fluid) => (
            <button
              key={fluid.id}
              type="button"
              className={`sim-chip ${state.fluidId === fluid.id ? "active" : ""}`}
              onClick={() => onChange({ fluidId: fluid.id })}
            >
              {fluid.label} ({fluid.density} kg/m³)
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Propeller vertikal</legend>
        <Slider
          label="Gaya dorong"
          value={state.propellerForce}
          min={-2000}
          max={2000}
          step={50}
          unit="N"
          onChange={(value) => onChange({ propellerForce: value })}
          formatValue={(v) => v.toFixed(0)}
        />
        <p className="sim-hint">Positif mendorong ke atas, negatif mendorong ke bawah.</p>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Mode tantangan</legend>
        <label className="sim-field sim-field-inline">
          <input
            type="checkbox"
            checked={state.challengeMode}
            onChange={(event) => onChange({ challengeMode: event.target.checked })}
          />
          Tahan di kedalaman target
        </label>
        {state.challengeMode && (
          <Slider
            label="Kedalaman target"
            value={state.challengeTargetDepth}
            min={2}
            max={30}
            step={1}
            unit="m"
            onChange={(value) => onChange({ challengeTargetDepth: value })}
          />
        )}
      </fieldset>
      <button className="button primary full" onClick={onReleaseFromSurface}>
        Mulai dari permukaan
      </button>
    </div>
  );
}
