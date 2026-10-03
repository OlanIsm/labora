"use client";

import { experiments, getExperiment } from "@/features/experiments/index";
import type { RecordEntry } from "@/features/progress/model";
import { date } from "@/shared/date";
import { resultPath } from "@/shared/routes";
import { subjects } from "@/shared/subjects";
import { EmptyState } from "@/shared/ui/EmptyState";
import { SubjectBadge } from "@/shared/ui/SubjectBadge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Progress({ records }: { records: RecordEntry[] }) {
  return (
    <>
      <div className="page-heading">
        <h1>Ini hasil eksplorasimu.</h1>
        <p>
          Lihat eksperimen yang sudah kamu selesaikan. Kamu bisa membuka
          hasilnya atau mencoba lagi.
        </p>
      </div>
      <div className="progress-overview">
        <div>
          <strong>
            {records.length}
            <small>/{experiments.length}</small>
          </strong>
          <span>Eksperimen selesai</span>
        </div>
        <div>
          <strong>
            {records.length
              ? `${Math.round(records.reduce((a, b) => a + b.score, 0) / records.length)}%`
              : "Belum ada"}
          </strong>
          <span>Rata-rata nilai</span>
        </div>
        <div>
          <strong>
            {
              new Set(
                records.map((r) => getExperiment(r.experimentId)?.subject),
              ).size
            }
            <small>/{subjects.length}</small>
          </strong>
          <span>Lab yang dicoba</span>
        </div>
      </div>
      <div className="section-heading">
        <h2>Riwayat eksperimen</h2>
        <Link href="/laboratories" className="text-link">
          Cari eksperimen
        </Link>
      </div>
      {records.length ? (
        <div className="history-list">
          {records.map((r) => {
            const exp = getExperiment(r.experimentId);
            return exp ? (
              <Link
                href={resultPath(exp.id)}
                key={r.experimentId}
                className="history-row"
              >
                <SubjectBadge subject={exp.subject} />
                <span>
                  <strong>{exp.title}</strong>
                  <small>{date(r.completedAt)}</small>
                </span>
                <b>{r.score}%</b>
                <ArrowRight size={18} />
              </Link>
            ) : null;
          })}
        </div>
      ) : (
        <EmptyState
          title="Eksperimen pertamamu menunggu"
          href="/laboratories"
          action="Pilih eksperimen"
        >
          Selesaikan satu eksperimen. Hasilnya akan tersimpan di sini.
        </EmptyState>
      )}
    </>
  );
}
