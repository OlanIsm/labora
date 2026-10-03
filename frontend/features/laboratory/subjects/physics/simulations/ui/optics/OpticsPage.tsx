"use client";
import { useCallback, useMemo, useState } from "react";
import { useCoachSteps } from "../../application/coachSteps";
import type { CoachStep } from "../../application/coachSteps";
import { SPECTRUM_COLORS, thinLensImage } from "../../domain/optics/engine";
import { traceRay } from "../../domain/optics/scene";
import type { ObjectKind, SceneObject } from "../../domain/optics/scene";
import type { Vector2 } from "../../domain/shared/vector2";
import EllieMascot from "../shared/EllieMascot";
import QuizPanel from "../shared/QuizPanel";
import SimShell from "../shared/SimShell";
import OpticsCanvas from "./OpticsCanvas";
import type { OpticsRenderState } from "./OpticsCanvas";
import OpticsControls from "./OpticsControls";
import type { OpticsControlsState } from "./OpticsControls";

type CoachState = {
  objectCount: number;
  hasMovedObject: boolean;
  usedWhiteLaser: boolean;
  imageFormationMode: boolean;
};

const COACH_STEPS: CoachStep<CoachState>[] = [
  {
    id: "intro",
    message: () =>
      "Hai, aku Ellie! Ada cermin siap pakai di papan. Seret untuk memindahkannya dan lihat sinar lasernya memantul.",
    isDone: (s) => s.hasMovedObject,
  },
  {
    id: "add-object",
    message: () =>
      "Bagus! Sekarang coba tambahkan prisma dari panel kanan untuk melihat dispersi warna.",
    isDone: (s) => s.objectCount > 1,
  },
  {
    id: "try-white",
    message: () =>
      'Coba pilih sinar "Putih" di panel laser. Perhatikan bagaimana prisma menguraikannya jadi pelangi.',
    isDone: (s) => s.usedWhiteLaser,
  },
  {
    id: "try-image",
    message: () =>
      'Sekarang coba centang "Mode pembentukan bayangan" untuk melihat bagaimana lensa membentuk bayangan.',
    isDone: (s) => s.imageFormationMode,
  },
  {
    id: "explore",
    message: () =>
      'Geser "Jarak benda" dan "Jarak fokus" untuk melihat bayangan berubah nyata/maya dan tegak/terbalik.',
    isDone: () => true,
  },
];

const QUIZ_QUESTIONS = [
  {
    prompt:
      "Pada pemantulan cahaya oleh cermin datar, bagaimana hubungan sudut datang dan sudut pantul?",
    options: [
      "Sudut datang lebih besar",
      "Sudut pantul lebih besar",
      "Sudut datang = sudut pantul",
      "Tidak ada hubungan",
    ],
    answer: 2,
    explanation:
      "Hukum pemantulan menyatakan sudut datang selalu sama dengan sudut pantul, keduanya diukur dari garis normal.",
  },
  {
    prompt:
      "Mengapa prisma dapat menguraikan cahaya putih menjadi warna-warni (dispersi)?",
    options: [
      "Karena prisma berwarna-warni",
      "Karena setiap warna punya kecepatan sama di udara",
      "Karena indeks bias kaca sedikit berbeda untuk setiap panjang gelombang cahaya",
      "Karena cahaya putih sebenarnya tidak ada",
    ],
    answer: 2,
    explanation:
      "Indeks bias kaca bergantung pada panjang gelombang (dispersi), sehingga setiap warna dibelokkan dengan sudut yang sedikit berbeda saat melewati prisma.",
  },
  {
    prompt:
      "Jika sebuah benda diletakkan tepat di antara titik fokus (f) dan 2f pada lensa cembung, bagaimana sifat bayangannya?",
    options: [
      "Maya, tegak, diperkecil",
      "Nyata, terbalik, diperbesar",
      "Nyata, tegak, sama besar",
      "Maya, terbalik, diperkecil",
    ],
    answer: 1,
    explanation:
      "Untuk objek antara f dan 2f pada lensa cembung, bayangan yang terbentuk selalu nyata, terbalik, dan diperbesar (terletak lebih jauh dari 2f).",
  },
];

