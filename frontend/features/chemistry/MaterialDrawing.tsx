import type { Material } from "@/lib/sandbox/types";

const forms: Record<string, string> = {
  mg: "ribbon", zn: "plate", cu: "wire", fe: "nail", al: "foil", ag: "metal",
  "zn-powder": "powder", "caco3-powder": "powder", "iron-powder": "powder", starch: "powder",
  caco3: "pieces", mno2: "pieces", sand: "grains", sucrose: "grains", glucose: "grains",
  yeast: "yeast", cabbage: "cabbage",
};
const colors: Record<string, string> = {
  sand: "#d2b47c", sucrose: "#fff9db", glucose: "#fff9db", starch: "#f7f5eb",
  yeast: "#d5bc87", mno2: "#48535b", "iron-powder": "#69757e", "zn-powder": "#97a8b5",
  caco3: "#f1eee2", "caco3-powder": "#f1eee2", cuso4: "#3c91bc", fecl3: "#a76c40",
};

export function chemistryMaterialForm(material: Material) {
  if (material.discipline !== "chemistry" || material.kind !== "material" || material.id.startsWith("litmus-")) return undefined;
  return forms[material.id] || (material.phase === "solid" ? "crystals" : undefined);
}

export default function ChemistryMaterialDrawing({ material }: { material: Material }) {
  const form = chemistryMaterialForm(material);
  if (!form) return null;
  const stroke = "#426b7d";
  const color = colors[material.id] || "#e8eff3";
  let sample;
  switch (form) {
    case "wire":
      sample = <path d="M19 72L23 64C6 51 22 21 41 23C61 25 71 47 56 61C44 72 24 64 27 48C30 34 50 33 54 46C58 60 39 63 36 52L38 47" fill="none" stroke="#a86a39" strokeWidth="5" strokeLinecap="round" />;
      break;
    case "nail":
      sample = <><path d="M27 23L36 15L49 30L40 38Z" fill="#9cabb5" stroke={stroke} strokeWidth="2" /><path d="M34 32L41 26L65 70L68 81L59 74Z" fill="#b8c6cc" stroke={stroke} strokeWidth="2" /></>;
      break;
    case "ribbon":
      sample = <><path d="M18 23H27V57Q27 75 44 75Q63 75 63 56V31H54V56Q54 66 44 66Q36 66 36 57V23Z" fill="#b8c6cc" stroke={stroke} strokeWidth="2" /><path d="M18 23L23 16H36V23" fill="#e8eff3" stroke={stroke} strokeWidth="2" /></>;
      break;
    case "plate":
      sample = <><path d="M17 32L56 19L66 61L27 76Z" fill="#97a8b5" stroke={stroke} strokeWidth="2" /><path d="M27 76V81L68 66L66 61M17 32L27 76M27 42L50 34M30 54L55 44" fill="none" stroke={stroke} strokeWidth="2" /></>;
      break;
    case "foil":
      sample = <><path d="M16 26L41 17L64 26L60 74L39 79L17 68Z" fill="#d2e5ec" stroke={stroke} strokeWidth="2" /><path d="M41 17L34 40L47 58L39 79M16 26L34 40L60 74M64 26L34 40L17 68" fill="none" stroke={stroke} strokeWidth="1.5" /></>;
      break;
    case "metal":
      sample = <><path d="M16 50L30 30L56 35L65 63L46 76L21 69Z" fill="#c5cfd4" stroke={stroke} strokeWidth="2" /><path d="M30 30L39 51L56 35M39 51L46 76M16 50L39 51L65 63" fill="none" stroke={stroke} strokeWidth="1.5" /></>;
      break;
    case "cabbage":
      sample = <><ellipse cx="40" cy="49" rx="27" ry="29" fill="#89507f" stroke={stroke} strokeWidth="2" /><path d="M39 77C17 63 16 37 35 24C50 17 67 43 52 66M39 77C59 51 45 30 33 28M17 45Q32 40 40 57M62 43Q48 39 42 62M25 66Q34 56 39 77" fill="none" stroke="#e7cee2" strokeWidth="2" /></>;
      break;
    case "pieces":
      sample = <>{["M13 60L21 42L34 45L41 60L31 73L17 71Z", "M37 38L47 24L63 29L68 43L58 56L43 52Z", "M43 67L49 55L64 58L68 71L57 79L46 77Z"].map(path => <path key={path} d={path} fill={color} stroke={stroke} strokeWidth="2" />)}</>;
      break;
    case "powder":
    case "grains":
    case "yeast":
      sample = <><path d="M13 63Q40 77 67 63L61 77Q40 87 19 77Z" fill="#e7f4f8" stroke={stroke} strokeWidth="2" />
        {Array.from({ length: form === "powder" ? 24 : 15 }, (_, index) => {
          const x = 19 + index % 6 * 8 + Math.floor(index / 6) % 2 * 3;
          const y = 64 - Math.floor(index / 6) * 7;
          return form === "yeast" ? <ellipse key={index} cx={x} cy={y} rx="2" ry="3.5" fill={color} stroke={stroke} strokeWidth=".8" /> : <circle key={index} cx={x} cy={y} r={form === "powder" ? 2 : 3} fill={color} stroke={stroke} strokeWidth=".8" />;
        })}</>;
      break;
    default:
      sample = <>{[[17, 48], [39, 55], [36, 28]].map(([x, y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><path d="M0 0L13-7L26 0V18L13 25L0 18Z" fill={color} stroke={stroke} strokeWidth="2" /><path d="M0 0L13 7L26 0M13 7V25" fill="none" stroke={stroke} strokeWidth="1.5" /></g>)}</>;
  }
  return <svg viewBox="0 0 80 95" aria-hidden="true" className="equipment-drawing" data-material-form={form}>{sample}</svg>;
}
