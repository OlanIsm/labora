"use client";
import { useEffect, useState } from "react";
import type { Entity, LabState } from "@/lib/sandbox/types";
import { chemistryGuides, illustrativeTools } from "./equipmentGuides";
import { materials } from "@/lib/sandbox/catalog";

export function chemistryTip(state: LabState, selected?: Entity, playing = false): string {
  if (selected?.material === "stopwatch") return !selected.active ? "Tekan Mulai stopwatch di Atur benda. Stopwatch mulai dari nilainya sendiri, tanpa perlu sambungan." : !playing ? "Stopwatch aktif, tetapi waktu simulasi dijeda. Tekan Lanjutkan waktu atau Jalankan di toolbar." : "Stopwatch berjalan. Hentikan membekukan angka; Nolkan mengembalikannya ke 0.";
  if (selected?.material === "burner") {
    const vessel = state.entities.find(e => selected.connections.includes(e.id) && materials[e.material]?.kind === "container");
    if (!vessel) return "Tarik titik pembakar ke titik wadah berisi air. Kaki tiga tidak wajib di simulasi ini.";
    if (!vessel.contents.some(p => p.mass > 1e-8)) return `${vessel.label} masih kosong. Tambahkan air sebelum memanaskan.`;
    if (!selected.active) return `Pembakar tersambung ke ${vessel.label}. Atur Suhu target (°C), lalu tekan Nyalakan / jalankan pada panel Atur benda.`;
    if (!playing) return "Pembakar sudah menyala, tetapi waktu dijeda. Tekan Jalankan di toolbar agar suhu berubah.";
    return `Pemanasan berjalan menuju target ${selected.params.targetTemperature ?? 120} °C. Pilih ${vessel.label} untuk melihat suhu dan volume. Pada titik didih model, kalor menguapkan pelarut sehingga volume berkurang. Matikan pembakar untuk berhenti memanaskan.`;
  }
  if (selected && illustrativeTools.includes(selected.material)) return chemistryGuides[selected.material].usage;
  if (selected && chemistryGuides[selected.material]) return chemistryGuides[selected.material].usage;
  return !state.entities.length ? "Mulai dari satu wadah. Ambil gelas kimia dari rak di kanan." : "Pilih alat untuk melihat cara pakainya. Tarik titik di sisi benda untuk membuat sambungan; klik garis untuk melepasnya.";
}

export function chemistryGuideSteps(selected?: Entity) {
  const guide = selected && chemistryGuides[selected.material];
  if (!selected || !guide) return steps;
  return [
    { target: "controls", text: `${selected.label} : ${guide.purpose}` },
    { target: "controls", text: guide.usage },
    { target: "observations", text: selected.material === "stopwatch" ? "Baca detik di bawah stopwatch. Jeda waktu simulasi juga menjeda stopwatch; Hentikan hanya menghentikan stopwatch ini dan Nolkan mengembalikan angkanya ke 0." : materials[selected.material]?.kind === "instrument" ? "Arahkan kursor ke alat untuk angka besar, atau gunakan fokus keyboard. Di HP, pilih alat. Bandingkan hasil sebelum dan sesudah mengubah isi wadah; sambungan saja sudah memperbarui pembacaan." : "Pilih wadah atau alat untuk melihat hasil pengamatan dan grafik yang tersedia. Amati warna, lapisan, endapan, gas, atau suhu; tidak semua perubahan terjadi seketika." },
    { target: "controls", text: guide.limitation || "Model ini menyederhanakan alat nyata. Kamu bebas mengganti jumlah bahan dan susunan meja; gunakan Batalkan tindakan untuk kembali." },
    { target: "notebook", text: `Catat jumlah bahan, hasil awal, dan hasil akhir saat memakai ${selected.label}. Ubah satu hal lalu bandingkan lagi, tanpa urutan percobaan wajib.` },
  ];
}

