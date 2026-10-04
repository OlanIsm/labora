const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base = process.env.LABORA_BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/login`);
    await page
      .getByRole("button", { name: "Coba sebagai guru", exact: true })
      .click();
    await page.waitForURL("**/dashboard");
    await page.goto(`${base}/teacher/new`);
    await page.locator(".builder-stage").first().waitFor();
    assert.equal(await page.locator(".builder-stage").count(), 3);
    assert.equal(await page.locator(".stage-question").count(), 0);
    await page
      .getByLabel("Kelas atau kelompok", { exact: true })
      .fill("Kelas Demo");
    for (const text of [
      "Catat warna larutan.",
      "Bandingkan hasil pengamatan.",
    ]) {
      await page
        .getByRole("button", { name: "Tambah langkah", exact: true })
        .click();
      await page
        .locator(".builder-stage")
        .last()
        .getByLabel("Instruksi", { exact: true })
        .fill(text);
    }
    await page
      .locator(".builder-stage")
      .last()
      .getByRole("button", { name: "Tambah kuis setelah ini" })
      .click();
    let quiz = page.locator(".builder-stage").last();
    await quiz
      .getByLabel("Pertanyaan", { exact: true })
      .fill("Apa sifat larutan?");
    await quiz.getByLabel("Pilihan 1", { exact: true }).fill("Basa");
    await quiz.getByLabel("Pilihan 2", { exact: true }).fill("Asam");
    await quiz.getByLabel("Jawaban benar").selectOption("1");
    await page
      .getByRole("button", { name: "Tambah kuis", exact: true })
      .click();
    quiz = page.locator(".builder-stage").last();
    await quiz
      .getByLabel("Pertanyaan", { exact: true })
      .fill("Apa warna setelah indikator?");
    await quiz
      .getByRole("button", { name: "Tambah pilihan", exact: true })
      .click();
    for (const [i, value] of ["Hijau", "Merah", "Biru"].entries())
      await quiz.getByLabel(`Pilihan ${i + 1}`, { exact: true }).fill(value);
    await quiz.getByLabel("Jawaban benar").selectOption("1");
    await quiz
      .getByRole("button", { name: "Hapus pilihan 1 pada kuis 7", exact: true })
      .click();
    assert.equal(await quiz.getByLabel("Jawaban benar").inputValue(), "0");
    assert.equal(await quiz.locator(".builder-option").count(), 2);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (process.env.LABORA_SCREENSHOTS)
        await page.screenshot({
          path: `${process.env.LABORA_SCREENSHOTS}/assignment-builder-${width}.png`,
          fullPage: true,
        });
    }
    await page
      .getByRole("button", { name: "Simpan tugas", exact: true })
      .click();
    await page.waitForURL("**/teacher/results/*");
    const assignment = await page.evaluate(
      () => JSON.parse(localStorage.getItem("labora-assignments"))[0],
    );
    assert.equal(assignment.stages.length, 7);
    assert.equal(assignment.stages.filter((s) => s.kind === "quiz").length, 2);
    await page.goto(`${base}/login`);
    await page
      .getByRole("button", { name: "Coba sebagai siswa", exact: true })
      .click();
    await page.waitForURL("**/dashboard");
    await page.goto(
      `${base}/challenges/run/acid-base?assignment=${assignment.id}`,
    );
    for (const name of [
      "Letakkan gelas beker",
      "Tuangkan larutan a",
      "Tambahkan indikator ph",
    ])
      await page.getByRole("button", { name, exact: true }).click();
    for (const instruction of [
      "Catat warna larutan.",
      "Bandingkan hasil pengamatan.",
    ]) {
      await page
        .getByRole("heading", { name: instruction, exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Lanjutkan", exact: true })
        .click();
    }
    await page.getByRole("button", { name: /Asam/ }).click();
    await page.getByRole("button", { name: /Biru/ }).click();
    await page
      .getByRole("button", { name: "Lihat hasil eksperimen", exact: true })
      .click();
    await page.waitForURL("**/results/acid-base");
    const record = await page.evaluate(
      () => JSON.parse(localStorage.getItem("labora-records"))[0],
    );
    assert.equal(record.score, 70);
    assert.equal(record.definition.steps.length, 7);
    assert.equal(record.runtime.step, 7);
    assert.deepEqual(errors, []);
    console.log(
      "Assignment builder passed: optional quizzes, 5 steps + 2 quizzes, flexible choices, desktop/mobile, persistence, and student completion.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
