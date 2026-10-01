"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import SimShell from "../shared/SimShell";
import RollerCoasterCanvas, { RollerCoasterRenderState } from "./RollerCoasterCanvas";
import RollerCoasterControls, { RollerCoasterControlsState } from "./RollerCoasterControls";
import EllieMascot from "../shared/EllieMascot";
import QuizPanel from "../shared/QuizPanel";
import { useCoachSteps, CoachStep } from "../../../lib/physics-sims/shared/coachSteps";
import { useFixedTimestepLoop } from "../../../lib/physics-sims/shared/gameLoop";
import { playTone, playNoiseBurst } from "../../../lib/physics-sims/shared/audio";
import { PHYSICS_DT, PLANETS } from "../../../lib/physics-sims/shared/config";
import { TRACK_PRESETS } from "../../../lib/physics-sims/roller-coaster/presets";
import {
  buildTrackPolyline,
  buildTrackTable,
  CarParams,
  CarState,
  computeEnergy,
  ControlPoint,
  initialCarState,
  LANDING_SPEED_LIMIT,
  sampleAt,
  stepCar,
  totalTrackLength,
} from "../../../lib/physics-sims/roller-coaster/engine";

type CoachState = {
  hasReleased: boolean;
  isFinished: boolean;
  isDerailed: boolean;
  editable: boolean;
};

const COACH_STEPS: CoachStep<CoachState>[] = [
  {
    id: "intro",
    message: () =>
      "Hai, aku Ellie! Tekan \"Lepas Kereta\" untuk melihat keretanya meluncur di lintasan ini dulu.",
    isDone: (s) => s.hasReleased,
  },
  {
    id: "watch-energy",
    message: () => "Perhatikan bar energi: biru (EP) bertambah saat kereta naik. Saat turun, EP berubah menjadi hijau (EK) dan kereta makin cepat.",
    isDone: (s) => s.isFinished || s.isDerailed,
  },
  {
    id: "try-edit",
    message: (s) =>
      s.isDerailed
        ? "Kereta jatuh! Aktifkan \"Ubah lintasan\", naikkan titik awal atau kurangi gesekan, lalu coba lagi."
        : "Coba centang \"Ubah lintasan\" lalu seret titik ungu untuk membuat bukitmu sendiri.",
    isDone: (s) => s.editable,
  },
  {
    id: "explore",
    message: () => "Bagus! Seret titik-titik itu untuk mengubah bentuk lintasan, lalu lepas kereta lagi.",
    isDone: () => true,
  },
];

const QUIZ_QUESTIONS = [
  {
    prompt: "Saat kereta meluncur turun tanpa gesekan, apa yang terjadi pada energi totalnya (EP + EK)?",
    options: ["Bertambah", "Berkurang", "Tetap konstan", "Menjadi nol"],
    answer: 2,
    explanation: "Tanpa gesekan, energi mekanik total (EP + EK) kekal: energi potensial berubah menjadi energi kinetik, tapi jumlahnya tidak berubah.",
  },
  {
    prompt: "Kemana energi yang hilang akibat gesekan berubah menjadi?",
    options: ["Energi potensial", "Energi kinetik", "Panas", "Energi tidak hilang"],
    answer: 2,
    explanation: "Gesekan mengubah sebagian energi mekanik menjadi panas, sehingga EP + EK berkurang meski EP + EK + Panas tetap konstan.",
  },
  {
    prompt: "Mengapa kereta bisa jatuh di puncak loop jika terlalu lambat?",
    options: [
      "Karena gesekan terlalu besar",
      "Karena gravitasi tidak cukup menghasilkan gaya sentripetal yang dibutuhkan",
      "Karena massa kereta terlalu kecil",
      "Karena lintasannya terlalu panjang",
    ],
    answer: 1,
    explanation: "Di puncak loop, kereta butuh v² ≥ g·r agar gravitasi bisa menyediakan gaya sentripetal yang menahannya di jalur. Jika lebih lambat, kereta kehilangan kontak dengan lintasan.",
  },
];

const INITIAL_CONTROLS: RollerCoasterControlsState = {
  presetId: TRACK_PRESETS[0].id,
  mass: 10,
  frictionCoefficient: 0.03,
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}

