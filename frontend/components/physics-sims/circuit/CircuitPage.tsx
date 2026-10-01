"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import SimShell from "../shared/SimShell";
import CircuitCanvas, { CircuitRenderState } from "./CircuitCanvas";
import CircuitControls, { CircuitControlsState } from "./CircuitControls";
import EllieMascot from "../shared/EllieMascot";
import QuizPanel from "../shared/QuizPanel";
import { useCoachSteps, CoachStep } from "../../../lib/physics-sims/shared/coachSteps";
import { playNoiseBurst, playTone } from "../../../lib/physics-sims/shared/audio";
import {
  lampBrightness,
  shouldFuseBlow,
  shouldLampBurnOut,
  solveCircuit,
} from "../../../lib/physics-sims/circuit/engine";
import {
  assignNodes,
  CIRCUIT_PRESETS,
  PlacedComponent,
  toElectricalComponents,
} from "../../../lib/physics-sims/circuit/presets";

type CoachState = {
  selectedComponent: boolean;
  showMeters: boolean;
  shortCircuitSelected: boolean;
  fuseBlown: boolean;
};

const COACH_STEPS: CoachStep<CoachState>[] = [
  {
    id: "intro",
    message: () =>
      "Hai, aku Ellie! Klik lampu atau saklar pada rangkaian untuk melihat arus dan dayanya di panel kanan.",
    isDone: (state) => state.selectedComponent,
  },
  {
    id: "meters",
    message: () =>
      "Bagus! Centang \"Tampilkan voltmeter/amperemeter\" agar semua nilai arus dan daya terlihat sekaligus.",
    isDone: (state) => state.showMeters,
  },
  {
    id: "short",
    message: () =>
      "Sekarang pilih \"Demo korsleting\". Perhatikan arus melonjak karena kabel menghubungkan kutub baterai dengan hambatan hampir nol.",
    isDone: (state) => state.shortCircuitSelected,
  },
  {
    id: "fuse",
    message: (state) =>
      state.fuseBlown
        ? "Sekring putus dan membuka rangkaian. Arus berhenti: itulah fungsi pengaman sekring."
        : "Lihat sekringnya: jika arus melebihi rating 5 A, sekring akan putus dan memutus rangkaian.",
    isDone: (state) => state.fuseBlown,
  },
  {
    id: "done",
    message: () =>
      "Eksperimen selesai! Klik sekring yang putus lalu pilih \"Ganti Komponen\" untuk mengulanginya.",
    isDone: () => true,
  },
];

const QUIZ_QUESTIONS = [
  {
    prompt: "Mengapa arus menjadi sangat besar saat terjadi korsleting?",
    options: [
      "Tegangan baterai hilang",
      "Hambatan jalur menjadi sangat kecil",
      "Sekring menambah energi",
      "Lampu menghasilkan arus",
    ],
    answer: 1,
    explanation:
      "Menurut I = V/R, pada tegangan yang sama arus membesar ketika hambatan R mendekati nol.",
  },
  {
    prompt: "Apa fungsi sekring pada rangkaian?",
    options: [
      "Menaikkan tegangan",
      "Membuat lampu lebih terang",
      "Memutus rangkaian saat arus melewati batas aman",
      "Menyimpan muatan listrik",
    ],
    answer: 2,
    explanation:
      "Sekring meleleh atau putus ketika arus melampaui rating-nya, sehingga rangkaian terbuka dan arus berhenti.",
  },
  {
    prompt: "Dua resistor dipasang paralel. Bagaimana hambatan penggantinya dibanding masing-masing resistor?",
    options: [
      "Lebih besar dari keduanya",
      "Sama dengan resistor terbesar",
      "Lebih kecil dari resistor terkecil",
      "Selalu nol",
    ],
    answer: 2,
    explanation:
      "Cabang paralel menyediakan lebih banyak jalur arus, sehingga hambatan penggantinya lebih kecil dari setiap hambatan cabang.",
  },
];

