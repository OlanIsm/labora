import "server-only";
import { assignmentExperiment } from "../../../shared/experiment-engine/assignment";
import type { Experiment } from "@contracts/experiment";
import type {
  SessionDTO,
  EventOutcome,
  AssignmentDTO,
} from "@contracts/laboratory";
import type { Database } from "@contracts/database";
import {
  act,
  answer,
  initialRuntime,
} from "../../../shared/experiment-engine/engine";
import type { Runtime } from "../../../shared/experiment-engine/engine";
import { requireIdentity } from "../identity";
import {
  experimentVersion,
  versionDefinition,
  withAnswerKeys,
} from "../catalog";
import { adminDatabase, databaseError, toJson } from "../../shared/database";
import { AppError } from "../../shared/errors";
import { readJson } from "../../shared/http";
import { fields, text, uuid, integer, page } from "../../shared/validation";

type SessionRow = {
  id: string;
  student_id: string;
  revision: number;
  status: SessionDTO["status"];
  mode: SessionDTO["mode"];
  experiment_version_id: string | null;
  assignment_version_id: string | null;
  state: Runtime;
  last_saved_at: string;
  subject: string;
};
export async function ownedSession(id: string) {
  const { user } = await requireIdentity();
  const { data, error } = await adminDatabase()
    .from("lab_sessions")
    .select("*")
    .eq("id", uuid(id))
    .eq("student_id", user.id)
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  return { user, row: data as unknown as SessionRow };
}
export async function sessionDefinition(
  row: Pick<SessionRow, "experiment_version_id" | "assignment_version_id">,
): Promise<Experiment> {
  if (!row.experiment_version_id) throw new AppError("VALIDATION_ERROR");
  const version = await versionDefinition(row.experiment_version_id);
  if (!row.assignment_version_id) return version.definition;
  const { data, error } = await adminDatabase()
    .from("assignment_versions")
    .select("config")
    .eq("id", row.assignment_version_id)
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  const config = data.config as unknown as AssignmentDTO;
  return assignmentExperiment(version.definition, config);
}
export async function sessionDTO(
  value:
    SessionRow | Database["public"]["Tables"]["lab_sessions"]["Row"] | null,
): Promise<SessionDTO> {
  if (!value) throw new AppError("SERVICE_UNAVAILABLE");
  const row = value as unknown as SessionRow;
  const definition =
    row.mode === "guided" ? await sessionDefinition(row) : undefined;
  let assignmentId: string | undefined;
  if (row.assignment_version_id) {
    const { data, error } = await adminDatabase()
      .from("assignment_versions")
      .select("assignment_id")
      .eq("id", row.assignment_version_id)
      .single();
    databaseError(error);
    assignmentId = data!.assignment_id;
  }
  return {
    id: row.id,
    revision: row.revision,
    status: row.status,
    mode: row.mode,
    state: row.state,
    definition,
    experimentId: definition?.id,
    assignmentId,
    lastSavedAt: row.last_saved_at,
  };
}
export async function listSessions(request: Request) {
  const { client } = await requireIdentity(),
    { offset, limit } = page(request);
  const params = new URL(request.url).searchParams;
  let query = client.from("lab_sessions").select("*");
  if (params.has("mode"))
    query = query.eq("mode", text(params.get("mode"), "mode", 20));
  if (params.has("subject"))
    query = query.eq("subject", text(params.get("subject"), "subject", 20));
  if (params.has("simulationKey"))
    query = query.eq(
      "simulation_key",
      text(params.get("simulationKey"), "simulationKey", 80),
    );
  const { data, error } = await query
    .order("last_saved_at", { ascending: false })
    .range(offset, offset + limit - 1);
  databaseError(error);
  return Promise.all((data || []).map((row) => sessionDTO(row)));
}
export async function createSession(request: Request) {
  const body = await readJson(request, 262144);
  fields(body, [
    "experimentId",
    "assignmentId",
    "eventId",
    "mode",
    "subject",
    "state",
    "simulationKey",
  ]);
  const { user } = await requireIdentity(),
    eventId = uuid(body.eventId, "eventId"),
    db = adminDatabase();
  let versionId: string | null = null,
    assignmentVersion: string | null = null,
    subject: string,
    definition: Experiment | undefined,
    state: unknown;
  const mode = body.mode ?? "guided";
  if (mode === "guided") {
    const version = await experimentVersion(
      text(body.experimentId, "experimentId", 80),
    );
    versionId = version.id;
    definition = version.definition;
    subject = definition.subject;
    state = initialRuntime();
    if (body.assignmentId) {
      const { data, error } = await db
        .from("assignments")
        .select("*")
        .eq("id", uuid(body.assignmentId, "assignmentId"))
        .eq("status", "published")
        .maybeSingle();
      databaseError(error);
      if (!data || data.experiment_id !== version.definition.id)
        throw new AppError("NOT_FOUND");
      const { data: recipient, error: recipientError } = await db
        .from("assignment_recipients")
        .select("student_id")
        .eq("assignment_version_id", data.published_version_id!)
        .eq("student_id", user.id)
        .maybeSingle();
      databaseError(recipientError);
      if (!recipient) throw new AppError("NOT_FOUND");
      const { data: av, error: avError } = await db
        .from("assignment_versions")
        .select("experiment_version_id")
        .eq("id", data.published_version_id!)
        .single();
      databaseError(avError);
      versionId = av!.experiment_version_id;
      assignmentVersion = data.published_version_id;
      if (data.due_at && Date.parse(data.due_at) < Date.now())
        throw new AppError("FORBIDDEN");
    }
  } else if (mode === "sandbox") {
    subject = text(body.subject, "subject", 20);
    if (!["chemistry", "physics", "biology", "free"].includes(subject))
      throw new AppError("VALIDATION_ERROR");
    state = validateSnapshot(body.state, subject);
  } else throw new AppError("VALIDATION_ERROR");
  const { data: previous, error: previousError } = await db
    .from("lab_sessions")
    .select("*")
    .eq("student_id", user.id)
    .eq("start_event_id", eventId)
    .maybeSingle();
  databaseError(previousError);
  function verifyStart(
    previous: Database["public"]["Tables"]["lab_sessions"]["Row"],
  ) {
    if (
      previous.mode !== mode ||
      previous.experiment_version_id !== versionId ||
      previous.assignment_version_id !== assignmentVersion ||
      previous.subject !== subject ||
      previous.simulation_key !== (body.simulationKey || null)
    )
      throw new AppError("IDEMPOTENCY_CONFLICT");
    return sessionDTO(previous);
  }
  if (previous) return verifyStart(previous);
  const { data, error } = await db
    .from("lab_sessions")
    .insert({
      student_id: user.id,
      mode,
      subject,
      experiment_version_id: versionId,
      assignment_version_id: assignmentVersion,
      start_event_id: eventId,
      state: toJson(state),
      simulation_key: body.simulationKey
        ? text(body.simulationKey, "simulationKey", 80)
        : null,
    })
    .select("*")
    .single();
  if (error?.code === "23505") {
    const { data: winner, error: retryError } = await db
      .from("lab_sessions")
      .select("*")
      .eq("student_id", user.id)
      .eq("start_event_id", eventId)
      .maybeSingle();
    databaseError(retryError);
    if (winner) return verifyStart(winner);
    throw new AppError("IDEMPOTENCY_CONFLICT");
  }
  databaseError(error);
  return sessionDTO(data);
}
export async function getSession(id: string) {
  const { row } = await ownedSession(id);
  return sessionDTO(row);
}

