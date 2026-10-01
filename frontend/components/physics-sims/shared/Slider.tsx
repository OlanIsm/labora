"use client";
// Labeled range slider with an explicit SI unit shown next to the live
// value, per the task's accessibility requirement. Native <input type=range>
// already supports keyboard (arrow keys) and touch out of the box.
export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  formatValue,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
}) {
  const displayValue = formatValue ? formatValue(value) : value.toString();
  return (
    <label className="sim-field">
      <span className="sim-field-label">
        {label}
        <strong>
          {displayValue} {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label}, satuan ${unit}`}
      />
    </label>
  );
}
