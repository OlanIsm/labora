"use client";

import type { Assignment } from "@/features/assignments/model";
import { experiments, getExperiment } from "@/features/experiments/index";
import { SubjectBadge } from "@/shared/ui/SubjectBadge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Builder({
  onSave,
}: {
  onSave: (a: Assignment) => Promise<void>;
}) {
  const router = useRouter();
  const [experimentId, setExperimentId] = useState("acid-base");
  const [title, setTitle] = useState("Penyelidikan Asam dan Basa");
  const [instructions, setInstructions] = useState(
    "Amati perubahan warna dan jelaskan apa yang ditunjukkan indikator tentang larutan A.",
  );
  const [className, setClassName] = useState("");
  const [stages, setStages] = useState<Assignment["stages"]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const exp = getExperiment(experimentId)!;
  useEffect(() => {
    setStages(
      exp.steps.map((s) => ({
        instruction: s.instruction,
        hint: s.hint,
        question: s.question?.prompt || "",
        options: s.question?.options || [],
        answer: s.question?.answer || 0,
      })),
    );
  }, [exp]);
  function update(i: number, key: "instruction" | "hint", value: string) {
    setStages((s) => s.map((x, j) => (j === i ? { ...x, [key]: value } : x)));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const a: Assignment = {
        id: `assignment-${Date.now()}`,
        experimentId,
        title: title.trim(),
        instructions: instructions.trim(),
        className: className.trim(),
        stages,
        createdAt: new Date().toISOString(),
      };
      await onSave(a);
      router.push(`/teacher/results/${a.id}`);
    } catch {
      setError("Tugas belum tersimpan. Periksa koneksi, lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" href="/teacher">
        <ArrowLeft size={18} />
        Ruang guru
      </Link>
      <div className="page-heading">
        <h1>Buat tugas eksperimen</h1>
        <p>
          Tentukan kelas dan arahan. Simulasi serta jawaban ilmiahnya tetap
          tersedia.
        </p>
      </div>
      <form className="builder-layout" onSubmit={save}>
        <div>
          <section className="builder-section">
            <h2>Detail tugas</h2>
            <div className="field-grid">
              <label>
                Eksperimen
                <select
                  value={experimentId}
                  onChange={(e) => setExperimentId(e.target.value)}
                >
                  {experiments.map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Kelas atau kelompok
                <input
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: VIII A"
                />
              </label>
            </div>
            <label>
              Judul tugas
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Arahan untuk siswa
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </label>
          </section>
          <section className="builder-section">
            <h2>Panduan tiap langkah</h2>
            <p>
              Ubah instruksi dan petunjuk. Tindakan dan kuis tetap mengikuti
              simulasi.
            </p>
            {stages.map((s, i) => (
              <div className="builder-stage" key={i}>
                <span className="builder-stage-num">{i + 1}</span>
                <div>
                  <h3>Langkah {i + 1}</h3>
                  <label>
                    Instruksi
                    <input
                      value={s.instruction}
                      onChange={(e) => update(i, "instruction", e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Petunjuk
                    <input
                      value={s.hint}
                      onChange={(e) => update(i, "hint", e.target.value)}
                    />
                  </label>
                  {exp.steps[i]?.question && (
                    <div className="stage-question">
                      <strong>{exp.steps[i].question?.prompt}</strong>
                      <p>
                        Jawaban:{" "}
                        {
                          exp.steps[i].question?.options[
                            exp.steps[i].question?.answer
                          ]
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
        <aside className="builder-aside">
          <SubjectBadge subject={exp.subject} />
          <h2>{exp.title}</h2>
          <p>{exp.objective}</p>
          <div className="inline-meta">
            <span>{exp.steps.length} langkah</span>
            <span>{exp.duration} menit</span>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full" type="submit" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan tugas"}
          </button>
        </aside>
      </form>
    </>
  );
}
