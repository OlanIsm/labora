const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const baseUrl = process.env.LABORA_BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(baseUrl, { timeout: 60000 });
    await page
      .getByRole("link", { name: /Mulai eksperimen/i })
      .first()
      .click();
    await page.waitForURL("**/dashboard");
    await page.goto(`${baseUrl}/login`);
    await page.getByRole("button", { name: "Coba sebagai siswa" }).click();
    await page.waitForURL("**/dashboard");
    await page.goto(`${baseUrl}/challenges/run/acid-base`);
    await page
      .getByRole("button", { name: "Letakkan gelas beker", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Tuangkan larutan a", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Tambahkan indikator ph", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: /Molekul indikator merespons konsentrasi ion hidrogen/,
      })
      .click();
    await page.getByRole("button", { name: "Lihat hasil eksperimen" }).click();
    await page.waitForURL("**/results/acid-base");
    await page
      .getByRole("heading", { name: "Kamu sudah mencobanya!" })
      .waitFor();
    const record = await page.evaluate(
      () => JSON.parse(localStorage.getItem("labora-records"))[0],
    );
    assert.equal(record.experimentId, "acid-base");
    assert.equal(record.score, 100);
    assert.equal(record.runtime.step, 4);
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("labora-runtime-acid-base"),
      ),
      null,
    );
    await page.reload();
    await page
      .getByRole("heading", { name: "Kamu sudah mencobanya!" })
      .waitFor();

    await page.goto(`${baseUrl}/sandbox/chemistry`);
    await page
      .getByRole("heading", { name: "Lab Kimia", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Ambil Gelas kimia", exact: true })
      .click();
    await page.locator(".sandbox-object").first().waitFor();
    await page.goto(`${baseUrl}/sandbox/biology`);
    await page
      .getByRole("heading", { name: "Lab Biologi", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: /^Amati / })
      .first()
      .click();
    await page
      .getByRole("button", {
        name: "Objektif 40 kali, perbesaran total 400 kali",
      })
      .click();
    await page.goto(`${baseUrl}/fisika/meriam-target`);
    await page.getByRole("button", { name: "Tembak!", exact: true }).click();
    assert.ok(await page.locator("canvas").count());

    await page.goto(`${baseUrl}/login`);
    await page.getByRole("button", { name: "Coba sebagai guru" }).click();
    await page.waitForURL("**/dashboard");
    await page.goto(`${baseUrl}/teacher/new`);
    await page
      .getByLabel("Kelas atau kelompok", { exact: true })
      .fill("VIII A");
    await page
      .getByLabel("Judul tugas", { exact: true })
      .fill("Penyelidikan indikator");
    await page
      .getByRole("button", { name: "Simpan tugas", exact: true })
      .click();
    await page.waitForURL("**/teacher/results/*");
    const assignment = await page.evaluate(
      () => JSON.parse(localStorage.getItem("labora-assignments"))[0],
    );
    assert.equal(assignment.title, "Penyelidikan indikator");
    assert.equal(assignment.className, "VIII A");
    assert.equal(assignment.stages.length, 4);
    assert.deepEqual(errors, []);
    console.log(
      "Application flow passed: landing entry, student/teacher login, complete guided experiment, persisted result, free chemistry/biology, physics launch, and assignment publication.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
