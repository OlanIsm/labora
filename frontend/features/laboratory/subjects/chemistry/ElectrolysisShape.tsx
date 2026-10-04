import { materials } from "@/features/laboratory/domain/catalog";
import type { Entity, LabState } from "@/features/laboratory/domain/types";

export function electrolysisIndicator(entity: Entity, state: LabState) {
  const vessel = state.entities.find(
    (e) =>
      entity.connections.includes(e.id) &&
      materials[e.material]?.kind === "container",
  );
  const copper = !!vessel?.contents.some(
    (p) => p.material === "cuso4" && p.mass > 1e-8,
  );
  const hydrogen = vessel?.measurements["H₂ katoda (mL)"] || 0;
  const oxygen = vessel?.measurements["O₂ anoda (mL)"] || 0;
  const deposit = vessel?.measurements["Cu katoda (g)"] || 0;
  return {
    vessel,
    copper,
    hydrogen,
    oxygen,
    deposit,
    running:
      entity.active &&
      !!vessel &&
      (copper ? deposit > 0 : hydrogen > 0 || oxygen > 0),
  };
}

export default function ElectrolysisShape({
  entity,
  state,
}: {
  entity: Entity;
  state: LabState;
}) {
  const indicator = electrolysisIndicator(entity, state);
  const stroke = "#426b7d";
  return (
    <svg
      viewBox="0 0 80 95"
      aria-hidden="true"
      className="equipment-drawing chemistry-electrolysis"
      data-electrolysis-state={
        indicator.running
          ? indicator.copper
            ? "copper"
            : "gas"
          : entity.active
            ? "waiting"
            : "off"
      }
    >
      <rect
        x="25"
        y="4"
        width="30"
        height="17"
        rx="3"
        fill="#d2e5ec"
        stroke={stroke}
        strokeWidth="2"
      />
      <path
        d="M30 12H37M33.5 8.5V15.5M43 12H50M25 12H20V43M55 12H60V43"
        stroke={stroke}
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="40"
        cy="18"
        r="2"
        fill={indicator.running ? "#365f27" : "#76859a"}
      />
      <path d="M10 37V84H70V37" fill="white" stroke={stroke} strokeWidth="2" />
      {indicator.vessel && (
        <path d="M12 54H68V82H12Z" fill={indicator.vessel.color} />
      )}
      <path d="M20 43V74M60 43V74" stroke={stroke} strokeWidth="4" />
      <text x="20" y="34" textAnchor="middle" fontSize="9" fill={stroke}>
        +
      </text>
      <text x="60" y="34" textAnchor="middle" fontSize="9" fill={stroke}>
        −
      </text>
      {indicator.running && !indicator.copper && (
        <>
          <g data-electrode="anode-oxygen">
            <circle
              className="chemistry-bubble"
              cx="27"
              cy="67"
              r="2.5"
              fill="white"
              stroke={stroke}
            />
          </g>
          <g data-electrode="cathode-hydrogen">
            <circle
              className="chemistry-bubble"
              cx="53"
              cy="69"
              r="2.5"
              fill="white"
              stroke={stroke}
            />
            <circle
              className="chemistry-bubble"
              cx="52"
              cy="58"
              r="2.5"
              fill="white"
              stroke={stroke}
            />
          </g>
        </>
      )}
      {indicator.copper && indicator.deposit > 0 && (
        <path
          data-electrode="cathode-copper"
          d="M60 55V74"
          stroke="#ad623b"
          strokeWidth="6"
        />
      )}
      <text x="20" y="93" textAnchor="middle" fontSize="7" fill={stroke}>
        Anoda
      </text>
      <text x="60" y="93" textAnchor="middle" fontSize="7" fill={stroke}>
        Katoda
      </text>
    </svg>
  );
}
