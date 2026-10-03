"use client";

import type { Assignment } from "@/features/assignments/model";
import { getExperiment } from "@/features/experiments/index";
import type { RecordEntry } from "@/features/progress/model";
import { date } from "@/shared/date";
import { path, resultPath } from "@/shared/routes";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import Link from "next/link";

export function AssignmentResults({
  assignment,
  records,
}: {
  assignment?: Assignment;
  records: RecordEntry[];
}) {
  if (!assignment)
    return (
      <EmptyState
        title="Tugas tidak ditemukan"
        href="/teacher"
        action="Kembali ke ruang guru"
      >
        Tugas ini belum tersedia. Periksa daftar tugasmu.
      </EmptyState>
    );
  const exp = getExperiment(assignment.experimentId)!;
  const matching = records.filter((r) => r.experimentId === exp.id);
  const incorrect = matching.flatMap((r) =>
    Object.values(r.runtime.answers).filter((a) => !a.correct),
  );
  return (
    <>
      <Link href="/teacher" className="back-link">
        <ArrowLeft size={18} />
        Ruang guru
      </Link>
      <div className="page-heading">
        <h1>{assignment.title}</h1>
        <p>
          {exp.title} · {assignment.className}
        </p>
        <Link
          className="button primary"
          href={`${path(exp.id)}?assignment=${assignment.id}`}
        >
          Buka aktivitas <ArrowRight size={18} />
        </Link>
      </div>
      <div className="result-grid">
        <section>
          <h2>Arahan tugas</h2>
          <p>{assignment.instructions}</p>
          <div className="metric-row">
            <span>Langkah</span>
            <strong>{assignment.stages.length}</strong>
          </div>
          <div className="metric-row">
            <span>Dibuat</span>
            <strong>{date(assignment.createdAt)}</strong>
          </div>
        </section>
        <section>
          <h2>Hasil yang tersedia</h2>
          <p>
            <strong>{matching.length}</strong> hasil eksperimen tercatat.
          </p>
          <p className="local-note">
            Hasil dikelompokkan berdasarkan eksperimen, bukan ID tugas. Mode
            demo hanya menampilkan data browser ini.
          </p>
        </section>
      </div>
      <section className="review-section">
        <h2>Hasil siswa</h2>
        {matching.length ? (
          matching.map((r) => (
            <Link
              href={resultPath(exp.id)}
              className="assignment-row"
              key={r.completedAt}
            >
              <CheckCircle2 size={24} />
              <span>
                <strong>{r.userName || "Siswa"}</strong>
                <small>{date(r.completedAt)}</small>
              </span>
              <b>{r.score}%</b>
              <ArrowRight size={18} />
            </Link>
          ))
        ) : (
          <EmptyState title="Belum ada hasil siswa">
            Hasil muncul setelah eksperimen diselesaikan.
          </EmptyState>
        )}
      </section>
      {incorrect.length > 0 && (
        <section className="review-section">
          <h2>Pemahaman yang perlu dibahas</h2>
          {incorrect.map((a, i) => (
            <div className="review-answer" key={i}>
              <CircleHelp size={22} />
              <div>
                <h3>{a.prompt}</h3>
                <p>{a.explanation}</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
