"use client";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { GripVertical, Microscope, X } from "lucide-react";
import { useState } from "react";
import type { CSSProperties } from "react";
import EllieMascot from "../physics/simulations/ui/shared/EllieMascot";
import {
  INITIAL_MICROSCOPE,
  OBJECTIVES,
  insertSlide,
  microscopeSlides,
} from "./microscope";
import type { MicroscopeSlide, SlideId } from "./microscope";
import { microscopeGuide } from "./microscopeCoach";
import MicroscopeField from "./MicroscopeField";

function SlideGlass({ slide }: { slide: MicroscopeSlide }) {
  return (
    <span
      className="microscope-slide-glass"
      style={{ "--slide-color": slide.color } as CSSProperties}
      aria-hidden="true"
    >
      <span className="microscope-slide-paper">{slide.name}</span>
      <span className="microscope-slide-coverslip">
        <span
          className={`microscope-slide-sample sample-${slide.shape}`}
          style={{ backgroundImage: `url(/microscopy/${slide.id}.webp)` }}
        />
      </span>
      <span className="microscope-slide-end">
        <GripVertical size={16} />
      </span>
    </span>
  );
}

function SlideCard({
  slide,
  selected,
  onLoad,
}: {
  slide: MicroscopeSlide;
  selected: boolean;
  onLoad: (id: SlideId) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `microscope-slide:${slide.id}`,
    data: { slideId: slide.id },
  });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      className={`microscope-slide ${selected ? "loaded" : ""} ${isDragging ? "dragging" : ""}`}
      aria-label={`Amati ${slide.name}`}
      aria-pressed={selected}
      onClick={() => onLoad(slide.id)}
    >
      <SlideGlass slide={slide} />
      <span className="microscope-slide-caption">
        <span>{slide.category}</span>
        <span>{selected ? "Di mikroskop" : "Amati"}</span>
      </span>
    </button>
  );
}

function Viewport({
  view,
  slide,
  dragging,
}: {
  view: typeof INITIAL_MICROSCOPE;
  slide: MicroscopeSlide | undefined;
  dragging: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "microscope" });
  return (
    <div
      ref={setNodeRef}
      className={`microscope-aperture ${isOver ? "drop-ready" : ""} ${dragging ? "awaiting-slide" : ""}`}
      aria-label="Tempat memasukkan preparat ke mikroskop"
    >
      {slide ? (
        <MicroscopeField
          key={slide.id}
          slide={slide}
          objective={view.objective}
          focus={view.focus}
          light={view.light}
        />
      ) : (
        <div className="microscope-empty">
          <Microscope size={56} strokeWidth={1.5} aria-hidden="true" />
          <h3>Masukkan satu preparat.</h3>
          <p>
            Seret kaca preparat ke sini,
            <br />
            atau klik preparat di rak.
          </p>
        </div>
      )}
      {dragging && (
        <div className="microscope-drop-hint">
          {isOver ? "Lepaskan untuk mengamati" : "Letakkan preparat di sini"}
        </div>
      )}
    </div>
  );
}

