import "server-only";
import { isDeepStrictEqual } from "node:util";
import { ownedSession } from "../sessions";
import { adminDatabase, databaseError, toJson } from "../../shared/database";
import { readJson } from "../../shared/http";
import { fields, text, uuid } from "../../shared/validation";
import { AppError } from "../../shared/errors";
export async function notes(session: string) {
  const { user } = await ownedSession(session);
  const { data, error } = await adminDatabase()
    .from("lab_notes")
    .select("*")
    .eq("session_id", session)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  databaseError(error);
  return data;
}
export async function saveNote(request: Request, session: string, id?: string) {
  const body = await readJson(request);
  fields(body, [
    "hypothesis",
    "observation",
    "conclusion",
    "measurements",
    "id",
  ]);
  const { user } = await ownedSession(session);
  const measurements = body.measurements ?? {};
  if (
    !measurements ||
    typeof measurements !== "object" ||
    Array.isArray(measurements) ||
    Object.keys(measurements).length > 50 ||
    Object.values(measurements).some(
      (n) => typeof n !== "number" || !Number.isFinite(n),
    )
  )
    throw new AppError("VALIDATION_ERROR");
  const value = {
    hypothesis: text(body.hypothesis, "hypothesis", 4000, true),
    observation: text(body.observation, "observation", 4000, true),
    conclusion: text(body.conclusion, "conclusion", 4000, true),
    measurement_snapshot: toJson(measurements),
    updated_at: new Date().toISOString(),
  };
  const db = adminDatabase();
  const query = id
    ? db
        .from("lab_notes")
        .update(value)
        .eq("id", uuid(id))
        .eq("session_id", session)
        .eq("author_id", user.id)
    : db.from("lab_notes").insert({
        ...value,
        ...(body.id ? { id: uuid(body.id) } : {}),
        session_id: session,
        author_id: user.id,
      });
  const { data, error } = await query.select("*").maybeSingle();
  if (!id && body.id && error?.code === "23505") {
    const { data: previous, error: previousError } = await db
      .from("lab_notes")
      .select("*")
      .eq("id", uuid(body.id))
      .eq("session_id", session)
      .eq("author_id", user.id)
      .maybeSingle();
    databaseError(previousError);
    if (
      !previous ||
      previous.hypothesis !== value.hypothesis ||
      previous.observation !== value.observation ||
      previous.conclusion !== value.conclusion ||
      !isDeepStrictEqual(
        previous.measurement_snapshot,
        value.measurement_snapshot,
      )
    )
      throw new AppError("IDEMPOTENCY_CONFLICT");
    return previous;
  }
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  return data;
}
