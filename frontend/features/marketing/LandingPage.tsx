"use client";

import { experiments, initialRuntime } from "@/features/experiments/index";
import { Visual } from "@/features/experiments/ui";
import { LabChoices } from "@/features/laboratory/ui";
import {
  ArrowRight,
  Atom,
  Beaker,
  CircleHelp,
  Droplets,
  GraduationCap,
  GripVertical,
  Leaf,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Landing() {
  const [indicator, setIndicator] = useState(false);
  const preview = {
    ...initialRuntime(),
    placed: ["beaker"],
    step: indicator ? 3 : 2,
  };
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Sains lebih seru
            <br />
            kalau kamu <span>coba.</span>
          </h1>
          <p>
            Campur larutan, nyalakan rangkaian, atau intip sel lewat mikroskop.
            Di Labora, kamu bisa mencoba eksperimen langsung dari layar.
          </p>
          <Link href="/dashboard" className="button primary large">
            Mulai eksperimen <ArrowRight size={20} />
          </Link>
          <p className="hero-footnote">
            Untuk SMA/MA kelas X–XII. Eksperimen bebas tanpa akun.
          </p>
          <div className="hero-subjects">
            <span>
              <Beaker size={18} />
              Kimia
            </span>
            <span>
              <Atom size={18} />
              Fisika
            </span>
            <span>
              <Leaf size={18} />
              Biologi
            </span>
          </div>
        </div>
        <div className="hero-experiment">
          <div className="demo-heading">
            <span>
              <Beaker size={19} /> Coba dulu di sini
            </span>
            <span>Simulasi pH</span>
          </div>
          <Visual exp={experiments[0]} state={preview} />
          <div className="demo-observation" aria-live="polite">
            <strong>
              {indicator
                ? "Warnanya berubah. Larutan ini asam!"
                : "Larutan ini asam atau basa?"}
            </strong>
            <p>
              {indicator
                ? "Indikator berwarna merah menunjukkan pH sekitar 3."
                : "Tambahkan indikator pH untuk mencari tahu."}
            </p>
          </div>
          <button
            className={`button ${indicator ? "ghost" : "demo-action"}`}
            onClick={() => setIndicator(!indicator)}
          >
            {indicator ? <RotateCcw size={18} /> : <Droplets size={18} />}
            {indicator ? "Ulangi percobaan" : "Tambahkan indikator"}
          </button>
        </div>
      </section>
      <section id="labs" className="landing-labs">
        <div className="section-heading">
          <div>
            <h2>Rasa penasaranmu mau ke mana?</h2>
            <p>Pilih bidang sains, lalu temukan eksperimen pertamamu.</p>
          </div>
        </div>
        <LabChoices enterApp />
      </section>
      <section id="learning" className="learning-section">
        <div>
          <h2>Nggak harus langsung tahu jawabannya.</h2>
          <p>
            Setiap eksperimen punya panduan. Kamu boleh mencoba, salah, dan
            mengulang sampai paham.
          </p>
          <Link href="/dashboard" className="text-link">
            Buka dashboard <ArrowRight size={18} />
          </Link>
        </div>
        <dl className="learning-list">
          <div>
            <dt>
              <GripVertical size={22} />
              Pakai alatnya
            </dt>
            <dd>Geser alat ke meja, atau pilih lalu tekan tombol tindakan.</dd>
          </div>
          <div>
            <dt>
              <Lightbulb size={22} />
              Buntu? Buka petunjuk
            </dt>
            <dd>
              Ada bantuan di setiap langkah, tanpa langsung memberi jawaban.
            </dd>
          </div>
          <div>
            <dt>
              <CircleHelp size={22} />
              Pahami hasilnya
            </dt>
            <dd>
              Jawab pertanyaan singkat dan baca penjelasan dari pengamatanmu.
            </dd>
          </div>
          <div>
            <dt>
              <GraduationCap size={22} />
              Belajar bareng kelas
            </dt>
            <dd>Guru bisa menyiapkan tugas dari eksperimen yang tersedia.</dd>
          </div>
        </dl>
      </section>
      <section className="landing-close">
        <div>
          <h2>Pertanyaan berikutnya, kamu yang tentukan.</h2>
          <p>Mulai dari eksperimen sederhana. Lihat apa yang berubah.</p>
        </div>
        <Link href="/dashboard" className="button primary large">
          Pilih eksperimenmu
        </Link>
      </section>
    </>
  );
}
