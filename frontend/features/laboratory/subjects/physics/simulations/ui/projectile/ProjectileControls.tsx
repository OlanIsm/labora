"use client";
import type { ProjectileLevel } from "../../domain/projectile/levels";
import { PLANETS } from "../../domain/shared/config";
import type { PlanetId } from "../../domain/shared/config";
import Slider from "../shared/Slider";

export type ProjectileControlsState = {
  angleDeg: number;
  speed: number;
  mass: number;
  dragEnabled: boolean;
  planetId: PlanetId;
  levelIndex: number;
};

export default function ProjectileControls({
  state,
  onChange,
  levels,
  onLaunch,
  canLaunch,
}: {
  state: ProjectileControlsState;
  onChange: (next: Partial<ProjectileControlsState>) => void;
  levels: ProjectileLevel[];
  onLaunch: () => void;
  canLaunch: boolean;
}) {
  return (
    <div className="sim-controls-inner">
      <fieldset className="sim-fieldset">
        <legend>Level</legend>
        <div className="sim-level-row">
          {levels.map((level, index) => (
            <button
              key={level.id}
              type="button"
              className={`sim-chip ${state.levelIndex === index ? "active" : ""}`}
              onClick={() => onChange({ levelIndex: index })}
            >
              {level.id}. {level.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Pengaturan tembakan</legend>
        <Slider
          label="Sudut tembak (θ)"
          value={state.angleDeg}
          min={0}
          max={90}
          step={1}
          unit="°"
          onChange={(value) => onChange({ angleDeg: value })}
        />
        <Slider
          label="Kecepatan awal (v₀)"
          value={state.speed}
          min={5}
          max={40}
          step={1}
          unit="m/s"
          onChange={(value) => onChange({ speed: value })}
        />
        <Slider
          label="Massa benda"
          value={state.mass}
          min={0.2}
          max={20}
          step={0.1}
          unit="kg"
          onChange={(value) => onChange({ mass: value })}
          formatValue={(v) => v.toFixed(1)}
        />
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Lingkungan</legend>
        <label className="sim-field sim-field-inline">
          <input
            type="checkbox"
            checked={state.dragEnabled}
            onChange={(event) =>
              onChange({ dragEnabled: event.target.checked })
            }
          />
          Hambatan udara (drag kuadratik)
        </label>
        <label className="sim-field">
          <span className="sim-field-label">Planet</span>
          <select
            value={state.planetId}
            onChange={(event) =>
              onChange({ planetId: event.target.value as PlanetId })
            }
          >
            {Object.values(PLANETS).map((planet) => (
              <option key={planet.id} value={planet.id}>
                {planet.label} (g = {planet.gravity} m/s²)
              </option>
            ))}
          </select>
        </label>
        {!PLANETS[state.planetId].airDensity && state.dragEnabled && (
          <p className="sim-hint">
            {PLANETS[state.planetId].label} tidak memiliki atmosfer, jadi
            hambatan udara tidak berpengaruh di sini.
          </p>
        )}
      </fieldset>
      <button
        className="button primary full"
        onClick={onLaunch}
        disabled={!canLaunch}
      >
        Tembak!
      </button>
    </div>
  );
}
