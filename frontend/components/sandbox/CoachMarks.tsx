"use client";
import { useEffect, useState } from "react";
import { readLocal, writeLocal } from "@/services/labRepository";

const stages = [
  {
    id: "add",
    target: "rack",
    text: "Seret alat atau bahan dari rak ke meja kerja.",
  },
  {
    id: "pour",
    target: "controls",
    text: "Tuang atau campur bahan. Coba kombinasi apa pun!",
  },
  {
    id: "measure",
    target: "observations",
    text: "Baca alat ukur untuk melihat apa yang berubah.",
  },
  {
    id: "undo",
    target: "toolbar",
    text: "Salah? Tekan Undo atau Reset, bebas mencoba lagi.",
  },
  {
    id: "note",
    target: "notebook",
    text: "Tulis pengamatanmu di Buku Catatan Lab, kalau mau.",
  },
];
export default function CoachMarks({
  open,
  onClose,
  actions,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  actions: string[];
  onNavigate: (target:string)=>void;
}) {
  const [stage, setStage] = useState(0);
  useEffect(()=>{if(open)setStage(0);},[open]);
  useEffect(() => {
    if (!open) return;
    const target = document.getElementById(`sandbox-${stages[stage].target}`);
    target?.classList.add("sandbox-coach-target");
    target?.setAttribute("aria-describedby", "sandbox-coach-text");
    return () => {
      target?.classList.remove("sandbox-coach-target");
      target?.removeAttribute("aria-describedby");
    };
  }, [open, stage]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <aside className="sandbox-coach" aria-label="Cara pakai opsional">
      <div>
        <strong>
          Cara pakai ·{" "}
          {actions.filter((id) => stages.some((s) => s.id === id)).length}/5
          sudah dicoba
        </strong>
        <button className="button ghost small" onClick={onClose}>
          Lewati
        </button>
      </div>
      <nav aria-label="Bagian cara pakai">
        {stages.map((s, i) => (
          <button
            key={s.id}
            aria-pressed={stage === i}
            className={stage === i ? "active" : ""}
            onClick={() => {
              setStage(i);
              onNavigate(s.target);
              document
                .getElementById(`sandbox-${s.target}`)
                ?.scrollIntoView({ block: "nearest", behavior: "auto" });
            }}
          >
            {actions.includes(s.id) ? "✓ " : ""}
            {i + 1}
          </button>
        ))}
      </nav>
      <p id="sandbox-coach-text">{stages[stage].text}</p>
      <small>Meja tetap bisa dipakai. Esc untuk menutup.</small>
    </aside>
  );
}
export function useIntroduction() {
  const [offer, setOffer] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOffer(readLocal("labora-sandbox-intro") !== "seen");
  }, []);
  const dismiss = () => {
    writeLocal("labora-sandbox-intro", "seen");
    setOffer(false);
    setOpen(false);
  };
  const start = () => {
    writeLocal("labora-sandbox-intro", "seen");
    setOffer(false);
    setOpen(true);
  };
  return { offer, open, dismiss, start };
}
