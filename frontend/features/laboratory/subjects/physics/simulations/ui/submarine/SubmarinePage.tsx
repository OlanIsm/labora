"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCoachSteps } from "../../application/coachSteps";
import type { CoachStep } from "../../application/coachSteps";
import { useFixedTimestepLoop } from "../../application/gameLoop";
import { FLUIDS, PHYSICS_DT, PLANETS } from "../../domain/shared/config";
import {
  buoyancyForce,
  CHALLENGE_HOLD_DURATION,
  CHALLENGE_TOLERANCE,
  classifyStatus,
  hydrostaticPressure,
  initialSubmarineState,
  stepSubmarine,
  weightForce,
} from "../../domain/submarine/engine";
import type {
  SubmarineParams,
  SubmarineState,
} from "../../domain/submarine/engine";
import { playTone } from "../../infrastructure/audio";
import EllieMascot from "../shared/EllieMascot";
import QuizPanel from "../shared/QuizPanel";
import SimShell from "../shared/SimShell";
import SubmarineCanvas from "./SubmarineCanvas";
import type { SubmarineRenderState } from "./SubmarineCanvas";
import SubmarineControls from "./SubmarineControls";
import type { SubmarineControlsState } from "./SubmarineControls";

type CoachState = {
  hasStarted: boolean;
  ballastWaterFraction: number;
  challengeMode: boolean;
  challengeWon: boolean;
};

const COACH_STEPS: CoachStep<CoachState>[] = [
  {
    id: "intro",
    message: () =>
      'Hai, aku Ellie! Tekan "Mulai dari permukaan" untuk melepas kapal selam ke dalam air.',
    isDone: (s) => s.hasStarted,
  },
  {
    id: "try-ballast",
    message: () =>
      'Coba geser "Air di tangki" ke atas 50%. Lihat kapal mulai tenggelam karena beratnya bertambah!',
    isDone: (s) => s.ballastWaterFraction > 0.5,
  },
  {
    id: "try-challenge",
    message: () =>
      'Bagus! Sekarang coba centang "Tahan di kedalaman target" dan atur ballast agar kapal melayang tepat di zona hijau.',
    isDone: (s) => s.challengeMode,
  },
  {
    id: "challenge-active",
    message: (s) =>
      s.challengeWon
        ? "Berhasil! Kapal melayang stabil di kedalaman target. Itu artinya W = Fa."
        : "Atur ballast perlahan sampai kapal berhenti bergerak tepat di zona hijau selama 5 detik.",
    isDone: () => true,
  },
];

const QUIZ_QUESTIONS = [
  {
    prompt:
      "Apa yang terjadi jika gaya apung (Fa) lebih besar daripada berat kapal (W)?",
    options: [
      "Kapal tenggelam",
      "Kapal terapung ke atas",
      "Kapal melayang diam",
      "Kapal meledak",
    ],
    answer: 1,
    explanation:
      "Jika Fa > W, ada gaya netto ke atas yang mendorong kapal naik hingga sebagian keluar dari air (terapung).",
  },
  {
    prompt:
      "Mengisi tangki pemberat dengan air membuat kapal lebih mudah tenggelam karena...",
    options: [
      "Volume kapal berkurang",
      "Massa kapal bertambah tanpa mengubah volume, sehingga W bertambah sementara Fa tetap",
      "Gaya apung bertambah",
      "Tekanan air berkurang",
    ],
    answer: 1,
    explanation:
      "Fa = ρ·V·g hanya bergantung pada volume yang tercelup, bukan massa. Menambah air ballast menambah massa (dan W) tanpa mengubah volume kapal, sehingga Fa tetap sama.",
  },
  {
    prompt:
      "Bagaimana tekanan hidrostatik berubah saat kapal selam menyelam lebih dalam?",
    options: [
      "Berkurang",
      "Tetap sama",
      "Bertambah secara linear dengan kedalaman",
      "Berubah secara acak",
    ],
    answer: 2,
    explanation:
      "P = P₀ + ρgh, sehingga tekanan bertambah secara linear seiring bertambahnya kedalaman h.",
  },
];

