"use client";

import { subjects } from "@/shared/subjects";
import type { Subject } from "../subjectTypes";

export function SubjectBadge({ subject }: { subject: Subject }) {
  const s = subjects.find((x) => x.id === subject)!;
  return (
    <span className={`subject-badge ${subject}`}>
      <s.icon size={15} aria-hidden="true" />
      {s.name}
    </span>
  );
}
