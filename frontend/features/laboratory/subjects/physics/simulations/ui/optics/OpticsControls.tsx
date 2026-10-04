"use client";
import { SPECTRUM_COLORS } from "../../domain/optics/engine";
import type { ObjectKind } from "../../domain/optics/scene";
import Slider from "../shared/Slider";

export type LaserColorMode = "white" | number; // number = a specific wavelength in nm

export type OpticsControlsState = {
  laserColorMode: LaserColorMode;
  imageFormationMode: boolean;
  objectDistance: number;
  focalLength: number;
};

const OBJECT_PALETTE: { kind: ObjectKind; label: string }[] = [
  { kind: "mirror", label: "Cermin datar" },
  { kind: "convexLens", label: "Lensa cembung" },
  { kind: "concaveLens", label: "Lensa cekung" },
  { kind: "prism", label: "Prisma" },
  { kind: "screen", label: "Layar" },
];

export default function OpticsControls({
  state,
  onChange,
  onAddObject,
  onRotateSelected,
  onDeleteSelected,
  hasSelection,
}: {
  state: OpticsControlsState;
  onChange: (next: Partial<OpticsControlsState>) => void;
  onAddObject: (kind: ObjectKind) => void;
  onRotateSelected: (deltaRad: number) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}) {
  return (
    <div className="sim-controls-inner">
      <fieldset className="sim-fieldset">
        <legend>Tambah objek</legend>
        <div className="sim-level-row">
          {OBJECT_PALETTE.map((item) => (
            <button
              key={item.kind}
              type="button"
              className="sim-chip"
              onClick={() => onAddObject(item.kind)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {hasSelection && (
          <div className="sim-action-row-inline">
            <button
              className="button ghost small"
              onClick={() => onRotateSelected(-Math.PI / 12)}
            >
              Putar kiri
            </button>
            <button
              className="button ghost small"
              onClick={() => onRotateSelected(Math.PI / 12)}
            >
              Putar kanan
            </button>
            <button className="button ghost small" onClick={onDeleteSelected}>
              Hapus
            </button>
          </div>
        )}
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Sumber laser</legend>
        <div className="sim-level-row">
          <button
            type="button"
            className={`sim-chip ${state.laserColorMode === "white" ? "active" : ""}`}
            onClick={() => onChange({ laserColorMode: "white" })}
          >
            Putih (sinar campuran)
          </button>
          {SPECTRUM_COLORS.map((color) => (
            <button
              key={color.wavelengthNm}
              type="button"
              className={`sim-chip ${state.laserColorMode === color.wavelengthNm ? "active" : ""}`}
              onClick={() => onChange({ laserColorMode: color.wavelengthNm })}
              style={{ borderColor: color.hex }}
            >
              {color.name}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="sim-fieldset">
        <legend>Mode pembentukan bayangan</legend>
        <label className="sim-field sim-field-inline">
          <input
            type="checkbox"
            checked={state.imageFormationMode}
            onChange={(event) =>
              onChange({ imageFormationMode: event.target.checked })
            }
          />
          Aktifkan (gambar benda, bayangan, dan 3 sinar istimewa)
        </label>
        {state.imageFormationMode && (
          <>
            <Slider
              label="Jarak benda (s)"
              value={state.objectDistance}
              min={2}
              max={30}
              step={1}
              unit="cm"
              onChange={(value) => onChange({ objectDistance: value })}
            />
            <Slider
              label="Jarak fokus (f)"
              value={state.focalLength}
              min={-20}
              max={20}
              step={1}
              unit="cm"
              onChange={(value) => onChange({ focalLength: value })}
            />
            <p className="sim-hint">
              f positif = lensa cembung, f negatif = lensa cekung.
            </p>
          </>
        )}
      </fieldset>
    </div>
  );
}
