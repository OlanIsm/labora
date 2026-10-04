const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const base = process.env.LABORA_BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const calls = new Map();
    const errors = [];
    const account = {
      id: "c479bc35-2b33-4a81-b90f-d6a92fef280e",
      mode: "account",
      role: "student",
      name: "Navigation Student",
      email: "navigation@example.test",
    };
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      calls.set(path, (calls.get(path) || 0) + 1);
      const data = path.endsWith("/auth/config")
        ? { configured: true }
        : path.endsWith("/me")
          ? account
          : path.endsWith("/progress/summary")
            ? { completed: 0, averageScore: 0, subjects: 0 }
            : [];
      await route.fulfill({ json: { data, requestId: "navigation-test" } });
    });
    await page.goto(`${base}/dashboard`);
    await page.getByRole("heading", { name: /Mau coba apa hari/ }).waitFor();
    await page.waitForFunction(() => !document.querySelector(".loading-page"));
    await page.evaluate(() => {
      window.navigationShell = document.querySelector(".app-shell");
      window.navigationLoading = false;
      new MutationObserver(() => {
        if (document.querySelector(".loading-page"))
          window.navigationLoading = true;
      }).observe(document.body, { childList: true, subtree: true });
    });

    for (const path of [
      "/settings",
      "/assignments",
      "/challenges",
      "/progress",
      "/dashboard",
    ]) {
      await page.locator(".app-sidebar").hover();
      await page
        .locator(".app-sidebar")
        .evaluate((sidebar) =>
          Promise.all(
            sidebar.getAnimations().map((animation) => animation.finished),
          ),
        );
      await page.locator(`.app-sidebar a[href="${path}"]`).first().click();
      await page.waitForURL(`${base}${path}`, { waitUntil: "commit" });
      assert.equal(await page.locator(".loading-page").count(), 0);
      assert.equal(
        await page.evaluate(
          () => window.navigationShell === document.querySelector(".app-shell"),
        ),
        true,
        "Navigation keeps the existing application mounted",
      );
    }
    for (const path of [
      "/auth/config",
      "/me",
      "/assignments",
      "/progress",
      "/experiments",
    ]) {
      assert.equal(
        calls.get(`/api/v1${path}`),
        1,
        `${path} loads once across navigation`,
      );
    }
    assert.equal(await page.evaluate(() => window.navigationLoading), false);
    assert.deepEqual(errors, []);
    console.log(
      "Navigation passed: persistent shell, one identity/data initialization, and no repeated full-page loader.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