export default function MicroscopeLab() {
  const [view, setView] = useState(INITIAL_MICROSCOPE);
  const [draggedId, setDraggedId] = useState<SlideId | null>(null);
  const [message, setMessage] = useState(
    "Mikroskop siap. Pilih preparat dari rak untuk mulai mengamati.",
  );
  const [guideVisible, setGuideVisible] = useState(true);
  const slide = microscopeSlides.find((s) => s.id === view.slideId);
  const draggedSlide = microscopeSlides.find((s) => s.id === draggedId);
  const guide = microscopeGuide(view, slide);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  function load(id: SlideId) {
    const selected = microscopeSlides.find((s) => s.id === id);
    if (!selected) return;
    setView(insertSlide(id));
    setMessage(
      `${selected.name} dimasukkan. Mulai dari objektif 4×, lalu ikuti panduan Ellie untuk melihat lebih dekat.`,
    );
  }
  function drop(event: DragEndEvent) {
    setDraggedId(null);
    const id = event.active.data.current?.slideId as SlideId | undefined;
    if (event.over?.id === "microscope" && id) load(id);
    else
      setMessage(
        "Preparat belum dimasukkan. Seret ke bidang pandang mikroskop atau klik preparat di rak.",
      );
  }

  function followGuide() {
    const { slideId, objective, adjustment } = guide;
    if (slideId) load(slideId);
    else if (objective) setView((prev) => ({ ...prev, objective }));
    else if (adjustment === "focus") setView((prev) => ({ ...prev, focus: 0 }));
    else if (adjustment === "light")
      setView((prev) => ({ ...prev, light: 80 }));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={drop}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Seret preparat ke mikroskop dengan mouse. Dengan keyboard, tekan Enter atau Spasi untuk mengamatinya.",
        },
      }}
      onDragStart={(event) =>
        setDraggedId(event.active.data.current?.slideId || null)
      }
      onDragCancel={() => {
        setDraggedId(null);
        setMessage(
          "Pemindahan preparat dibatalkan. Preparat di mikroskop tetap sama.",
        );
      }}
    >
      <div className="microscope-lab">
        <div className="page-heading">
          <h1>Lab Biologi</h1>
          <p>
            Dunia kecil, banyak yang bisa diamati. Pilih preparat dan lihat
            lebih dekat.
          </p>
        </div>
        <div className="microscope-layout">
          <section
            className="microscope-viewer"
            aria-labelledby="microscope-view-heading"
          >
            <div className="microscope-view-toolbar">
              <div>
                <h2 id="microscope-view-heading">Pandangan mikroskop</h2>
                <p>{slide?.name || "Belum ada preparat"}</p>
              </div>
              <button
                className="button ghost small"
                disabled={!slide}
                onClick={() => {
                  setView({ ...INITIAL_MICROSCOPE });
                  setMessage(
                    "Preparat dikeluarkan. Pilih preparat lain dari rak.",
                  );
                }}
              >
                <X size={17} aria-hidden="true" /> Keluarkan preparat
              </button>
            </div>
            <div className="microscope-instrument">
              <Viewport view={view} slide={slide} dragging={!!draggedSlide} />
              <div
                className="microscope-objectives"
                role="group"
                aria-label="Pilih lensa objektif"
              >
                <span>Objektif (simulasi)</span>
                {OBJECTIVES.map((objective) => (
                  <button
                    key={objective}
                    type="button"
                    disabled={!slide}
                    aria-pressed={view.objective === objective}
                    aria-label={`Objektif ${objective} kali, perbesaran total ${objective * 10} kali`}
                    onClick={() => {
                      setView((prev) => ({ ...prev, objective }));
                      setMessage(
                        `Objektif ${objective}× dipilih. Perbesaran total ${objective * 10}×. Bidang pandang ${objective > view.objective ? "menyempit" : "berubah"}.`,
                      );
                    }}
                  >
                    {objective}×
                  </button>
                ))}
              </div>
            </div>
            <div className="microscope-scale">
              <strong>{view.objective * 10}× total (simulasi)</strong>
              <span>Okuler 10× × objektif {view.objective}×</span>
            </div>
            <section
              className="microscope-guide"
              aria-label="Panduan pengamatan mikroskop"
            >
              <div className="microscope-guide-heading">
                <h3>
                  {!slide
                    ? "Mulai bersama Ellie"
                    : view.objective === 4
                      ? "Amati keseluruhan"
                      : view.objective === 10
                        ? "Kenali struktur sel"
                        : view.objective === 40
                          ? "Periksa lebih dekat"
                          : "Pahami batas zoom"}
                </h3>
                <button
                  className="text-link"
                  type="button"
                  aria-expanded={guideVisible}
                  aria-controls="microscope-ellie"
                  onClick={() => setGuideVisible((visible) => !visible)}
                >
                  {guideVisible ? "Sembunyikan Ellie" : "Tampilkan Ellie"}
                </button>
              </div>
              <div id="microscope-ellie" hidden={!guideVisible}>
                <EllieMascot line={guide.line} />
                <button
                  className="button primary small microscope-guide-next"
                  type="button"
                  onClick={followGuide}
                >
                  {guide.actionLabel}
                </button>
              </div>
            </section>
            <div className="microscope-adjustments">
              <label>
                Fokus{" "}
                <span>
                  {view.focus === 0 ? "Tajam" : "Sesuaikan ketajaman"}
                </span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={view.focus}
                  disabled={!slide}
                  onChange={(e) =>
                    setView((prev) => ({
                      ...prev,
                      focus: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Pencahayaan <span>{view.light}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={view.light}
                  disabled={!slide}
                  onChange={(e) =>
                    setView((prev) => ({
                      ...prev,
                      light: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <p className="microscope-model-note">
              Foto mikroskop asli; objektif dan perbesaran total adalah label
              simulasi. Zoom digital menyorot area foto, bukan menambah detail
              optik baru. Ukuran sel tidak dikalibrasi.
            </p>
            {slide && (
              <details className="microscope-photo-credit">
                <summary>Kredit foto preparat</summary>
                <p>
                  Foto oleh{" "}
                  <a href={slide.photo.source} target="_blank" rel="noreferrer">
                    {slide.photo.author}
                  </a>
                  ,{" "}
                  <a
                    href={slide.photo.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {slide.photo.license}
                  </a>
                  . Dipotong dan dikonversi ke WebP; zoom, fokus, dan
                  pencahayaan diatur oleh simulasi.
                </p>
              </details>
            )}
          </section>
          <aside
            className="microscope-rack"
            aria-labelledby="microscope-rack-heading"
          >
            <div className="microscope-rack-heading">
              <h2 id="microscope-rack-heading">Rak preparat</h2>
              <span>{microscopeSlides.length} preparat</span>
            </div>
            <p>
              Seret satu kaca preparat ke mikroskop, atau klik untuk
              mengamatinya.
            </p>
            <div className="microscope-slide-list">
              {microscopeSlides.map((s) => (
                <SlideCard
                  key={s.id}
                  slide={s}
                  selected={view.slideId === s.id}
                  onLoad={load}
                />
              ))}
            </div>
          </aside>
          <section
            className="microscope-observation"
            aria-labelledby="microscope-observation-heading"
          >
            <div className="microscope-observation-heading">
              <Microscope size={22} aria-hidden="true" />
              <h2 id="microscope-observation-heading">
                {slide
                  ? `Tentang ${slide.name.toLowerCase()}`
                  : "Apa yang bisa kamu temukan?"}
              </h2>
            </div>
            <p>
              {slide?.description ||
                "Bandingkan sel tumbuhan, sel hewan, dan organisme bersel satu. Setiap preparat memperlihatkan bentuk serta struktur yang berbeda."}
            </p>
            {slide && (
              <>
                <div className="microscope-structures">
                  <strong>Struktur yang diamati</strong>
                  <ul>
                    {slide.structures.map((structure) => (
                      <li key={structure}>{structure}</li>
                    ))}
                  </ul>
                </div>
                <p className="microscope-observation-prompt">
                  {slide.observation}
                </p>
              </>
            )}
          </section>
        </div>
        <p className="microscope-feedback" role="status" aria-live="polite">
          {message}
        </p>
      </div>
      <DragOverlay dropAnimation={null}>
        {draggedSlide && (
          <div className="microscope-drag-preview">
            <SlideGlass slide={draggedSlide} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
