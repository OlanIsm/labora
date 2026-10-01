"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
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
} from "lucide-react";
import { useSandbox } from "@/hooks/useSandbox";
import { Discipline, LabState } from "@/lib/sandbox/types";
import { HistoryAction } from "@/lib/sandbox/engine";
import {
  actionFeedback,
  Feedback,
  observationFeedback,
  measurementFeedback,
} from "@/lib/sandbox/feedback";
import { loadBench, saveBench, download } from "@/services/labRepository";
import { ruleCounts } from "@/lib/sandbox/rules";
import Workbench from "./Workbench";
import Inventory from "./Inventory";
import ApparatusControls from "./ApparatusControls";
import Observations from "./Observations";
import Notebook from "./Notebook";
import CoachMarks, { useIntroduction } from "./CoachMarks";
import LabErrorBoundary from "./LabErrorBoundary";
import ActionFeedback from "./ActionFeedback";

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
  const [actions, setActions] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [help, setHelp] = useState(false);
  const intro = useIntroduction();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const pending = useRef<{ action: HistoryAction; before: LabState } | null>(
    null,
  );
  const lastEvent = useRef<number | null>(null);
  useEffect(() => {
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
    } else if (lastEvent.current !== null) {
      const observed = state.events
        .filter(
          (event) =>
            event.id > lastEvent.current! &&
            [
              "gas.formed",
              "precipitate.formed",
              "indicator.changed",
              "container.overflow",
              "fuse.blown",
              "lamp.broken",
            ].includes(event.type),
        )
        .at(-1);
      if (observed) {
        setMessage("");
        setFeedback(observationFeedback(observed, state));
      }
    }
    lastEvent.current = latest;
  }, [history, speed]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );
  const mark = (type: string) =>
    setActions((old) => (old.includes(type) ? old : [...old, type]));
  const entity = state.entities.find((e) => e.id === selected);
  function startIntroduction() {
    setPanelOpen(true);
    setTab("rack");
    intro.start();
  }
  function send(a: HistoryAction) {
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
    if (next === "observe" && id) setSelected(id);
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
    setTab("controls");
  }
  function drop(e: DragEndEvent) {
    if (e.over?.id !== "bench") return;
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
      if (item)
        send({
          type: "move",
          id: item.id,
          x: item.x + (e.delta.x / bench.width) * 100,
          y: item.y + (e.delta.y / bench.height) * 100,
        });
    }
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
  }
  if (!ready) return <p role="status">Menyiapkan meja bebas...</p>;
  return (
    <DndContext sensors={sensors} onDragEnd={drop}>
      <div className={`sandbox ${discipline}`}>
        <header className="sandbox-heading">
          <div>
            <h1>Lab {names[discipline]}</h1>
            <p>Eksperimen bebas · SMA/MA kelas X–XII</p>
          </div>
          <div className="sandbox-action-row">
            <button onClick={startIntroduction}>
              <CircleHelp size={17} />
              Cara Pakai
            </button>
          </div>
        </header>
        <nav className="sandbox-rooms" aria-label="Pilihan ruang">
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
        </nav>
        <div id="sandbox-toolbar" className="sandbox-toolbar">
          <button
            aria-label="Undo"
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
            aria-label="Redo"
            disabled={!history.future.length}
            onClick={() => {
              setSpeed(0);
              send({ type: "redo" });
            }}
          >
            <Redo2 size={18} />
            <span>Ulangi</span>
          </button>
          <span className="sandbox-clock">{state.time.toFixed(1)} s</span>
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
        <ActionFeedback
          feedback={feedback}
          message={message}
          onNext={feedbackNext}
        />
        {intro.offer && (
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
              onSelect={(id) => {
                setSelected(id);
                setTab("controls");
                setPanelOpen(true);
                setMessage("");
                const item = state.entities.find((e) => e.id === id);
                if (item)
                  setFeedback({
                    title: `${item.label} dipilih.`,
                    detail:
                      measurementFeedback(item) ||
                      item.status ||
                      "Benda belum diubah. Tindakan yang tersedia ada di panel benda.",
                    hint: "Kamu bisa memilih tindakan atau mengambil benda lain.",
                    target: id,
                  });
              }}
            />
            <p className="sandbox-safety">
              K3 virtual: jangan mencoba kombinasi berbahaya di dunia nyata.
              Tumpahan, panas, dan kerusakan di sini hanya simulasi.
            </p>
            <Observations entity={entity} state={state} />
            <Notebook
              state={state}
              entity={entity}
              dispatch={send}
              onNote={() => mark("note")}
            />
          </div>
          <aside className={`sandbox-right ${panelOpen ? "panel-open" : ""}`}>
            <button
              className="sandbox-panel-disclosure"
              aria-expanded={panelOpen}
              aria-controls="sandbox-panel-body"
              onClick={() => setPanelOpen(!panelOpen)}
            >
              Rak & pengaturan {panelOpen ? "· tutup" : "· buka"}
            </button>
            <div id="sandbox-panel-body" className="sandbox-panel-body">
              <div
                className="sandbox-panel-tabs"
                role="group"
                aria-label="Panel meja"
              >
                <button
                  aria-pressed={tab === "rack"}
                  onClick={() => setTab("rack")}
                >
                  Rak
                </button>
                <button
                  aria-pressed={tab === "controls"}
                  onClick={() => setTab("controls")}
                >
                  Benda dipilih
                </button>
              </div>
              {tab === "rack" ? (
                <Inventory discipline={discipline} onAdd={(id) => add(id)} />
              ) : (
                <ApparatusControls
                  entity={entity}
                  state={state}
                  dispatch={send}
                  target={target}
                  setTarget={(id) => {
                    setTarget(id);
                    setMessage("");
                    const destination = state.entities.find((e) => e.id === id);
                    if (destination)
                      setFeedback({
                        title: `${destination.label} dipilih sebagai tujuan.`,
                        detail:
                          entity && entity.contents.some((p) => p.mass > 0)
                            ? "Bahan belum dituang. Memilih tujuan saja belum memindahkan isi benda."
                            : "Benda belum tersambung. Memilih tujuan saja belum menghubungkan alat.",
                        hint:
                          entity && entity.contents.some((p) => p.mass > 0)
                            ? "Tekan “Tuang / campur” untuk memindahkan jumlah yang dipilih."
                            : "Tekan “Sambungkan” untuk menghubungkan kedua benda.",
                        target: destination.id,
                      });
                  }}
                  onAction={mark}
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </DndContext>
  );
}
export default function Sandbox({ discipline }: { discipline: Discipline }) {
  return (
    <LabErrorBoundary>
      <Desk key={discipline} discipline={discipline} />
    </LabErrorBoundary>
  );
}
