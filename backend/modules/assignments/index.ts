import "server-only";
import type { AssignmentDTO, AssignmentReport } from "@contracts/laboratory";
import type { Experiment } from "@contracts/experiment";
import { requireIdentity } from "../identity";
import { requireTeacher } from "../classrooms";
import { experimentVersion, withAnswerKeys } from "../catalog";
import { resultDTO } from "../assessment";
import { adminDatabase, databaseError, toJson } from "../../shared/database";
import type { Database } from "@contracts/database";
import { AppError } from "../../shared/errors";
import { readJson } from "../../shared/http";
import { fields, text, uuid, integer, page } from "../../shared/validation";

type AssignmentRow = Database["public"]["Tables"]["assignments"]["Row"];
export async function ownedAssignment(id: string) {
  const { user } = await requireIdentity();
  const { data, error } = await adminDatabase()
    .from("assignments")
    .select("*")
    .eq("id", uuid(id))
    .eq("teacher_id", user.id)
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  await requireTeacher(data.school_id);
  return { user, row: data as AssignmentRow };
}
async function assignmentDTO(
  row: AssignmentRow,
  teacher: boolean,
): Promise<AssignmentDTO> {
  let config = row.draft_config as unknown as AssignmentDTO;
  if (row.published_version_id) {
    const { data, error } = await adminDatabase()
      .from("assignment_versions")
      .select("config")
      .eq("id", row.published_version_id)
      .single();
    databaseError(error);
    config = data!.config as unknown as AssignmentDTO;
  }
  return {
    ...config,
    id: row.id,
    experimentId: row.experiment_id,
    title: row.title,
    createdAt: row.created_at,
    status: row.status as AssignmentDTO["status"],
    revision: row.revision,
    versionId: row.published_version_id || undefined,
    dueAt: row.due_at,
    stages: config.stages.map((s) => ({
      ...s,
      ...(!teacher ? { answer: undefined, explanation: undefined } : {}),
    })),
  };
}
export async function listAssignments(request: Request) {
  const { user } = await requireIdentity(),
    db = adminDatabase(),
    { offset, limit } = page(request);
  const [{ data: owned, error: oError }, { data: recipients, error: rError }] =
    await Promise.all([
      db
        .from("assignments")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      db
        .from("assignment_recipients")
        .select("assignment_version_id")
        .eq("student_id", user.id)
        .order("assigned_at", { ascending: false })
        .range(offset, offset + limit - 1),
    ]);
  databaseError(oError);
  databaseError(rError);
  const ownedRows: AssignmentRow[] = [];
  for (const a of owned || []) {
    try {
      await requireTeacher(a.school_id);
      ownedRows.push(a);
    } catch (e) {
      if (!(e instanceof AppError) || e.code !== "FORBIDDEN") throw e;
    }
  }
  let studentRows: AssignmentRow[] = [];
  if (recipients?.length) {
    const { data, error } = await db
      .from("assignments")
      .select("*")
      .in(
        "published_version_id",
        recipients.map((r) => r.assignment_version_id),
      )
      .eq("status", "published");
    databaseError(error);
    studentRows = data || [];
  }
  const rows = new Map([...ownedRows, ...studentRows].map((a) => [a.id, a]));
  return Promise.all(
    [...rows.values()].map((a) => assignmentDTO(a, a.teacher_id === user.id)),
  );
}
export async function getAssignment(id: string) {
  const { user } = await requireIdentity(),
    db = adminDatabase();
  const { data, error } = await db
    .from("assignments")
    .select("*")
    .eq("id", uuid(id))
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  if (data.teacher_id === user.id) {
    await requireTeacher(data.school_id);
    return assignmentDTO(data, true);
  }
  const { data: r, error: rError } = await db
    .from("assignment_recipients")
    .select("student_id")
    .eq(
      "assignment_version_id",
      data.published_version_id || "00000000-0000-4000-8000-000000000000",
    )
    .eq("student_id", user.id)
    .maybeSingle();
  databaseError(rError);
  if (!r || data.status !== "published") throw new AppError("NOT_FOUND");
  return assignmentDTO(data, false);
}
async function validateDraft(body: Record<string, unknown>) {
  fields(body, [
    "experimentId",
    "title",
    "instructions",
    "stages",
    "schoolId",
    "classIds",
    "dueAt",
    "revision",
  ]);
  const version = await experimentVersion(
      text(body.experimentId, "experimentId", 80),
    ),
    privateExp = await withAnswerKeys(version.definition, version.id);
  const stages = body.stages;
  if (
    !Array.isArray(stages) ||
    stages.length !== version.definition.steps.length
  )
    throw new AppError("VALIDATION_ERROR");
  const config = {
    instructions: text(body.instructions, "instructions", 4000, true),
    className: "",
    stages: stages.map((s, i) => {
      if (!s || typeof s !== "object" || Array.isArray(s))
        throw new AppError("VALIDATION_ERROR");
      fields(s, [
        "instruction",
        "hint",
        "question",
        "options",
        "answer",
        "explanation",
      ]);
      const base = privateExp.steps[i];
      let options: string[] = [],
        question = "",
        answer: number | undefined;
      if (base.question) {
        if (
          !Array.isArray(s.options) ||
          s.options.length < 2 ||
          s.options.length > 6
        )
          throw new AppError("VALIDATION_ERROR");
        options = s.options.map((o: unknown) => text(o, "option", 300));
        question = text(s.question, "question", 500);
        answer = integer(
          s.answer ?? base.question.answer,
          "answer",
          0,
          options.length - 1,
        );
      }
      return {
        instruction: text(s.instruction, "instruction", 1000),
        hint: text(s.hint, "hint", 1000, true),
        question,
        options,
        ...(answer !== undefined
          ? {
              answer,
              explanation: text(
                s.explanation ?? base.question?.explanation ?? "",
                "explanation",
                4000,
                true,
              ),
            }
          : {}),
      };
    }),
  };
  let dueAt: string | null = null;
  if (body.dueAt) {
    dueAt = text(body.dueAt, "dueAt", 40);
    if (!Number.isFinite(Date.parse(dueAt)) || Date.parse(dueAt) <= Date.now())
      throw new AppError("VALIDATION_ERROR");
    dueAt = new Date(dueAt).toISOString();
  }
  return {
    experimentId: version.definition.id,
    title: text(body.title, "title", 160),
    config,
    dueAt,
    definition: privateExp,
  };
}
export async function createAssignment(request: Request) {
  const body = await readJson(request),
    draft = await validateDraft(body),
    schoolId = uuid(body.schoolId, "schoolId"),
    user = await requireTeacher(schoolId);
  const { data, error } = await adminDatabase()
    .from("assignments")
    .insert({
      teacher_id: user.id,
      school_id: schoolId,
      experiment_id: draft.experimentId,
      title: draft.title,
      draft_config: draft.config,
      due_at: draft.dueAt,
    })
    .select("*")
    .single();
  databaseError(error);
  if (!data) throw new AppError("SERVICE_UNAVAILABLE");
  return assignmentDTO(data, true);
}
export async function updateAssignment(request: Request, id: string) {
  const { row } = await ownedAssignment(id);
  if (row.status !== "draft") throw new AppError("REVISION_CONFLICT");
  const body = await readJson(request),
    revision = integer(body.revision, "revision"),
    draft = await validateDraft(body);
  const { data, error } = await adminDatabase()
    .from("assignments")
    .update({
      experiment_id: draft.experimentId,
      title: draft.title,
      draft_config: draft.config,
      due_at: draft.dueAt,
      revision: revision + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("revision", revision)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("REVISION_CONFLICT");
  return assignmentDTO(data, true);
}
export async function publishAssignment(request: Request, id: string) {
  const body = await readJson(request);
  fields(body, ["revision", "classIds"]);
  const revision = integer(body.revision, "revision"),
    { user, row } = await ownedAssignment(id);
  if (
    !Array.isArray(body.classIds) ||
    !body.classIds.length ||
    body.classIds.length > 20
  )
    throw new AppError("VALIDATION_ERROR");
  const classes = [...new Set(body.classIds.map((c) => uuid(c, "classIds")))];
  if (row.status === "published") {
    const existing = await assignmentDTO(row, true);
    if (
      JSON.stringify([...(existing.classIds || [])].sort()) !==
      JSON.stringify([...classes].sort())
    )
      throw new AppError("REVISION_CONFLICT");
    return existing;
  }
  const version = await experimentVersion(row.experiment_id),
    definition = await withAnswerKeys(version.definition, version.id),
    config = row.draft_config as unknown as AssignmentDTO;
  const keys: Record<string, unknown> = {};
  config.stages.forEach((s, i) => {
    if (definition.steps[i].question)
      keys[i] = {
        answer: s.answer,
        explanation: s.explanation || definition.steps[i].question!.explanation,
      };
  });
  const publicConfig = {
    ...config,
    classIds: classes,
    stages: config.stages.map(({ answer, explanation, ...s }) => s),
  };
  const { data: rooms, error: roomError } = await adminDatabase()
    .from("classes")
    .select("name")
    .in("id", classes)
    .eq("teacher_id", user.id);
  databaseError(roomError);
  publicConfig.className = (rooms || []).map((c) => c.name).join(", ");
  const { data, error } = await adminDatabase().rpc("labora_publish", {
    actor: user.id,
    assignment: id,
    expected_revision: revision,
    public_config: publicConfig,
    keys: toJson(keys),
    classes,
  });
  databaseError(error);
  return assignmentDTO(data as unknown as AssignmentRow, true);
}
export async function archiveAssignment(id: string) {
  await ownedAssignment(id);
  const { error } = await adminDatabase()
    .from("assignments")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);
  databaseError(error);
  return { archived: true };
}
export async function report(
  request: Request,
  id: string,
): Promise<AssignmentReport> {
  const { row, user } = await ownedAssignment(id),
    db = adminDatabase();
  const { offset, limit } = page(request);
  if (!row.published_version_id)
    return {
      assignmentId: id,
      total: 0,
      completed: 0,
      results: [],
      recipients: [],
    };
  const [{ data: summary, error: rError }, { data: results, error: eError }] =
    await Promise.all([
      db.rpc("labora_assignment_report", {
        actor: user.id,
        assignment: id,
        page_offset: offset,
        page_limit: limit,
      }),
      db
        .from("experiment_results")
        .select("*")
        .eq("assignment_version_id", row.published_version_id)
        .order("completed_at", { ascending: false })
        .order("id")
        .range(offset, offset + limit - 1),
    ]);
  databaseError(rError);
  databaseError(eError);
  const all = await Promise.all((results || []).map(resultDTO));
  const aggregate = summary as unknown as Pick<
    AssignmentReport,
    "total" | "completed" | "recipients" | "attempts"
  >;
  return {
    assignmentId: id,
    ...aggregate,
    results: all,
    nextOffset:
      offset + limit < Math.max(aggregate.total, aggregate.attempts || 0)
        ? offset + limit
        : null,
  };
}
