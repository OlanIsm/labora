"use client";
import { CSSProperties, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, MouseSensor, TouchSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { ArrowLeft, GripVertical, Microscope, X } from "lucide-react";
import Link from "next/link";
import { INITIAL_MICROSCOPE, MicroscopeSlide, SlideId, insertSlide, microscopeObjectiveStage, microscopeSlides, moveMicroscopePan, zoomMicroscope } from "./microscope";
import MicroscopeField from "./MicroscopeField";
import GiffyMascot from "./GiffyMascot";
import { microscopeGuide } from "./microscopeCoach";

function SlideGlass({ slide }: { slide: MicroscopeSlide }) {
  return <span className="microscope-slide-glass" style={{ "--slide-color": slide.color } as CSSProperties} aria-hidden="true">
    <span className="microscope-slide-paper">{slide.name}</span>
    <span className="microscope-slide-coverslip"><span className={`microscope-slide-sample sample-${slide.shape}`} style={{ backgroundImage: `url(/microscopy/${slide.id}.webp)` }} /></span>
    <span className="microscope-slide-end"><GripVertical size={16} /></span>
  </span>;
}

function SlideCard({ slide, selected, onLoad }: { slide: MicroscopeSlide; selected: boolean; onLoad: (id: SlideId) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `microscope-slide:${slide.id}`, data: { slideId: slide.id } });
  return <button ref={setNodeRef} {...attributes} {...listeners} type="button" className={`microscope-slide ${selected ? "loaded" : ""} ${isDragging ? "dragging" : ""}`}
    aria-label={`Amati ${slide.name}`} aria-pressed={selected} onClick={() => onLoad(slide.id)}>
    <SlideGlass slide={slide} />
    <span className="microscope-slide-caption"><span>{slide.category}</span><span>{selected ? "Di mikroskop" : "Amati"}</span></span>
  </button>;
}

function Viewport({ view, slide, dragging, onPan }: { view: typeof INITIAL_MICROSCOPE; slide: MicroscopeSlide | undefined; dragging: boolean; onPan: (dx: number, dy: number) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "microscope" });
  return <div ref={setNodeRef} className={`microscope-aperture ${isOver ? "drop-ready" : ""} ${dragging ? "awaiting-slide" : ""}`}
    aria-label="Tempat memasukkan preparat ke mikroskop">
    {slide ? <MicroscopeField key={slide.id} slide={slide} objective={view.objective} focus={view.focus} light={view.light} pan={view.pan} onPan={onPan} /> : <div className="microscope-empty">
      <Microscope size={56} strokeWidth={1.5} aria-hidden="true" />
      <h3>Masukkan satu preparat.</h3>
      <p>Seret kaca preparat ke sini,<br />atau klik preparat di rak.</p>
    </div>}
    {dragging && <div className="microscope-drop-hint">{isOver ? "Lepaskan untuk mengamati" : "Letakkan preparat di sini"}</div>}
  </div>;
}

