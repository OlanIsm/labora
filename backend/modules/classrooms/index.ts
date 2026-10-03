import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { requireIdentity } from "../identity";
import { adminDatabase, databaseError } from "../../shared/database";
import { AppError } from "../../shared/errors";
import { readJson } from "../../shared/http";
import { fields, text, uuid, integer } from "../../shared/validation";

export async function requireTeacher(schoolId: string) {
  const { user } = await requireIdentity();
  const { data, error } = await adminDatabase()
    .from("school_members")
    .select("role")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  databaseError(error);
  if (data?.role !== "teacher") throw new AppError("FORBIDDEN");
  return user;
}
export async function memberships() {
  const { client, user } = await requireIdentity();
  const { data, error } = await client
    .from("school_members")
    .select("school_id,role,schools(name)")
    .eq("user_id", user.id)
    .eq("status", "active");
  databaseError(error);
  return data;
}
export async function createSchool(request: Request) {
  const body = await readJson(request);
  fields(body, ["name"]);
  const { user } = await requireIdentity();
  const { data, error } = await adminDatabase().rpc("labora_create_school", {
    actor: user.id,
    school_name: text(body.name, "name", 120),
  });
  databaseError(error);
  return data;
}
export async function classes() {
  const { client } = await requireIdentity();
  const { data, error } = await client
    .from("classes")
    .select("*")
    .is("archived_at", null)
    .order("created_at")
    .limit(100);
  databaseError(error);
  return data?.map((c) => ({
    id: c.id,
    schoolId: c.school_id,
    teacherId: c.teacher_id,
    name: c.name,
    archived: false,
  }));
}
export async function createClass(request: Request) {
  const body = await readJson(request);
  fields(body, ["name", "schoolId"]);
  const schoolId = uuid(body.schoolId, "schoolId");
  const user = await requireTeacher(schoolId);
  const { data, error } = await adminDatabase()
    .from("classes")
    .insert({
      school_id: schoolId,
      teacher_id: user.id,
      name: text(body.name, "name", 80),
    })
    .select("*")
    .single();
  databaseError(error);
  return {
    id: data!.id,
    schoolId,
    teacherId: user.id,
    name: data!.name,
    archived: false,
  };
}
export async function ownedClass(id: string) {
  const { user } = await requireIdentity();
  const { data, error } = await adminDatabase()
    .from("classes")
    .select("*")
    .eq("id", uuid(id))
    .eq("teacher_id", user.id)
    .is("archived_at", null)
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  await requireTeacher(data.school_id);
  return { user, room: data };
}
export async function classRoster(id: string) {
  await ownedClass(id);
  const { data, error } = await adminDatabase()
    .from("class_members")
    .select("student_id,profiles(display_name)")
    .eq("class_id", id)
    .is("left_at", null)
    .limit(1000);
  databaseError(error);
  return data;
}
export async function archiveClass(id: string) {
  await ownedClass(id);
  const { error } = await adminDatabase()
    .from("classes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  databaseError(error);
  return { archived: true };
}
export async function removeStudent(id: string, student: string) {
  await ownedClass(id);
  const { error } = await adminDatabase()
    .from("class_members")
    .update({ left_at: new Date().toISOString() })
    .eq("class_id", id)
    .eq("student_id", uuid(student));
  databaseError(error);
  return { removed: true };
}
export async function createInvitation(request: Request) {
  const body = await readJson(request);
  fields(body, ["schoolId", "classId", "email", "role", "maxUses"]);
  const schoolId = uuid(body.schoolId, "schoolId"),
    user = await requireTeacher(schoolId);
  const role = body.role === undefined ? "student" : body.role;
  if (!["teacher", "student"].includes(String(role)))
    throw new AppError("VALIDATION_ERROR");
  const classId = body.classId ? uuid(body.classId, "classId") : null;
  if (classId) {
    const { room } = await ownedClass(classId);
    if (room.school_id !== schoolId || role !== "student")
      throw new AppError("FORBIDDEN");
  }
  if (role === "teacher") {
    const { data, error } = await adminDatabase()
      .from("schools")
      .select("owner_id")
      .eq("id", schoolId)
      .maybeSingle();
    databaseError(error);
    if (data?.owner_id !== user.id) throw new AppError("FORBIDDEN");
  }
  const email = body.email
    ? text(body.email, "email", 254).toLowerCase()
    : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError("VALIDATION_ERROR");
  const token = randomBytes(24).toString("base64url"),
    expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const { data, error } = await adminDatabase()
    .from("invitations")
    .insert({
      school_id: schoolId,
      class_id: classId,
      invited_email: email,
      role: role as "student" | "teacher",
      token_hash: createHash("sha256").update(token).digest("hex"),
      created_by: user.id,
      expires_at: expiresAt,
      max_uses: integer(body.maxUses ?? 1, "maxUses", 1, 1000),
    })
    .select("id")
    .single();
  databaseError(error);
  return { id: data!.id, token, expiresAt };
}
export async function acceptInvitation(request: Request) {
  const body = await readJson(request);
  fields(body, ["token"]);
  const { user } = await requireIdentity();
  if (!user.email_confirmed_at || !user.email) throw new AppError("FORBIDDEN");
  const { data, error } = await adminDatabase().rpc(
    "labora_accept_invitation",
    {
      actor: user.id,
      email_address: user.email,
      digest: createHash("sha256")
        .update(text(body.token, "token", 100))
        .digest("hex"),
    },
  );
  databaseError(error);
  return data;
}
export async function revokeInvitation(id: string) {
  const { user } = await requireIdentity();
  const { data, error } = await adminDatabase()
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", uuid(id))
    .eq("created_by", user.id)
    .select("id")
    .maybeSingle();
  databaseError(error);
  if (!data) throw new AppError("NOT_FOUND");
  return { revoked: true };
}
