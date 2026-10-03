import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { experiments } from "../../backend/modules/catalog/definitions";

const base = process.env.LABORA_BASE_URL || "http://localhost:3120";
const supabaseUrl = process.env.SUPABASE_URL!;
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(supabaseUrl).hostname),
  "Integration fixtures run only against local Supabase.",
);
const admin = createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const password = "Labora-test-94!";
type Account = { id: string; email: string; cookies: Map<string, string> };
async function api(
  account: Account | null,
  path: string,
  method = "GET",
  body?: unknown,
  status = 200,
) {
  const response = await fetch(base + "/api/v1" + path, {
    method,
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      ...(account
        ? {
            Cookie: [...account.cookies]
              .map(([k, v]) => `${k}=${v}`)
              .join("; "),
          }
        : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  for (const value of response.headers.getSetCookie()) {
    const first = value.split(";")[0],
      i = first.indexOf("=");
    account?.cookies.set(first.slice(0, i), first.slice(i + 1));
  }
  const result = await response.json();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${JSON.stringify(result)}`,
  );
  assert.ok(result.requestId);
  return status >= 400 ? result.error : result.data;
}
async function account(name: string): Promise<Account> {
  const email = `${name}-${randomUUID()}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "teacher", className: "Forged class" },
  });
  assert.equal(error, null);
  const a = { id: data.user!.id, email, cookies: new Map<string, string>() };
  const profile = await api(a, "/auth/login", "POST", { email, password });
  assert.equal(
    profile.role,
    "student",
    "Editable metadata cannot grant teacher rights",
  );
  return a;
}
async function main() {
  const teacher = await account("Teacher"),
    student = await account("Student"),
    other = await account("Other");
  const school = await api(teacher, "/schools", "POST", {
    name: "Integration School",
  });
  assert.equal((await api(teacher, "/me")).role, "teacher");
  const room = await api(teacher, "/classes", "POST", {
    schoolId: school.id,
    name: "VIII A",
  });
  await api(
    student,
    "/classes",
    "POST",
    { schoolId: school.id, name: "Forged" },
    403,
  );
  const invite = await api(teacher, "/invitations", "POST", {
    schoolId: school.id,
    classId: room.id,
    email: student.email,
    maxUses: 1,
  });
  await api(other, "/invitations/accept", "POST", { token: invite.token }, 404);
  await api(student, "/invitations/accept", "POST", { token: invite.token });
  await api(student, "/invitations/accept", "POST", { token: invite.token });
  assert.equal((await api(student, "/me")).role, "student");
  assert.equal((await api(student, "/classes")).length, 1);
  await api(other, `/classes/${room.id}/members`, "GET", undefined, 404);
  const catalog = await api(null, "/experiments");
  assert.equal(catalog.length, 9);
  const publicDefinition = await api(null, "/experiments/acid-base");
  assert.ok(!JSON.stringify(publicDefinition).includes('"answer":'));
  assert.ok(!JSON.stringify(publicDefinition).includes('"explanation":'));
  await api(student, "/experiments/acid-base/authoring", "GET", undefined, 403);
  const authored = await api(teacher, "/experiments/acid-base/authoring");
  assert.equal(authored.steps[3].question.answer, 1);
  const draft = await api(teacher, "/assignments", "POST", {
    schoolId: school.id,
    experimentId: "acid-base",
    title: "Acid Test",
    instructions: "Observe carefully",
    stages: authored.steps.map((s: any) => ({
      instruction: s.instruction,
      hint: s.hint,
      question: s.question?.prompt || "",
      options: s.question?.options || [],
      answer: s.question?.answer ?? 0,
    })),
  });
  assert.equal(draft.status, "draft");
  assert.equal((await api(student, "/assignments")).length, 0);
  const published = await api(
    teacher,
    `/assignments/${draft.id}/publish`,
    "POST",
    { revision: 0, classIds: [room.id] },
  );
  assert.equal(published.status, "published");
  await api(teacher, `/assignments/${draft.id}/publish`, "POST", {
    revision: 0,
    classIds: [room.id],
  });
  const tasks = await api(student, "/assignments");
  assert.equal(tasks.length, 1);
  assert.ok(!JSON.stringify(tasks).includes('"answer":'));
  await api(other, `/assignments/${draft.id}`, "GET", undefined, 404);
  await api(
    other,
    "/sessions",
    "POST",
    {
      experimentId: "acid-base",
      assignmentId: draft.id,
      eventId: randomUUID(),
    },
    404,
  );

  const targeted = await api(teacher, "/assignments", "POST", {
    schoolId: school.id,
    experimentId: "acid-base",
    title: "Selected students only",
    instructions: draft.instructions,
    stages: draft.stages,
  });
  await api(
    teacher,
    `/assignments/${targeted.id}/publish`,
    "POST",
    {
      revision: 0,
      classIds: [room.id],
      studentIds: [],
    },
    422,
  );
  await api(
    teacher,
    `/assignments/${targeted.id}/publish`,
    "POST",
    {
      revision: 0,
      classIds: [room.id],
      studentIds: [other.id],
    },
    403,
  );
  assert.equal(
    (await api(teacher, `/assignments/${targeted.id}`)).status,
    "draft",
  );
  assert.equal(
    (await api(teacher, `/assignments/${targeted.id}/results`)).total,
    0,
  );
  const otherInvite = await api(teacher, "/invitations", "POST", {
    schoolId: school.id,
    classId: room.id,
    email: other.email,
    maxUses: 1,
  });
  await api(other, "/invitations/accept", "POST", { token: otherInvite.token });
  const selected = await api(
    teacher,
    `/assignments/${targeted.id}/publish`,
    "POST",
    {
      revision: 0,
      classIds: [room.id],
      studentIds: [student.id, student.id],
    },
  );
  assert.deepEqual(selected.studentIds, [student.id]);
  assert.equal(selected.audience, "students");
  assert.equal(selected.selectedStudentCount, 1);
  assert.equal(
    (await api(teacher, `/assignments/${targeted.id}/results`)).total,
    1,
  );
  const visible = await api(student, `/assignments/${targeted.id}`);
  assert.equal(
    visible.studentIds,
    undefined,
    "Student identities stay teacher-only",
  );
  await api(teacher, `/assignments/${targeted.id}/publish`, "POST", {
    revision: 0,
    classIds: [room.id],
    studentIds: [student.id],
  });
  await api(
    teacher,
    `/assignments/${targeted.id}/publish`,
    "POST",
    {
      revision: 0,
      classIds: [room.id],
      studentIds: [other.id],
    },
    409,
  );
  await api(other, `/assignments/${targeted.id}`, "GET", undefined, 404);
  assert.equal((await api(other, "/assignments")).length, 0);
  await api(
    other,
    "/sessions",
    "POST",
    {
      experimentId: "acid-base",
      assignmentId: targeted.id,
      eventId: randomUUID(),
    },
    404,
  );

  for (const exp of experiments) {
    const eventId = randomUUID(),
      assignmentId = exp.id === "acid-base" ? draft.id : undefined;
    let session = await api(student, "/sessions", "POST", {
      experimentId: exp.id,
      assignmentId,
      eventId,
    });
    assert.equal(
      (
        await api(student, "/sessions", "POST", {
          experimentId: exp.id,
          assignmentId,
          eventId,
        })
      ).id,
      session.id,
    );
    await api(other, `/sessions/${session.id}`, "GET", undefined, 404);
    await api(
      student,
      `/sessions/${session.id}/submit`,
      "POST",
      { revision: 0 },
      422,
    );
    await api(
      student,
      `/sessions/${session.id}/state`,
      "PATCH",
      { eventId: randomUUID(), revision: 0, state: { step: 99 } },
      403,
    );
    for (const step of exp.steps) {
      const key = randomUUID(),
        payload = step.question
          ? {
              eventId: key,
              revision: session.revision,
              choice: step.question.answer,
            }
          : {
              eventId: key,
              revision: session.revision,
              action: step.action,
              item: step.item,
            };
      const path = `/sessions/${session.id}/${step.question ? "answers" : "actions"}`;
      const result = await api(student, path, "POST", payload);
      assert.equal(result.accepted, true);
      session = result.session;
      const duplicate = await api(student, path, "POST", payload);
      assert.deepEqual(duplicate, result);
      await api(
        student,
        path,
        "POST",
        {
          ...payload,
          ...(step.question
            ? {
                choice:
                  (step.question.answer! + 1) % step.question.options.length,
              }
            : { item: exp.items.find((i) => i.id !== step.item)!.id }),
        },
        409,
      );
    }
    const result = await api(
      student,
      `/sessions/${session.id}/submit`,
      "POST",
      { revision: session.revision },
    );
    assert.equal(result.score, 100, exp.id);
    assert.equal(result.accuracy, 100);
    assert.equal(result.quiz, 100);
    assert.deepEqual(
      await api(student, `/sessions/${session.id}/submit`, "POST", {
        revision: 0,
      }),
      result,
    );
    await api(other, `/results/${result.id}`, "GET", undefined, 404);
    if (exp.id === "acid-base")
      assert.equal((await api(teacher, `/results/${result.id}`)).score, 100);
    else await api(teacher, `/results/${result.id}`, "GET", undefined, 404);
  }
  const report = await api(teacher, `/assignments/${draft.id}/results`);
  assert.equal(report.total, 1);
  assert.equal(report.completed, 1);
  assert.equal(report.results.length, 1);
  assert.equal((await api(student, "/progress")).length, 9);
  assert.deepEqual(await api(student, "/progress/summary"), {
    attempts: 9,
    completed: 9,
    subjects: 3,
    averageScore: 100,
  });
  const reportPage = await api(
    teacher,
    `/assignments/${draft.id}/results?offset=1&limit=1`,
  );
  assert.equal(reportPage.total, 1);
  assert.equal(reportPage.completed, 1);
  assert.equal(reportPage.results.length, 0);
  assert.equal((await api(other, "/progress")).length, 0);
  const notifications = await api(student, "/notifications");
  assert.equal(notifications.length, 11);
  await api(student, "/notifications", "PATCH", { all: true });
  assert.ok((await api(student, "/notifications")).every((n: any) => n.readAt));

  const practice = await api(student, "/sessions", "POST", {
    experimentId: "acid-base",
    eventId: randomUUID(),
  });
  const wrong = await api(student, `/sessions/${practice.id}/actions`, "POST", {
    eventId: randomUUID(),
    revision: 0,
    action: "place",
    item: "indicator",
  });
  assert.equal(wrong.accepted, false);
  assert.equal(wrong.session.state.step, 0);
  await api(
    student,
    `/sessions/${practice.id}/actions`,
    "POST",
    { eventId: randomUUID(), revision: 0, action: "place", item: "beaker" },
    409,
  );
  await api(
    student,
    `/sessions/${practice.id}/actions`,
    "POST",
    {
      eventId: randomUUID(),
      revision: 1,
      action: "place",
      item: "beaker",
      score: 100,
    },
    422,
  );

  const direct = createClient(
    // The browser key cannot call privileged server functions or read another account.
    supabaseUrl,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  assert.equal(
    (await direct.auth.signInWithPassword({ email: other.email, password }))
      .error,
    null,
  );
  assert.deepEqual(
    (await direct.from("experiment_results").select("*")).data,
    [],
  );
  assert.deepEqual((await direct.from("lab_sessions").select("*")).data, []);
  assert.deepEqual(
    (await direct.from("assignment_recipients").select("*")).data,
    [],
  );
  assert.deepEqual((await direct.from("notifications").select("*")).data, []);
  assert.ok(
    (
      await direct.rpc("labora_publish", {
        actor: teacher.id,
        assignment: targeted.id,
        expected_revision: 0,
        classes: [room.id],
        students: [other.id],
        public_config: {},
        keys: {},
      })
    ).error,
  );
  assert.ok(
    (
      await direct.rpc("labora_create_school", {
        actor: teacher.id,
        school_name: "Forged",
      })
    ).error,
  );
  assert.ok(
    (
      await direct
        .from("school_members")
        .insert({ school_id: school.id, user_id: other.id, role: "teacher" })
    ).error,
  );
  assert.ok((await direct.from("assignments").select("draft_config")).error);
  assert.ok(
    (await direct.schema("private").from("answer_keys").select("*")).error,
  );
  const snapshot = {
    version: 1,
    discipline: "physics",
    simulation: "projectile",
    data: { speed: 20 },
  };
  const saved = await api(student, "/sessions", "POST", {
    mode: "sandbox",
    subject: "physics",
    simulationKey: "projectile",
    eventId: randomUUID(),
    state: snapshot,
  });
  const saveEvent = {
    eventId: randomUUID(),
    revision: 0,
    state: { ...snapshot, data: { speed: 30 } },
  };
  const updated = await api(
    student,
    `/sessions/${saved.id}/state`,
    "PATCH",
    saveEvent,
  );
  assert.equal(updated.session.revision, 1);
  assert.deepEqual(
    (await api(student, `/sessions/${saved.id}/state`, "PATCH", saveEvent))
      .session.state,
    saveEvent.state,
  );
  await api(other, `/sessions/${saved.id}/state`, "PATCH", saveEvent, 404);
  await api(
    student,
    `/sessions/${saved.id}/state`,
    "PATCH",
    { ...saveEvent, eventId: randomUUID() },
    409,
  );
  const note = await api(student, `/sessions/${saved.id}/notes`, "POST", {
    hypothesis: "Increasing speed increases range",
    observation: "The path became longer",
    conclusion: "Speed affects range",
    measurements: { speed: 30 },
  });
  assert.equal(
    (await api(student, `/sessions/${saved.id}/notes`))[0].id,
    note.id,
  );
  await api(other, `/sessions/${saved.id}/notes`, "GET", undefined, 404);
  const noteEvent = {
    id: randomUUID(),
    hypothesis: "H",
    observation: "O",
    conclusion: "C",
    measurements: { speed: 20, labTime: 1 },
  };
  const noteFirst = await api(
    student,
    `/sessions/${saved.id}/notes`,
    "POST",
    noteEvent,
  );
  assert.equal(
    (await api(student, `/sessions/${saved.id}/notes`, "POST", noteEvent)).id,
    noteFirst.id,
  );
  await api(
    student,
    `/sessions/${saved.id}/notes`,
    "POST",
    { ...noteEvent, observation: "changed" },
    409,
  );
  const avatarForm = new FormData();
  avatarForm.append(
    "avatar",
    new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jOuoAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      { type: "image/png" },
    ),
    "avatar.png",
  );
  const upload = await fetch(base + "/api/v1/me/avatar", {
    method: "POST",
    headers: {
      Origin: base,
      Cookie: [...student.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
    },
    body: avatarForm,
  });
  const uploaded = await upload.json();
  assert.equal(upload.status, 200, JSON.stringify(uploaded));
  assert.ok(uploaded.data.avatarUrl);
  assert.equal((await fetch(uploaded.data.avatarUrl)).status, 200);
  const { data: avatarProfile } = await admin
    .from("profiles")
    .select("avatar_path")
    .eq("id", student.id)
    .single();
  assert.ok(
    (await direct.storage.from("avatars").download(avatarProfile!.avatar_path!))
      .error,
  );
  console.log(
    "Backend integration passed: 9 assessed experiments, real cookie auth, enrollment, frozen recipients, duplicate/stale events, official scores, private keys and cross-user/RLS isolation.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