export default function RollerCoasterPage() {
  const [controls, setControls] = useState(INITIAL_CONTROLS);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>(
    () => TRACK_PRESETS[0].controlPoints.map((p) => ({ ...p })),
  );
  const [editable, setEditable] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const coach = useCoachSteps(COACH_STEPS);

  const carState = useRef<CarState | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const hasAnnouncedOutcome = useRef(false);

  const table = buildTrackTable(buildTrackPolyline(controlPoints));
  const trackLength = totalTrackLength(table);
  const gravity = PLANETS.earth.gravity;
  const params: CarParams = {
    gravity,
    mass: controls.mass,
    frictionCoefficient: controls.frictionCoefficient,
  };
  const referenceHeight = table.length ? Math.min(...table.map((s) => s.position.y)) - 2 : 0;

  const handlePresetChange = useCallback((presetId: string) => {
    const preset = TRACK_PRESETS.find((p) => p.id === presetId) ?? TRACK_PRESETS[0];
    setControlPoints(preset.controlPoints.map((p) => ({ ...p })));
    carState.current = null;
    hasAnnouncedOutcome.current = false;
    setRenderTick((t) => t + 1);
  }, []);

  const handleRelease = useCallback(() => {
    carState.current = initialCarState();
    hasAnnouncedOutcome.current = false;
    setPaused(false);
    playTone(muted, { frequency: 300, duration: 0.2, type: "square" });
  }, [muted]);

  const handleReset = useCallback(() => {
    carState.current = null;
    hasAnnouncedOutcome.current = false;
    coach.reset();
    setRenderTick((t) => t + 1);
  }, [coach]);

  const stepSimulation = useCallback(
    (dt: number) => {
      const current = carState.current;
      if (!current || current.finished || current.derailed) return;
      const next = stepCar(current, table, params, trackLength, dt);
      carState.current = next;
      if (!hasAnnouncedOutcome.current && (next.finished || next.derailed)) {
        hasAnnouncedOutcome.current = true;
        if (next.derailed) playNoiseBurst(muted, 0.25, 0.2);
        else if (next.speed > LANDING_SPEED_LIMIT) playTone(muted, { frequency: 180, duration: 0.25, type: "sawtooth" });
        else playTone(muted, { frequency: 700, duration: 0.3, type: "triangle" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, trackLength, controls.mass, controls.frictionCoefficient, muted],
  );

  const render = useCallback(() => setRenderTick((t) => t + 1), []);
  useFixedTimestepLoop(PHYSICS_DT, stepSimulation, render, paused || !carState.current);

  const current = carState.current;
  const energy = current ? computeEnergy(current, table, params, referenceHeight) : null;
  const carWorldPosition = current ? sampleAt(table, current.arcLength).position : null;

  const canvasState: RollerCoasterRenderState = {
    controlPoints,
    trackSamples: table,
    carPosition: carWorldPosition,
    carRunning: !!current && !current.finished && !current.derailed,
    reducedMotion,
  };

  let outcomeMessage: { text: string; tone: "success" | "warning" } | null = null;
  if (current?.derailed) {
    outcomeMessage = {
      text: "Kereta jatuh! Kecepatan di puncak loop terlalu rendah untuk melawan gravitasi (v² < g·r).",
      tone: "warning",
    };
  } else if (current?.finished) {
    if (current.speed > LANDING_SPEED_LIMIT) {
      outcomeMessage = { text: `Terlalu kencang saat mendarat (${current.speed.toFixed(1)} m/s).`, tone: "warning" };
    } else if (current.speed < 0.5) {
      outcomeMessage = { text: "Berhenti di tengah jalan (gesekan terlalu besar).", tone: "warning" };
    } else {
      outcomeMessage = { text: `Sampai! Kecepatan akhir ${current.speed.toFixed(1)} m/s.`, tone: "success" };
    }
  }

  const totalEnergy = energy ? energy.total : 1;
  const pePercent = energy ? (energy.potential / totalEnergy) * 100 : 0;
  const kePercent = energy ? (energy.kinetic / totalEnergy) * 100 : 0;
  const heatPercent = energy ? (energy.heat / totalEnergy) * 100 : 0;

  const coachState: CoachState = {
    hasReleased: !!current,
    isFinished: !!current?.finished,
    isDerailed: !!current?.derailed,
    editable,
  };
  coach.evaluate(coachState);

  return (
    <SimShell
      title="Roller Coaster Maker"
      explanation="Di tempat tinggi, kereta menyimpan energi potensial. Saat turun, energi itu berubah menjadi energi kinetik sehingga kereta makin cepat. Gesekan mengubah sebagian energi menjadi panas. Bar energi menunjukkan perpindahan ini; energi tidak sekadar menghilang."
      objective="Buat kereta mencapai akhir lintasan dan cari tahu bagaimana ketinggian serta gesekan mengubah energinya."
      interactionHint={editable ? "Seret pegangan ungu untuk membentuk lintasan. Lepas Kereta untuk menguji bentuk barumu." : "Tekan Lepas Kereta. Aktifkan Ubah lintasan untuk menampilkan pegangan yang bisa diseret."}
      curriculumBadge="SMP 8 · SMA 10"
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      onReset={handleReset}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      mascot={<EllieMascot line={coach.activeStep.message(coachState)} />}
      stage={
        <RollerCoasterCanvas
          state={canvasState}
          editable={editable}
          onDragPoint={(index, point) => {
            setControlPoints((prev) => prev.map((p, i) => (i === index ? point : p)));
            carState.current = null;
            hasAnnouncedOutcome.current = false;
          }}
        />
      }
      controls={
        <RollerCoasterControls
          state={controls}
          onChange={(next) => {
            if (next.presetId) handlePresetChange(next.presetId);
            setControls((prev) => ({ ...prev, ...next }));
          }}
          presets={TRACK_PRESETS}
          onRelease={handleRelease}
          canRelease={!current || current.finished || current.derailed}
          editable={editable}
          onToggleEditable={() => setEditable((e) => !e)}
        />
      }
      dataPanel={
        <>
          {outcomeMessage && (
            <p className={`sim-outcome-banner ${outcomeMessage.tone}`}>{outcomeMessage.text}</p>
          )}
          <div className="sim-energy-bar" aria-hidden="true">
            <span style={{ width: `${pePercent}%`, background: "#2f6fed" }} />
            <span style={{ width: `${kePercent}%`, background: "#27ae60" }} />
            <span style={{ width: `${heatPercent}%`, background: "#d9534f" }} />
          </div>
          <div className="sim-energy-legend">
            <span>
              <i style={{ background: "#2f6fed" }} /> EP: {energy ? energy.potential.toFixed(0) : "–"} J
            </span>
            <span>
              <i style={{ background: "#27ae60" }} /> EK: {energy ? energy.kinetic.toFixed(0) : "–"} J
            </span>
            <span>
              <i style={{ background: "#d9534f" }} /> Panas: {energy ? energy.heat.toFixed(0) : "–"} J
            </span>
            <span>Total: {energy ? energy.total.toFixed(0) : "–"} J</span>
          </div>
        </>
      }
      formula={
        <>
          <p>
            Energi potensial EP = mgh dan energi kinetik EK = ½mv². Tanpa
            gesekan, total energi mekanik (EP + EK) tetap konstan sepanjang
            lintasan, hanya berpindah bentuk.
          </p>
          <p>
            Dengan gesekan, sebagian energi berubah menjadi panas sebesar
            kerja gesekan (gaya gesek × jarak tempuh), sehingga EP + EK +
            Panas tetap konstan, tetapi EP + EK saja berkurang.
          </p>
          <p>
            Di puncak loop, kereta hanya aman jika kecepatannya cukup untuk
            menghasilkan gaya sentripetal yang dibutuhkan: v² ≥ g·r (r =
            radius loop). Jika v² kurang dari itu, gravitasi tidak cukup
            untuk menahan kereta di jalurnya dan ia akan jatuh.
          </p>
        </>
      }
      quiz={<QuizPanel title="Uji Pemahaman" questions={QUIZ_QUESTIONS} />}
    />
  );
}