const INITIAL_CONTROLS: CircuitControlsState = {
  presetId: CIRCUIT_PRESETS[0].id,
  showMeters: false,
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

function clonePreset(id: string): PlacedComponent[] {
  const preset = CIRCUIT_PRESETS.find((p) => p.id === id) ?? CIRCUIT_PRESETS[0];
  return preset.components.map((c) => ({ ...c }));
}

export default function CircuitPage() {
  const [controls, setControls] = useState(INITIAL_CONTROLS);
  const [components, setComponents] = useState<PlacedComponent[]>(() => clonePreset(INITIAL_CONTROLS.presetId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [overloadedId, setOverloadedId] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const coach = useCoachSteps(COACH_STEPS);

  const solution = useMemo(() => {
    if (paused) return null;
    const { nodeCount } = assignNodes(components);
    const electrical = toElectricalComponents(components);
    return solveCircuit(electrical, nodeCount);
  }, [components, paused]);

  // Detect overloads after every solve: if a fuse should blow or a lamp
  // should burn out given the just-solved currents/power, apply that state
  // change (triggering a re-solve next render) and play the matching
  // sound/flash effect once.
  useEffect(() => {
    if (!solution) return;
    for (const component of components) {
      if (component.kind === "fuse" && !component.blown) {
        const current = solution.branchCurrents[component.id] || 0;
        if (shouldFuseBlow({ ...component } as never, current)) {
          setComponents((prev) => prev.map((c) => (c.id === component.id ? { ...c, blown: true } : c)));
          setOverloadedId(component.id);
          playNoiseBurst(muted, 0.3, 0.3);
          return;
        }
      }
      if (component.kind === "lamp" && !component.burnedOut) {
        const power = solution.branchPower[component.id] || 0;
        if (shouldLampBurnOut({ ...component } as never, power)) {
          setComponents((prev) => prev.map((c) => (c.id === component.id ? { ...c, burnedOut: true } : c)));
          setOverloadedId(component.id);
          playTone(muted, { frequency: 100, duration: 0.3, type: "sawtooth" });
          return;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solution]);

  const handlePresetChange = useCallback((presetId: string) => {
    setComponents(clonePreset(presetId));
    setSelectedId(null);
    setOverloadedId(null);
  }, []);

  const handleReset = useCallback(() => {
    setComponents(clonePreset(controls.presetId));
    setSelectedId(null);
    setOverloadedId(null);
    coach.reset();
  }, [coach, controls.presetId]);

  const handleToggleSwitch = useCallback((id: string) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, closed: !c.closed } : c)));
    playTone(muted, { frequency: 500, duration: 0.08, type: "square" });
  }, [muted]);

  const handleReplaceComponent = useCallback((id: string) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, blown: false, burnedOut: false } : c)));
    setOverloadedId(null);
    playTone(muted, { frequency: 600, duration: 0.15, type: "sine" });
  }, [muted]);

  const currents = solution?.branchCurrents || {};
  const brightness: Record<string, number> = {};
  for (const component of components) {
    if (component.kind === "lamp") {
      brightness[component.id] = lampBrightness({ ...component } as never, solution?.branchPower[component.id] || 0);
    }
  }

  const canvasState: CircuitRenderState = {
    components,
    currents,
    brightness,
    overloadedId,
    reducedMotion,
  };

  const selectedComponent = components.find((c) => c.id === selectedId) || null;
  const selectedCurrent = selectedComponent ? currents[selectedComponent.id] ?? null : null;
  const selectedPower = selectedComponent ? solution?.branchPower[selectedComponent.id] ?? null : null;

  const coachState: CoachState = {
    selectedComponent: !!selectedComponent,
    showMeters: controls.showMeters,
    shortCircuitSelected: controls.presetId === "shortCircuit",
    fuseBlown: components.some((component) => component.kind === "fuse" && component.blown),
  };
  coach.evaluate(coachState);

  return (
    <SimShell
      title="Simulator Korsleting Listrik"
      explanation="Baterai menyediakan beda tegangan yang mendorong arus melalui jalur tertutup. Saklar terbuka menghentikan arus. Cabang paralel menyediakan lebih banyak jalur daripada rangkaian seri. Pada korsleting, hambatan sangat kecil menyebabkan arus besar; sekring putus untuk membuka jalur tersebut."
      objective="Bandingkan arus pada rangkaian seri dan paralel, lalu jelaskan bagaimana sekring melindungi rangkaian saat korsleting."
      interactionHint="Klik bagian tengah lampu, saklar, atau sekring untuk melihat nilainya. Gunakan tombol Buka/Tutup saklar di panel kanan."
      curriculumBadge="SMP 9 · SMA 12"
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      onReset={handleReset}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      mascot={<EllieMascot line={coach.activeStep.message(coachState)} />}
      stage={<CircuitCanvas state={canvasState} onSelect={setSelectedId} selectedId={selectedId} />}
      controls={
        <CircuitControls
          state={controls}
          onChange={(next) => {
            if (next.presetId) handlePresetChange(next.presetId);
            setControls((prev) => ({ ...prev, ...next }));
          }}
          presets={CIRCUIT_PRESETS}
          selectedComponent={selectedComponent}
          onToggleSwitch={handleToggleSwitch}
          onReplaceComponent={handleReplaceComponent}
          current={selectedCurrent}
          power={selectedPower}
        />
      }
      dataPanel={
        controls.showMeters && solution ? (
          <dl className="sim-data-grid">
            {components.map((component) => (
              <div key={component.id}>
                <dt>{component.kind} ({component.id})</dt>
                <dd>
                  {Math.abs(solution.branchCurrents[component.id] || 0).toFixed(2)} A ·{" "}
                  {(solution.branchPower[component.id] || 0).toFixed(1)} W
                </dd>
              </div>
            ))}
          </dl>
        ) : undefined
      }
      formula={
        <>
          <p>
            Rangkaian diselesaikan dengan analisis simpul (nodal analysis):
            setiap titik sambungan punya tegangan, dan jumlah arus yang
            masuk/keluar dari setiap titik harus nol. Arus di setiap
            komponen dihitung dari hukum Ohm I = V/R menggunakan selisih
            tegangan di kedua ujungnya.
          </p>
          <p>
            Arus konvensional mengalir dari kutub positif baterai ke kutub
            negatif melalui rangkaian luar (titik-titik biru di animasi).
            Secara fisik, elektron sebenarnya bergerak berlawanan arah
            (dari kutub negatif ke positif), tetapi arah arus konvensional
            adalah yang digunakan dalam semua rumus dan rangkaian.
          </p>
          <p>
            Korsleting terjadi ketika ada jalur dengan hambatan sangat
            kecil (misalnya kabel langsung) menghubungkan kedua kutub
            baterai, menyebabkan arus sangat besar. Sekring akan putus
            (menjadi rangkaian terbuka) ketika arus yang melaluinya
            melebihi nilai rating-nya, melindungi komponen lain dari
            kerusakan. Lampu akan putus jika daya yang didisipasikannya
            (P = I²R) melebihi batas maksimumnya.
          </p>
        </>
      }
      quiz={<QuizPanel title="Uji Pemahaman" questions={QUIZ_QUESTIONS} />}
    />
  );
}
