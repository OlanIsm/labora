import "server-only";
import type { Experiment } from "@contracts/experiment";
import { requireIdentity } from "../identity";
import { serverSupabase } from "../../shared/supabase";
import { adminDatabase, databaseError } from "../../shared/database";
import { AppError } from "../../shared/errors";
import { experiments as fixtures } from "./definitions";
export async function listExperiments() {
  const client = await serverSupabase();
  const { data, error } = await client
    .from("experiments")
    .select("id,subject,title,summary,duration_minutes,current_version_id")
    .eq("published", true)
    .order("id")
    .limit(100);
  databaseError(error);
  return data;
}
export async function experimentVersion(id: string) {
  const client = await serverSupabase();
  const { data, error } = await client
    .from("experiments")
    .select("current_version_id")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  databaseError(error);
  if (!data?.current_version_id) throw new AppError("NOT_FOUND");
  return versionDefinition(data.current_version_id);
}
export async function versionDefinition(id: string): Promise<{
  id: string;
  experiment_id: string;
  definition: Experiment;
  version: number;
  engine_version: number;
}> {
  const { data, error } = await adminDatabase()
    .from("experiment_versions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  return {
    id: data.id,
    experiment_id: data.experiment_id,
    version: data.version,
    engine_version: data.engine_version,
    definition: data.definition as Experiment,
  };
}
export async function withAnswerKeys(
  definition: Experiment,
  versionId: string,
  assignmentVersion: string | null = null,
) {
  const { data, error } = await adminDatabase().rpc("labora_answer_keys", {
    version_id: versionId,
    assignment_id: assignmentVersion || undefined,
  });
  databaseError(error);
  const keys = data as Record<string, { answer: number; explanation: string }>;
  return {
    ...definition,
    steps: definition.steps.map((step, i) =>
      step.question
        ? { ...step, question: { ...step.question, ...keys[String(i)] } }
        : step,
    ),
  };
}
export async function authoringDefinition(id: string) {
  const { user } = await requireIdentity();
  const { data, error } = await adminDatabase()
    .from("school_members")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "teacher")
    .eq("status", "active")
    .limit(1);
  databaseError(error);
  if (!data?.length) throw new AppError("FORBIDDEN");
  const version = await experimentVersion(id);
  return withAnswerKeys(version.definition, version.id);
}
export function practiceDefinition(id: string) {
  const definition = fixtures.find((e) => e.id === id);
  if (!definition) throw new AppError("NOT_FOUND");
  return definition;
}
