import type { Assignment } from "@/features/assignments/model";
import type { User } from "@/features/auth/model";
import { getExperiment } from "@/features/experiments";
import type { RecordEntry } from "@/features/progress/model";
import { path, resultPath } from "@/shared/routes";

export type AppNotification = {
  id: string;
  kind: "assignment" | "result";
  title: string;
  description: string;
  href: string;
  createdAt: string;
};

export function buildNotifications(
  user: User | null,
  assignments: Assignment[],
  records: RecordEntry[],
): AppNotification[] {
  if (!user) return [];
  const teacher = user.role === "teacher";
  const tasks: AppNotification[] = assignments
    .filter(
      (assignment) =>
        teacher || !user.className || assignment.className === user.className,
    )
    .map((assignment) => ({
      id: `assignment:${assignment.id}`,
      kind: "assignment",
      title: assignment.title,
      description: `${teacher ? "Tugas dibuat untuk" : "Tugas kelas"} ${assignment.className}.`,
      href: teacher
        ? `/teacher/results/${assignment.id}`
        : `${path(assignment.experimentId)}?assignment=${encodeURIComponent(assignment.id)}`,
      createdAt: assignment.createdAt,
    }));
  const results: AppNotification[] = records
    .filter(
      (record) =>
        teacher ||
        ((!record.userName || record.userName === user.name) &&
          (!record.className || record.className === user.className)),
    )
    .map((record) => ({
      id: `result:${record.experimentId}:${record.completedAt}`,
      kind: "result",
      title: getExperiment(record.experimentId)?.title || "Hasil eksperimen",
      description: `${teacher ? record.userName || "Siswa" : "Kamu"} menyelesaikan eksperimen dengan skor ${record.score}%.`,
      href: teacher ? "/teacher" : resultPath(record.experimentId),
      createdAt: record.completedAt,
    }));
  return [...tasks, ...results].sort(
    (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
  );
}
