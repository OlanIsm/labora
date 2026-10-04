"use client";

import type { Assignment } from "@/features/assignments/model";
import type { User } from "@/features/auth/model";
import type { RuntimeRepository } from "@/features/experiments/index";
import {
  experiments,
  getExperiment,
  initialRuntime,
} from "@/features/experiments/index";
import type { Experiment } from "@/features/experiments/model";
import { Visual } from "@/features/experiments/ui";
import { LabChoices } from "@/features/laboratory/ui";
import type { RecordEntry } from "@/features/progress/model";
import { date } from "@/shared/date";
import { labPath, path, resultPath } from "@/shared/routes";
import { EmptyState } from "@/shared/ui/EmptyState";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/infrastructure/api";
import type { SessionDTO } from "@contracts/laboratory";
import { useProgressSummary } from "@/features/progress";

export function Dashboard({
  user,
  records,
  assignments,
  runtimes,
}: {
  user: User | null;
  records: RecordEntry[];
  assignments: Assignment[];
  runtimes: Pick<RuntimeRepository, "load">;
}) {
  const { summary, error: summaryError } = useProgressSummary();
  const [resumeError, setResumeError] = useState("");
  const [resume, setResume] = useState<Experiment | null>(null);
  const [resumeAssignment, setResumeAssignment] = useState<
    string | undefined
  >();
  useEffect(() => {
    let active = true;
    if (user?.mode === "account") {
      setResume(null);
      apiFetch<SessionDTO[]>("/sessions?mode=guided")
        .then((all) => {
          if (!active) return;
          const s = all.find((s) => s.status === "active");
          setResume(s ? getExperiment(s.experimentId || "") || null : null);
          setResumeAssignment(s?.assignmentId);
        })
        .catch((e) => {
          if (active) setResumeError(e.message);
        });
      return () => {
        active = false;
      };
    }
    setResume(
      experiments.find((e) => {
        const runtime = runtimes.load(e.id);
        return runtime && runtime.step > 0 && runtime.step < e.steps.length;
      }) || null,
    );
  }, [runtimes, user?.id, user?.mode]);
  const completedCount =
    summary?.completed ?? new Set(records.map((r) => r.experimentId)).size;
  const recommended =
    resume ||
    experiments.find((e) => !records.some((r) => r.experimentId === e.id)) ||
    experiments[0];
  const recent = records.slice(0, 3);
  const tasks =
    user?.role === "teacher"
      ? assignments
      : assignments.filter(
          (a) => !user?.className || a.className === user.className,
        );
  return (
    <>
      {(summaryError || resumeError) && (
        <p role="alert" className="form-error">
          {summaryError || resumeError}
        </p>
      )}
      <div className="page-heading">
        <h1>
          Hai{user ? `, ${user.name.split(" ")[0]}` : ""}! Mau coba apa hari
          ini?
        </h1>
        <p>
          Mulai dengan satu eksperimen. Ikuti langkahnya, lalu amati hasilnya.
        </p>
      </div>
      <section className={`next-experiment ${recommended.subject}`}>
        <div className="next-copy">
          <span className="featured-experiment-label">
            <FlaskConical size={16} /> Eksperimen unggulan
          </span>
          <h2>{recommended.title}</h2>
          <p>{recommended.subtitle}</p>
          <div className="inline-meta">
            <span>
              <Clock3 size={16} />
              {recommended.duration} menit
            </span>
            <span>
              <BookOpen size={16} />
              {recommended.steps.length} langkah berpandu
            </span>
          </div>
          <Link
            href={
              resume
                ? `${labPath(recommended.id)}${resumeAssignment ? `?assignment=${resumeAssignment}` : ""}`
                : path(recommended.id)
            }
            className="button primary"
          >
            {resume ? "Lanjutkan eksperimen" : "Coba eksperimen ini"}{" "}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="next-preview">
          <svg
            className="preview-accents"
            viewBox="0 0 400 220"
            aria-hidden="true"
          >
            <path
              d="M77 76l-12-10m8 27H57m20 12-12 10"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="m283 34-9 18m31-3-18 7"
              stroke="#fff0a6"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M80 143q0 15-15 15 15 0 15 15 0-15 15-15-15 0-15-15Z"
              fill="#fff0a6"
            />
            <circle cx="325" cy="179" r="5" fill="#ffd84d" />
            <circle cx="49" cy="49" r="5" fill="#ffd84d" />
            <circle cx="345" cy="112" r="7" fill="#fff" opacity=".55" />
          </svg>
          <Visual exp={recommended} state={initialRuntime()} preview />
          <span className="preview-label">Pratinjau simulasi</span>
        </div>
      </section>
      <div className="progress-summary">
        <span>
          <CheckCircle2 size={20} />
          <strong>
            {completedCount} dari {experiments.length}
          </strong>{" "}
          eksperimen selesai
        </span>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Eksperimen selesai"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={experiments.length}
        >
          <span
            style={{ width: `${(completedCount / experiments.length) * 100}%` }}
          />
        </div>
        <Link href="/progress" className="text-link">
          Lihat progres <ArrowRight size={16} />
        </Link>
      </div>
      <section className="home-section">
        <div className="section-heading">
          <div>
            <h2>Jelajahi lab</h2>
            <p>Pilih pertanyaan yang bikin kamu penasaran.</p>
          </div>
        </div>
        <LabChoices />
      </section>
      <div className="dashboard-lower">
        <section>
          <div className="section-heading">
            <h2>
              {user?.role === "teacher" ? "Tugas kelasmu" : "Tugas dari guru"}
            </h2>
            <Link
              href={user?.role === "teacher" ? "/teacher" : "/assignments"}
              className="text-link"
            >
              Semua tugas
            </Link>
          </div>
          {tasks.length ? (
            tasks.slice(0, 3).map((a) => (
              <Link
                href={
                  user?.role === "teacher"
                    ? `/teacher/results/${a.id}`
                    : `${path(a.experimentId)}?assignment=${a.id}`
                }
                className="list-row"
                key={a.id}
              >
                <BookOpen size={22} />
                <span>
                  <strong>{a.title}</strong>
                  <small>{a.className}</small>
                </span>
                <ArrowRight size={18} />
              </Link>
            ))
          ) : (
            <EmptyState title="Belum ada tugas">
              Tugas kelas akan muncul di sini. Kamu tetap bisa mencoba lab
              sendiri.
            </EmptyState>
          )}
        </section>
        <section>
          <div className="section-heading">
            <h2>Terakhir kamu selesaikan</h2>
          </div>
          {recent.length ? (
            recent.map((r) => (
              <Link
                href={
                  r.id ? `/progress?result=${r.id}` : resultPath(r.experimentId)
                }
                className="list-row"
                key={r.experimentId}
              >
                <CheckCircle2 size={22} />
                <span>
                  <strong>{getExperiment(r.experimentId)?.title}</strong>
                  <small>
                    {date(r.completedAt)} · Nilai {r.score}%
                  </small>
                </span>
                <ArrowRight size={18} />
              </Link>
            ))
          ) : (
            <EmptyState title="Mulai catatan penemuanmu">
              Selesaikan eksperimen pertama untuk melihat hasilnya di sini.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
