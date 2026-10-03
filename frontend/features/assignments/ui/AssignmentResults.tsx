"use client";

import type { Assignment } from "@/features/assignments/model";
import { getExperiment } from "@/features/experiments/index";
import type { RecordEntry } from "@/features/progress/model";
import { date } from "@/shared/date";
import { path, resultPath } from "@/shared/routes";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/infrastructure/api";
import type { AssignmentReport, ClassRoom } from "@contracts/laboratory";
import { download, csvCell } from "@/shared/infrastructure/download";

export function AssignmentResults({
  assignment,
  records,
  account = false,
}: {
  assignment?: Assignment;
  records: RecordEntry[];
  account?: boolean;
}) {
  const [remote, setRemote] = useState<Assignment | undefined>(),
    [report, setReport] = useState<AssignmentReport | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [classes, setClasses] = useState<ClassRoom[]>([]),
    [classId, setClassId] = useState("");
  const id = assignment?.id;
  useEffect(() => {
    if (!account || !id) return;
    let active = true;
    setReport(null);
    setRemote(undefined);
    Promise.all([
      apiFetch<Assignment>(`/assignments/${id}`),
      apiFetch<AssignmentReport>(`/assignments/${id}/results`),
      apiFetch<ClassRoom[]>("/classes"),
    ])
      .then(([a, r, c]) => {
        if (active) {
          setRemote(a);
          setReport(r);
          setClasses(c);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [account, id]);
  assignment = remote || assignment;
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
  const matching = account
    ? report?.results || []
    : records.filter((r) => r.experimentId === exp.id);
  const incorrect = matching.flatMap((r) =>
    Object.values(r.runtime.answers).filter((a) => !a.correct),
  );
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Link href="/teacher" className="back-link">
        <ArrowLeft size={18} />
        Ruang guru
      </Link>
      <div className="page-heading">
        <h1>{assignment.title}</h1>
        <p>
          {exp.title} · {assignment.className}
        </p>
        {!account && (
          <Link
            className="button primary"
            href={`${path(exp.id)}?assignment=${assignment.id}`}
          >
            Buka aktivitas <ArrowRight size={18} />
          </Link>
        )}
        {account && assignment.status === "draft" && (
          <form
            className="settings-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const a = await apiFetch<Assignment>(
                  `/assignments/${id}/publish`,
                  {
                    method: "POST",
                    body: JSON.stringify({
                      revision: assignment!.revision,
                      classIds: [classId],
                    }),
                  },
                );
                setRemote(a);
                setReport(
                  await apiFetch<AssignmentReport>(
                    `/assignments/${id}/results`,
                  ),
                );
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Tugas belum terbit.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Kelas penerima
              <select
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Pilih kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button primary" disabled={busy}>
              Terbitkan tugas
            </button>
          </form>
        )}
        {account && (
          <p>
            Status:{" "}
            <strong>
              {assignment.status === "draft"
                ? "Draf"
                : assignment.status === "published"
                  ? "Diterbitkan"
                  : "Diarsipkan"}
            </strong>
          </p>
        )}
        {account && assignment.status !== "draft" && (
          <button
            className="button ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                let offset: number | null = 0;
                const rows: string[][] = [
                  [
                    "Nama",
                    "Waktu selesai",
                    "Nilai",
                    "Ketepatan langkah",
                    "Ketepatan kuis",
                    "Pertanyaan",
                    "Jawaban",
                    "Benar",
                    "Penjelasan",
                  ],
                ];
                while (offset !== null) {
                  const page: AssignmentReport =
                    await apiFetch<AssignmentReport>(
                      `/assignments/${id}/results?offset=${offset}&limit=100`,
                    );
                  for (const result of page.results) {
                    const answers = Object.values(result.runtime.answers);
                    for (const answer of answers.length ? answers : [null])
                      rows.push([
                        result.userName || "Siswa",
                        result.completedAt,
                        String(result.score),
                        String(result.accuracy),
                        String(result.quiz),
                        answer?.prompt || "",
                        answer ? `Pilihan ${answer.choice + 1}` : "",
                        answer ? String(answer.correct) : "",
                        answer?.explanation || "",
                      ]);
                  }
                  offset = page.nextOffset ?? null;
                }
                download(
                  `hasil-tugas-${id}.csv`,
                  "\uFEFF" +
                    rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
                  "text/csv;charset=utf-8",
                );
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Ekspor belum dapat disiapkan.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Ekspor seluruh hasil CSV
          </button>
        )}
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
            <strong>
              {account
                ? (report?.attempts ?? matching.length)
                : matching.length}
            </strong>{" "}
            hasil eksperimen tercatat.
          </p>
          <p className="local-note">
            {account
              ? `${report?.completed ?? 0} dari ${report?.total ?? 0} siswa penerima sudah menyelesaikan tugas. Semua percobaan tersimpan; ringkasan memakai skor terbaik.`
              : "Hasil dikelompokkan berdasarkan eksperimen, bukan ID tugas. Mode demo hanya menampilkan data browser ini."}
          </p>
        </section>
      </div>
      <section className="review-section">
        <h2>Hasil siswa</h2>
        {matching.length ? (
          matching.map((r) => (
            <Link
              href={account ? `/progress?result=${r.id}` : resultPath(exp.id)}
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
      {account && report && (
        <section className="review-section">
          <h2>Penerima tugas</h2>
          {report.recipients.map((r) => (
            <div className="assignment-row" key={r.id}>
              <span>
                <strong>{r.name}</strong>
                <small>{r.completed ? "Selesai" : "Belum selesai"}</small>
              </span>
              <b>{r.bestScore === null ? "—" : `${r.bestScore}%`}</b>
            </div>
          ))}
        </section>
      )}
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
      {account && report?.nextOffset != null && (
        <button
          className="button ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const next = await apiFetch<AssignmentReport>(
                `/assignments/${id}/results?offset=${report.nextOffset}`,
              );
              setReport((previous) =>
                previous
                  ? {
                      ...next,
                      results: [...previous.results, ...next.results],
                      recipients: [...previous.recipients, ...next.recipients],
                    }
                  : next,
              );
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Hasil belum dapat dimuat.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Muat hasil berikutnya
        </button>
      )}
    </>
  );
}
