import type { Experiment } from "./experiment";
import type { Runtime } from "../experiment-engine/engine";
export type ClassRoom = {
  id: string;
  schoolId: string;
  name: string;
  teacherId: string;
  archived: boolean;
};
export type AssignmentDTO = {
  id: string;
  experimentId: string;
  title: string;
  instructions: string;
  className: string;
  classIds?: string[];
  stages: {
    instruction: string;
    hint: string;
    question: string;
    options: string[];
    answer?: number;
    explanation?: string;
  }[];
  createdAt: string;
  status?: "draft" | "published" | "archived";
  revision?: number;
  versionId?: string;
  dueAt?: string | null;
};
export type SessionDTO = {
  id: string;
  revision: number;
  status: "active" | "submitted" | "abandoned";
  mode: "guided" | "sandbox";
  experimentId?: string;
  assignmentId?: string;
  state: Runtime;
  definition?: Experiment;
  lastSavedAt: string;
};
export type EventOutcome = {
  session: SessionDTO;
  accepted: boolean;
  feedback: string;
};
export type ResultDTO = {
  definition: Experiment;
  id: string;
  sessionId: string;
  experimentId: string;
  assignmentId?: string;
  completedAt: string;
  score: number;
  accuracy: number;
  quiz: number;
  runtime: Runtime;
  userName?: string;
  studentId: string;
  className?: string;
};
export type ProgressSummary = {
  attempts: number;
  completed: number;
  subjects: number;
  averageScore: number;
};
export type NotificationDTO = {
  id: string;
  kind: "assignment" | "result";
  title: string;
  description: string;
  href: string;
  createdAt: string;
  readAt: string | null;
};
export type AssignmentReport = {
  attempts?: number;
  nextOffset?: number | null;
  assignmentId: string;
  total: number;
  completed: number;
  results: ResultDTO[];
  recipients: {
    id: string;
    name: string;
    completed: boolean;
    bestScore: number | null;
  }[];
};
