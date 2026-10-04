import { materials } from "@/features/laboratory/domain/catalog";
import type { Entity } from "@/features/laboratory/domain/types";

export function renderPhysicsShape({ entity: e }: { entity: Entity }) {
  const model = materials[e.material].model;
  if (model === "incline" || model === "friction") {
    const angle = (Math.max(0, Math.min(80, e.params.angle)) * Math.PI) / 180;
    const x = 8 + 70 * Math.cos(angle),
      y = 70 - 70 * Math.sin(angle);
    const travel = Math.min(
      60,
      Math.max(0, e.measurements["Posisi (m)"] || 0) * 8,
    );
    return (
      <svg viewBox="0 0 100 80" aria-hidden="true">
        <path d={`M8 70L${x} ${y}V70Z`} fill="#f9eebd" stroke="#806500" />
        <g
          transform={`translate(${x - travel * Math.cos(angle)} ${y + travel * Math.sin(angle)}) rotate(${-e.params.angle})`}
        >
          <rect
            x="-22"
            y="-16"
            width="20"
            height="15"
            rx="2"
            fill="#e5c652"
            stroke="#806500"
          />
        </g>
      </svg>
    );
  }
  if (["newton", "collision"].includes(model || "")) {
    const position =
      e.measurements["Posisi (m)"] || e.params.time * e.params.speed;
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <path d="M4 64H96" stroke="#806500" />
        <g transform={`translate(${Math.min(65, Math.abs(position) * 4)},0)`}>
          <rect
            x="4"
            y="40"
            width="26"
            height="20"
            rx="4"
            fill="#e5c652"
            stroke="#806500"
          />
          <circle cx="9" cy="63" r="4" fill="#806500" />
          <circle cx="25" cy="63" r="4" fill="#806500" />
        </g>
      </svg>
    );
  }
  if (model === "fall")
    return (
      <svg viewBox="0 0 100 80" aria-hidden="true">
        <path
          d="M50 8V70M15 70H85"
          stroke="#806500"
          strokeDasharray="3 3"
          fill="none"
        />
        <circle
          cx="50"
          cy={10 + Math.min(53, (e.measurements["Jarak jatuh (m)"] || 0) * 5)}
          r="7"
          fill="#d45a89"
        />
      </svg>
    );
  if (model === "projectile") {
    const y = e.measurements["y (m)"] || 0;
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <path
          d="M5 62H95M12 62Q50 4 90 62"
          fill="none"
          stroke="#806500"
          strokeDasharray="4 3"
        />
        <circle
          cx={10 + Math.min(80, (e.measurements["x (m)"] || 0) * 3)}
          cy={62 - Math.min(50, y * 5)}
          r="7"
          fill="#d45a89"
        />
      </svg>
    );
  }
  if (model === "pendulum")
    return (
      <span
        className="sandbox-pendulum"
        style={{
          transform: `rotate(${e.measurements["Sudut saat ini (°)"] || 0}deg)`,
        }}
      >
        <i />
      </span>
    );
  if (model === "spring")
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <path
          d="M50 2L50 10 35 16 65 23 35 30 65 37 35 44 65 51 50 58V65"
          stroke="#806500"
          strokeWidth="3"
          fill="none"
        />
        <rect x="35" y="60" width="30" height="14" rx="5" fill="#edcf56" />
      </svg>
    );
  if (["lens", "snell", "reflection", "dispersion"].includes(model || ""))
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <ellipse
          cx="50"
          cy="37"
          rx="9"
          ry="33"
          fill="#badfea"
          stroke="#427c93"
        />
        <path
          d="M2 5L50 37L98 62M2 65L50 37L98 10"
          stroke="#b74c64"
          fill="none"
          strokeWidth="2"
        />
      </svg>
    );
  if (model === "wave" || model === "sound")
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <path
          d="M0 38Q12 2 25 38T50 38T75 38T100 38"
          stroke="#806500"
          fill="none"
          strokeWidth="3"
        />
      </svg>
    );
  if (model === "buoyancy")
    return (
      <span className="sandbox-fluid">
        <i
          style={{
            top:
              e.status === "Terapung"
                ? "15%"
                : e.status === "Melayang"
                  ? "42%"
                  : "70%",
          }}
        />
      </span>
    );
  return null;
}
