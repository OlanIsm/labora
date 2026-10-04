import "server-only";
import type { NotificationDTO } from "@contracts/laboratory";
import { requireIdentity } from "../identity";
import { adminDatabase, databaseError } from "../../shared/database";
import { readJson } from "../../shared/http";
import { fields, uuid, page } from "../../shared/validation";
import { AppError } from "../../shared/errors";
export async function notifications(
  request: Request,
): Promise<NotificationDTO[]> {
  const { client } = await requireIdentity(),
    { offset, limit } = page(request);
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  databaseError(error);
  return Promise.all(
    (data || []).map(async (n) => {
      let title = "Hasil eksperimen",
        description = "Hasil eksperimen sudah tersedia.",
        href = "/progress";
      if (n.type === "assignment") {
        const { data: v, error: vError } = await adminDatabase()
          .from("assignment_versions")
          .select("assignment_id")
          .eq("id", n.assignment_version_id!)
          .single();
        databaseError(vError);
        const { data: a, error: aError } = await adminDatabase()
          .from("assignments")
          .select("title,experiment_id")
          .eq("id", v!.assignment_id)
          .single();
        databaseError(aError);
        title = a!.title;
        description = "Ada tugas eksperimen untukmu.";
        href = `/experiments/${a!.experiment_id}?assignment=${v!.assignment_id}`;
      } else if (n.result_id) href = `/progress?result=${n.result_id}`;
      return {
        id: n.id,
        kind: n.type as "assignment" | "result",
        title,
        description,
        href,
        createdAt: n.created_at,
        readAt: n.read_at,
      };
    }),
  );
}
export async function readNotifications(request: Request) {
  const body = await readJson(request);
  fields(body, ["ids", "all"]);
  const { client, user } = await requireIdentity();
  let query = client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  if (body.all !== true) {
    if (
      !Array.isArray(body.ids) ||
      body.ids.length < 1 ||
      body.ids.length > 100
    )
      throw new AppError("VALIDATION_ERROR");
    query = query.in(
      "id",
      body.ids.map((id) => uuid(id)),
    );
  }
  const { error } = await query;
  databaseError(error);
  return { read: true };
}
