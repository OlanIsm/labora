const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const base = process.env.LABORA_BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      const recoveries = [];
      let signupCalls = 0;
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("crash", () => errors.push("Browser page crashed"));
      await page.route("**/api/v1/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/auth/register")) signupCalls++;
        if (path.endsWith("/auth/recover")) {
          recoveries.push(route.request().postDataJSON());
          return route.fulfill({
            json: {
              data: { message: "Tautan pemulihan dikirim." },
              requestId: "recovery-test",
            },
          });
        }
        if (path.endsWith("/me"))
          return route.fulfill({
            status: 401,
            json: {
              error: { code: "UNAUTHENTICATED", message: "Masuk." },
              requestId: "auth-test",
            },
          });
        return route.fulfill({
          json: { data: { configured: true }, requestId: "auth-test" },
        });
      });
      await page.goto(`${base}/register`, { timeout: 60000 });
      const email = page.getByLabel("Email", { exact: true });
      await email.waitFor();
      for (const value of [
        "student@example.com",
        "Student.Name+lab@gmail.com",
        "test@school.example",
      ]) {
        await email.fill("");
        await email.pressSequentially(value, { delay: 15 });
        assert.equal(await email.inputValue(), value);
        assert.equal(page.isClosed(), false);
        assert.equal(page.url(), `${base}/register`);
      }
      assert.equal(signupCalls, 0, "Typing never submits registration");
      await page
        .locator(".auth-switch")
        .getByRole("link", { name: "Masuk", exact: true })
        .click();
      await page.getByRole("heading", { name: "Masuk ke Labora" }).waitFor();
      const forgot = page.getByRole("link", {
        name: "Lupa password",
        exact: true,
      });
      assert.equal(await forgot.getAttribute("href"), "/forgot-password");
      assert.equal(
        await page
          .getByRole("button", { name: /Kirim tautan pemulihan/ })
          .count(),
        0,
      );
      assert.equal(
        await page.locator(".auth-switch-divider").isVisible(),
        true,
      );
      await page.screenshot({
        path: join(process.env.TEMP || ".", `labora-login-${width}.png`),
        fullPage: true,
      });
      await forgot.click();
      await page.getByRole("heading", { name: "Lupa password?" }).waitFor();
      assert.equal(
        await page.getByLabel("Kata sandi", { exact: true }).count(),
        0,
      );
      await page
        .getByLabel("Email", { exact: true })
        .fill("student@example.com");
      await page
        .getByRole("button", { name: "Kirim tautan pemulihan", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Tautan pemulihan dikirim." })
        .waitFor();
      assert.deepEqual(recoveries, [{ email: "student@example.com" }]);
      await page.getByRole("link", { name: "Kembali ke login" }).click();
      await page.getByRole("heading", { name: "Masuk ke Labora" }).waitFor();
      assert.deepEqual(errors, []);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.close();
    }
    console.log(
      "Auth form passed on desktop/mobile: email typing stays on signup, recovery link/divider, and email-only recovery submission.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
