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
    // Local UI coverage does not require a configured school database.
    await page.route("**/api/v1/practice/answers", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          requestId: "ui-test",
          data: {
            correct: true,
            explanation:
              "Molekul indikator merespons konsentrasi ion hidrogen.",
          },
        }),
      }),
    );
    await page.goto(baseUrl, { timeout: 60000 });
    await page.locator(".lab-choice").first().waitFor();
    assert.deepEqual(
      await page
        .locator(".lab-choice")
        .evaluateAll((cards) => cards.map((card) => card.getAttribute("href"))),
      ["/login", "/login", "/login"],
    );
    assert.equal(
      await page
        .getByRole("link", { name: "Coba Labora", exact: true })
        .getAttribute("href"),
      "/login",
    );
    for (const subject of ["Kimia", "Fisika", "Biologi"]) {
      await page
        .locator(".lab-choice")
        .filter({
          has: page.getByRole("heading", { name: subject, exact: true }),
        })
        .click();
      await page.waitForURL("**/login");
      await page.goto(baseUrl);
    }
    await page
      .getByRole("link", { name: /Mulai eksperimen/i })
      .first()
      .click();
    await page.waitForURL("**/login");
    await page.getByRole("button", { name: "Coba sebagai siswa" }).waitFor();
    assert.equal(
      await page
        .getByRole("link", { name: "Daftar di sini", exact: true })
        .getAttribute("href"),
      "/register",
    );
    await page.goto(baseUrl);
    await page
      .getByRole("link", { name: "Pilih eksperimenmu", exact: true })
      .click();
    await page.waitForURL("**/login");
    await page.getByRole("button", { name: "Coba sebagai siswa" }).click();
    await page.waitForURL("**/dashboard");
    await page.locator('.app-sidebar a[href="/assignments"]').waitFor();
    assert.equal(
      await page.locator('.bottom-nav a[href="/assignments"]').count(),
      1,
    );
    await page.goto(`${baseUrl}/challenges`);
    await page.locator(".challenge-subject h2").first().waitFor();
    assert.deepEqual(
      await page.locator(".challenge-subject h2").allTextContents(),
      ["Kimia", "Fisika", "Biologi"],
    );
    for (const [index, subject] of [
      "chemistry",
      "physics",
      "biology",
    ].entries()) {
      const cards = page
        .locator(".challenge-subject")
        .nth(index)
        .locator(".experiment-card");
      assert.ok(await cards.count());
      assert.ok(
        await cards.evaluateAll(
          (nodes, subject) =>
            nodes.every((node) => node.classList.contains(subject)),
          subject,
        ),
      );
    }
    await page
      .locator('.experiment-card[href^="/experiments/acid-base"]')
      .click();
    await page.waitForURL("**/experiments/acid-base?from=challenges");
    await page.reload();
    const challengeBack = page.getByRole("link", {
      name: "Kembali ke tantangan",
    });
    await challengeBack.waitFor();
    assert.equal(await challengeBack.getAttribute("href"), "/challenges");
    await challengeBack.click();
    await page.waitForURL("**/challenges");
    await page.goto(`${baseUrl}/experiments/acid-base`);
    assert.equal(
      await page
        .getByRole("link", { name: "Kembali ke lab", exact: true })
        .getAttribute("href"),
      "/laboratories/chemistry",
    );
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
    await page
      .getByRole("button", { name: "Lihat hasil eksperimen" })
      .waitFor({ timeout: 10000 })
      .catch(async () => {
        throw new Error(await page.locator(".feedback-line").innerText());
      });
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

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of [
        "/dashboard",
        "/challenges",
        "/challenges/run/acid-base",
      ]) {
        await page.goto(`${baseUrl}${route}`);
        await page.locator(".loading-page").waitFor({ state: "hidden" });
        if (route.includes("/run/")) {
          await page
            .getByRole("button", { name: "Letakkan gelas beker", exact: true })
            .waitFor();
        } else {
          await page
            .getByRole("heading", {
              name: route === "/dashboard" ? /Mau coba apa hari/ : "Tantangan",
              exact: true,
            })
            .waitFor();
        }
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} fits at ${width}px`,
        );
        if (process.env.LABORA_SCREENSHOTS) {
          await page.screenshot({
            path: `${process.env.LABORA_SCREENSHOTS}/${width}-${route.replaceAll("/", "-")}.png`,
            fullPage: true,
          });
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.goto(`${baseUrl}/login`);
    await page.getByRole("button", { name: "Coba sebagai guru" }).click();
    await page.waitForURL("**/dashboard");
    await page.getByRole("heading", { name: /Mau coba apa hari/ }).waitFor();
    assert.equal(
      await page
        .locator(
          '.app-sidebar a[href="/assignments"], .bottom-nav a[href="/assignments"]',
        )
        .count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("link", { name: "Semua tugas", exact: true })
        .getAttribute("href"),
      "/teacher",
    );
    await page.goto(`${baseUrl}/assignments`);
    await page.waitForURL("**/teacher");
    await page
      .getByRole("heading", {
        name: "Siapkan eksperimen untuk kelasmu.",
        exact: true,
      })
      .waitFor();
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
    assert.equal(assignment.stages.length, 3);
    assert.ok(assignment.stages.every((stage) => stage.kind === "action"));
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
