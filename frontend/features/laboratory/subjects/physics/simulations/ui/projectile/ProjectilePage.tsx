"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCoachSteps } from "../../application/coachSteps";
import type { CoachStep } from "../../application/coachSteps";
import { useFixedTimestepLoop } from "../../application/gameLoop";
import {
  analyticFlightTime,
  analyticMaxHeight,
  analyticRange,
  hitsObstacle,
  hitsTarget,
  launchProjectile,
  stepProjectile,
} from "../../domain/projectile/engine";
import type { ProjectileState } from "../../domain/projectile/engine";
import { PROJECTILE_LEVELS } from "../../domain/projectile/levels";
import { PHYSICS_DT, PLANETS } from "../../domain/shared/config";
import type { Vector2 } from "../../domain/shared/vector2";
import { playNoiseBurst, playTone } from "../../infrastructure/audio";
import EllieMascot from "../shared/EllieMascot";
import QuizPanel from "../shared/QuizPanel";
import SimShell from "../shared/SimShell";
import ProjectileCanvas from "./ProjectileCanvas";
import type { ProjectileRenderState } from "./ProjectileCanvas";
import ProjectileControls from "./ProjectileControls";
import type { ProjectileControlsState } from "./ProjectileControls";
import { useSimulationSave } from "../../../../../application/useSimulationSave";
import { object, numeric } from "../../../../../application/snapshotValidation";

type CoachState = {
  hasLaunched: boolean;
  isAtApex: boolean;
  hasHitTarget: boolean;
  hasLanded: boolean;
  dragEnabled: boolean;
};

const COACH_STEPS: CoachStep<CoachState>[] = [
  {
    id: "intro",
    message: () =>
      'Hai, aku Ellie! Atur sudut dan kecepatan tembak di kanan, lalu tekan "Tembak!" untuk melihat lintasannya.',
    isDone: (s) => s.hasLaunched,
  },
  {
    id: "watch-apex",
    message: () =>
      "Perhatikan panah hijau (v_y). Di titik tertinggi, panah itu akan menghilang karena v_y = 0.",
    isDone: (s) => s.isAtApex || s.hasLanded,
  },
  {
    id: "check-result",
    message: (s) =>
      s.hasHitTarget
        ? "Kena target! Tanpa drag dan pada kecepatan yang sama, bandingkan jangkauan 30°, 45°, dan 60°. Mana yang paling jauh?"
        : "Belum kena. Coba sesuaikan sudut atau kecepatannya, lalu tembak lagi.",
    isDone: (s) => s.dragEnabled,
  },
  {
    id: "try-drag",
    message: () =>
      "Bagus, sekarang hambatan udara aktif. Bandingkan jalur solid (dengan drag) dan garis putus-putus (tanpa drag).",
    isDone: () => true,
  },
];

const QUIZ_QUESTIONS = [
  {
    prompt:
      "Pada sudut berapa jangkauan proyektil paling jauh (tanpa hambatan udara)?",
    options: ["15°", "30°", "45°", "90°"],
    answer: 2,
    explanation:
      "R = v₀²sin(2θ)/g maksimum ketika sin(2θ) = 1, yaitu saat 2θ = 90° atau θ = 45°.",
  },
  {
    prompt:
      "Berapa komponen kecepatan vertikal (v_y) proyektil di titik tertinggi lintasannya?",
    options: ["Sama dengan v₀", "Nol", "Maksimum", "Negatif"],
    answer: 1,
    explanation:
      "Di titik tertinggi, proyektil berhenti bergerak naik sebelum mulai turun, sehingga v_y = 0 sesaat.",
  },
  {
    prompt:
      "Jika hambatan udara diaktifkan, benda manakah yang jaraknya lebih jauh pada sudut dan kecepatan awal yang sama?",
    options: [
      "Benda yang lebih ringan",
      "Benda yang lebih berat",
      "Keduanya sama",
      "Tidak bisa ditentukan",
    ],
    answer: 1,
    explanation:
      "Gaya hambat tidak bergantung pada massa, tapi percepatan akibat hambatan (a=F/m) lebih kecil untuk benda yang lebih berat, jadi ia lebih sedikit terpengaruh drag.",
  },
];

const CROSS_SECTION_AREA = 0.045; // m^2, a cannonball-sized sphere
const DRAG_COEFFICIENT = 0.47; // sphere

