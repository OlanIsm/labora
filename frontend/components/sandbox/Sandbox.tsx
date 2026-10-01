"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  BookOpen,
  CircleHelp,
  Download,
  Pause,
  Play,
  RotateCcw,
  Undo2,
  Redo2,
  X,
} from "lucide-react";
import { useSandbox } from "@/hooks/useSandbox";
import { Discipline, LabState } from "@/lib/sandbox/types";
import { HistoryAction } from "@/lib/sandbox/engine";
import {
  actionFeedback,
  Feedback,
  observationFeedback,
  selectionFeedback,
  latestObservationSince,
  failedDropFeedback,
} from "@/lib/sandbox/feedback";
import { loadBench, saveBench, download } from "@/services/labRepository";
import { ruleCounts } from "@/lib/sandbox/rules";
import { pourDrop, dipLitmusDrop } from "@/lib/sandbox/drop";
import { isLitmus } from "@/lib/sandbox/litmus";
import { placeTubeInRack, releaseTubeFromRack } from "@/lib/sandbox/rack";
import { fitOnBench } from "@/lib/sandbox/placement";
import { materials } from "@/lib/sandbox/catalog";
import DragPreview from "./DragPreview";
import Workbench from "./Workbench";
import Inventory from "./Inventory";
import ApparatusControls from "./ApparatusControls";
import Observations from "./Observations";
import Notebook from "./Notebook";
import CoachMarks, { useIntroduction } from "./CoachMarks";
import LabErrorBoundary from "./LabErrorBoundary";
import ActionFeedback from "./ActionFeedback";
import EquipmentExplanation from "./EquipmentExplanation";
import MicroscopeLab from "../../features/biology/MicroscopeLab";

