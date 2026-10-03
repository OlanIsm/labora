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
import { useState } from "react";
import { useAccount } from "@/shared/accountContext";
import { apiFetch } from "@/shared/infrastructure/api";
import { useProgressSummary } from "../useProgressSummary";

export function Progress({ records }: { records: RecordEntry[] }) {
  const { summary, error: summaryError } = useProgressSummary();
  const account = useAccount().mode === "account";
  const [extra, setExtra] = useState<RecordEntry[]>([]);
  const [offset, setOffset] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initialRecords = records;
  records = [
    ...new Map(
      [...records, ...extra].map((record) => [
        record.id || record.completedAt,
        record,
      ]),
    ).values(),
  ];
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
            {summary?.completed ??
              new Set(records.map((r) => r.experimentId)).size}
            <small>/{experiments.length}</small>
          </strong>
          <span>Eksperimen selesai</span>
        </div>
        <div>
          <strong>
            {summary
              ? `${summary.averageScore}%`
              : records.length
                ? `${Math.round(records.reduce((a, b) => a + b.score, 0) / records.length)}%`
                : "Belum ada"}
          </strong>
          <span>Rata-rata nilai</span>
        </div>
        <div>
          <strong>
            {summary?.subjects ??
              new Set(
                records.map((r) => getExperiment(r.experimentId)?.subject),
              ).size}
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
                href={r.id ? `/progress?result=${r.id}` : resultPath(exp.id)}
                key={r.id || `${r.experimentId}:${r.completedAt}`}
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
      {(error || summaryError) && (
        <p role="alert" className="form-error">
          {error || summaryError}
        </p>
      )}
      {account &&
        initialRecords.length >= 50 &&
        (summary ? offset < summary.attempts : true) && (
          <button
            className="button ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const next = await apiFetch<RecordEntry[]>(
                  `/progress?offset=${offset}`,
                );
                setExtra((previous) => [...previous, ...next]);
                setOffset((current) => current + 50);
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Riwayat belum dapat dimuat.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Muat riwayat berikutnya
          </button>
        )}
    </>
  );
}
