import { flowerColor, seedShape } from "./garden";

export default function PeaPlant({ genes, showSeed = false, compact = false }: { genes: string; showSeed?: boolean; compact?: boolean }) {
  const purple = flowerColor(genes) === "purple", round = seedShape(genes) === "round";
  return <svg className={`pea-plant ${compact ? "compact" : ""}`} viewBox="0 0 120 150" aria-hidden="true">
    <path d="M60 132V49" fill="none" stroke="#527a41" strokeWidth="5" strokeLinecap="round" />
    <path d="M59 104Q24 110 21 80Q49 77 59 104 M62 91Q95 94 98 66Q74 65 62 91" fill="#9bc77d" stroke="#527a41" strokeWidth="2" />
    <path d="M24 83 57 102 M95 70 64 89" fill="none" stroke="#527a41" strokeWidth="1.5" />
    <path d="M58 75Q40 48 30 69" fill="none" stroke="#527a41" strokeWidth="2" strokeLinecap="round" />
    <g transform="translate(60 39)">
      {[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cx="0" cy="-15" rx="13" ry="20" transform={`rotate(${angle})`} fill={purple ? "#ab7ac5" : "#fffdf7"} stroke={purple ? "#754592" : "#a7b1a1"} strokeWidth="2" />)}
      <circle r="9" fill="#f1d477" stroke="#9d823f" strokeWidth="1.5" />
    </g>
    <path d="M33 128h54l-8 21H42Z" fill="#dbc4a5" stroke="#a58c6b" strokeWidth="2" />
    <path d="M31 127h58" stroke="#a58c6b" strokeWidth="4" strokeLinecap="round" />
    {showSeed && <g transform="translate(98 120)">
      {round ? <circle r="14" fill="#ead195" stroke="#8b7748" strokeWidth="2" /> : <path d="M-10-10Q-4-16 0-12Q7-17 12-8Q17-2 12 3Q15 10 6 13Q0 17-4 12Q-14 14-13 4Q-18-4-10-10Z" fill="#ead195" stroke="#8b7748" strokeWidth="2" />}
      {!round && <path d="M-6-7Q2 0-4 6 M4-8Q-2-2 7 4" fill="none" stroke="#a9905b" strokeWidth="1.5" />}
    </g>}
  </svg>;
}
