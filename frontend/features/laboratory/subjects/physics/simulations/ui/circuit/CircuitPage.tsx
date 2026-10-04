"use client";
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CIRCUIT_CELL,
  CIRCUIT_HEIGHT,
  CIRCUIT_MARGIN,
  CIRCUIT_WIDTH,
  COMPONENT_NAMES,
  connectPoints,
  createComponent,
  moveComponent,
  rotateComponent,
  samePoint,
  snapPoint,
} from "../../domain/circuit/editor";
import {
  lampBrightness,
  shouldFuseBlow,
  shouldLampBurnOut,
  solveCircuit,
} from "../../domain/circuit/engine";
import type { ComponentKind } from "../../domain/circuit/engine";
import {
  assignNodes,
  CIRCUIT_PRESETS,
  toElectricalComponents,
} from "../../domain/circuit/presets";
import type { GridPoint, PlacedComponent } from "../../domain/circuit/presets";
import { playNoiseBurst, playTone } from "../../infrastructure/audio";
import EllieMascot from "../shared/EllieMascot";
import QuizPanel from "../shared/QuizPanel";
import SimShell from "../shared/SimShell";
import CircuitCanvas from "./CircuitCanvas";
import type { CircuitRenderState } from "./CircuitCanvas";
import CircuitControls from "./CircuitControls";
import type { CircuitControlsState } from "./CircuitControls";
import { useSimulationSave } from "../../../../../application/useSimulationSave";
import {
  object,
  numeric,
  point,
} from "../../../../../application/snapshotValidation";

const QUIZ_QUESTIONS = [
  {
    prompt:
      "Dua lampu dipasang seri. Bagaimana arus yang melewati kedua lampu?",
    options: [
      "Sama besar",
      "Lampu pertama selalu lebih besar",
      "Lampu kedua selalu lebih besar",
      "Tidak ada arus",
    ],
    answer: 0,
    explanation:
      "Rangkaian seri hanya memiliki satu jalur, sehingga arus yang melewati setiap komponen sama.",
  },
  {
    prompt:
      "Dua lampu dipasang paralel pada baterai. Bagaimana tegangan pada setiap cabang?",
    options: [
      "Dibagi dua",
      "Sama dengan tegangan sumber",
      "Selalu nol",
      "Bergantung pada jumlah kabel",
    ],
    answer: 1,
    explanation:
      "Setiap cabang paralel terhubung ke dua simpul yang sama, sehingga beda tegangannya sama (hambatan kabel diabaikan).",
  },
  {
    prompt:
      "Jika satu lampu dilepas dari rangkaian paralel, apa yang terjadi pada lampu di cabang lain?",
    options: [
      "Ikut padam",
      "Tetap menyala",
      "Selalu putus",
      "Tegangan menjadi nol",
    ],
    answer: 1,
    explanation:
      "Cabang lain masih memiliki jalur tertutup menuju baterai. Pada rangkaian seri, melepas satu lampu justru memutus satu-satunya jalur.",
  },
];

function clonePreset(id: string): PlacedComponent[] {
  return (CIRCUIT_PRESETS.find((p) => p.id === id)?.components || []).map(
    (c) => ({ ...c, from: { ...c.from }, to: { ...c.to } }),
  );
}

