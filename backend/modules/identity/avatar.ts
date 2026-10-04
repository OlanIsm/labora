import "server-only";
import { randomUUID } from "node:crypto";
import { requireIdentity, getProfile } from "./index";
import { adminDatabase, databaseError } from "../../shared/database";
import { readBytes } from "../../shared/http";
import { AppError } from "../../shared/errors";
export async function uploadAvatar(request: Request) {
  const { user } = await requireIdentity();
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw new AppError("UNSUPPORTED_MEDIA_TYPE");
  const buffer = await readBytes(request, 2200000);
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    throw new AppError("BAD_REQUEST");
  }
  const file = form.get("avatar");
  if (
    !(file instanceof File) ||
    file.size > 2097152 ||
    file.size < 12 ||
    [...form.keys()].some((key) => key !== "avatar")
  )
    throw new AppError("VALIDATION_ERROR", {
      avatar: ["Pilih foto PNG, JPEG, atau WebP maksimal 2 MB."],
    });
  const data = Buffer.from(await file.arrayBuffer());
  const types: Record<string, { extension: string; valid: boolean }> = {
    "image/png": {
      extension: "png",
      valid: data
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    },
    "image/jpeg": {
      extension: "jpg",
      valid: data[0] === 255 && data[1] === 216 && data[2] === 255,
    },
    "image/webp": {
      extension: "webp",
      valid:
        data.subarray(0, 4).toString() === "RIFF" &&
        data.subarray(8, 12).toString() === "WEBP",
    },
  };
  const type = types[file.type];
  if (!type?.valid)
    throw new AppError("VALIDATION_ERROR", {
      avatar: ["Format foto tidak sesuai dengan isi file."],
    });
  const db = adminDatabase(),
    path = `${user.id}/${randomUUID()}.${type.extension}`;
  const { data: previous, error: profileError } = await db
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();
  databaseError(profileError);
  const { error: uploadError } = await db.storage
    .from("avatars")
    .upload(path, data, { contentType: file.type, upsert: false });
  if (uploadError) throw new AppError("SERVICE_UNAVAILABLE");
  const { error } = await db
    .from("profiles")
    .update({ avatar_path: path, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    await db.storage.from("avatars").remove([path]);
    databaseError(error);
  }
  if (previous?.avatar_path?.startsWith(`${user.id}/`)) {
    const { error: cleanupError } = await db.storage
      .from("avatars")
      .remove([previous.avatar_path]);
    if (cleanupError)
      console.error(
        "Avatar cleanup failed; retry through storage maintenance.",
      );
  }
  return getProfile();
}
