"use client";

import type { Assignment } from "@/features/assignments/model";
import type { Experiment } from "@/features/experiments/domain/definitions";
import { initialRuntime } from "@/features/experiments/domain/engine";
import { Visual } from "@/features/experiments/ui/ExperimentVisual";
import { labPath } from "@/shared/routes";
import { SubjectBadge } from "@/shared/ui/SubjectBadge";
import { subjects } from "@/shared/subjects";
import { Icon } from "./EquipmentIcon";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
  GraduationCap,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function Detail({
  exp,
  assignment,
}: {
  exp: Experiment;
  assignment?: Assignment;
}) {
  const fromChallenges = useSearchParams().get("from") === "challenges";
  const subject = subjects.find((subject) => subject.id === exp.subject)!;
  const equipmentIcon = (name: string) =>
    exp.items.find((item) => item.name === name)?.icon || "bag";
  return (
    <>
      <Link
        href={fromChallenges ? "/challenges" : `/laboratories/${exp.subject}`}
        className="back-link"
      >
        <ArrowLeft size={18} />
        {fromChallenges ? "Kembali ke tantangan" : "Kembali ke lab"}
      </Link>
      <section className="detail-hero">
        <div>
          <SubjectBadge subject={exp.subject} />
          <h1>{exp.title}</h1>
          <p className="detail-subtitle">{exp.subtitle}</p>
          <p>{exp.objective}</p>
          <div className="inline-meta">
            <span>
              <Clock3 size={17} />
              Sekitar {exp.duration} menit
            </span>
            <span>
              <BookOpen size={17} />
              {exp.steps.length} langkah
            </span>
          </div>
          <Link
            href={`${labPath(exp.id)}?from=challenges${assignment ? `&assignment=${assignment.id}` : ""}`}
            className="button primary large"
          >
            {assignment ? "Mulai tugas" : "Masuk dan coba"}{" "}
            <ArrowRight size={19} />
          </Link>
          <small className="detail-reassurance">
            Alat sudah tersedia. Kamu bisa mengulang kapan saja.
          </small>
        </div>
        <div className={`detail-visual ${exp.subject}`}>
          <Visual exp={exp} state={initialRuntime()} preview />
          <span className="preview-label">Pratinjau simulasi</span>
        </div>
      </section>
      {assignment && (
        <div className="assignment-note">
          <GraduationCap size={24} />
          <div>
            <strong>{assignment.title}</strong>
            <p>{assignment.instructions}</p>
          </div>
        </div>
      )}
      <div className="detail-sections">
        <section className="detail-learning">
          <div className="detail-panel-heading">
            <div>
              <h2>Apa yang akan kamu pelajari?</h2>
              <p>{exp.objective}</p>
            </div>
            <Image
              className="detail-learning-mascot"
              src={subject.mascot}
              alt={`Maskot ${subject.name}`}
              width={112}
              height={112}
            />
          </div>
          <div className="detail-theory">
            <span className="detail-theory-icon" aria-hidden="true">
              <Lightbulb size={24} />
            </span>
            <div>
              <h3>Sains di baliknya</h3>
              <p>{exp.theory}</p>
            </div>
          </div>
        </section>
        <section className={`detail-materials ${exp.subject}`}>
          <div className="detail-panel-heading">
            <h2>Alat dan bahan</h2>
            <div className="detail-equipment-art" aria-hidden="true">
              <Sparkles className="equipment-sparkle" size={24} />
              {exp.items.slice(0, 3).map((item) => (
                <Icon key={item.id} name={item.icon} size={58} />
              ))}
            </div>
          </div>
          <div className="materials-list">
            <div>
              <h3>Alat</h3>
              {exp.equipment.map((x) => (
                <span key={x}>
                  <Icon name={equipmentIcon(x)} size={20} />
                  {x}
                </span>
              ))}
            </div>
            <div>
              <h3>Bahan</h3>
              {exp.materials.length ? (
                exp.materials.map((x) => (
                  <span key={x}>
                    <Icon name={equipmentIcon(x)} size={20} />
                    {x}
                  </span>
                ))
              ) : (
                <span>Tidak perlu bahan tambahan</span>
              )}
            </div>
          </div>
        </section>
      </div>
      <details className="step-preview">
        <summary>
          Intip langkah eksperimennya <span>{exp.steps.length} langkah</span>
        </summary>
        <ol>
          {exp.steps.map((s, i) => (
            <li key={i}>{s.instruction}</li>
          ))}
        </ol>
      </details>
    </>
  );
}
