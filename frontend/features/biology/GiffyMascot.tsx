"use client";

export default function GiffyMascot({ line }: { line: string }) {
  return <div className="sim-mascot giffy-mascot" aria-label="Panduan Giffy">
    <svg viewBox="0 0 80 96" width="64" height="76" aria-hidden="true">
      <path d="M30 34h20l5 45H25Z" fill="#efc577" stroke="#785637" strokeWidth="2" />
      <path d="M31 46l7-3 5 7-8 6Z M43 60l8 3-2 8-8-2Z M27 68l7-3 5 8-8 5Z" fill="#b78448" />
      <path d="M28 15 26 5 M49 15 52 5" stroke="#785637" strokeWidth="4" strokeLinecap="round" />
      <circle cx="26" cy="5" r="4" fill="#9b6c3f" /><circle cx="52" cy="5" r="4" fill="#9b6c3f" />
      <path d="M23 18Q7 5 9 22Q15 28 25 24 M54 18Q70 5 71 22Q64 29 54 24" fill="#efc577" stroke="#785637" strokeWidth="2" />
      <path d="M22 18Q39 7 56 18L57 37Q40 49 23 38Z" fill="#efc577" stroke="#785637" strokeWidth="2" />
      <ellipse cx="39" cy="37" rx="18" ry="10" fill="#f8dda7" stroke="#785637" strokeWidth="2" />
      <circle cx="30" cy="24" r="7" fill="#fff" stroke="#365f27" strokeWidth="1.5" />
      <circle cx="48" cy="24" r="7" fill="#fff" stroke="#365f27" strokeWidth="1.5" />
      <path d="M37 24h4" stroke="#365f27" strokeWidth="2" />
      <circle cx="31" cy="25" r="2.5" fill="#1f2430" /><circle cx="47" cy="25" r="2.5" fill="#1f2430" />
      <circle cx="32" cy="35" r="1.5" fill="#785637" /><circle cx="46" cy="35" r="1.5" fill="#785637" />
      <path d="M34 41q5 4 10 0" fill="none" stroke="#785637" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24 75 13 83l-4 11h62l-4-11-13-8-14 9Z" fill="#fff" stroke="#a5bca0" strokeWidth="2" />
      <path d="M24 75l10 19 M54 75 44 94" stroke="#a5bca0" strokeWidth="1.5" />
      <path d="M55 82q10-5 10 5-7 8-10-5Z" fill="#7ed957" stroke="#365f27" strokeWidth="1.5" />
      <circle cx="39" cy="90" r="2" fill="#365f27" />
    </svg>
    <div className="sim-speech" role="status" aria-live="polite" aria-atomic="true"><strong>Giffy, teman eksperimenmu</strong><span>{line}</span></div>
  </div>;
}
