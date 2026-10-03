const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const { createClient } = require("@supabase/supabase-js");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const base = process.env.LABORA_BASE_URL || "http://localhost:3120";
assert.ok(
  ["127.0.0.1", "localhost"].includes(
    new URL(process.env.SUPABASE_URL).hostname,
  ),
  "Use local Supabase for fixtures.",
);
const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
(async () => {
  const email = `browser-${randomUUID()}@example.test`,
    password = "Labora-browser-94!";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Browser Student" },
  });
  assert.equal(error, null);
  const fixtureUsers = [data.user.id];
  const browser = await chromium.launch();
  try {
    const first = await browser.newContext(),
      second = await browser.newContext();
    const errors = [];
    async function login(context) {
      const response = await context.request.post(base + "/api/v1/auth/login", {
        headers: { Origin: base },
        data: { email, password },
      });
      assert.equal(response.status(), 200);
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      return page;
    }
    const one = await login(first);
    const teacherEmail = `teacher-browser-${randomUUID()}@example.test`;
    const teacherUser = await admin.auth.admin.createUser({
      email: teacherEmail,
      password,
      email_confirm: true,
      user_metadata: { name: "Browser Teacher" },
    });
    assert.equal(teacherUser.error, null);
    fixtureUsers.push(teacherUser.data.user.id);
    const teacherContext = await browser.newContext();
    assert.equal(
      (
        await teacherContext.request.post(base + "/api/v1/auth/login", {
          headers: { Origin: base },
          data: { email: teacherEmail, password },
        })
      ).status(),
      200,
    );
    async function post(context, path, data) {
      const response = await context.request.post(base + "/api/v1" + path, {
        headers: { Origin: base },
        data,
      });
      assert.equal(response.status(), 200, await response.text());
      return (await response.json()).data;
    }
    const school = await post(teacherContext, "/schools", {
      name: "Browser School",
    });
    const room = await post(teacherContext, "/classes", {
      schoolId: school.id,
      name: "Browser Class",
    });
    const invitation = await post(teacherContext, "/invitations", {
      schoolId: school.id,
      classId: room.id,
      email,
      maxUses: 1,
    });
    await post(first, "/invitations/accept", { token: invitation.token });
    const teacherPage = await teacherContext.newPage();
    teacherPage.on("pageerror", (e) => errors.push(e.message));
    await teacherPage.goto(base + "/teacher/new");
    await teacherPage
      .getByLabel("Judul tugas", { exact: true })
      .fill("Browser Assignment");
    await teacherPage.getByLabel(/Kelas atau kelompok/).selectOption(room.id);
    await teacherPage
      .getByLabel("Pertanyaan", { exact: true })
      .fill("Mengapa indikator berubah warna pada larutan asam?");
    await teacherPage
      .getByRole("textbox", {
        name: "Penjelasan setelah menjawab",
        exact: true,
      })
      .fill("Indikator merespons ion hidrogen dalam larutan asam.");
    await teacherPage.getByLabel("Terbitkan untuk kelas yang dipilih").check();
    await teacherPage
      .getByRole("button", { name: "Simpan tugas", exact: true })
      .click();
    await teacherPage.waitForURL("**/teacher/results/*");
    const assignmentId = new URL(teacherPage.url()).pathname.split("/").pop();
    await one.goto(
      base + `/challenges/run/acid-base?assignment=${assignmentId}`,
    );
    await one
      .getByRole("button", { name: "Letakkan gelas beker", exact: true })
      .click();
    await one
      .getByRole("button", { name: "Tuangkan larutan a", exact: true })
      .waitFor();
    const two = await login(second);
    await two.goto(
      base + `/challenges/run/acid-base?assignment=${assignmentId}`,
    );
    await two
      .getByRole("button", { name: "Tuangkan larutan a", exact: true })
      .click();
    await two
      .getByRole("button", { name: "Tambahkan indikator ph", exact: true })
      .click();
    await two
      .getByText("Mengapa indikator berubah warna pada larutan asam?", {
        exact: true,
      })
      .waitFor();
    await two
      .getByRole("button", {
        name: /Molekul indikator merespons konsentrasi ion hidrogen/,
      })
      .click();
    await two
      .getByText(/Indikator merespons ion hidrogen dalam larutan asam\./)
      .waitFor();
    await two.getByRole("button", { name: "Lihat hasil eksperimen" }).click();
    await two.waitForURL("**/results/acid-base");
    await two
      .getByRole("heading", { name: "Kamu sudah mencobanya!" })
      .waitFor();
    assert.ok((await two.locator("body").innerText()).includes("100%"));
    assert.equal(
      await two.evaluate(() => localStorage.getItem("labora-records")),
      null,
      "Official results must not use demo storage.",
    );
    await one.goto(base + "/progress");
    await one.getByRole("link", { name: /Identifikasi Asam dan Basa/ }).click();
    await one
      .getByRole("heading", { name: "Kamu sudah mencobanya!" })
      .waitFor();
    assert.deepEqual(errors, []);
    await teacherPage.reload();
    await teacherPage.getByRole("link", { name: /Browser Student/ }).waitFor();
    const csvDownload = teacherPage.waitForEvent("download");
    await teacherPage
      .getByRole("button", { name: "Ekspor seluruh hasil CSV" })
      .click();
    assert.ok(
      readFileSync(await (await csvDownload).path(), "utf8").includes(
        "Browser Student",
      ),
    );
    await one.goto(base + "/sandbox/chemistry");
    await one
      .getByRole("status")
      .filter({ hasText: "Tersimpan di akun" })
      .first()
      .waitFor();
    await one.getByText(/Buku Catatan Lab/).click();
    await one
      .getByLabel("Hipotesis", { exact: true })
      .fill("Browser hypothesis");
    await one
      .getByLabel("Pengamatan", { exact: true })
      .fill("Browser observation");
    await one
      .getByLabel("Kesimpulan", { exact: true })
      .fill("Browser conclusion");
    const noteSave = one.waitForResponse(
      (response) =>
        response.url().endsWith("/notes") &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );
    await one
      .getByRole("button", { name: "Simpan catatan + snapshot alat ukur" })
      .click();
    await noteSave;
    await two.goto(base + "/sandbox/chemistry");
    await two
      .getByRole("status")
      .filter({ hasText: "Tersimpan di akun" })
      .first()
      .waitFor();
    await two.getByText(/Buku Catatan Lab/).click();
    await two
      .getByRole("button", { name: "Ekspor teks", exact: true })
      .waitFor({ state: "visible" });
    const noteDownload = two.waitForEvent("download");
    await two.getByRole("button", { name: "Ekspor teks", exact: true }).click();
    assert.ok(
      readFileSync(await (await noteDownload).path(), "utf8").includes(
        "Browser observation",
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      "Account browser passed: HTTP-only login, two independent contexts, published teacher questions/explanations, guided resume, server scores/history, CSV export, cross-device notebook export, and no demo writes.",
    );
  } finally {
    await browser.close();
    for (const userId of fixtureUsers) {
      // Assessed history retains profile references; soft-delete local fixtures.
      const { error: cleanupError } = await admin.auth.admin.deleteUser(
        userId,
        true,
      );
      assert.equal(cleanupError, null, "Local fixture cleanup must succeed.");
    }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
