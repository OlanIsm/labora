"use client";

import { score } from "@/features/experiments/index";
import type { Experiment } from "@/features/experiments/model";
import type { RecordEntry } from "@/features/progress/model";
import { labPath } from "@/shared/routes";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ArrowRight, CheckCircle2, CircleHelp, RotateCcw } from "lucide-react";
import Link from "next/link";

export function Result({
  exp,
  record,
}: {
  exp: Experiment;
  record?: RecordEntry;
}) {
  if (!record)
    return (
      <EmptyState
        title="Belum ada hasil"
        href={labPath(exp.id)}
        action="Mulai eksperimen"
      >
        Selesaikan eksperimen untuk melihat pengamatan dan nilaimu.
      </EmptyState>
    );
  const s = score(exp, record.runtime);
  return (
    <>
      <section className={`result-hero ${exp.subject}`}>
        <div className="result-heading">
          <CheckCircle2 size={42} />
          <div>
            <h1>Kamu sudah mencobanya!</h1>
            <p>{exp.title}</p>
          </div>
        </div>
        <div className="result-score">
          <strong>{s.total}%</strong>
          <span>Nilai pemahamanmu</span>
        </div>
        <p className="result-concept">{exp.concept}</p>
        <div className="result-actions">
          <Link className="button primary" href="/laboratories">
            Coba eksperimen lain <ArrowRight size={18} />
          </Link>
          <Link className="button ghost" href={labPath(exp.id)}>
            <RotateCcw size={17} />
            Ulangi eksperimen
          </Link>
        </div>
      </section>
      <div className="result-grid">
        <section>
          <h2>Catatan eksperimenmu</h2>
          <div className="metric-row">
            <span>Langkah selesai</span>
            <strong>
              {record.runtime.done.length}/{exp.steps.length}
            </strong>
          </div>
          <div className="metric-row">
            <span>Ketepatan langkah</span>
            <strong>{s.accuracy}%</strong>
          </div>
          <div className="metric-row">
            <span>Jawaban kuis benar</span>
            <strong>{s.quiz}%</strong>
          </div>
        </section>
        <section>
          <h2>Yang kamu pelajari</h2>
          <p>{exp.concept}</p>
          <p>{exp.theory}</p>
        </section>
      </div>
      <section className="review-section">
        <h2>Kenapa jawabannya begitu?</h2>
        {Object.values(record.runtime.answers).map((a, i) => (
          <div className="review-answer" key={i}>
            <span className={a.correct ? "correct" : "incorrect"}>
              {a.correct ? (
                <CheckCircle2 size={21} />
              ) : (
                <CircleHelp size={21} />
              )}
              {a.correct ? "Benar" : "Pelajari lagi"}
            </span>
            <div>
              <h3>{a.prompt}</h3>
              <p>
                Jawaban: <strong>{a.expected}</strong>
              </p>
              <p>{a.explanation}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