const steps = [
  { target: "rack", text: "Hai, aku Leo! Ambil gelas kimia dari tab Alat. Kamu boleh mencoba apa saja, tanpa urutan wajib." },
  { target: "rack", text: "Buka tab Bahan, lalu seret air atau larutan ke dalam gelas. Menaruh botol di meja saja belum menuangkan isinya." },
  { target: "controls", text: "Untuk menguji larutan, tarik titik di sisi lakmus atau pH meter ke titik gelas. Garis menunjukkan pasangan benda yang tersambung." },
  { target: "observations", text: "Amati warna lakmus dan hasil ukur. Untuk melepas sambungan, arahkan kursor ke garis lalu klik. Escape membatalkan garis yang sedang ditarik." },
  { target: "notebook", text: "Kalau mau, tulis hasilnya di buku catatan. Salah mencoba? Batalkan tindakan, lalu coba lagi. Percobaanmu tetap bebas." },
];

export default function ChemistryGuide({ open, state, selected, playing = false, onOpen, onClose, onNavigate }: {
  open: boolean; state: LabState; selected?: Entity; playing?: boolean; onOpen: () => void; onClose: () => void; onNavigate: (target: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const guideSteps = chemistryGuideSteps(selected);
  useEffect(() => { if (open) { setStep(0); setVisible(true); } }, [open]);
  useEffect(() => { setStep(0); }, [selected?.id]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open, onClose]);
  function navigate(index: number) {
    setStep(index);
    onNavigate(guideSteps[index].target);
  }
  const tip = chemistryTip(state, selected, playing);
  return <aside className="chemistry-guide" aria-label="Panduan Leo">
    {visible && <div className="chemistry-guide-card sim-mascot">
    <svg className="chemistry-leo" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="32" r="27" fill="#d79a32" />
      <circle cx="22" cy="20" r="8" fill="#ffd84d" /><circle cx="58" cy="20" r="8" fill="#ffd84d" />
      <ellipse cx="40" cy="33" rx="20" ry="21" fill="#ffe3a0" />
      <rect x="22" y="25" width="36" height="15" rx="6" fill="#eaf9ff" stroke="#426b7d" strokeWidth="2" />
      <path d="M40 26V39" stroke="#426b7d" strokeWidth="2" />
      <circle cx="31" cy="32" r="2.5" fill="#1f2430" /><circle cx="49" cy="32" r="2.5" fill="#1f2430" />
      <path d="M36 42Q40 46 44 42M34 47Q40 52 46 47" fill="none" stroke="#674823" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 60Q20 53 29 53H51Q60 53 60 60V74H20Z" fill="white" stroke="#426b7d" strokeWidth="1.5" />
      <path d="M32 54L40 64L48 54M40 64V74" fill="none" stroke="#426b7d" strokeWidth="1.5" />
      <circle cx="53" cy="66" r="3" fill="#ff78b8" />
    </svg>
    <div className="chemistry-guide-content sim-speech">
      <div className="chemistry-guide-text"><strong>Leo, teman eksperimenmu</strong>{" "}
        <p role="status" aria-live="polite" aria-atomic="true">{open ? guideSteps[step].text : tip}</p>
      </div>
      <button onClick={open ? onClose : onOpen}>{open ? "Lewati" : "Buka panduan"}</button>
      {open && <nav className="chemistry-guide-navigation" aria-label="Bagian panduan Kimia">
        <button disabled={step === 0} onClick={() => navigate(step - 1)}>Sebelumnya</button>
        <span>{step + 1} dari {guideSteps.length} · {selected ? selected.label : "opsional"}</span>
        <button onClick={() => step === guideSteps.length - 1 ? onClose() : navigate(step + 1)}>{step === guideSteps.length - 1 ? "Selesai" : "Berikutnya"}</button>
      </nav>}
    </div>
    </div>}
    <button aria-expanded={visible} onClick={() => { setVisible(!visible); if (visible && open) onClose(); }}>{visible ? "Sembunyikan panduan" : "Tampilkan panduan Leo"}</button>
  </aside>;
}