export async function sessionEvent(
  request: Request,
  id: string,
  kind: "action" | "answer" | "state",
) {
  const body = await readJson(request, kind === "state" ? 262144 : 32768);
  fields(
    body,
    kind === "action"
      ? ["eventId", "revision", "action", "item", "parameters"]
      : kind === "answer"
        ? ["eventId", "revision", "choice"]
        : ["eventId", "revision", "state"],
  );
  const eventId = uuid(body.eventId, "eventId"),
    revision = integer(body.revision, "revision"),
    { user, row } = await ownedSession(id),
    db = adminDatabase();
  const { data: previous, error: previousError } = await db
    .from("lab_actions")
    .select("payload,action_type,outcome")
    .eq("session_id", row.id)
    .eq("client_event_id", eventId)
    .maybeSingle();
  databaseError(previousError);
  const payload = { ...body };
  delete payload.eventId;
  delete payload.revision;
  if (previous) {
    if (
      previous.action_type !== kind ||
      JSON.stringify(sortObject(previous.payload)) !==
        JSON.stringify(sortObject(payload))
    )
      throw new AppError("IDEMPOTENCY_CONFLICT");
    return previous.outcome as EventOutcome;
  }
  if (row.status !== "active" || row.revision !== revision)
    throw new AppError("REVISION_CONFLICT");
  let next = row.state,
    accepted = false,
    quiz: unknown = null;
  if (kind === "state") {
    if (row.mode !== "sandbox") throw new AppError("FORBIDDEN");
    next = validateSnapshot(body.state, row.subject) as Runtime;
    accepted = true;
  } else {
    if (row.mode !== "guided") throw new AppError("VALIDATION_ERROR");
    const exp = await sessionDefinition(row),
      step = exp.steps[row.state.step];
    if (!step) throw new AppError("REVISION_CONFLICT");
    if (kind === "action") {
      const action = text(body.action, "action", 30),
        item = text(body.item, "item", 80);
      if (
        (action === "continue"
          ? step.action !== "continue" || item !== "instruction"
          : !exp.items.some((i) => i.id === item)) ||
        ![
          "continue",
          "place",
          "pour",
          "add",
          "connect",
          "activate",
          "observe",
          "measure",
        ].includes(action)
      )
        throw new AppError("VALIDATION_ERROR");
      next = applyParameters(next, body.parameters);
      if (
        exp.subject !== "chemistry" &&
        action !== "place" &&
        step.item === item &&
        !next.placed.includes(item)
      )
        next = act(exp, next, "place", item);
      next = act(exp, next, action, item);
      accepted = next.step > row.state.step;
    } else {
      if (!step.question) throw new AppError("VALIDATION_ERROR");
      const choice = integer(
          body.choice,
          "choice",
          0,
          step.question.options.length - 1,
        ),
        privateExp = await withAnswerKeys(
          exp,
          row.experiment_version_id!,
          row.assignment_version_id,
        );
      next = answer(privateExp, next, choice);
      if (next.step === row.state.step)
        throw new AppError("SERVICE_UNAVAILABLE");
      accepted = true;
      quiz = {
        key: String(row.state.step),
        choice,
        correct: next.answers[row.state.step].correct,
      };
    }
  }
  const outcome: EventOutcome = {
    session: await sessionDTO({
      ...row,
      state: next,
      revision: revision + 1,
      last_saved_at: new Date().toISOString(),
    }),
    accepted,
    feedback: next.feedback || "Meja tersimpan.",
  };
  const { data, error } = await db.rpc("labora_commit_event", {
    actor: user.id,
    session: row.id,
    event: eventId,
    expected_revision: revision,
    event_type: kind,
    event_payload: toJson(payload),
    new_state: toJson(next),
    is_accepted: accepted,
    response: toJson(outcome),
    quiz: quiz ? toJson(quiz) : undefined,
  });
  databaseError(error);
  return data as EventOutcome;
}
function sortObject(value: unknown): unknown {
  return Array.isArray(value)
    ? value.map(sortObject)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => [k, sortObject(v)]),
        )
      : value;
}
function applyParameters(state: Runtime, value: unknown): Runtime {
  if (value === undefined) return state;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppError("VALIDATION_ERROR");
  const parameters = value as Record<string, unknown>;
  fields(parameters, [
    "voltage",
    "resistance",
    "angle",
    "speed",
    "length",
    "zoom",
  ]);
  const ranges: Record<string, [number, number]> = {
    voltage: [1, 12],
    resistance: [1, 12],
    angle: [15, 75],
    speed: [5, 20],
    length: [0.5, 2],
    zoom: [40, 400],
  };
  for (const [key, n] of Object.entries(parameters))
    if (
      typeof n !== "number" ||
      !Number.isFinite(n) ||
      n < ranges[key][0] ||
      n > ranges[key][1] ||
      (key === "zoom" && ![40, 100, 400].includes(n))
    )
      throw new AppError("VALIDATION_ERROR");
  return { ...state, ...parameters };
}
export function validateSnapshot(state: unknown, subject: string) {
  if (!state || typeof state !== "object" || Array.isArray(state))
    throw new AppError("VALIDATION_ERROR");
  const s = state as Record<string, unknown>;
  if (
    s.version === 1 &&
    s.discipline === subject &&
    typeof s.simulation === "string" &&
    [
      "microscope",
      "projectile",
      "submarine",
      "circuit",
      "optics",
      "roller-coaster",
    ].includes(s.simulation)
  ) {
    validateJsonTree(s);
    return s;
  }
  if (
    s.version !== 1 ||
    s.discipline !== subject ||
    !Array.isArray(s.entities) ||
    s.entities.length > 200 ||
    !Array.isArray(s.notes) ||
    s.notes.length > 100 ||
    !Array.isArray(s.events) ||
    s.events.length > 1000 ||
    !Array.isArray(s.samples) ||
    s.samples.length > 2000
  )
    throw new AppError("VALIDATION_ERROR");
  validateJsonTree(s);
  return s;
}
function validateJsonTree(value: unknown, depth = 0) {
  if (depth > 20) throw new AppError("VALIDATION_ERROR");
  if (typeof value === "number" && !Number.isFinite(value))
    throw new AppError("VALIDATION_ERROR");
  if (typeof value === "string" && value.length > 16000)
    throw new AppError("VALIDATION_ERROR");
  if (value && typeof value === "object")
    for (const item of Object.values(value)) validateJsonTree(item, depth + 1);
  if (depth === 0 && JSON.stringify(value).length > 250000)
    throw new AppError("PAYLOAD_TOO_LARGE");
}
export async function abandonSession(id: string) {
  const { user, row } = await ownedSession(id);
  if (row.status !== "active") throw new AppError("REVISION_CONFLICT");
  const { error } = await adminDatabase()
    .from("lab_sessions")
    .update({ status: "abandoned" })
    .eq("id", id)
    .eq("student_id", user.id)
    .eq("status", "active");
  databaseError(error);
  return { abandoned: true };
}