export default function MicroscopeLab() {
  const [view, setView] = useState(INITIAL_MICROSCOPE);
  const [draggedId, setDraggedId] = useState<SlideId | null>(null);
  const [message, setMessage] = useState("Mikroskop siap. Pilih preparat dari rak untuk mulai mengamati.");
  const [guideVisible, setGuideVisible] = useState(true);
  const slide = microscopeSlides.find(s => s.id === view.slideId);
  const draggedSlide = microscopeSlides.find(s => s.id === draggedId);
  const guide = microscopeGuide(view, slide);
  const stage = microscopeObjectiveStage(view.objective);
  const hasPanned = !!(view.pan.x || view.pan.y);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }));

  function load(id: SlideId) {
    const selected = microscopeSlides.find(s => s.id === id);
    if (!selected) return;
    setView(insertSlide(id));
    setMessage(`${selected.name} dimasukkan. Mulai dari objektif 4×, lalu ikuti panduan Giffy untuk melihat lebih dekat.`);
  }
  function drop(event: DragEndEvent) {
    setDraggedId(null);
    const id = event.active.data.current?.slideId as SlideId | undefined;
    if (event.over?.id === "microscope" && id) load(id);
    else setMessage("Preparat belum dimasukkan. Seret ke bidang pandang mikroskop atau klik preparat di rak.");
  }

  function followGuide() {
    const { slideId, objective, adjustment } = guide;
    if (slideId) load(slideId);
    else if (objective) setView(prev => ({ ...prev, objective, pan: { x: 0, y: 0 } }));
    else if (adjustment === "focus") setView(prev => ({ ...prev, focus: 0 }));
    else if (adjustment === "light") setView(prev => ({ ...prev, light: 80 }));
    else if (adjustment === "position") setView(prev => ({ ...prev, pan: { x: 0, y: 0 } }));
  }

  return <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={drop}
    accessibility={{ screenReaderInstructions: { draggable: "Seret preparat ke mikroskop dengan mouse. Dengan keyboard, tekan Enter atau Spasi untuk mengamatinya." } }}
    onDragStart={event => setDraggedId(event.active.data.current?.slideId || null)}
    onDragCancel={() => { setDraggedId(null); setMessage("Pemindahan preparat dibatalkan. Preparat di mikroskop tetap sama."); }}>
    <div className="microscope-lab">
      <Link href="/biologi" className="back-link"><ArrowLeft size={18} /> Semua aktivitas Biologi</Link>
      <div className="page-heading">
        <h1>Mikroskop Biologi</h1>
        <p>Dunia kecil, banyak yang bisa diamati. Pilih preparat dan lihat lebih dekat.</p>
      </div>
      <div className="microscope-layout">
        <section className="microscope-viewer" aria-labelledby="microscope-view-heading">
          <div className="microscope-view-toolbar">
            <div><h2 id="microscope-view-heading">Pandangan mikroskop</h2><p>{slide?.name || "Belum ada preparat"}</p></div>
            <button className="button ghost small" disabled={!slide} onClick={() => { setView({ ...INITIAL_MICROSCOPE }); setMessage("Preparat dikeluarkan. Pilih preparat lain dari rak."); }}>
              <X size={17} aria-hidden="true" /> Keluarkan preparat
            </button>
          </div>
          <div className="microscope-instrument">
            <Viewport view={view} slide={slide} dragging={!!draggedSlide} onPan={(dx, dy) => setView(prev => ({ ...prev, pan: moveMicroscopePan(prev.pan, dx, dy) }))} />
            <label className="microscope-zoom">Zoom <strong>{view.objective}×</strong>
              <span>100×</span>
              <input type="range" min="4" max="100" step="1" value={view.objective} disabled={!slide} aria-label="Zoom preparat" aria-orientation="vertical"
                aria-valuetext={`${view.objective} kali, perbesaran total ${view.objective * 10} kali (simulasi)`}
                onChange={event => { const objective = Number(event.target.value); if (slide) setView(prev => zoomMicroscope(prev, slide, objective)); }} />
              <span>4×</span>
            </label>
          </div>
          <div className="microscope-navigation">
            <p id="microscope-pan-help">Seret foto untuk menggeser preparat. Tombol panah keyboard juga bisa digunakan.</p>
            <button className="button ghost small" type="button" disabled={!slide || !hasPanned} onClick={() => setView(prev => ({ ...prev, pan: { x: 0, y: 0 } }))}>Pusatkan kembali</button>
          </div>
          <div className="microscope-scale"><strong>{view.objective * 10}× total (simulasi)</strong><span>Okuler 10× × objektif {view.objective}×</span></div>
          <section className="microscope-guide" aria-label="Panduan pengamatan mikroskop">
            <div className="microscope-guide-heading">
              <h3>{!slide ? "Mulai bersama Giffy" : hasPanned ? "Jelajahi preparat" : stage === 4 ? "Amati keseluruhan" : stage === 10 ? "Kenali struktur sel" : stage === 40 ? "Periksa lebih dekat" : "Pahami batas zoom"}</h3>
              <button className="text-link" type="button" aria-expanded={guideVisible} aria-controls="microscope-giffy" onClick={() => setGuideVisible(visible => !visible)}>{guideVisible ? "Sembunyikan Giffy" : "Tampilkan Giffy"}</button>
            </div>
            <div id="microscope-giffy" hidden={!guideVisible}>
              <GiffyMascot line={guide.line} />
              <button className="button primary small microscope-guide-next" type="button" onClick={followGuide}>{guide.actionLabel}</button>
            </div>
          </section>
          <div className="microscope-adjustments">
            <label>Fokus <span>{view.focus === 0 ? "Tajam" : "Sesuaikan ketajaman"}</span>
              <input type="range" min="-10" max="10" step="1" value={view.focus} disabled={!slide} onChange={e => setView(prev => ({ ...prev, focus: Number(e.target.value) }))} />
            </label>
            <label>Pencahayaan <span>{view.light}%</span>
              <input type="range" min="10" max="100" step="5" value={view.light} disabled={!slide} onChange={e => setView(prev => ({ ...prev, light: Number(e.target.value) }))} />
            </label>
          </div>
          <p className="microscope-model-note">Foto mikroskop asli; zoom dan perbesaran total adalah label simulasi. Foto diulang agar preparat bisa digeser tanpa batas. Zoom digital tidak menambah detail optik baru. Ukuran sel tidak dikalibrasi.</p>
          {slide && <details className="microscope-photo-credit"><summary>Kredit foto preparat</summary><p>
            Foto oleh <a href={slide.photo.source} target="_blank" rel="noreferrer">{slide.photo.author}</a>, <a href={slide.photo.licenseUrl} target="_blank" rel="noreferrer">{slide.photo.license}</a>. Dipotong dan dikonversi ke WebP; zoom, fokus, dan pencahayaan diatur oleh simulasi.
          </p></details>}
        </section>
        <aside className="microscope-rack" aria-labelledby="microscope-rack-heading">
          <div className="microscope-rack-heading"><h2 id="microscope-rack-heading">Rak preparat</h2><span>{microscopeSlides.length} preparat</span></div>
          <p>Seret satu kaca preparat ke mikroskop, atau klik untuk mengamatinya.</p>
          <div className="microscope-slide-list">
            {microscopeSlides.map(s => <SlideCard key={s.id} slide={s} selected={view.slideId === s.id} onLoad={load} />)}
          </div>
        </aside>
        <section className="microscope-observation" aria-labelledby="microscope-observation-heading">
          <div className="microscope-observation-heading"><Microscope size={22} aria-hidden="true" /><h2 id="microscope-observation-heading">{slide ? `Tentang ${slide.name.toLowerCase()}` : "Apa yang bisa kamu temukan?"}</h2></div>
          <p>{slide?.description || "Bandingkan sel tumbuhan, sel hewan, dan organisme bersel satu. Setiap preparat memperlihatkan bentuk serta struktur yang berbeda."}</p>
          {slide && <>
            <div className="microscope-structures"><strong>Struktur yang diamati</strong><ul>{slide.structures.map(structure => <li key={structure}>{structure}</li>)}</ul></div>
            <p className="microscope-observation-prompt">{slide.observation}</p>
          </>}
        </section>
      </div>
      <p className="microscope-feedback" role="status" aria-live="polite">{message}</p>
    </div>
    <DragOverlay dropAnimation={null}>{draggedSlide && <div className="microscope-drag-preview"><SlideGlass slide={draggedSlide} /></div>}</DragOverlay>
  </DndContext>;
}
