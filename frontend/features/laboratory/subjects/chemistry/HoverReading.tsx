import { instrumentReadings } from "@/features/laboratory/domain/feedback";
import type { Entity, LabState } from "@/features/laboratory/domain/types";

export default function HoverReading({
  entity,
  state,
}: {
  entity: Entity;
  state: LabState;
}) {
  const key = instrumentReadings[entity.material]?.[0];
  if (!key || entity.material === "stopwatch") return null;
  const connected = state.entities.some((other) =>
    entity.connections.includes(other.id),
  );
  const value = entity.measurements[key];
  const number = Number.isFinite(value)
    ? value.toLocaleString("id-ID", {
        maximumFractionDigits: entity.material === "ph-meter" ? 2 : 3,
      })
    : "Belum terbaca";
  const label =
    key === "pH"
      ? `pH ${number}`
      : key === "Suhu (°C)"
        ? `${number} °C`
        : key === "Massa isi (g)"
          ? `${number} g`
          : `${key}: ${number}`;
  return (
    <output
      className="chemistry-hover-reading"
      aria-label={`Pembacaan ${entity.label}`}
    >
      {connected ? label : "Belum tersambung"}
    </output>
  );
}
