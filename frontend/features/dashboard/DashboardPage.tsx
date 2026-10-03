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
import { ArrowRight, BookOpen, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [resume, setResume] = useState<Experiment | null>(null);
  useEffect(() => {
    setResume(
      experiments.find((e) => {
        const runtime = runtimes.load(e.id);
        return runtime && runtime.step > 0 && runtime.step < e.steps.length;
      }) || null,
    );
  }, [runtimes]);
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
          <h2>{recommended.title}</h2>
          <p>{recommended.subtitle}</p>
          <div className="inline-meta">
            <span>
              <Clock3 size={16} />
              {recommended.duration} menit
            </span>
            <span>{recommended.steps.length} langkah berpandu</span>
          </div>
          <Link
            href={resume ? labPath(recommended.id) : path(recommended.id)}
            className="button primary"
          >
            {resume ? "Lanjutkan eksperimen" : "Coba eksperimen ini"}{" "}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="next-preview">
          <Visual exp={recommended} state={initialRuntime()} preview />
          <span className="preview-label">Pratinjau simulasi</span>
        </div>
      </section>
      <div className="progress-summary">
        <span>
          <CheckCircle2 size={20} />
          <strong>
            {records.length} dari {experiments.length}
          </strong>{" "}
          eksperimen selesai
        </span>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Eksperimen selesai"
          aria-valuenow={records.length}
          aria-valuemin={0}
          aria-valuemax={experiments.length}
        >
          <span
            style={{ width: `${(records.length / experiments.length) * 100}%` }}
          />
        </div>
        <Link href="/progress" className="text-link">
          Lihat progres
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
            <Link href="/assignments" className="text-link">
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
                href={resultPath(r.experimentId)}
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
