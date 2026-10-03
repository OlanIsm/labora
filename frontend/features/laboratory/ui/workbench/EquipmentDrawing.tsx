"use client";
import type { Material } from "@/features/laboratory/domain/types";
import { useId } from "react";

export const hasEquipmentDrawing = (material: Material) =>
  material.kind === "container" ||
  material.kind === "material" ||
  [
    "microscope",
    "dropper",
    "thermometer",
    "balance",
    "ph-meter",
    "voltmeter",
    "ammeter",
    "multimeter",
    "electrolyte-tester",
    "burner",
    "funnel",
    "battery",
    "resistor",
    "rheostat",
    "spring",
    "ball",
    "launcher",
    "wire",
    "onion",
    "cheek",
    "elodea",
    "slide",
    "potato",
    "seed",
    "rack",
    "stirrer",
    "tripod",
    "stopwatch",
    "electrolysis",
    "chromatography",
    "balloon",
  ].includes(material.id);

/** Scientific schematics: silhouettes distinguish apparatus; read quantities from the instrument panel. */
export default function EquipmentDrawing({
  material,
  fill = 0,
  color = "#bde8f4",
  sealed = false,
  sediment = false,
  gas = false,
  layered = false,
  layerFraction = 0.25,
  layerColor = "#ddb74e",
  hot = false,
  value,
  animated = false,
}: {
  material: Material;
  fill?: number;
  color?: string;
  sealed?: boolean;
  sediment?: boolean;
  gas?: boolean;
  layered?: boolean;
  layerFraction?: number;
  layerColor?: string;
  hot?: boolean;
  value?: number;
  animated?: boolean;
}) {
  const clip = useId();
  const id = material.id;
  const stroke = "#426b7d";
  if (id === "stopwatch")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M34 8H46M40 8V20M58 22L64 16"
          stroke={stroke}
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="40"
          cy="53"
          r="29"
          fill="#e7f4f8"
          stroke={stroke}
          strokeWidth="2.5"
        />
        <circle cx="40" cy="53" r="23" fill="#fff" stroke={stroke} />
        {value === undefined ? (
          <path
            d="M40 33V53L53 61"
            stroke={stroke}
            strokeWidth="2"
            fill="none"
          />
        ) : (
          <path
            d="M40 53V33"
            transform={`rotate(${value * 6} 40 53)`}
            stroke={stroke}
            strokeWidth="2"
            fill="none"
          />
        )}
        <path
          d="M40 73V76M20 53H17M60 53H63"
          stroke={stroke}
          strokeWidth="2"
          fill="none"
        />
        {value !== undefined && (
          <text x="40" y="91" textAnchor="middle" fontSize="10" fill={stroke}>
            {value.toFixed(1)} s
          </text>
        )}
        <circle cx="40" cy="53" r="3" fill={stroke} />
      </svg>
    );
  if (id === "balloon")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <ellipse
          cx="40"
          cy="34"
          rx="24"
          ry="29"
          fill="#e7a2bb"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M40 63L35 69H45ZM40 69Q29 77 40 83T37 93"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
      </svg>
    );
  if (id === "chromatography")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M22 8H58V86H22Z"
          fill="#fffef2"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M25 73H55M25 25H55" stroke={stroke} strokeDasharray="3 3" />
        <ellipse cx="40" cy="65" rx="9" ry="3" fill="#a44b67" />
        <ellipse cx="40" cy="49" rx="8" ry="3" fill="#695b91" />
        <ellipse cx="40" cy="34" rx="7" ry="3" fill="#35778a" />
      </svg>
    );
  if (id === "electrolysis")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <rect
          x="27"
          y="5"
          width="26"
          height="15"
          rx="2"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M32 12H38M35 9V15M43 12H49M27 12H22V41M53 12H58V41"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M12 35V84H68V35"
          fill="#e7f4f8"
          stroke={stroke}
          strokeWidth="2.5"
        />
        <path d="M15 55H65V81H15Z" fill="#bde8f4" />
        <path d="M22 41V72M58 41V72" stroke={stroke} strokeWidth="4" />
        {[29, 51].map((x) => (
          <g key={x}>
            <circle cx={x} cy="64" r="2" fill="#fff" stroke={stroke} />
            <circle cx={x} cy="51" r="2" fill="#fff" stroke={stroke} />
          </g>
        ))}
      </svg>
    );
  if (id === "electrolyte-tester")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <rect
          x="9"
          y="9"
          width="20"
          height="27"
          rx="3"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M14 18H24M19 13V23M14 29H24M29 16H44M58 31H66V66M19 36V66"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
        <circle
          cx="51"
          cy="21"
          r="10"
          fill="#fff9db"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M47 18L51 25 55 18M47 31H55"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M19 66V84M66 66V84" stroke={stroke} strokeWidth="5" />
      </svg>
    );
  if (id === "stirrer")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M22 82L52 10Q55 5 59 9L29 83Q25 88 22 82Z"
          fill="#e7f4f8"
          stroke={stroke}
          strokeWidth="2"
        />
      </svg>
    );
  if (id === "tripod")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M13 23H67V35H13Z"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M19 25V33M29 25V33M39 25V33M49 25V33M59 25V33M15 29H65"
          stroke={stroke}
        />
        <path
          d="M20 35L10 85M60 35L70 85M40 35V85"
          stroke={stroke}
          strokeWidth="3"
        />
      </svg>
    );
  if (id === "rack")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        {[19, 40, 61].map((x) => (
          <path
            key={x}
            d={`M${x - 5} 12H${x + 5}V62a5 5 0 0 1 -10 0Z`}
            fill="#e7f4f8"
            stroke={stroke}
            strokeWidth="2"
          />
        ))}
        <path
          d="M9 39H71V47H9ZM9 77H71V85H9Z"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M12 47V77M68 47V77" stroke={stroke} strokeWidth="3" />
      </svg>
    );
  if (id === "spring")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M20 8H60M40 8V18L26 25 54 32 26 39 54 46 26 53 54 60 40 67V76"
          stroke={stroke}
          strokeWidth="3"
          fill="none"
        />
        <rect
          x="26"
          y="76"
          width="28"
          height="15"
          rx="3"
          fill="#f4da74"
          stroke={stroke}
        />
      </svg>
    );
  if (id === "ball")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <circle
          cx="40"
          cy="44"
          r="22"
          fill="#e7a2bb"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M13 80H67M40 72V64" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  if (id === "launcher")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M24 57L53 22 65 32 35 65Z"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="2"
        />
        <circle cx="30" cy="64" r="9" fill="#f4da74" stroke={stroke} />
        <path d="M10 80H53L43 72H20Z" fill="#d2e5ec" stroke={stroke} />
        <circle cx="67" cy="15" r="4" fill="#e7a2bb" />
      </svg>
    );
  if (id === "wire")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M16 17V33Q16 48 38 48T62 66V80"
          fill="none"
          stroke="#a44b67"
          strokeWidth="4"
        />
        <path d="M16 8V19M62 79V90" stroke={stroke} strokeWidth="5" />
      </svg>
    );
  if (id === "onion")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <rect
          x="10"
          y="18"
          width="60"
          height="60"
          rx="3"
          fill="#edf2d9"
          stroke={stroke}
          strokeWidth="2"
        />
        {[18, 38, 58].map((y) => (
          <g key={y}>
            <path
              d={`M10 ${y}H70M30 ${y}V${y + 20}M50 ${y}V${y + 20}`}
              fill="none"
              stroke="#6d864e"
            />
            {[20, 40, 60].map((x) => (
              <circle key={x} cx={x} cy={y + 10} r="2.5" fill="#80649b" />
            ))}
          </g>
        ))}
      </svg>
    );
  if (id === "cheek")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M18 34Q23 13 48 21T69 57Q68 79 40 78T13 55Z"
          fill="#efdbe8"
          stroke="#a46a8e"
          strokeWidth="2"
        />
        <circle cx="41" cy="50" r="9" fill="#80649b" />
        <circle cx="43" cy="48" r="2" fill="#efe7f5" />
      </svg>
    );
  if (id === "slide")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <rect
          x="8"
          y="31"
          width="64"
          height="31"
          rx="2"
          fill="#e7f4f8"
          stroke={stroke}
          strokeWidth="2"
        />
        <rect
          x="31"
          y="35"
          width="25"
          height="24"
          fill="#ffffffaa"
          stroke={stroke}
        />
        <ellipse cx="43" cy="47" rx="7" ry="5" fill="#bbd9a5" />
        <path d="M15 38V55" stroke={stroke} />
      </svg>
    );
  if (id === "potato")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M17 36Q20 15 49 21Q68 24 65 49Q65 77 39 79Q12 74 12 52Z"
          fill="#d9bf8c"
          stroke="#876b42"
          strokeWidth="2"
        />
        {[
          [26, 38],
          [48, 32],
          [39, 55],
          [52, 64],
          [23, 65],
        ].map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x - 2} ${y}q2 -3 4 0`}
            fill="none"
            stroke="#876b42"
            strokeWidth="2"
          />
        ))}
      </svg>
    );
  if (id === "seed" || id === "elodea")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path d="M40 79V24" stroke="#4d7b3b" strokeWidth="3" />
        {[31, 48, 65].map((y) => (
          <g key={y}>
            <path
              d={`M40 ${y}Q18 ${y - 20} 17 ${y - 3}Q23 ${y + 6} 40 ${y}Q62 ${y - 20} 63 ${y - 3}Q57 ${y + 6} 40 ${y}`}
              fill="#add496"
              stroke="#4d7b3b"
            />
          </g>
        ))}
        {id === "seed" && (
          <>
            <path
              d="M40 78q-11 7 -3 14M40 84l10 8"
              stroke="#876b42"
              fill="none"
              strokeWidth="2"
            />
            <ellipse
              cx="32"
              cy="81"
              rx="8"
              ry="4"
              fill="#d9bf8c"
              stroke="#876b42"
            />
          </>
        )}
      </svg>
    );
  const outlines: Record<string, string> = {
    beaker: "M19 15H58L64 20H61V77Q61 83 55 83H25Q19 83 19 77Z",
    "test-tube": "M30 9H50V72A10 10 0 0 1 30 72Z",
    erlenmeyer: "M33 9H47V31L65 76Q69 83 61 83H19Q11 83 15 76L33 31Z",
    cylinder: "M33 8H47V78H33Z",
    burette: "M35 5H45V67L41 73V84H39V73L35 67Z",
    "evaporating-dish": "M12 61H68Q65 82 40 82Q15 82 12 61Z",
    "watch-glass": "M10 65Q40 84 70 65Q40 72 10 65Z",
    aquarium: "M9 24H71V80H9Z",
  };
  const vessel =
    (material.kind === "container" && id !== "dropper") || id === "burette";
  if (vessel) {
    const outline = outlines[id] || outlines.beaker;
    return (
      <svg
        viewBox={id === "test-tube" ? "22 0 36 95" : "0 0 80 95"}
        aria-hidden="true"
        className="equipment-drawing"
      >
        <defs>
          <clipPath id={clip}>
            <path d={outline} />
          </clipPath>
        </defs>
        <path d={outline} fill="#ffffff99" stroke={stroke} strokeWidth="2.5" />
        <g clipPath={`url(#${clip})`}>
          <rect
            key={`${fill}-${color}`}
            className="equipment-liquid"
            x="8"
            y={83 - Math.max(0, Math.min(1, fill)) * 65}
            width="64"
            height="80"
            fill={color}
          />
          {layered && (
            <rect
              x="8"
              y={83 - Math.max(0, Math.min(1, fill)) * 65}
              width="64"
              height={
                Math.max(0, Math.min(1, fill)) *
                65 *
                Math.max(0, Math.min(1, layerFraction))
              }
              fill={layerColor}
            />
          )}
          {sediment && <path d="M8 79H72V86H8Z" fill="#a89065" />}
          {gas &&
            [29, 39, 49].map((x, i) => (
              <circle
                key={x}
                className={animated ? "chemistry-bubble" : undefined}
                cx={x}
                cy={65 - i * 13}
                r="2.5"
                fill="#fff"
                stroke={stroke}
              />
            ))}
        </g>
        <path d={outline} fill="none" stroke={stroke} strokeWidth="2.5" />
        {["beaker", "cylinder", "burette"].includes(id) &&
          [28, 40, 52, 64].map((y) => (
            <path
              key={y}
              d={`M${id === "beaker" ? 48 : 39} ${y}h8`}
              stroke={stroke}
            />
          ))}
        {id === "cylinder" && (
          <path d="M23 83H57" stroke={stroke} strokeWidth="4" />
        )}
        {id === "burette" && (
          <path d="M30 70H51" stroke={stroke} strokeWidth="3" />
        )}
        {sealed && <path d="M28 7H52" stroke={stroke} strokeWidth="5" />}
        {hot && (
          <path
            className={animated ? "chemistry-steam" : undefined}
            d="M23 13q-4 -4 0 -8M56 13q4 -4 0 -8"
            stroke={stroke}
            fill="none"
            strokeWidth="1.5"
          />
        )}
      </svg>
    );
  }
  if (id === "litmus-red" || id === "litmus-blue")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <rect
          x="28"
          y="9"
          width="24"
          height="76"
          rx="1"
          fill="#fffef2"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M29 32H51V84H29Z"
          fill={
            color === "#bde8f4"
              ? id === "litmus-red"
                ? "#b54458"
                : "#37699c"
              : color
          }
        />
        <path d="M33 17H47M33 23H47" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  if (material.kind === "material")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M29 10H51V25L60 32V82H20V32L29 25Z"
          fill="#ffffff99"
          stroke={stroke}
          strokeWidth="2.5"
        />
        <path d="M28 7H52V16H28Z" fill={stroke} />
        <path d="M23 55H57V79H23Z" fill={material.color || color} />
        {material.phase === "solid" &&
          [29, 40, 51].map((x) => (
            <circle key={x} cx={x} cy="73" r="3" fill="#fff" />
          ))}
        <rect
          x="23"
          y="34"
          width="34"
          height="18"
          rx="3"
          fill="#fff"
          stroke={stroke}
        />
        <text x="40" y="46" textAnchor="middle" fontSize="8" fill={stroke}>
          {id === "water" || id === "tap-water"
            ? "H₂O"
            : id.startsWith("hcl")
              ? "HCl"
              : id.startsWith("naoh")
                ? "NaOH"
                : id === "universal"
                  ? "Ind."
                  : material.name.split(" ")[0].slice(0, 6)}
        </text>
      </svg>
    );
  if (id === "microscope")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M25 14L37 6 52 28 40 36Z"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="3"
        />
        <path
          d="M48 32Q71 41 57 72L48 81"
          fill="none"
          stroke={stroke}
          strokeWidth="9"
        />
        <path
          d="M13 82H69M19 51H49M35 38L29 47"
          stroke={stroke}
          strokeWidth="5"
        />
        <circle
          cx="56"
          cy="47"
          r="6"
          fill="#fff"
          stroke={stroke}
          strokeWidth="3"
        />
        <path d="M29 56V69H42" stroke={stroke} fill="none" strokeWidth="3" />
      </svg>
    );
  if (id === "dropper")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M32 12Q40 2 48 12V29H32Z"
          fill="#d58eaa"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M35 29H45V62L40 77 35 62Z"
          fill="#d8eff7"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M40 82Q32 92 40 93Q48 92 40 82Z" fill={color} />
      </svg>
    );
  if (id === "thermometer")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M35 14A5 5 0 0 1 45 14V66A12 12 0 1 1 35 66Z"
          fill="#fff"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M40 73V35" stroke="#b14464" strokeWidth="4" />
        <circle cx="40" cy="75" r="7" fill="#b14464" />
        {[22, 34, 46, 58].map((y) => (
          <path key={y} d={`M45 ${y}h5`} stroke={stroke} />
        ))}
      </svg>
    );
  if (id === "balance")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path d="M18 25H62M40 25V42" stroke={stroke} strokeWidth="4" />
        <rect
          x="10"
          y="42"
          width="60"
          height="36"
          rx="6"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="2"
        />
        <rect x="20" y="51" width="40" height="17" rx="2" fill="#fff" />
        <text x="40" y="63" textAnchor="middle" fontSize="10" fill={stroke}>
          {value === undefined ? "g" : value.toFixed(1)}
        </text>
      </svg>
    );
  if (["ph-meter", "voltmeter", "ammeter", "multimeter"].includes(id))
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <rect
          x="8"
          y="18"
          width="45"
          height="61"
          rx="7"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="2"
        />
        <rect x="15" y="27" width="31" height="18" rx="2" fill="#fff" />
        <text x="30" y="40" textAnchor="middle" fontSize="10" fill={stroke}>
          {value === undefined
            ? id === "ph-meter"
              ? "pH"
              : id === "ammeter"
                ? "A"
                : "V"
            : value.toFixed(1)}
        </text>
        <circle cx="30" cy="60" r="6" fill="#fff" stroke={stroke} />
        <path
          d="M53 53Q71 42 66 66V80"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M66 76V87" stroke={stroke} strokeWidth="5" />
      </svg>
    );
  if (id === "burner")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M17 82H63M35 80V42H45V80M45 68H65"
          stroke={stroke}
          strokeWidth="5"
          fill="none"
        />
        {fill > 0 && (
          <path
            className={animated ? "chemistry-flame" : undefined}
            d="M40 37Q21 28 40 8Q59 28 40 37Z"
            fill="#5ec8ff"
            stroke={stroke}
            strokeWidth="2"
          />
        )}
      </svg>
    );
  if (id === "funnel")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path
          d="M12 19H68L45 55V80H35V55Z"
          fill="#d2e5ec"
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M20 23H60L40 47Z" fill="#fff9db" stroke={stroke} />
      </svg>
    );
  if (id === "battery")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <rect
          x="22"
          y="18"
          width="36"
          height="65"
          rx="5"
          fill="#f4da74"
          stroke={stroke}
          strokeWidth="2"
        />
        <path
          d="M33 12H47V18H33ZM33 38H47M40 31V45M33 68H47"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
        />
      </svg>
    );
  if (id === "resistor" || id === "rheostat")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path d="M5 48H21M59 48H75" stroke={stroke} strokeWidth="3" />
        <rect
          x="21"
          y="35"
          width="38"
          height="26"
          rx="5"
          fill="#efe0b0"
          stroke={stroke}
          strokeWidth="2"
        />
        {[29, 38, 47].map((x, i) => (
          <path
            key={x}
            d={`M${x} 36V60`}
            stroke={["#705443", "#aa4b43", "#87632d"][i]}
            strokeWidth="4"
          />
        ))}
      </svg>
    );
  if (id === "pendulum")
    return (
      <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing">
        <path d="M10 10H70M40 10L57 71" stroke={stroke} strokeWidth="3" />
        <circle
          cx="57"
          cy="75"
          r="10"
          fill="#f4da74"
          stroke={stroke}
          strokeWidth="2"
        />
      </svg>
    );
  return null;
}
