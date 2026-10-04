"use client";

import type { Assignment } from "@/features/assignments/model";
import { experiments, getExperiment } from "@/features/experiments/index";
import { SubjectBadge } from "@/shared/ui/SubjectBadge";
import { StageEditor } from "./StageEditor";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/infrastructure/api";
import type { ClassRoom } from "@contracts/laboratory";
import { RecipientSelector } from "./RecipientSelector";

export function Builder({
  onSave,
  account = false,
}: {
  onSave: (a: Assignment) => Promise<Assignment | void>;
  account?: boolean;
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
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState("");
  const [studentIds, setStudentIds] = useState<string[] | undefined>();
  const [publish, setPublish] = useState(false);
  const [templateReady, setTemplateReady] = useState(!account);
  const [savedDraft, setSavedDraft] = useState<Assignment | null>(null);
  const exp = getExperiment(experimentId)!;
  function templateStages(definition: typeof exp): Assignment["stages"] {
    return definition.steps.flatMap((step, sourceStep) =>
      step.question
        ? []
        : [
            {
              kind: "action" as const,
              sourceStep,
              instruction: step.instruction,
              hint: step.hint,
              question: "",
              options: [],
            },
          ],
    );
  }
  useEffect(() => {
    setStages(templateStages(exp));
  }, [exp]);
  useEffect(() => {
    if (!account) return;
    let active = true;
    setTemplateReady(false);
    apiFetch<ClassRoom[]>("/classes")
      .then((data) => {
        if (active) setClasses(data);
      })
      .catch(() => {
        if (active) setError("Daftar kelas belum dapat dimuat.");
      });
    return () => {
      active = false;
    };
  }, [account]);
  useEffect(() => {
    if (!account) return;
    let active = true;
    setTemplateReady(false);
    apiFetch<typeof exp>(`/experiments/${exp.id}/authoring`)
      .then((data) => {
        if (!active) return;
        setTemplateReady(true);
        setStages(templateStages(data));
      })
      .catch(() => {
        if (active) setError("Template penilaian belum dapat dimuat.");
      });
    return () => {
      active = false;
    };
  }, [account, exp]);
  function addStage(kind: "instruction" | "quiz", after = stages.length - 1) {
    if (stages.length >= 100) {
      setError("Satu tugas dapat memuat maksimal 100 langkah dan kuis.");
      return;
    }
    const stage: Assignment["stages"][number] = {
      kind,
      instruction: kind === "quiz" ? "Jawab pertanyaan berikut." : "",
      hint: "",
      question: "",
      options: kind === "quiz" ? ["", ""] : [],
      ...(kind === "quiz" ? { answer: 0 } : {}),
    };
    setStages((previous) => [
      ...previous.slice(0, after + 1),
      stage,
      ...previous.slice(after + 1),
    ]);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (account && publish && studentIds?.length === 0)
        throw new Error("Pilih setidaknya satu siswa penerima tugas.");
      const a: Assignment = {
        id: savedDraft?.id || `assignment-${Date.now()}`,
        ...(savedDraft ? { revision: savedDraft.revision } : {}),
        experimentId,
        title: title.trim(),
        instructions: instructions.trim(),
        className: className.trim(),
        stages,
        createdAt: new Date().toISOString(),
      };
      const saved = await onSave(a);
      if (saved && account) setSavedDraft(saved);
      const id = saved?.id || a.id;
      if (account && publish)
        await apiFetch(`/assignments/${id}/publish`, {
          method: "POST",
          body: JSON.stringify({
            revision: saved?.revision ?? 0,
            classIds: [classId],
            studentIds,
          }),
        });
      router.push(`/teacher/results/${id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Tugas belum tersimpan. Periksa koneksi, lalu coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!templateReady)
    return (
      <p role={error ? "alert" : "status"}>
        {error || "Memuat template penilaian…"}
        {error && (
          <button
            className="button ghost"
            onClick={() => window.location.reload()}
          >
            Coba lagi
          </button>
        )}
      </p>
    );
  return (
    <>
      <Link className="back-link" href="/teacher">
        <ArrowLeft size={18} />
        Ruang guru
      </Link>
      <div className="page-heading">
        <h1>Buat tugas eksperimen</h1>
        <p>
          Susun langkah sesuai kebutuhan kelas. Tambahkan kuis jika ingin
          menilai pemahaman siswa.
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
                {account ? (
                  <select
                    value={classId}
                    onChange={(e) => {
                      setClassId(e.target.value);
                      setStudentIds(undefined);
                      setClassName(
                        classes.find((c) => c.id === e.target.value)?.name ||
                          "",
                      );
                    }}
                    required={publish}
                  >
                    <option value="">Pilih kelas untuk penerbitan</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Contoh: VIII A"
                  />
                )}
              </label>
            </div>
            {account && (
              <RecipientSelector
                classId={classId}
                studentIds={studentIds}
                onChange={setStudentIds}
              />
            )}
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
            <h2>Langkah dan kuis</h2>
            <p>
              Mulai dari langkah simulasi yang tersedia. Tambahkan bacaan,
              pengamatan, atau kuis; kuis tidak wajib.
            </p>
            {stages.map((stage, index) => (
              <StageEditor
                key={index}
                stage={stage}
                index={index}
                experiment={exp}
                onChange={(updated) =>
                  setStages((previous) =>
                    previous.map((value, i) => (i === index ? updated : value)),
                  )
                }
                onRemove={
                  stages.length > 1
                    ? () =>
                        setStages((previous) =>
                          previous.filter((_, i) => i !== index),
                        )
                    : undefined
                }
                onAddQuiz={() => addStage("quiz", index)}
              />
            ))}
            <div className="builder-add-actions">
              <button
                type="button"
                className="button ghost"
                onClick={() => addStage("instruction")}
              >
                <Plus size={18} /> Tambah langkah
              </button>
              <button
                type="button"
                className="button ghost"
                onClick={() => addStage("quiz")}
              >
                <Plus size={18} /> Tambah kuis
              </button>
            </div>
          </section>
        </div>
        <aside className="builder-aside">
          <SubjectBadge subject={exp.subject} />
          <h2>{exp.title}</h2>
          <p>{exp.objective}</p>
          <div className="inline-meta">
            <span>
              {stages.filter((s) => s.kind !== "quiz").length} langkah
            </span>
            <span>{stages.filter((s) => s.kind === "quiz").length} kuis</span>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {savedDraft && (
            <Link href={`/teacher/results/${savedDraft.id}`}>
              Periksa tugas yang tersimpan
            </Link>
          )}
          {account && (
            <>
              <p>
                Tugas disimpan sebagai draf sebelum diterbitkan. Siswa menerima
                versi yang sudah diterbitkan.
              </p>
              <label className="assignment-publish">
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                />{" "}
                Terbitkan untuk penerima yang dipilih
              </label>
              {!classes.length && (
                <Link href="/settings">Buat kelas di pengaturan</Link>
              )}
            </>
          )}
          <button className="button primary full" type="submit" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan tugas"}
          </button>
        </aside>
      </form>
    </>
  );
}
