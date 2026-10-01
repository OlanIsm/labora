"use client";
// Ellie the Elephant, Labora's physics guide mascot (designSystem.md §12):
// calm, smart, analytical, soft blue-gray body, white lab coat, round
// glasses, yellow details. Mirrors the chemistry feature's LeoMascot
// pattern: an inline SVG portrait plus a speech bubble that reacts to
// simulation state via the `line` prop.
export default function EllieMascot({ line }: { line: string }) {
  return (
    <div className="sim-mascot" aria-label="Panduan Ellie">
      <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">
        <ellipse cx="32" cy="38" rx="19" ry="16" fill="#A9B9C8" />
        <ellipse cx="14" cy="30" rx="8" ry="10" fill="#A9B9C8" />
        <ellipse cx="50" cy="30" rx="8" ry="10" fill="#A9B9C8" />
        <path
          d="M26 42 Q24 54 28 58 Q31 60 31 56 L31 44 Z"
          fill="#A9B9C8"
        />
        <ellipse cx="32" cy="36" rx="12" ry="10" fill="#F5F7FA" />
        <circle cx="26" cy="33" r="5" fill="#fff" stroke="#4C546A" strokeWidth="1.2" />
        <circle cx="38" cy="33" r="5" fill="#fff" stroke="#4C546A" strokeWidth="1.2" />
        <line x1="31" y1="33" x2="33" y2="33" stroke="#4C546A" strokeWidth="1.2" />
        <circle cx="26" cy="33" r="2" fill="#1F2430" />
        <circle cx="38" cy="33" r="2" fill="#1F2430" />
        <path d="M28 41 Q32 44 36 41" stroke="#1F2430" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path
          d="M12 46 h40 a4 4 0 0 1 4 4 v2 a4 4 0 0 1 -4 4 h-40 a4 4 0 0 1 -4 -4 v-2 a4 4 0 0 1 4 -4 Z"
          fill="#fff"
        />
        <circle cx="32" cy="52" r="2" fill="#FFD84D" />
      </svg>
      <div className="sim-speech" role="status" aria-live="polite" aria-atomic="true">
        <strong>Ellie, teman eksperimenmu</strong>
        <span>{line}</span>
      </div>
    </div>
  );
}
