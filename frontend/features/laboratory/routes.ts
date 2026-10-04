import type { Subject } from "@/shared/subjectTypes";

export function laboratoryPath(subject: Subject): string {
  return subject === "physics" ? "/fisika" : `/sandbox/${subject}`;
}
