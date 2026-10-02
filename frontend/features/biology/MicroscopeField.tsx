import { useId, useRef, useState } from "react";
import { INITIAL_MICROSCOPE, MicroscopeSlide, microscopeFieldWidth, microscopePhotoViewBox } from "./microscope";

export default function MicroscopeField({ slide, objective, focus, light, pan, onPan }: {
  slide: MicroscopeSlide; objective: number; focus: number; light: number;
  pan: typeof INITIAL_MICROSCOPE.pan; onPan: (dx: number, dy: number) => void;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [panning, setPanning] = useState(false);
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const patternId = `micrograph-${useId().replace(/:/g, "")}`;
  const viewBox = microscopePhotoViewBox(slide, objective, pan);
  const [x, y, width] = viewBox.split(" ").map(Number);
  function finishPan() { drag.current = null; setPanning(false); }
  return <div className={`microscope-photo ${panning ? "panning" : ""}`} role="group" tabIndex={status === "ready" ? 0 : -1}
    aria-label={`Geser bidang pandang ${slide.name}`} aria-describedby="microscope-pan-help"
    onPointerDown={event => {
      if (status !== "ready" || event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      setPanning(true);
    }}
    onPointerMove={event => {
      if (!drag.current || drag.current.pointerId !== event.pointerId) return;
      const scale = microscopeFieldWidth(objective) / event.currentTarget.clientWidth;
      onPan((drag.current.x - event.clientX) * scale, (drag.current.y - event.clientY) * scale);
      drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    }}
    onPointerUp={event => {
      if (drag.current?.pointerId !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      finishPan();
    }}
    onPointerCancel={finishPan} onLostPointerCapture={finishPan}
    onKeyDown={event => {
      if (status !== "ready") return;
      const step = microscopeFieldWidth(objective) / 10;
      const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (moves[event.key]) { event.preventDefault(); onPan(...moves[event.key]); }
    }}>
    <svg className="microscope-specimen" viewBox={viewBox} role="img" aria-busy={status === "loading"}
      aria-label={`Foto mikroskop ${slide.name}, simulasi zoom ${objective} kali, perbesaran total ${objective * 10} kali`}
      data-specimen={slide.id} data-objective={objective} style={{ filter: `blur(${Math.abs(focus) * 0.3}px) brightness(${light / 80})` }}>
      <defs><pattern id={patternId} width="1600" height="1600" patternUnits="userSpaceOnUse">
        <image key={attempt} href={`/microscopy/${slide.id}.webp${attempt ? `?retry=${attempt}` : ""}`} width="1600" height="1600"
          onLoad={() => setStatus("ready")} onError={() => setStatus("error")} />
      </pattern></defs>
      <rect x={x} y={y} width={width} height={width} fill={`url(#${patternId})`} />
    </svg>
    {status === "loading" && <div className="microscope-photo-message" role="status">Memuat foto preparat...</div>}
    {status === "error" && <div className="microscope-photo-message" role="alert">
      <p>Foto preparat belum bisa dimuat.</p>
      <button className="button primary small" onClick={() => { setStatus("loading"); setAttempt(n => n + 1); }}>Muat ulang foto</button>
    </div>}
  </div>;
}