const INITIAL_CONTROLS: OpticsControlsState = {
  laserColorMode: "white",
  imageFormationMode: false,
  objectDistance: 15,
  focalLength: 10,
};

let objectIdCounter = 0;
function nextObjectId(): string {
  objectIdCounter += 1;
  return `obj${objectIdCounter}`;
}

const DEFAULT_SIZES: Record<ObjectKind, number> = {
  mirror: 4,
  convexLens: 4,
  concaveLens: 4,
  prism: 2.5,
  screen: 4,
};

export default function OpticsPage() {
  const [controls, setControls] = useState(INITIAL_CONTROLS);
  const [objects, setObjects] = useState<SceneObject[]>(() => [
    {
      id: nextObjectId(),
      kind: "mirror",
      position: { x: 3, y: 2 },
      rotationRad: (135 * Math.PI) / 180,
      size: 4,
    },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hasMovedObject, setHasMovedObject] = useState(false);
  const [hasUsedWhiteLaser, setHasUsedWhiteLaser] = useState(false);
  const coach = useCoachSteps(COACH_STEPS);

  const handleAddObject = useCallback((kind: ObjectKind) => {
    const id = nextObjectId();
    setObjects((prev) => [
      ...prev,
      {
        id,
        kind,
        position: { x: 0, y: 0 },
        rotationRad: 0,
        size: DEFAULT_SIZES[kind],
      },
    ]);
    setSelectedId(id);
  }, []);

  const handleDragObject = useCallback((id: string, position: Vector2) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, position } : o)),
    );
    setHasMovedObject(true);
  }, []);

  const handleRotateSelected = useCallback(
    (deltaRad: number) => {
      if (!selectedId) return;
      setObjects((prev) =>
        prev.map((o) =>
          o.id === selectedId
            ? { ...o, rotationRad: o.rotationRad + deltaRad }
            : o,
        ),
      );
    },
    [selectedId],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const handleReset = useCallback(() => {
    setObjects([
      {
        id: nextObjectId(),
        kind: "mirror",
        position: { x: 3, y: 2 },
        rotationRad: (135 * Math.PI) / 180,
        size: 4,
      },
    ]);
    setSelectedId(null);
    setHasMovedObject(false);
    setHasUsedWhiteLaser(false);
    coach.reset();
  }, [coach]);

  const laserOrigin: Vector2 = { x: -12, y: 0 };
  const laserDirection: Vector2 = { x: 1, y: 0 };

  const traces = useMemo(() => {
    if (controls.imageFormationMode) return [];
    const wavelengths =
      controls.laserColorMode === "white"
        ? SPECTRUM_COLORS.map((c) => c.wavelengthNm)
        : [controls.laserColorMode];
    return wavelengths.map((wavelengthNm) =>
      traceRay(
        {
          origin: laserOrigin,
          direction: laserDirection,
          wavelengthNm,
          intensity: 1,
        },
        objects,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls.laserColorMode, controls.imageFormationMode, objects]);

  const canvasState: OpticsRenderState = { objects, traces, selectedId };

  const imageResult = controls.imageFormationMode
    ? thinLensImage(controls.objectDistance, controls.focalLength)
    : null;

  const coachState: CoachState = {
    objectCount: objects.length,
    hasMovedObject,
    usedWhiteLaser: hasUsedWhiteLaser,
    imageFormationMode: controls.imageFormationMode,
  };
  coach.evaluate(coachState);

  return (
    <SimShell
      title="Sandbox Laser & Lensa"
      explanation="Cermin mengubah arah sinar melalui pemantulan. Prisma membiaskan warna-warna cahaya dengan sudut berbeda. Lensa mengumpulkan atau menyebarkan sinar; letak benda terhadap fokus menentukan apakah bayangannya nyata atau maya. Coba geser jarak benda melewati titik fokus dan amati perubahan sifat bayangan."
      objective="Arahkan sinar dengan cermin, uraikan cahaya putih lewat prisma, lalu bandingkan bayangan nyata dan maya pada lensa."
      interactionHint="Klik bagian tengah objek untuk memilihnya, seret untuk memindahkan, dan gunakan Putar kiri/kanan di panel pengaturan."
      curriculumBadge="SMP 8 · SMA 11"
      paused={paused}
      onTogglePause={() => setPaused((p) => !p)}
      onReset={handleReset}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      mascot={<EllieMascot line={coach.activeStep.message(coachState)} />}
      stage={
        controls.imageFormationMode ? (
          <ImageFormationDiagram
            objectDistance={controls.objectDistance}
            focalLength={controls.focalLength}
          />
        ) : (
          <OpticsCanvas
            state={canvasState}
            onSelect={setSelectedId}
            onDragObject={handleDragObject}
          />
        )
      }
      controls={
        <OpticsControls
          state={controls}
          onChange={(next) => {
            if (next.laserColorMode === "white") setHasUsedWhiteLaser(true);
            setControls((prev) => ({ ...prev, ...next }));
          }}
          onAddObject={handleAddObject}
          onRotateSelected={handleRotateSelected}
          onDeleteSelected={handleDeleteSelected}
          hasSelection={!!selectedId}
        />
      }
      dataPanel={
        imageResult && (
          <dl className="sim-data-grid">
            <div>
              <dt>Jarak bayangan (s′)</dt>
              <dd>
                {Number.isFinite(imageResult.imageDistance)
                  ? `${imageResult.imageDistance.toFixed(1)} cm`
                  : "~tak terhingga"}
              </dd>
            </div>
            <div>
              <dt>Perbesaran (M)</dt>
              <dd>
                {Number.isFinite(imageResult.magnification)
                  ? imageResult.magnification.toFixed(2)
                  : "~tak terhingga"}
              </dd>
            </div>
            <div>
              <dt>Sifat bayangan</dt>
              <dd>
                {imageResult.isReal ? "Nyata" : "Maya"},{" "}
                {imageResult.isUpright ? "tegak" : "terbalik"},{" "}
                {imageResult.isEnlarged ? "diperbesar" : "diperkecil"}
              </dd>
            </div>
          </dl>
        )
      }
      formula={
        <>
          <p>
            Pemantulan cahaya: sudut datang = sudut pantul, diukur dari garis
            normal permukaan cermin.
          </p>
          <p>
            Pembiasan mengikuti hukum Snellius: n₁sinθ₁ = n₂sinθ₂. Jika cahaya
            bergerak dari medium rapat ke medium kurang rapat pada sudut lebih
            besar dari sudut kritis, terjadi pemantulan sempurna (total internal
            reflection): seluruh cahaya dipantulkan, tidak ada yang diteruskan.
          </p>
          <p>
            Prisma membelokkan cahaya ungu lebih besar daripada cahaya merah
            karena indeks bias kaca sedikit berbeda untuk setiap panjang
            gelombang (dispersi), sehingga cahaya putih terurai menjadi spektrum
            mejikuhibiniu.
          </p>
          <p>
            Lensa tipis: 1/f = 1/s + 1/s′, perbesaran M = −s′/s. Bayangan nyata
            (s′ positif) dapat ditangkap di layar; bayangan maya (s′ negatif)
            hanya terlihat seolah-olah di belakang lensa.
          </p>
        </>
      }
      quiz={<QuizPanel title="Uji Pemahaman" questions={QUIZ_QUESTIONS} />}
    />
  );
}

const DIAGRAM_SCALE = 10; // px per cm
const DIAGRAM_WIDTH = 560;
const DIAGRAM_HEIGHT = 360;
const AXIS_Y = DIAGRAM_HEIGHT / 2;
const LENS_X = DIAGRAM_WIDTH / 2;
const OBJECT_HEIGHT_CM = 6;

function ImageFormationDiagram({
  objectDistance,
  focalLength,
}: {
  objectDistance: number;
  focalLength: number;
}) {
  const result = thinLensImage(objectDistance, focalLength);
  const objX = LENS_X - objectDistance * DIAGRAM_SCALE;
  const objTopY = AXIS_Y - OBJECT_HEIGHT_CM * DIAGRAM_SCALE;
  const focalPx = focalLength * DIAGRAM_SCALE;

  const hasFiniteImage = Number.isFinite(result.imageDistance);
  const imgX = hasFiniteImage
    ? LENS_X + result.imageDistance * DIAGRAM_SCALE
    : null;
  const imgHeightCm = hasFiniteImage
    ? -OBJECT_HEIGHT_CM * result.magnification
    : 0;
  const imgTopY = hasFiniteImage ? AXIS_Y - imgHeightCm * DIAGRAM_SCALE : null;

  // Three principal rays from the object tip:
  // 1. Parallel to axis -> refracts through the far focal point.
  // 2. Through the lens center -> continues straight.
  // 3. Through the near focal point -> refracts parallel to the axis.
  const rays: { points: [number, number][]; dashed: boolean }[] = [];
  if (hasFiniteImage && imgTopY !== null && imgX !== null) {
    rays.push({
      points: [
        [objX, objTopY],
        [LENS_X, objTopY],
        [imgX, imgTopY],
      ],
      dashed: false,
    });
    rays.push({
      points: [
        [objX, objTopY],
        [LENS_X, AXIS_Y],
        [imgX, imgTopY],
      ],
      dashed: false,
    });
    const nearFocalY = AXIS_Y - (objTopY - AXIS_Y === 0 ? 0 : 0);
    rays.push({
      points: [
        [objX, objTopY],
        [LENS_X - focalPx, AXIS_Y],
        [
          LENS_X,
          AXIS_Y +
            (objTopY - AXIS_Y) *
              (focalPx !== 0 ? (LENS_X - (LENS_X - focalPx)) / -focalPx : 0),
        ],
        [imgX, imgTopY],
      ],
      dashed: false,
    });
  }

  return (
    <div className="sim-canvas-container">
      <svg
        viewBox={`0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}`}
        width="100%"
        height={DIAGRAM_HEIGHT}
        role="img"
        aria-label="Diagram pembentukan bayangan oleh lensa"
        style={{ background: "#0b1120", borderRadius: 12 }}
      >
        <line
          x1={0}
          y1={AXIS_Y}
          x2={DIAGRAM_WIDTH}
          y2={AXIS_Y}
          stroke="#374151"
          strokeWidth={1}
        />
        <line
          x1={LENS_X}
          y1={20}
          x2={LENS_X}
          y2={DIAGRAM_HEIGHT - 20}
          stroke="#60a5fa"
          strokeWidth={3}
        />
        <circle
          cx={LENS_X - Math.abs(focalPx)}
          cy={AXIS_Y}
          r={3}
          fill="#facc15"
        />
        <circle
          cx={LENS_X + Math.abs(focalPx)}
          cy={AXIS_Y}
          r={3}
          fill="#facc15"
        />

        <line
          x1={objX}
          y1={AXIS_Y}
          x2={objX}
          y2={objTopY}
          stroke="#34d399"
          strokeWidth={3}
          markerEnd="url(#arrow)"
        />
        <text x={objX - 10} y={objTopY - 8} fill="#34d399" fontSize={12}>
          Benda
        </text>

        {hasFiniteImage && imgTopY !== null && imgX !== null && (
          <>
            <line
              x1={imgX}
              y1={AXIS_Y}
              x2={imgX}
              y2={imgTopY}
              stroke={result.isReal ? "#f87171" : "#f87171"}
              strokeWidth={3}
              strokeDasharray={result.isReal ? undefined : "6 4"}
            />
            <text x={imgX + 6} y={imgTopY - 8} fill="#f87171" fontSize={12}>
              Bayangan
            </text>
            {rays.map((ray, index) => (
              <polyline
                key={index}
                points={ray.points.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke="#fde68a"
                strokeWidth={1.5}
                strokeDasharray={result.isReal ? undefined : "4 3"}
              />
            ))}
          </>
        )}
        <defs>
          <marker
            id="arrow"
            markerWidth={8}
            markerHeight={8}
            refX={4}
            refY={4}
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#34d399" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