export default function CircuitPage() {
  const [controls, setControls] = useState<CircuitControlsState>({
    presetId: "empty",
    showMeters: false,
  });
  const [components, setComponents] = useState<PlacedComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [overloadedId, setOverloadedId] = useState<string | null>(null);
  const [wireMode, setWireMode] = useState(false);
  const [wireStart, setWireStart] = useState<GridPoint | null>(null);
  const [message, setMessage] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const nextId = useRef(0);
  const cloud = useSimulationSave(
    "circuit",
    { controls, components },
    (v) => {
      setControls(v.controls);
      setComponents(v.components);
      nextId.current = Date.now();
    },
    (
      v: unknown,
    ): v is { controls: CircuitControlsState; components: PlacedComponent[] } =>
      object(v) &&
      object(v.controls) &&
      typeof v.controls.presetId === "string" &&
      typeof v.controls.showMeters === "boolean" &&
      Array.isArray(v.components) &&
      v.components.length <= 200 &&
      v.components.every(
        (c) =>
          object(c) &&
          typeof c.id === "string" &&
          typeof c.kind === "string" &&
          c.kind in COMPONENT_NAMES &&
          object(c.from) &&
          numeric(c.from.col, 0, 200) &&
          numeric(c.from.row, 0, 200) &&
          object(c.to) &&
          numeric(c.to.col, 0, 200) &&
          numeric(c.to.row, 0, 200) &&
          Object.entries(c).every(
            ([k, value]) =>
              ![
                "voltage",
                "resistance",
                "fuseRatingAmps",
                "maxPowerWatts",
              ].includes(k) || numeric(value, 0, 100000),
          ),
      ),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const electrical = useMemo(
    () => toElectricalComponents(components),
    [components],
  );
  const solution = useMemo(
    () =>
      paused
        ? null
        : solveCircuit(electrical, assignNodes(components).nodeCount),
    [components, electrical, paused],
  );
  useEffect(() => {
    if (!solution) return;
    const broken =
      electrical.find((c) =>
        shouldFuseBlow(c, solution.branchCurrents[c.id] || 0),
      ) ||
      electrical.find((c) =>
        shouldLampBurnOut(c, solution.branchPower[c.id] || 0),
      );
    if (!broken) return;
    setComponents((prev) =>
      prev.map((c) =>
        c.id === broken.id
          ? {
              ...c,
              ...(c.kind === "fuse" ? { blown: true } : { burnedOut: true }),
            }
          : c,
      ),
    );
    setOverloadedId(broken.id);
    setMessage(
      `${COMPONENT_NAMES[broken.kind]} ${broken.id} putus karena kelebihan ${broken.kind === "fuse" ? "arus" : "daya"}. Pilih komponen untuk menggantinya.`,
    );
    playNoiseBurst(muted, 0.2, 0.15);
  }, [electrical, solution, muted]);

  function markCustom() {
    setControls((prev) => ({ ...prev, presetId: "custom" }));
  }
  function select(id: string | null) {
    setSelectedId(id);
    setWireMode(false);
    setWireStart(null);
  }
  function add(kind: ComponentKind, point?: GridPoint) {
    if (kind === "battery" && components.some((c) => c.kind === "battery")) {
      setMessage(
        "Satu baterai cukup untuk rangkaian ini. Ubah tegangan baterai yang sudah ada.",
      );
      return;
    }
    if (kind === "wire" && !point) {
      setWireMode(true);
      setWireStart(null);
      setMessage(
        "Klik terminal awal, lalu terminal tujuan untuk membuat kabel. Klik titik meja untuk membuat belokan.",
      );
      return;
    }
    if (!point) {
      const candidates = [1, 3, 5, 0, 2, 4].flatMap((row) =>
        [1, 4, 6].map((col) => ({ col, row })),
      );
      point = candidates.find(
        (p) =>
          !components.some(
            (c) =>
              c.kind !== "wire" &&
              (c.from.col + c.to.col) / 2 === p.col + 1 &&
              (c.from.row + c.to.row) / 2 === p.row,
          ),
      );
      if (!point) {
        setMessage(
          "Rak sudah memenuhi meja. Pindahkan atau hapus komponen untuk memberi ruang.",
        );
        return;
      }
    }
    const component = createComponent(
      kind,
      `${kind}-${++nextId.current}`,
      point,
    );
    setComponents((prev) => [...prev, component]);
    select(component.id);
    markCustom();
    setMessage(
      `${COMPONENT_NAMES[kind]} ditambahkan. Seret untuk memindahkan, atau klik kedua terminal untuk menyambungkan kabel.`,
    );
  }
  function drop(event: DragEndEvent) {
    if (event.over?.id !== "circuit-board") return;
    const rect = document
      .querySelector(".circuit-board")
      ?.getBoundingClientRect();
    const item = event.active.rect.current.translated;
    const kind = event.active.data.current?.kind as ComponentKind | undefined;
    if (!rect || !item || !kind) return;
    const point = snapPoint(
      (((item.left + item.width / 2 - rect.left) / rect.width) * CIRCUIT_WIDTH -
        CIRCUIT_MARGIN) /
        CIRCUIT_CELL -
        1,
      (((item.top + item.height / 2 - rect.top) / rect.height) *
        CIRCUIT_HEIGHT -
        CIRCUIT_MARGIN) /
        CIRCUIT_CELL,
    );
    add(kind, point);
  }
  function terminal(point: GridPoint) {
    setWireMode(true);
    if (!wireStart) {
      setWireStart(point);
      setMessage(
        "Terminal awal dipilih. Klik terminal tujuan, atau tekan Batal kabel.",
      );
      return;
    }
    if (samePoint(wireStart, point)) {
      setWireStart(null);
      setMessage("Sambungan dibatalkan.");
      return;
    }
    const next = connectPoints(
      components,
      `wire-${++nextId.current}`,
      wireStart,
      point,
    );
    setComponents(next);
    setWireStart(null);
    markCustom();
    setMessage(
      next === components
        ? "Kedua terminal ini sudah terhubung kabel."
        : "Kabel tersambung. Kamu bisa membuat kabel berikutnya atau kembali ke Pindahkan.",
    );
  }
  function move(id: string, dc: number, dr: number) {
    if (!dc && !dr) return;
    setComponents((prev) => moveComponent(prev, id, dc, dr));
    setWireStart(null);
    markCustom();
  }
  function remove(id: string) {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    select(null);
    markCustom();
    setMessage(
      "Komponen dihapus. Kabel lainnya tetap ada dan bisa dipilih untuk dihapus.",
    );
  }
  function load(presetId: string) {
    if (
      controls.presetId === "custom" &&
      components.length &&
      !window.confirm(
        "Ganti rangkaian? Susunan buatanmu saat ini akan diganti.",
      )
    )
      return;
    setComponents(clonePreset(presetId));
    select(null);
    setOverloadedId(null);
    setPaused(false);
    setMessage(
      presetId === "empty"
        ? "Meja dikosongkan. Tambahkan baterai untuk mulai."
        : "Contoh dimuat. Semua komponen dan kabel bisa kamu ubah.",
    );
    setControls((prev) => ({ ...prev, presetId }));
  }
  function update(id: string, values: Partial<PlacedComponent>) {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...values } : c)),
    );
    markCustom();
  }
  const battery = components.find((c) => c.kind === "battery");
  const current = solution?.branchCurrents[battery?.id || ""] || 0;
  const status = paused
    ? "Simulasi dijeda"
    : !battery
      ? "Tambahkan baterai"
      : Math.abs(current) < 1e-6
        ? "Rangkaian terbuka"
        : Math.abs(current) > 100
          ? "Korsleting: hambatan terlalu kecil"
          : "Arus mengalir";
  const selected = components.find((c) => c.id === selectedId) || null;
  const selectedElectrical = electrical.find((c) => c.id === selectedId);
  const selectedVoltage =
    solution && selectedElectrical
      ? Math.abs(
          (solution.nodeVoltages[selectedElectrical.nodeA] || 0) -
            (solution.nodeVoltages[selectedElectrical.nodeB] || 0),
        )
      : null;
  const canvasState: CircuitRenderState = {
    components,
    currents: solution?.branchCurrents || {},
    overloadedId,
    reducedMotion,
    brightness: Object.fromEntries(
      electrical
        .filter((c) => c.kind === "lamp")
        .map((c) => [
          c.id,
          lampBrightness(c, solution?.branchPower[c.id] || 0),
        ]),
    ),
  };
  const guide = !components.length
    ? "Hai, aku Ellie! Ambil baterai dan dua lampu dari rak. Klik terminal awal dan tujuan untuk menyambungkan kabel. Kamu bisa mulai dari contoh seri atau paralel juga."
    : wireStart
      ? "Titik kuning adalah awal kabelmu. Pilih terminal tujuan. Kabel hanya tersambung pada titik terminal, bukan saat garisnya sekadar berpotongan."
      : "Pada rangkaian seri, arus melalui kedua lampu sama. Pada paralel, tegangan kedua cabang sama. Coba ubah hambatan atau lepas satu lampu, lalu bandingkan hasilnya.";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={drop}
    >
      <div
        className="circuit-editor"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setWireMode(false);
            setWireStart(null);
            setMessage("Sambungan dibatalkan.");
          }
        }}
      >
        <SimShell
          cloud={cloud}
          title="Simulator Rangkaian Seri & Paralel"
          curriculumBadge="SMP 9 · SMA 12"
          explanation="Baterai mendorong arus melalui jalur tertutup. Dalam rangkaian seri, arus melewati setiap komponen secara berurutan dan hambatannya dijumlahkan. Dalam rangkaian paralel, arus terbagi ke beberapa cabang dengan tegangan yang sama. Terang lampu mengikuti daya listriknya; saklar terbuka menghentikan arus di jalurnya."
          objective="Buat rangkaianmu sendiri. Bandingkan arus, tegangan, dan terang lampu pada susunan seri dan paralel."
          interactionHint="Seret komponen dari rak ke meja. Klik dua terminal untuk membuat kabel; seret komponen untuk mengatur posisi. Pada ponsel, geser meja ke samping jika perlu."
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          onReset={() =>
            load(controls.presetId === "custom" ? "empty" : controls.presetId)
          }
          mascot={<EllieMascot line={guide} />}
          stage={
            <>
              <div
                className="circuit-board-toolbar"
                role="group"
                aria-label="Alat meja rangkaian"
              >
                <button
                  className="sim-chip"
                  aria-pressed={!wireMode}
                  onClick={() => {
                    setWireMode(false);
                    setWireStart(null);
                  }}
                >
                  Pindahkan
                </button>
                <button
                  className="sim-chip"
                  aria-pressed={wireMode}
                  onClick={() => {
                    setWireMode(true);
                    setWireStart(null);
                  }}
                >
                  Sambungkan kabel
                </button>
                {wireStart && (
                  <button
                    className="sim-chip"
                    onClick={() => {
                      setWireStart(null);
                      setWireMode(false);
                    }}
                  >
                    Batal kabel
                  </button>
                )}
                <span className="circuit-status" role="status">
                  {status}
                </span>
              </div>
              <CircuitCanvas
                state={canvasState}
                selectedId={selectedId}
                onSelect={select}
                wireMode={wireMode}
                wireStart={wireStart}
                onTerminal={terminal}
                onMove={move}
                onRemove={remove}
              />
              <p className="circuit-feedback" role="status">
                {message ||
                  "Terminal bulat menandai sambungan. Kabel yang berpotongan tanpa terminal tidak saling terhubung."}
              </p>
            </>
          }
          controls={
            <CircuitControls
              state={controls}
              presets={CIRCUIT_PRESETS}
              selectedComponent={selected}
              hasBattery={!!battery}
              onChange={(next) => {
                if (next.presetId) load(next.presetId);
                else setControls((prev) => ({ ...prev, ...next }));
              }}
              onAdd={add}
              onRemove={remove}
              onMove={move}
              onRotate={(id) => {
                setComponents((prev) => rotateComponent(prev, id));
                setWireStart(null);
                markCustom();
              }}
              onUpdate={update}
              onToggleSwitch={(id) => {
                update(id, { closed: !selected?.closed });
                playTone(muted, {
                  frequency: 500,
                  duration: 0.08,
                  type: "square",
                });
              }}
              onReplaceComponent={(id) => {
                update(id, { blown: false, burnedOut: false });
                setOverloadedId(null);
              }}
              current={
                selected && solution
                  ? solution.branchCurrents[selected.id] || 0
                  : null
              }
              power={
                selected && solution
                  ? solution.branchPower[selected.id] || 0
                  : null
              }
              voltage={selectedVoltage}
            />
          }
          dataPanel={
            <>
              <dl className="sim-data-grid">
                <div>
                  <dt>Tegangan sumber</dt>
                  <dd>{battery?.voltage || 0} V</dd>
                </div>
                <div>
                  <dt>Arus total</dt>
                  <dd>{Math.abs(current).toFixed(2)} A</dd>
                </div>
              </dl>
              {controls.showMeters && solution && (
                <dl className="sim-data-grid">
                  {components
                    .filter((c) => c.kind !== "wire")
                    .map((c) => (
                      <div key={c.id}>
                        <dt>
                          {COMPONENT_NAMES[c.kind]} ({c.id})
                        </dt>
                        <dd>
                          {Math.abs(solution.branchCurrents[c.id] || 0).toFixed(
                            2,
                          )}{" "}
                          A · {(solution.branchPower[c.id] || 0).toFixed(2)} W
                        </dd>
                      </div>
                    ))}
                </dl>
              )}
            </>
          }
          formula={
            <>
              <p>Hukum Ohm: I = V/R. Daya listrik: P = VI = I²R.</p>
              <p>
                Seri: R_total = R₁ + R₂ + …; arus sama pada setiap komponen.
                Paralel: 1/R_total = 1/R₁ + 1/R₂ + …; tegangan sama pada setiap
                cabang dan arus total adalah jumlah arus cabang.
              </p>
              <p>
                Simulasi menghitung tegangan simpul dan arus setiap komponen
                dari sambungan yang kamu buat, bukan dari nama contoh. Model
                menggunakan satu baterai DC ideal dan hambatan kabel yang sangat
                kecil. Titik biru menunjukkan arah arus konvensional dari kutub
                positif ke negatif.
              </p>
              <p>
                Kabel langsung di antara kutub baterai menyebabkan korsleting.
                Sekring putus jika arus melewati batasnya; lampu putus jika daya
                melebihi rating. Pilih komponen yang putus untuk menggantinya.
              </p>
            </>
          }
          quiz={<QuizPanel title="Uji Pemahaman" questions={QUIZ_QUESTIONS} />}
        />
      </div>
    </DndContext>
  );
}