const HULL_HEIGHT = 4; // m
const HULL_VOLUME = 20; // m^3
const HULL_HEIGHT_PX = 36;

const INITIAL_CONTROLS: SubmarineControlsState = {
  ballastWaterFraction: 0,
  fluidId: "water",
  propellerForce: 0,
  challengeMode: false,
  challengeTargetDepth: 15,
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

const FLUID_COLORS: Record<string, string> = {
  water: "#60a5fa",
  seawater: "#3b82f6",
  oil: "#92754a",
  syrup: "#c026d3",
};

export default function SubmarinePage() {
  const [controls, setControls] = useState(INITIAL_CONTROLS);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const coach = useCoachSteps(COACH_STEPS);

  const subState = useRef<SubmarineState>(initialSubmarineState());
  const [renderTick, setRenderTick] = useState(0);
  const holdTimer = useRef(0);
  const [stars, setStars] = useState(0);
  const hasWon = useRef(false);
  const hasStartedRef = useRef(false);

  const fluid = FLUIDS[controls.fluidId];
  const params: SubmarineParams = {
    gravity: PLANETS.earth.gravity,
    fluidDensity: fluid.density,
    dragCoefficient: fluid.dragCoefficient,
    hullVolume: HULL_VOLUME,
    hullMass: fluid.density * HULL_VOLUME * 0.95, // slightly less dense than fluid by default
    surfaceY: 0,
  };

  const handleStart = useCallback(() => {
    subState.current = initialSubmarineState();
    holdTimer.current = 0;
    hasWon.current = false;
    hasStartedRef.current = true;
    setRenderTick((tick) => tick + 1);
    setStars(0);
    setPaused(false);
  }, []);

  const handleReset = useCallback(() => {
    subState.current = initialSubmarineState();
    holdTimer.current = 0;
    hasWon.current = false;
    hasStartedRef.current = false;
    coach.reset();
    setStars(0);
    setRenderTick((t) => t + 1);
  }, [coach]);

  const stepSimulation = useCallback(
    (dt: number) => {
      subState.current = {
        ...stepSubmarine(
          subState.current,
          params,
          HULL_HEIGHT,
          controls.propellerForce,
          dt,
        ),
        ballastWaterFraction: controls.ballastWaterFraction,
      };
      if (controls.challengeMode && !hasWon.current) {
        const withinTolerance =
          Math.abs(
            subState.current.depthBelowSurface - controls.challengeTargetDepth,
          ) <= CHALLENGE_TOLERANCE;
        if (withinTolerance) {
          holdTimer.current += dt;
          if (holdTimer.current >= CHALLENGE_HOLD_DURATION) {
            hasWon.current = true;
            setStars(3);
            playTone(muted, {
              frequency: 880,
              duration: 0.4,
              type: "triangle",
            });
          }
        } else {
          holdTimer.current = 0;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      params,
      controls.propellerForce,
      controls.ballastWaterFraction,
      controls.challengeMode,
      controls.challengeTargetDepth,
      muted,
    ],
  );

  const render = useCallback(() => setRenderTick((t) => t + 1), []);
  useFixedTimestepLoop(
    PHYSICS_DT,
    stepSimulation,
    render,
    paused || !hasStartedRef.current,
  );

  const current = subState.current;
  const weight = weightForce(current, params);
  const buoyancy = buoyancyForce(current, params, HULL_HEIGHT);
  const dragForce = params.dragCoefficient * current.velocity;
  const netForce = weight - buoyancy - dragForce - controls.propellerForce;
  const status = classifyStatus(netForce, current.velocity);
  const pressure = hydrostaticPressure(current.depthBelowSurface, params);

  const canvasState: SubmarineRenderState = {
    depthBelowSurface: current.depthBelowSurface,
    hullHeightPx: HULL_HEIGHT_PX,
    weightForce: weight,
    buoyancyForce: buoyancy,
    status,
    fluidColor: FLUID_COLORS[controls.fluidId],
    reducedMotion,
    challengeTargetDepth: controls.challengeMode
      ? controls.challengeTargetDepth
      : null,
    challengeTolerance: CHALLENGE_TOLERANCE,
  };

  const coachState: CoachState = {
    hasStarted: hasStartedRef.current,
    ballastWaterFraction: controls.ballastWaterFraction,
    challengeMode: controls.challengeMode,
    challengeWon: stars > 0,
  };
  coach.evaluate(coachState);

  return (
    <SimShell
      title="Lab Kapal Selam"
      explanation="Air mendorong kapal ke atas, sementara berat menariknya ke bawah. Mengisi tangki pemberat menambah massa tanpa memperbesar kapal. Saat gaya apung dan berat seimbang serta geraknya mereda, kapal dapat melayang. Semakin dalam kapal berada, semakin besar tekanan cairan di sekitarnya."
      objective="Seimbangkan berat dan gaya apung agar kapal melayang di zona target selama 5 detik."
      interactionHint="Kapal adalah tampilan hasil, bukan tombol. Gunakan slider Air di tangki dan Gaya dorong untuk mengendalikannya."
      curriculumBadge="SMP 8 · SMA 11"
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      onReset={handleReset}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      mascot={<EllieMascot line={coach.activeStep.message(coachState)} />}
      stage={<SubmarineCanvas state={canvasState} />}
      controls={
        <SubmarineControls
          state={controls}
          onChange={(next) => setControls((prev) => ({ ...prev, ...next }))}
          onReleaseFromSurface={handleStart}
        />
      }
      dataPanel={
        <dl className="sim-data-grid">
          <div>
            <dt>Kedalaman</dt>
            <dd>{current.depthBelowSurface.toFixed(1)} m</dd>
          </div>
          <div>
            <dt>Tekanan hidrostatik</dt>
            <dd>{(pressure / 1000).toFixed(1)} kPa</dd>
          </div>
          <div>
            <dt>Gaya berat (W)</dt>
            <dd>{(weight / 1000).toFixed(1)} kN</dd>
          </div>
          <div>
            <dt>Gaya apung (Fa)</dt>
            <dd>{(buoyancy / 1000).toFixed(1)} kN</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              {status === "sinking"
                ? "Tenggelam"
                : status === "floating"
                  ? "Terapung"
                  : "Melayang"}
            </dd>
          </div>
          {controls.challengeMode && (
            <div>
              <dt>Tantangan</dt>
              <dd>
                {stars > 0
                  ? "★★★ Berhasil!"
                  : `${holdTimer.current.toFixed(1)}s / ${CHALLENGE_HOLD_DURATION}s`}
              </dd>
            </div>
          )}
        </dl>
      }
      formula={
        <>
          <p>
            Berat kapal W = m_total · g, dengan m_total = massa kapal + massa
            air di tangki pemberat. Gaya apung (hukum Archimedes) Fa = ρ_cairan
            · V_tercelup · g.
          </p>
          <p>
            Jika W &gt; Fa, kapal tenggelam. Jika Fa &gt; W, kapal terapung.
            Jika W = Fa, kapal melayang pada kedalaman tetap. Mengisi tangki
            pemberat dengan air menambah massa (dan berat) tanpa mengubah volume
            kapal, sehingga Fa tetap sementara W bertambah.
          </p>
          <p>
            Tekanan hidrostatik bertambah seiring kedalaman: P = P₀ + ρgh, di
            mana P₀ adalah tekanan atmosfer di permukaan.
          </p>
        </>
      }
      quiz={<QuizPanel title="Uji Pemahaman" questions={QUIZ_QUESTIONS} />}
    />
  );
}
