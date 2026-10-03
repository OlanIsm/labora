import { materials } from "@/features/laboratory/domain/catalog";
import type { Entity } from "@/features/laboratory/domain/types";

export function renderChemistryShape({ entity: e }: { entity: Entity }) {
  if (materials[e.material].model === "chromatography") {
    const length = Math.max(1, e.params.paperLength || 80);
    const front = e.measurements["Front pelarut model (mm)"] || 0;
    return (
      <svg viewBox="0 0 80 85" aria-hidden="true">
        <rect
          x="15"
          y="3"
          width="50"
          height="76"
          fill="#fffef2"
          stroke="#76859a"
        />
        <path d="M18 72H62" stroke="#76859a" strokeDasharray="3 2" />
        <path
          d={`M18 ${72 - (front / length) * 60}H62`}
          stroke="#155c7b"
          strokeDasharray="3 2"
        />
        {["#b13c68", "#66519b", "#35778a"].map((color, index) => {
          const distance =
            e.measurements[`Jarak pigmen ${index + 1} model (mm)`];
          return distance !== undefined ? (
            <ellipse
              key={color}
              cx="40"
              cy={72 - (distance / length) * 60}
              rx="10"
              ry="3"
              fill={color}
            />
          ) : null;
        })}
      </svg>
    );
  }
  if (e.material === "balloon") {
    const volume = e.measurements["Gas terbentuk (mL)"] || 0;
    const radius = Math.min(28, 6 + Math.cbrt(volume) * 2);
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <ellipse
          cx="40"
          cy="34"
          rx={radius}
          ry={radius * 1.1}
          fill="#dba3c3"
          stroke="#8a4d71"
        />
        <path d={`M40 ${34 + radius * 1.1}L40 77`} stroke="#8a4d71" />
      </svg>
    );
  }
  return null;
}