const INITIAL_CONTROLS: ProjectileControlsState = {
  angleDeg: 45,
  speed: 20,
  mass: 2,
  dragEnabled: false,
  planetId: "earth",
  levelIndex: 0,
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

export default function ProjectilePage() {
  const [controls, setControls] = useState(INITIAL_CONTROLS);
  const cloud = useSimulationSave(
    "projectile",
    controls,
    setControls,
    (v: unknown): v is ProjectileControlsState =>
      object(v) &&
      numeric(v.angleDeg, 0, 90) &&
      numeric(v.speed, 1, 100) &&
      numeric(v.mass, 0.01, 1000) &&
      typeof v.dragEnabled === "boolean" &&
      typeof v.planetId === "string" &&
      v.planetId in PLANETS &&
      numeric(v.levelIndex, 0, PROJECTILE_LEVELS.length - 1) &&
      Number.isInteger(v.levelIndex),
  );
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const coach = useCoachSteps(COACH_STEPS);

  const projectileState = useRef<ProjectileState | null>(null);
  const hasHitTarget = useRef(false);
  const trajectoryRef = useRef<Vector2[]>([]);
  const [renderTick, setRenderTick] = useState(0);

  const level = PROJECTILE_LEVELS[controls.levelIndex];
  const planet = PLANETS[controls.planetId];

  const comparisonTrajectory = useRef<Vector2[]>([]);
  useEffect(() => {
    // Recompute the drag-free comparison trail whenever shot parameters change.
    let state = launchProjectile(controls.angleDeg, controls.speed);
    const path: Vector2[] = [state.position];
    const params = {
      gravity: planet.gravity,
      mass: controls.mass,
      dragEnabled: false,
      dragCoefficient: DRAG_COEFFICIENT,
      airDensity: 0,
      crossSectionArea: CROSS_SECTION_AREA,
    };
    let safety = 0;
    while (!state.landed && safety < 6000) {
      state = stepProjectile(state, params);
      path.push(state.position);
      safety += 1;
    }
    comparisonTrajectory.current = path;
    setRenderTick((t) => t + 1);
  }, [controls.angleDeg, controls.speed, controls.mass, planet.gravity]);

  const handleLaunch = useCallback(() => {
    projectileState.current = launchProjectile(
      controls.angleDeg,
      controls.speed,
    );
    trajectoryRef.current = [projectileState.current.position];
    hasHitTarget.current = false;
    setPaused(false);
    playTone(muted, { frequency: 220, duration: 0.2, type: "square" });
  }, [controls.angleDeg, controls.speed, muted]);

  const handleReset = useCallback(() => {
    projectileState.current = null;
    trajectoryRef.current = [];
    hasHitTarget.current = false;
    coach.reset();
    setRenderTick((t) => t + 1);
  }, [coach]);

  const previousVy = useRef(0);
  const stepSimulation = useCallback(
    (dt: number) => {
      const current = projectileState.current;
      if (!current || current.landed) return;
      previousVy.current = current.velocity.y;
      const params = {
        gravity: planet.gravity,
        mass: controls.mass,
        dragEnabled: controls.dragEnabled,
        dragCoefficient: DRAG_COEFFICIENT,
        airDensity: planet.airDensity,
        crossSectionArea: CROSS_SECTION_AREA,
      };
      const next = stepProjectile(current, params, dt);
      projectileState.current = next;
      trajectoryRef.current.push(next.position);

      if (!hasHitTarget.current) {
        for (const obstacle of level.obstacles) {
          if (hitsObstacle(next.position, obstacle)) {
            projectileState.current = { ...next, landed: true };
            playNoiseBurst(muted, 0.15, 0.15);
            break;
          }
        }
        if (hitsTarget(next.position, level.target)) {
          hasHitTarget.current = true;
          playTone(muted, { frequency: 660, duration: 0.3, type: "triangle" });
        }
      }
      if (next.landed && !hasHitTarget.current) {
        playTone(muted, { frequency: 150, duration: 0.2, type: "sawtooth" });
      }
    },
    [planet, controls.mass, controls.dragEnabled, level, muted],
  );

  const render = useCallback(() => setRenderTick((t) => t + 1), []);

  useFixedTimestepLoop(
    PHYSICS_DT,
    stepSimulation,
    render,
    paused || !projectileState.current,
  );

  const current = projectileState.current;
  const isAtApex =
    !!current && previousVy.current > 0 && current.velocity.y <= 0;

  const canvasState: ProjectileRenderState = {
    trajectory: trajectoryRef.current,
    comparisonTrajectory: comparisonTrajectory.current,
    currentPosition: current?.position ?? { x: 0, y: 0 },
    currentVelocity: current?.velocity ?? { x: 0, y: 0 },
    isAtApex,
    hasLaunched: !!current,
    level,
    targetHit: hasHitTarget.current,
    reducedMotion,
  };

  const theoreticalRange = analyticRange(
    controls.angleDeg,
    controls.speed,
    planet.gravity,
  );
  const theoreticalHeight = analyticMaxHeight(
    controls.angleDeg,
    controls.speed,
    planet.gravity,
  );
  const theoreticalTime = analyticFlightTime(
    controls.angleDeg,
    controls.speed,
    planet.gravity,
  );

  coach.evaluate({
    hasLaunched: !!current,
    isAtApex,
    hasHitTarget: hasHitTarget.current,
    hasLanded: !!current?.landed,
    dragEnabled: controls.dragEnabled,
  });

  return (
    <SimShell
      cloud={cloud}
      title="Meriam & Target"
      explanation="Bola bergerak ke depan sekaligus naik dan turun. Gravitasi terus mengurangi kecepatan ke atas sampai bola mulai jatuh. Hambatan udara melawan gerak dan biasanya memperpendek jangkauan. Ubah satu slider, lalu bandingkan hasil tembakan."
      objective="Temukan sudut dan kecepatan yang membuat bola mengenai target. Bandingkan lintasan dengan dan tanpa hambatan udara."
      interactionHint="Geser pengaturan tembakan, lalu tekan Tembak! Garis putus-putus adalah prediksi tanpa drag."
      curriculumBadge="SMA Kelas 10"
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      onReset={handleReset}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      mascot={
        <EllieMascot
          line={coach.activeStep.message({
            hasLaunched: !!current,
            isAtApex,
            hasHitTarget: hasHitTarget.current,
            hasLanded: !!current?.landed,
            dragEnabled: controls.dragEnabled,
          })}
        />
      }
      stage={<ProjectileCanvas state={canvasState} />}
      controls={
        <ProjectileControls
          state={controls}
          onChange={(next) => setControls((prev) => ({ ...prev, ...next }))}
          levels={PROJECTILE_LEVELS}
          onLaunch={handleLaunch}
          canLaunch={!current || current.landed}
        />
      }
      dataPanel={
        <dl className="sim-data-grid">
          <div>
            <dt>Jarak (teori)</dt>
            <dd>{theoreticalRange.toFixed(1)} m</dd>
          </div>
          <div>
            <dt>Jarak (simulasi)</dt>
            <dd>{current ? current.position.x.toFixed(1) : "–"} m</dd>
          </div>
          <div>
            <dt>Tinggi maks (teori)</dt>
            <dd>{theoreticalHeight.toFixed(1)} m</dd>
          </div>
          <div>
            <dt>Waktu terbang (teori)</dt>
            <dd>{theoreticalTime.toFixed(1)} s</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              {hasHitTarget.current
                ? "Target kena!"
                : current?.landed
                  ? "Mendarat"
                  : current
                    ? "Melayang"
                    : "Siap"}
            </dd>
          </div>
        </dl>
      }
      formula={
        <>
          <p>
            Tanpa hambatan udara, posisi proyektil mengikuti x = v₀cosθ·t dan y
            = v₀sinθ·t − ½gt². Jarak terjauh (jangkauan) dicapai pada sudut 45°,
            dirumuskan R = v₀²sin(2θ)/g.
          </p>
          <p>
            Dengan hambatan udara (drag kuadratik), gaya hambat F_d = ½ρC_d A·v²
            melawan arah gerak, sehingga percepatannya a = F_d/m. Karena
            percepatan berbanding terbalik dengan massa, benda yang lebih berat
            lebih sedikit terpengaruh drag dan jaraknya lebih jauh dibanding
            benda ringan pada sudut dan kecepatan awal yang sama. Saat drag
            dimatikan, massa sama sekali tidak mempengaruhi lintasan.
          </p>
          <p>
            Di titik tertinggi lintasan, komponen kecepatan vertikal v_y = 0,
            yang ditandai pada simulasi di atas.
          </p>
        </>
      }
      quiz={<QuizPanel title="Uji Pemahaman" questions={QUIZ_QUESTIONS} />}
    />
  );
}
