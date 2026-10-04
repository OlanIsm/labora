// Run against a running app: LABORA_BASE_URL=http://localhost:3000 node tests/app-shell.browser.cjs
const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("shell-test-seeded")) {
        localStorage.setItem(
          "labora-user",
          JSON.stringify({
            name: "Siswa Demo",
            email: "demo-student@labora.local",
            role: "student",
            className: "Kelas Demo",
          }),
        );
        sessionStorage.setItem("shell-test-seeded", "true");
      }
    });
    await page.goto(
      `${process.env.LABORA_BASE_URL || "http://localhost:3000"}/dashboard`,
      { timeout: 60000 },
    );
    await page.getByRole("heading", { name: /Mau coba apa hari/ }).waitFor();
    const collapsed = () =>
      page
        .locator(".app-shell")
        .evaluate((el) => el.classList.contains("sidebar-collapsed"));
    const frame = await page.locator(".app-frame").boundingBox();
    const settleSidebar = () =>
      page
        .locator(".app-sidebar")
        .evaluate((el) =>
          Promise.all(
            el.getAnimations().map((animation) => animation.finished),
          ),
        );
    assert.equal(await collapsed(), true);
    await page.locator(".app-sidebar").hover();
    await settleSidebar();
    assert.equal(await collapsed(), false);
    assert.deepEqual(
      await page.locator(".app-frame").boundingBox(),
      frame,
      "Expanding overlays the page without moving or resizing it",
    );
    await page.locator(".page-heading").hover();
    await settleSidebar();
    assert.equal(await collapsed(), true);
    assert.deepEqual(
      await page.locator(".app-frame").boundingBox(),
      frame,
      "Collapsing preserves the page layout",
    );
    assert.equal(
      await page.locator('link[rel="icon"]').getAttribute("href"),
      "/logo/logo.png",
    );
    assert.equal(
      await page
        .locator(".sidebar-brand img")
        .getAttribute("src")
        .then((src) => src.includes("logo%2Flogo.png")),
      true,
    );
    for (const mascot of [
      "lion_chemistry",
      "physics_elephant",
      "biology_cat",
    ]) {
      const image = page.locator(`.lab-choice-mascot[src*="${mascot}"]`);
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((el) => el.decode());
      assert.equal(await image.evaluate((el) => el.naturalWidth > 0), true);
    }
    await page.locator(".app-sidebar").hover();
    await page
      .locator("#app-navigation")
      .getByRole("link", { name: "Settings", exact: true })
      .click();
    await page.waitForURL("**/settings");
    await page.locator(".page-heading").hover();
    assert.equal(
      await collapsed(),
      false,
      "Clicking a menu pins the sidebar open",
    );
    await page.getByRole("heading", { name: "Settings", exact: true }).click();
    assert.equal(
      await collapsed(),
      true,
      "Clicking the app closes the sidebar",
    );
    assert.equal(
      await page
        .getByText("Mulai dari satu pertanyaan.", { exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page
        .locator(".app-sidebar")
        .getByRole("button", { name: /Keluar/ })
        .count(),
      0,
    );
    await page.getByLabel("Nama", { exact: true }).fill("Alex Demo");
    await page.getByRole("button", { name: "Simpan pengaturan" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Pengaturan akun tersimpan." })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("labora-user")).name,
      ),
      "Alex Demo",
    );
    await page
      .getByRole("button", { name: "Keluar akun", exact: true })
      .click();
    await page.waitForURL(
      `${process.env.LABORA_BASE_URL || "http://localhost:3000"}/`,
    );
    assert.equal(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("labora-user")),
      ),
      null,
    );
    console.log(
      "Passed: sidebar overlay without layout shifts, hover, pin, main click, logo, favicon, mascots, profile save, and Settings logout.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
