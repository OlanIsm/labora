"use client";

import type { Experiment } from "@/features/experiments/domain/definitions";
import { initialRuntime } from "@/features/experiments/domain/engine";
import { Visual } from "@/features/experiments/ui/ExperimentVisual";
import type { RecordEntry } from "@/features/progress/model";
import { path } from "@/shared/routes";
import { SubjectBadge } from "@/shared/ui/SubjectBadge";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";

export function ExperimentCard({
  exp,
  record,
}: {
  exp: Experiment;
  record?: RecordEntry;
}) {
  return (
    <Link href={path(exp.id)} className={`experiment-card ${exp.subject}`}>
      <div className={`experiment-art ${exp.subject}`}>
        <Visual exp={exp} state={initialRuntime()} preview />
        <span className="preview-label">Pratinjau simulasi</span>
      </div>
      <div className="experiment-card-copy">
        <div className="experiment-card-meta">
          <SubjectBadge subject={exp.subject} />
          <span>
            <Clock3 size={15} />
            {exp.duration} menit
          </span>
        </div>
        <h3>{exp.title}</h3>
        <p>{exp.subtitle}</p>
        <span className="card-link">
          {record ? (
            <>
              <CheckCircle2 size={17} /> Selesai · Coba lagi
            </>
          ) : (
            <>
              Lihat eksperimen <ArrowRight size={17} />
            </>
          )}
        </span>
      </div>
    </Link>
  );
}
