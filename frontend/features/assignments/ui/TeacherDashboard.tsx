"use client";

import type { Assignment } from "@/features/assignments/model";
import { getExperiment } from "@/features/experiments/index";
import type { RecordEntry } from "@/features/progress/model";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ArrowRight, BookOpen, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { useAccount } from "@/shared/accountContext";

export function Teacher({
  assignments,
  records,
}: {
  assignments: Assignment[];
  records: RecordEntry[];
}) {
  const account = useAccount().mode === "account";
  return (
    <>
      <div className="page-heading">
        <h1>Siapkan eksperimen untuk kelasmu.</h1>
        <p>
          Pilih eksperimen, sesuaikan arahan, lalu lihat hasil belajar siswa.
        </p>
        <Link href="/teacher/new" className="button primary">
          <Plus size={18} />
          Buat tugas baru
        </Link>
      </div>
      <div className="teacher-summary">
        <span>
          <BookOpen size={24} />
          <strong>{assignments.length}</strong> tugas dibuat
        </span>
        {!account && (
          <span>
            <CheckCircle2 size={24} />
            <strong>{records.length}</strong> hasil tercatat di perangkat ini
          </span>
        )}
      </div>
      <div className="section-heading">
        <h2>Tugas yang kamu buat</h2>
      </div>
      {assignments.length ? (
        assignments.map((a) => (
          <Link
            href={`/teacher/results/${a.id}`}
            className="assignment-row"
            key={a.id}
          >
            <BookOpen size={24} />
            <span>
              <strong>{a.title}</strong>
              <small>
                {getExperiment(a.experimentId)?.title} · {a.className}
              </small>
            </span>
            <span className="row-action">
              Lihat hasil <ArrowRight size={18} />
            </span>
          </Link>
        ))
      ) : (
        <EmptyState
          title="Belum ada tugas kelas"
          href="/teacher/new"
          action="Buat tugas pertama"
        >
          Mulai dengan satu eksperimen dan sesuaikan petunjuknya untuk kelasmu.
        </EmptyState>
      )}
    </>
  );
}
