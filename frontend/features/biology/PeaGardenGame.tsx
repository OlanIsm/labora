"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, Sprout } from "lucide-react";
import { readLocal, writeLocal } from "../../services/labRepository";
import { GARDEN_MISSIONS, GARDEN_STORAGE_KEY, GardenState, Genes, Prediction, concludeMystery, flowerColor, growCross, initialGarden, isGardenState, missionComplete, mysteryEvidence, nextGardenMission, phenotypeLabel, saveOffspring } from "./garden";
import GiffyMascot from "./GiffyMascot";
import PeaPlant from "./PeaPlant";
import PunnettPlanner from "./PunnettPlanner";

const colorPredictions: { value: Prediction; label: string }[] = [
  { value: "purple", label: "100% bunga ungu" }, { value: "white", label: "100% bunga putih" },
  { value: "both", label: "Ungu dan putih mungkin muncul" }, { value: "unknown", label: "Belum bisa dipastikan" },
];
const targetPredictions: { value: Prediction; label: string }[] = ["0", "0.0625", "0.125", "0.25", "0.5", "1"].map(value => ({ value: value as Prediction, label: `${new Intl.NumberFormat("id-ID").format(Number(value) * 100)}%` }));

export default function PeaGardenGame() {
  const [state, setState] = useState<GardenState | null>(null);
  const [saved, setSaved] = useState(true);
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [inspectLine, setInspectLine] = useState("");
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    let restored: unknown;
    try { restored = JSON.parse(readLocal(GARDEN_STORAGE_KEY) || "null"); } catch { restored = null; }
    setState(isGardenState(restored) ? restored : initialGarden(Date.now()));
  }, []);
  useEffect(() => { if (state) setSaved(writeLocal(GARDEN_STORAGE_KEY, JSON.stringify(state))); }, [state]);
  if (!state) return <p role="status">Menyiapkan kebun Giffy...</p>;

  const mission = GARDEN_MISSIONS[state.mission];
  const traits = mission?.traits || 2;
  const complete = missionComplete(state);
  const first = state.plants.find(plant => plant.id === firstId), second = state.plants.find(plant => plant.id === secondId);
  const latest = state.history.filter(run => run.mission === state.mission).at(-1);
  const completedRun = state.history.find(run => run.mission === state.mission && run.passed);
  const hiddenResult = latest?.parents.some(id => !state.plants.find(plant => plant.id === id)?.revealed);
  const evidence = mysteryEvidence(state);
  const completedCount = Math.min(state.mission + (complete ? 1 : 0), GARDEN_MISSIONS.length);
  const currentFeedback = completedRun?.feedback || (latest?.parents[0] === firstId && latest.parents[1] === secondId ? latest.feedback : "");
  const line = inspectLine || (showHint && mission ? mission.hint : currentFeedback || (mission
    ? state.mission === 0 ? "Hai, aku Giffy! Di kebun ini kamu memilih pasangan induk untuk mencapai tujuan, bukan sekadar mengisi kotak. Bunga ungu bisa PP atau Pp. Pilih dua induk, buat prediksi, lalu tanam. Papan Punnett selalu boleh dibuka untuk membantu rencanamu."
      : `${mission.goal} ${state.mission === 2 ? "Genotipe misteri tidak bisa ditebak hanya dari warna bunganya. Pilih uji silang yang bisa memberi bukti." : "Keturunan yang disimpan bisa dipakai sebagai induk. Coba rencanakan dulu sebelum menanam."}`
    : "Empat misi selesai! Kebunmu menyimpan hasil eksperimen yang benar-benar tumbuh. Sekarang kamu boleh menyilangkan koleksi secara bebas dan memeriksa peluangnya dengan papan Punnett."));

  function chooseParent(slot: 1 | 2, id: string) {
    if (slot === 1) setFirstId(id); else setSecondId(id);
    setPrediction(null); setInspectLine("");
  }
  function advance() {
    const next = nextGardenMission(state!);
    setState(next); setFirstId(next.mission === 3 ? "dihybrid" : ""); setSecondId(""); setPrediction(null); setInspectLine(""); setShowHint(false);
  }
  function reset() {
    if (state!.history.length && !window.confirm("Mulai kebun baru? Koleksi, hasil persilangan, dan kemajuan misi saat ini akan diganti.")) return;
    setState(initialGarden(Date.now())); setFirstId(""); setSecondId(""); setPrediction(null); setInspectLine(""); setShowHint(false);
  }

  return <div className="pea-garden">
    <Link href="/biologi" className="back-link"><ArrowLeft size={18} /> Semua aktivitas Biologi</Link>
    <div className="garden-page-heading"><div><h1>Misi Kebun</h1><p>Pilih induk. Prediksi keturunannya. Bangun kebun dari generasi ke generasi.</p></div>
      <button className="button ghost small" onClick={reset}><RotateCcw size={17} /> Kebun baru</button></div>
    <div className="garden-progress"><span>{completedCount} dari {GARDEN_MISSIONS.length} misi selesai</span><progress max={GARDEN_MISSIONS.length} value={completedCount} aria-label="Kemajuan Misi Kebun" /><small>{saved ? "Tersimpan di browser ini" : "Penyimpanan browser tidak tersedia; kemajuan hanya bertahan selama tab ini terbuka."}</small></div>
    <section className={`garden-mission ${complete ? "complete" : ""}`} aria-labelledby="garden-mission-heading">
      <div className="garden-mission-illustration"><PeaPlant genes={state.mission === 1 ? "ppRR" : state.mission === 3 ? "pprr" : "PpRR"} showSeed={traits === 2} /></div>
      <div><h2 id="garden-mission-heading">{mission ? `Misi ${state.mission + 1}: ${mission.name}` : "Kebunmu, hasil belajarmu"}</h2><p>{mission?.goal || "Semua misi selesai. Terus bereksperimen dengan koleksi yang sudah kamu bangun."}</p>
        <p className="garden-mission-rule">Misi menilai rencana dan prediksi, bukan keberuntungan sampel.</p>
        {mission && <div className="garden-mission-actions"><button className="text-link" onClick={() => { setShowHint(value => !value); setInspectLine(""); }} aria-pressed={showHint}>Petunjuk Giffy</button>
          {complete && <button className="button primary small" onClick={advance}><Check size={17} />{state.mission === GARDEN_MISSIONS.length - 1 ? "Lihat kebunku" : "Lanjut ke misi berikutnya"}</button>}</div>}
      </div>
    </section>
    <div className="garden-coach"><GiffyMascot line={line} /></div>
    <div className="garden-play-layout">
      <div className="garden-workspace">
        <section className="garden-crossing" aria-labelledby="garden-cross-heading">
          <h2 id="garden-cross-heading">Pilih pasangan induk</h2>
          <p className="garden-small">P boleh menutupi p, tetapi bukan berarti lebih kuat atau lebih baik. Memilih tanaman yang sama dua kali berarti penyerbukan sendiri.</p>
          <div className="garden-parent-pair">{([1, 2] as const).map(slot => {
            const plant = slot === 1 ? first : second;
            return <div className="garden-parent" key={slot}>
              {plant ? <PeaPlant genes={plant.genes} showSeed={traits === 2} /> : <div className="garden-parent-empty"><Sprout size={44} /></div>}
              <label className="garden-field">Induk {slot}<select value={slot === 1 ? firstId : secondId} onChange={event => chooseParent(slot, event.target.value)} disabled={complete}>
                <option value="">Pilih dari koleksi</option>{state.plants.map(item => <option key={item.id} value={item.id}>{item.name} · {item.revealed ? item.genes.slice(0, traits * 2) : "PP atau Pp?"} · G{item.generation}</option>)}
              </select></label>
              {plant && <p className="garden-parent-description">{phenotypeLabel(plant.genes, traits)}<strong>{plant.revealed ? plant.genes.slice(0, traits * 2) : "Genotipe tersembunyi"}</strong></p>}
            </div>;
          })}</div>
          <PunnettPlanner key={`${firstId}-${secondId}-${state.mission}`} first={first} second={second} traits={traits} onInspect={setInspectLine} />
          <fieldset className="garden-prediction" disabled={complete || !first || !second}>
            <legend>{state.mission === 3 ? "Berapa peluang anak pprr: putih dan keriput?" : "Prediksi peluang warna keturunannya"}</legend>
            <div>{(state.mission === 3 ? targetPredictions : colorPredictions).map(option => <label key={option.value} className={prediction === option.value ? "selected" : ""}>
              <input type="radio" name="garden-prediction" value={option.value} checked={prediction === option.value} onChange={() => { setPrediction(option.value); setInspectLine(""); }} />{option.label}
            </label>)}</div>
          </fieldset>
          <button className="button primary garden-grow" disabled={!first || !second || !prediction || complete} onClick={() => {
            if (prediction) { setState(growCross(state, firstId, secondId, prediction)); setInspectLine(""); setShowHint(false); }
          }}><Sprout size={19} />Tanam 20 keturunan</button>
        </section>
        {latest && <section className="garden-result" aria-labelledby="garden-result-heading">
          <div className="garden-section-heading"><h2 id="garden-result-heading">Persilangan terakhir</h2><span>{latest.correct ? "Prediksi tepat" : "Periksa prediksimu"}</span></div>
          <p>{latest.feedback}</p>
          <div className="garden-result-counts"><span><strong>{latest.children.filter(genes => flowerColor(genes) === "purple").length}</strong> bunga ungu</span><span><strong>{latest.children.filter(genes => flowerColor(genes) === "white").length}</strong> bunga putih</span><span>{latest.children.length} tanaman dalam sampel</span></div>
          <p className="garden-small">Keturunan generasi {latest.generation} dari persilangan ini.</p>
          <div className="garden-plot" key={latest.id}>{latest.children.map((genes, index) => <div className="garden-sprout" key={index}><PeaPlant genes={genes} compact showSeed={traits === 2} /><span>{hiddenResult ? phenotypeLabel(genes) : genes.slice(0, traits * 2)}</span></div>)}</div>
          <p className="garden-small">Peluang teoritis tidak menjamin jumlah tepat pada 20 tanaman. Sampel baru dapat memberi hasil berbeda.</p>
          {!hiddenResult && <div className="garden-save-children"><h3>Pakai keturunannya sebagai induk</h3><p className="garden-small">Koleksi menyimpan wakil generasi terbaru dari setiap genotipe.</p>{[...new Set(latest.children)].map(genes => <button key={genes} className="button ghost small" onClick={() => {
            const next = saveOffspring(state, latest.id, genes as Genes);
            setState(next); setInspectLine(next === state ? "Genotipe ini sudah terwakili oleh generasi yang sama atau lebih baru di koleksimu." : `Keturunan ${genes.slice(0, traits * 2)} disimpan. Sekarang kamu bisa memilihnya sebagai induk.`);
          }}>Simpan {genes.slice(0, traits * 2)}</button>)}</div>}
        </section>}
        {state.mission === 2 && evidence.total > 0 && <section className="garden-evidence" aria-labelledby="garden-evidence-heading">
          <h2 id="garden-evidence-heading">Apa yang didukung bukti?</h2><p>Dari {evidence.total} keturunan uji silang dengan pp, kamu mengamati {evidence.white} bunga putih. Pengamatan dari percobaan sebelumnya tetap dihitung.</p>
          <div className="garden-conclusions">{([{ value: "PP", label: "Pasti PP" }, { value: "Pp", label: "Terbukti Pp" }, { value: "unknown", label: "Belum bisa dipastikan" }] as const).map(answer => <button className="button ghost small" key={answer.value} disabled={complete} onClick={() => { setState(concludeMystery(state, answer.value)); setInspectLine(""); }}>{answer.label}</button>)}</div>
          {complete && <p className="garden-evidence-reveal">Catatan genotipe: tanaman misteri adalah <strong>{state.plants.find(plant => plant.id === "mystery")!.genes.slice(0, 2)}</strong>. Cocokkan catatan ini dengan batas kesimpulan dari sampelmu.</p>}
        </section>}
      </div>
      <aside className="garden-collection" aria-labelledby="garden-collection-heading"><h2 id="garden-collection-heading">Koleksi induk</h2><p>{state.plants.length} tanaman tersedia. G0 adalah induk awal; G1 dan seterusnya adalah keturunan.</p>
        {state.plants.map(plant => <div className="garden-collection-plant" key={plant.id}><PeaPlant genes={plant.genes} compact showSeed={traits === 2} /><div><strong>{plant.name}</strong><span>{plant.revealed ? plant.genes.slice(0, traits * 2) : "PP atau Pp?"} · G{plant.generation}</span><small>{phenotypeLabel(plant.genes, traits)}</small></div></div>)}
      </aside>
    </div>
    <section className="garden-beds" aria-labelledby="garden-beds-heading"><h2 id="garden-beds-heading">Kebun hasil misimu</h2><p>Setiap petak menyimpan sampel dari rencana yang berhasil.</p><div className="garden-bed-grid">{GARDEN_MISSIONS.map((item, index) => {
      const run = state.history.find(result => result.mission === index && result.passed);
      return <section className={`garden-bed ${run ? "planted" : ""}`} key={item.id}><h3>{item.name}</h3>{run ? <><div>{run.children.slice(0, 6).map((genes, i) => <PeaPlant key={i} genes={genes} compact showSeed={item.traits === 2} />)}</div><p>{run.children.filter(genes => flowerColor(genes) === "white").length} putih, {run.children.filter(genes => flowerColor(genes) === "purple").length} ungu dari {run.children.length} tanaman.</p></> : <p>Petak ini menunggu misimu selesai.</p>}</section>;
    })}</div></section>
    <details className="garden-model"><summary>Model pewarisan yang digunakan</summary><p>Model Mendelian dengan dominasi penuh, segregasi alel, dan asortasi bebas untuk dua sifat. P memberi bunga ungu; pp memberi bunga putih. R memberi biji bulat; rr memberi biji keriput. Kedua sifat dianggap tidak terpaut. Genotipe pada koleksi adalah catatan simulasi, bukan sesuatu yang bisa diketahui hanya dari tampilan tanaman. Tanaman boleh menyerbuk sendiri. Model ini tidak menggambarkan seluruh kompleksitas pewarisan sifat di dunia nyata.</p></details>
  </div>;
}
