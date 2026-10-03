import { useState } from "react";
import { microscopePhotoViewBox } from "./microscope";
import type { MicroscopeSlide, Objective } from "./microscope";

export default function MicroscopeField({
  slide,
  objective,
  focus,
  light,
}: {
  slide: MicroscopeSlide;
  objective: Objective;
  focus: number;
  light: number;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  return (
    <div className="microscope-photo">
      <svg
        className="microscope-specimen"
        viewBox={microscopePhotoViewBox(slide, objective)}
        role="img"
        aria-busy={status === "loading"}
        aria-label={`Foto mikroskop ${slide.name}, simulasi objektif ${objective} kali, perbesaran total ${objective * 10} kali`}
        data-specimen={slide.id}
        data-objective={objective}
        style={{
          filter: `blur(${Math.abs(focus) * 0.3}px) brightness(${light / 80})`,
        }}
      >
        <image
          key={attempt}
          href={`/microscopy/${slide.id}.webp${attempt ? `?retry=${attempt}` : ""}`}
          x="0"
          y="0"
          width="1600"
          height="1600"
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
        />
      </svg>
      {status === "loading" && (
        <div className="microscope-photo-message" role="status">
          Memuat foto preparat...
        </div>
      )}
      {status === "error" && (
        <div className="microscope-photo-message" role="alert">
          <p>Foto preparat belum bisa dimuat.</p>
          <button
            className="button primary small"
            onClick={() => {
              setStatus("loading");
              setAttempt((n) => n + 1);
            }}
          >
            Muat ulang foto
          </button>
        </div>
      )}
    </div>
  );
}