const names = {
  chemistry: "Kimia",
  physics: "Fisika",
  biology: "Biologi",
  free: "Meja Bebas",
};
function Desk({ discipline }: { discipline: Discipline }) {
  const { state, history, dispatch, speed, setSpeed, ready, persistent } =
    useSandbox(discipline);
  const [selected, setSelected] = useState(""),
    [target, setTarget] = useState(""),
    [tab, setTab] = useState("rack");
  const [panelOpen, setPanelOpen] = useState(false);
  const [draggedMaterial, setDraggedMaterial] = useState("");
  const [draggedEntity, setDraggedEntity] = useState("");
  const [actions, setActions] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [help, setHelp] = useState(false);
  const intro = useIntroduction();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const pending = useRef<{ action: HistoryAction; before: LabState } | null>(
    null,
  );
  const lastEvent = useRef<number | null>(null);
  const results = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!ready) {
      lastEvent.current = null;
      return;
    }
    const latest = state.events.at(-1)?.id || 0;
    if (pending.current) {
      setFeedback(
        actionFeedback(
          pending.current.action,
          pending.current.before,
          state,
          speed > 0,
        ),
      );
      pending.current = null;
    } else {
      const observed = latestObservationSince(state, lastEvent.current);
      if (observed) {
        setMessage("");
        setFeedback(observationFeedback(observed, state));
      }
    }
    lastEvent.current = latest;
  }, [history, speed, ready]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );
  const mark = (type: string) =>
    setActions((old) => (old.includes(type) ? old : [...old, type]));
  const entity = state.entities.find((e) => e.id === selected);
  const simpleChemistry = discipline === "chemistry";
  function startIntroduction() {
    setPanelOpen(true);
    setTab("rack");
    intro.start();
  }
  function send(a: HistoryAction) {
    if (a.type === "move" || a.type === "add") {
      const bench = document.getElementById("sandbox-bench")?.getBoundingClientRect();
      const id = a.type === "move" ? a.id : undefined;
      const item = id ? state.entities.find((e) => e.id === id) : undefined;
      const material = a.type === "add" ? a.material : item?.material;
      const rect = item && !item.rackPlacement ? document.getElementById(`sandbox-entity-${item.id}`)?.getBoundingClientRect() : undefined;
      const mobile = window.matchMedia("(max-width: 760px)").matches;
      if (bench && a.x !== undefined && a.y !== undefined) {
        const fitted = fitOnBench(a.x, a.y, bench.width, bench.height,
          rect?.width ?? (material === "rack" ? 216 : mobile ? 70 : 90),
          rect?.height ?? (material === "rack" ? 184 : mobile ? 128 : 140));
        a = { ...a, ...fitted };
      }
    }
    pending.current = { action: a, before: state };
    setMessage("");
    dispatch(a);
    mark(a.type);
    if (a.type === "remove" && a.id === selected) setSelected("");
    if (a.type === "pour") {
      setSelected(a.target);
      setTarget("");
      setTab("controls");
    }
    if (["undo", "redo", "reset", "load", "remove"].includes(a.type))
      setTarget("");
  }
  function changeSpeed(value: number) {
    setSpeed(value);
    setMessage("");
    setFeedback({
      title: value ? "Waktu simulasi berjalan." : "Waktu simulasi dijeda.",
      detail: value
        ? `Percobaan berjalan dengan kecepatan ${value}×. Alat yang dinyalakan dapat bekerja.`
        : "Perubahan yang membutuhkan waktu berhenti sementara.",
      hint: value
        ? "Kamu bisa mengamati benda dan hasil pengukurannya."
        : "Kamu tetap bisa mengambil alat, menuang bahan, dan mengubah pengaturan.",
    });
  }
  function feedbackNext(next: NonNullable<Feedback["next"]>, id?: string) {
    if (next === "run") {
      changeSpeed(1);
      return;
    }
    if (next === "rack") {
      setTab("rack");
      setPanelOpen(true);
    }
    if (next === "observe") {
      if (id) setSelected(id);
      if (results.current) results.current.open = true;
    }
    requestAnimationFrame(() =>
      document
        .getElementById(
          next === "rack" ? "sandbox-rack" : "sandbox-observations",
        )
        ?.scrollIntoView({ block: "nearest", behavior: "auto" }),
    );
  }
  function add(material: string, x?: number, y?: number) {
    const id = `e${state.nextId}`;
    send({ type: "add", material, x, y });
    setSelected(id);
    setTab("rack");
  }
  function drop(e: DragEndEvent) {
    setDraggedMaterial("");
    setDraggedEntity("");
    const rack = e.over?.data.current?.rack;
    const slot = e.over?.data.current?.slot;
    if (typeof rack === "string" && typeof slot === "number") {
      const source = e.active.data.current;
      if (source?.material) placeTube(rack, slot, { material: String(source.material) });
      else if (source?.entity) placeTube(rack, slot, { entity: String(source.entity) });
      return;
    }
    const destination = e.over?.data.current?.container;
    const source = e.active.data.current;
    if (typeof destination === "string" && source) {
      const material = source.material || state.entities.find((e) => e.id === source.entity)?.material;
      if (isLitmus(String(material))) {
        const tested = dipLitmusDrop(state, destination, source.material ? { material: String(source.material) } : { entity: String(source.entity) });
        if (tested) {
          pending.current = null;
          dispatch({ type: "load", state: tested.state });
          setSelected(tested.paperId);
          setTarget("");
          setMessage("");
          setFeedback(actionFeedback({ type: "connect", source: tested.paperId, target: destination }, state, tested.state));
        } else { setMessage(""); setFeedback(failedDropFeedback("litmus")); }
        return;
      }
      const poured = source.material
        ? pourDrop(state, destination, { material: String(source.material) })
        : source.entity
          ? pourDrop(state, destination, { entity: String(source.entity) })
          : null;
      if (poured) {
        pending.current = null;
        dispatch({ type: "load", state: poured.state });
        setFeedback(actionFeedback(poured.action, poured.before, poured.state, speed > 0));
        setMessage("");
        setSelected(destination);
        setTarget("");
        mark("pour");
      } else { setMessage(""); setFeedback(failedDropFeedback("pour")); }
      return;
    }
    if (e.over?.id !== "bench") {
      setMessage("");
      setFeedback(failedDropFeedback("outside"));
      return;
    }
    const bench = document
      .getElementById("sandbox-bench")!
      .getBoundingClientRect();
    if (e.active.data.current?.material) {
      const rect = e.active.rect.current.translated;
      add(
        String(e.active.data.current.material),
        rect ? ((rect.left - bench.left) / bench.width) * 100 : undefined,
        rect ? ((rect.top - bench.top) / bench.height) * 100 : undefined,
      );
    }
    if (e.active.data.current?.entity) {
      const item = state.entities.find(
        (x) => x.id === e.active.data.current?.entity,
      );
      if (item) {
        const rect = e.active.rect.current.translated;
        send({
          type: "move",
          id: item.id,
          x: rect ? ((rect.left - bench.left) / bench.width) * 100 : item.x + (e.delta.x / bench.width) * 100,
          y: rect ? ((rect.top - bench.top) / bench.height) * 100 : item.y + (e.delta.y / bench.height) * 100,
        });
      }
    }
  }
  function placeTube(rack: string, slot: number, source: { entity: string } | { material: string }) {
    const next = placeTubeInRack(state, rack, slot, source);
    if (!next) { setMessage(""); setFeedback(failedDropFeedback("rack")); return; }
    pending.current = null;
    dispatch({ type: "load", state: next });
    const tube = next.entities.find((e) => e.rackPlacement?.rack === rack && e.rackPlacement.slot === slot)!;
    setSelected(tube.id);
    setMessage("");
    setFeedback({ title: `Tabung diletakkan di slot ${slot + 1}.`, detail: "Isi tabung tetap sama. Tabung akan ikut saat rak dipindahkan.", hint: "Seret tabung ke meja untuk mengambilnya, atau gunakan Keluarkan dari rak." });
  }
  function releaseTube() {
    const next = releaseTubeFromRack(state, selected);
    if (!next) return;
    pending.current = null;
    dispatch({ type: "load", state: next });
    setMessage("");
    setFeedback({ title: "Tabung dikeluarkan dari rak.", detail: "Tabung ada di meja, dengan isi yang sama. Slotnya kosong kembali.", hint: "Seret tabung ke slot kosong untuk meletakkannya lagi." });
  }
  function exportImage() {
    const escape = (v: string) =>
      v.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;",
          })[c]!,
      );
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600"><rect width="100%" height="100%" fill="#eaf9ff"/><text x="20" y="30" font-family="sans-serif">Labora · ${names[discipline]} · ${state.time.toFixed(1)} s</text>${state.entities.map((e) => `<g transform="translate(${e.x * 10},${e.y * 5 + 40})"><rect width="100" height="55" rx="12" fill="${escape(e.color)}" stroke="#155c7b"/><text y="75" font-size="12" font-family="sans-serif">${escape(e.label)}</text></g>`).join("")}</svg>`;
    download("meja-labora.svg", svg, "image/svg+xml");
    setMessage("Ekspor gambar SVG dimulai. Periksa unduhan browser.");
  }
  if (!ready) return <p role="status">Menyiapkan meja bebas...</p>;
  const controls = <>
    {entity?.material === "rack" && <p className="sandbox-small">Seret tabung ke slot kosong. Atau pilih tabung di meja lalu klik slot. Tanpa tabung di meja yang dipilih, klik slot membuat tabung baru.</p>}
    {entity?.rackPlacement && <button onClick={releaseTube}>Keluarkan dari rak</button>}
    <ApparatusControls entity={entity} state={state} dispatch={send} target={target}
      setTarget={(id) => {
        setTarget(id);
        setMessage("");
        const destination = state.entities.find((e) => e.id === id);
        if (destination && isLitmus(entity?.material || "")) {
          setFeedback({ title: `${destination.label} dipilih untuk diuji.`, detail: "Kertas belum dicelupkan. Memilih wadah tidak mengubah warna atau isi larutan.", hint: "Tekan Celupkan kertas untuk menguji larutan.", target: entity?.id });
          return;
        }
        if (destination) setFeedback({
          title: `${destination.label} dipilih sebagai tujuan.`,
          detail: entity && entity.contents.some((p) => p.mass > 0)
            ? "Bahan belum dituang. Memilih tujuan saja belum memindahkan isi benda."
            : "Benda belum tersambung. Memilih tujuan saja belum menghubungkan alat.",
          hint: entity && entity.contents.some((p) => p.mass > 0)
            ? "Tekan “Tuang / campur” untuk memindahkan jumlah yang dipilih."
            : "Tekan “Sambungkan” untuk menghubungkan kedua benda.",
          target: destination.id,
        });
      }} onAction={mark} />
  </>;
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const hits = args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);
        const rackSlots = hits.filter((hit) => String(hit.id).startsWith("rack-slot:"));
        if (rackSlots.length) return rackSlots;
        const containers = hits.filter((hit) => hit.id !== "bench");
        return containers.length ? containers : hits;
      }}
      onDragEnd={drop}
      onDragStart={(e) => {
        setDraggedEntity(String(e.active.data.current?.entity || ""));
        setDraggedMaterial(String(e.active.data.current?.material || state.entities.find((item) => item.id === e.active.data.current?.entity)?.material || ""));
      }}
      onDragCancel={() => {
        setDraggedMaterial("");
        setDraggedEntity("");
        setMessage("Drag dibatalkan. Meja tidak diubah.");
      }}
    >
      <div className={`sandbox ${discipline}`}>
        <header className="sandbox-heading">
          <div>
            <h1>Lab {names[discipline]}</h1>
            {!simpleChemistry && <p>Eksperimen bebas · SMA/MA kelas X–XII</p>}
          </div>
          <div className="sandbox-action-row">
            {simpleChemistry && <Link href="/laboratories">Keluar lab</Link>}
            {!simpleChemistry && <button onClick={startIntroduction}>
              <CircleHelp size={17} />
              Cara Pakai
            </button>}
          </div>
        </header>
        {!simpleChemistry && <nav className="sandbox-rooms" aria-label="Pilihan ruang">
          {(Object.keys(names) as Discipline[]).map((id) => (
            <Link
              key={id}
              href={`/sandbox/${id}`}
              aria-current={discipline === id ? "page" : undefined}
              className={discipline === id ? "active" : ""}
            >
              {names[id]}
            </Link>
          ))}
        </nav>}
        <div id="sandbox-toolbar" className="sandbox-toolbar">
          <button
            aria-label="Batalkan tindakan"
            title="Batalkan tindakan"
            disabled={!history.past.length}
            onClick={() => {
              setSpeed(0);
              send({ type: "undo" });
              mark("undo");
            }}
          >
            <Undo2 size={18} />
            <span>Batalkan</span>
          </button>
          <button
            aria-label="Ulangi tindakan"
            title="Ulangi tindakan"
            disabled={!history.future.length}
            onClick={() => {
              setSpeed(0);
              send({ type: "redo" });
            }}
          >
            <Redo2 size={18} />
            <span>Ulangi</span>
          </button>
          {!simpleChemistry && <span className="sandbox-clock">{state.time.toFixed(1)} s</span>}
          <button
            className="sandbox-play"
            aria-label={speed ? "Jeda simulasi" : "Jalankan simulasi"}
            onClick={() => changeSpeed(speed ? 0 : 1)}
          >
            {speed ? <Pause size={18} /> : <Play size={18} />}
            {speed ? "Jeda" : "Jalankan"}
          </button>
          <details className="sandbox-menu">
            <summary>Pilihan meja</summary>
            <div className="sandbox-menu-content">
              {simpleChemistry && <>
                <button onClick={startIntroduction}><CircleHelp size={17} />Cara pakai</button>
                <details className="sandbox-room-switcher">
                  <summary>Ganti lab</summary>
                  <nav aria-label="Pilihan ruang">
                    {(Object.keys(names) as Discipline[]).map((id) => <Link key={id} href={`/sandbox/${id}`} aria-current={discipline === id ? "page" : undefined}>{names[id]}</Link>)}
                  </nav>
                </details>
              </>}
              {simpleChemistry && <span className="sandbox-clock">Waktu simulasi: {state.time.toFixed(1)} s</span>}
              <label className="sandbox-speed">
                Waktu
                <select
                  aria-label="Kecepatan simulasi"
                  value={speed}
                  onChange={(e) => changeSpeed(+e.target.value)}
                >
                  <option value={0}>Jeda</option>
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                  <option value={5}>5×</option>
                </select>
              </label>
              <button
                onClick={() =>
                  setMessage(
                    saveBench(state, "saved")
                      ? "Konfigurasi disimpan di browser."
                      : "Storage diblokir; konfigurasi tersimpan sementara di memori.",
                  )
                }
              >
                Simpan
              </button>
              <button
                onClick={() => {
                  setSpeed(0);
                  send({
                    type: "load",
                    state: loadBench(discipline, "saved"),
                  });
                  setSelected("");
                  setMessage("Konfigurasi lokal dimuat.");
                }}
              >
                Muat
              </button>
              <button onClick={exportImage}>
                <Download size={18} />
                Gambar SVG
              </button>
              <button
                onClick={() => {
                  setSpeed(0);
                  send({ type: "reset", discipline });
                  setSelected("");
                  mark("undo");
                }}
              >
                <RotateCcw size={18} />
                Reset meja
              </button>
              <button onClick={() => setHelp(!help)} aria-expanded={help}>
                Bantuan & teori
              </button>
              <Link href="/challenges">
                <BookOpen size={17} />
                Tantangan opsional
              </Link>
            </div>
          </details>
        </div>
        {!persistent && (
          <p role="status" className="sandbox-notice">
            Penyimpanan browser diblokir. Meja tetap bisa digunakan; ekspor
            sebelum menutup halaman.
          </p>
        )}
        <div className={simpleChemistry ? `sandbox-inspector ${entity ? "has-selection" : ""}` : undefined}>
        {simpleChemistry && entity && <div className="sandbox-inspector-heading">
          <h2>{entity.label}</h2>
          <button className="sandbox-inspector-close" aria-label="Tutup info alat" onClick={() => {
          setSelected("");
          setFeedback(null);
          setMessage("");
        }}><X size={20} aria-hidden="true" /></button>
        </div>}
         <ActionFeedback
          feedback={feedback}
          message={message}
          onNext={feedbackNext}
          compact={simpleChemistry}
          onDismiss={() => { setFeedback(null); setMessage(""); }}
         />
         {simpleChemistry && <EquipmentExplanation entity={entity} compact />}
        {simpleChemistry && entity && <>
          <button aria-expanded={tab === "controls"} onClick={() => setTab(tab === "controls" ? "rack" : "controls")}>
            {tab === "controls" ? "Tutup tindakan" : "Tindakan alat"}
          </button>
          {tab === "controls" && controls}
        </>}
        </div>
        {intro.offer && !simpleChemistry && (
          <aside className="sandbox-intro-offer">
            <span>Baru pertama mencoba? Mau lihat cara pakai?</span>
            <button onClick={startIntroduction}>Mulai</button>
            <button onClick={intro.dismiss}>Lewati</button>
          </aside>
        )}
        <CoachMarks
          open={intro.open}
          onClose={intro.dismiss}
          actions={actions}
          onNavigate={(target) => {
            if (target === "rack" || target === "controls") {
              setPanelOpen(true);
              setTab(target === "rack" ? "rack" : "controls");
            }
          }}
        />
        {help && (
          <aside className="sandbox-help">
            <h2>Mulai dari pertanyaanmu</h2>
            <p>
              Ambil wadah, ambil bahan, lalu pilih tujuan dan jumlah. Sambungkan
              alat ukur ke wadah untuk membaca nilai. Urutan bebas; Undo dan
              Reset tidak mengurangi nilai.
            </p>
            <p>
              Coba bandingkan larutan sebelum dan sesudah diencerkan, ubah
              panjang bandul, atau bandingkan sel dengan fokus berbeda.
            </p>
            <details>
              <summary>Teori & batas model</summary>
              <p>
                pH menggunakan neraca muatan, kalor menggunakan Q = mcΔT,
                rangkaian menggunakan hukum Ohm, pembiasan menggunakan Snell.
                Model biologis menampilkan laju relatif, bukan prediksi sampel
                nyata.
              </p>
              <p>
                Reaksi, katalisis, kelarutan, dan ekosistem memakai
                penyederhanaan pembelajaran. Parameter yang perlu validasi guru
                ditandai di kode. Katalog saat ini: {ruleCounts.chemistry} entri
                Kimia, {ruleCounts.physics} Fisika, {ruleCounts.biology}{" "}
                Biologi. Sebagian entri berbagi model konseptual; angka ini
                bukan jumlah model ilmiah yang sudah divalidasi.
              </p>
            </details>
            <button onClick={() => setHelp(false)}>Tutup bantuan</button>
          </aside>
        )}
        <div className="sandbox-layout">
          <div className="sandbox-left">
            <Workbench
              state={state}
              selected={selected}
              dispatch={send}
              onPlaceTube={placeTube}
              onSelect={(id) => {
                setSelected(id);
                setTab(simpleChemistry ? "rack" : "controls");
                setPanelOpen(true);
                setMessage("");
                const item = state.entities.find((e) => e.id === id);
                if (item)
                  setFeedback(selectionFeedback(item));
              }}
            />
            <p className="sandbox-safety">
              {simpleChemistry ? "Simulasi saja. Jangan mencoba campuran berbahaya di dunia nyata." : "K3 virtual: jangan mencoba kombinasi berbahaya di dunia nyata. Tumpahan, panas, dan kerusakan di sini hanya simulasi."}
            </p>
            {!simpleChemistry && <Observations entity={entity} state={state} />}
            {!simpleChemistry && <Notebook
              state={state}
              entity={entity}
              dispatch={send}
              onNote={() => mark("note")}
              onFeedback={setMessage}
            />}
          </div>
          <aside className={`sandbox-right ${panelOpen || simpleChemistry ? "panel-open" : ""}`}>
            {!simpleChemistry && <button
              className="sandbox-panel-disclosure"
              aria-expanded={panelOpen}
              aria-controls="sandbox-panel-body"
              onClick={() => setPanelOpen(!panelOpen)}
            >
              Rak & pengaturan {panelOpen ? "· tutup" : "· buka"}
            </button>}
            <div id="sandbox-panel-body" className="sandbox-panel-body">
              {!simpleChemistry && <div
                className="sandbox-panel-tabs"
                role="group"
                aria-label="Panel meja"
              >
                <button
                  aria-pressed={tab === "rack"}
                  onClick={() => setTab("rack")}
                >
                  {simpleChemistry ? "Alat & bahan" : "Rak"}
                </button>
                <button
                  aria-pressed={tab === "controls"}
                  disabled={simpleChemistry && !entity}
                  onClick={() => setTab("controls")}
                >
                  {simpleChemistry ? "Atur benda" : "Benda dipilih"}
                </button>
              </div>}
              {(tab === "rack" || simpleChemistry) && (
                <Inventory discipline={discipline} onAdd={(id) => add(id)} />
              )}
              {!simpleChemistry && tab === "controls" && controls}
            </div>
          </aside>
          {simpleChemistry && (
            <div className="sandbox-records">
              <details ref={results} className="sandbox-results">
                <summary>Hasil pengamatan</summary>
                <Observations entity={entity} state={state} compact />
              </details>
              <Notebook state={state} entity={entity} dispatch={send} onNote={() => mark("note")} onFeedback={setMessage} />
            </div>
          )}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        <DragPreview material={materials[draggedMaterial]} entity={state.entities.find((item) => item.id === draggedEntity)} state={state} />
      </DragOverlay>
    </DndContext>
  );
}
export default function Sandbox({ discipline }: { discipline: Discipline }) {
  return (
    <LabErrorBoundary>
      {discipline === "biology" ? <MicroscopeLab /> : <Desk key={discipline} discipline={discipline} />}
    </LabErrorBoundary>
  );
}
