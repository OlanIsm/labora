import "server-only";
import type { ResultDTO } from "@contracts/laboratory";
import type { Database } from "@contracts/database";
import type { Runtime } from "../../../shared/experiment-engine/engine";
import { requireIdentity } from "../identity";
import { ownedSession, sessionDefinition } from "../sessions";
import { adminDatabase, databaseError } from "../../shared/database";
import { AppError } from "../../shared/errors";
import { readJson } from "../../shared/http";
import { fields, integer, uuid, page } from "../../shared/validation";

type ResultRow = Database["public"]["Tables"]["experiment_results"]["Row"];
export async function resultDTO(row: ResultRow): Promise<ResultDTO> {
  const db = adminDatabase();
  const [{ data: version, error: vError }, { data: profile, error: pError }] =
    await Promise.all([
      db
        .from("experiment_versions")
        .select("experiment_id")
        .eq("id", row.experiment_version_id)
        .single(),
      db
        .from("profiles")
        .select("display_name")
        .eq("id", row.student_id)
        .single(),
    ]);
  databaseError(vError);
  databaseError(pError);
  let assignmentId: string | undefined;
  if (row.assignment_version_id) {
    const { data, error } = await db
      .from("assignment_versions")
      .select("assignment_id")
      .eq("id", row.assignment_version_id)
      .single();
    databaseError(error);
    assignmentId = data!.assignment_id;
  }
  return {
    definition: await sessionDefinition({
      experiment_version_id: row.experiment_version_id,
      assignment_version_id: row.assignment_version_id,
    }),
    id: row.id,
    sessionId: row.session_id,
    experimentId: version!.experiment_id,
    assignmentId,
    studentId: row.student_id,
    completedAt: row.completed_at,
    score: row.score,
    accuracy: row.experiment_accuracy,
    quiz: row.quiz_accuracy,
    runtime: (row.observations as unknown as { runtime: Runtime }).runtime,
    userName: profile!.display_name,
  };
}
export async function submit(request: Request, id: string) {
  const body = await readJson(request);
  fields(body, ["revision"]);
  const revision = integer(body.revision, "revision"),
    { user, row } = await ownedSession(id),
    db = adminDatabase();
  const { data: existing, error: existingError } = await db
    .from("experiment_results")
    .select("*")
    .eq("session_id", row.id)
    .maybeSingle();
  databaseError(existingError);
  if (existing) return resultDTO(existing);
  const exp = await sessionDefinition(row);
  if (
    row.state.step !== exp.steps.length ||
    row.state.done.length !== exp.steps.length
  )
    throw new AppError("VALIDATION_ERROR", {
      form: [
        "Selesaikan setiap langkah dan pertanyaan sebelum mengirim hasil.",
      ],
    });
  if (row.assignment_version_id) {
    const { data: av, error: avError } = await db
      .from("assignment_versions")
      .select("assignment_id")
      .eq("id", row.assignment_version_id)
      .single();
    databaseError(avError);
    const { data: a, error: aError } = await db
      .from("assignments")
      .select("due_at,status")
      .eq("id", av!.assignment_id)
      .single();
    databaseError(aError);
    if (
      a!.status !== "published" ||
      (a!.due_at && Date.parse(a!.due_at) < Date.now())
    )
      throw new AppError("FORBIDDEN");
  }
  const { data: actions, error: actionError } = await db
    .from("lab_actions")
    .select("accepted")
    .eq("session_id", row.id)
    .eq("action_type", "action");
  databaseError(actionError);
  const { data: answers, error: answerError } = await db
    .from("quiz_responses")
    .select("is_correct")
    .eq("session_id", row.id);
  databaseError(answerError);
  const actionCount = exp.steps.filter((s) => !s.question).length,
    questionCount = exp.steps.filter((s) => s.question).length;
  if ((answers?.length || 0) !== questionCount)
    throw new AppError("VALIDATION_ERROR");
  const accuracy = Math.round(
      (actionCount / Math.max(actionCount, actions?.length || 0)) * 100,
    ),
    quiz = questionCount
      ? Math.round(
          ((answers || []).filter((a) => a.is_correct).length / questionCount) *
            100,
        )
      : 100;
  const { data, error } = await db.rpc("labora_submit", {
    actor: user.id,
    session: row.id,
    expected_revision: revision,
    assessment: {
      accuracy,
      quiz,
      score: Math.round(accuracy * 0.4 + quiz * 0.6),
      steps: exp.steps.length,
      observations: { runtime: row.state, concept: exp.concept },
    },
  });
  databaseError(error);
  return resultDTO(data as unknown as ResultRow);
}
export async function progress(request: Request) {
  const { client } = await requireIdentity(),
    { offset, limit } = page(request);
  const { data, error } = await client
    .from("experiment_results")
    .select("*")
    .order("completed_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);
  databaseError(error);
  return Promise.all((data || []).map(resultDTO));
}
export async function progressSummary() {
  const { user } = await requireIdentity();
  const { data, error } = await adminDatabase().rpc("labora_progress_summary", {
    actor: user.id,
  });
  databaseError(error);
  return data;
}
export async function getResult(id: string) {
  const { user } = await requireIdentity(),
    db = adminDatabase();
  const { data, error } = await db
    .from("experiment_results")
    .select("*")
    .eq("id", uuid(id))
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  if (data.student_id !== user.id) {
    if (!data.assignment_version_id) throw new AppError("NOT_FOUND");
    const { data: v, error: vError } = await db
      .from("assignment_versions")
      .select("assignment_id")
      .eq("id", data.assignment_version_id)
      .single();
    databaseError(vError);
    const { data: a, error: aError } = await db
      .from("assignments")
      .select("teacher_id,school_id")
      .eq("id", v!.assignment_id)
      .single();
    databaseError(aError);
    const { data: m, error: mError } = await db
      .from("school_members")
      .select("role")
      .eq("school_id", a!.school_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    databaseError(mError);
    if (a!.teacher_id !== user.id || m?.role !== "teacher")
      throw new AppError("NOT_FOUND");
  }
  return resultDTO(data);
}
