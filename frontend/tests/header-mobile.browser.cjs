const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const baseUrl = process.env.LABORA_BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      hasTouch: true,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      if (sessionStorage.getItem("header-test-seeded")) return;
      localStorage.setItem(
        "labora-user",
        JSON.stringify({
          name: "Siswa Demo",
          email: "demo-student@labora.local",
          role: "student",
          className: "Kelas Demo",
        }),
      );
      localStorage.setItem(
        "labora-assignments",
        JSON.stringify([
          {
            id: "header-task",
            title: "Warna indikator",
            experimentId: "acid-base",
            className: "Kelas Demo",
            instructions: "Amati warna larutan.",
            stages: [],
            createdAt: "2026-10-03T09:00:00Z",
          },
          {
            id: "other-task",
            title: "Tugas kelas lain",
            experimentId: "acid-base",
            className: "Kelas Lain",
            instructions: "",
            stages: [],
            createdAt: "2026-10-03T09:00:00Z",
          },
        ]),
      );
      localStorage.setItem(
        "labora-records",
        JSON.stringify([
          {
            experimentId: "acid-base",
            completedAt: "2026-10-03T08:00:00Z",
            score: 100,
            userName: "Siswa Demo",
            className: "Kelas Demo",
            runtime: { step: 4, answers: [], objects: [], completed: true },
          },
          {
            experimentId: "ohms-law",
            completedAt: "2026-10-03T08:00:00Z",
            score: 80,
            userName: "Siswa Lain",
            className: "Kelas Lain",
            runtime: {},
          },
        ]),
      );
      sessionStorage.setItem("header-test-seeded", "true");
    });
    await page.goto(`${baseUrl}/dashboard`, { timeout: 60000 });
    await page.getByRole("heading", { name: /Mau coba apa hari/ }).waitFor();
    const layout = await page.locator("main").boundingBox();
    await page.getByRole("button", { name: "Bantuan", exact: true }).click();
    const help = page.getByRole("dialog", { name: "Butuh bantuan?" });
    await help.waitFor();
    assert.deepEqual(
      await page.locator("main").boundingBox(),
      layout,
      "Help overlays without moving the page",
    );
    await help
      .locator("summary")
      .filter({ hasText: "Mulai eksperimen pertamamu" })
      .click();
    await help.getByRole("link", { name: "Pilih laboratorium" }).waitFor();
    await help
      .getByRole("searchbox", { name: "Cari tutorial" })
      .fill("mikroskop");
    assert.equal(await help.locator("summary").count(), 1);
    await help
      .getByRole("searchbox", { name: "Cari tutorial" })
      .fill("tidak-ada-tutorial");
    await help
      .getByRole("heading", { name: "Tutorial belum ditemukan" })
      .waitFor();
    await page.keyboard.press("Escape");
    await help.waitFor({ state: "detached" });
    assert.equal(
      await page
        .getByRole("button", { name: "Bantuan", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page
      .getByRole("button", { name: "Notifikasi, 2 belum dibaca" })
      .click();
    const notifications = page.getByRole("dialog", {
      name: "Notifikasi",
      exact: true,
    });
    await notifications.waitFor();
    assert.deepEqual(
      await page.locator("main").boundingBox(),
      layout,
      "Notifications overlay without moving the page",
    );
    assert.equal(
      await notifications.locator(".header-notification").count(),
      2,
    );
    assert.equal(await notifications.getByText("Tugas kelas lain").count(), 0);
    await notifications
      .getByRole("button", { name: "Tandai semua dibaca" })
      .click();
    assert.equal(
      await notifications.getByRole("img", { name: "Belum dibaca" }).count(),
      0,
    );
    await notifications
      .getByRole("button", { name: "Tutup notifikasi" })
      .click();
    await page.reload();
    await page.getByRole("heading", { name: /Mau coba apa hari/ }).waitFor();
    await page.getByRole("button", { name: "Notifikasi", exact: true }).click();
    await notifications
      .getByRole("button", { name: "Semua sudah dibaca" })
      .waitFor();
    await notifications.getByRole("link", { name: /Warna indikator/ }).click();
    await page.waitForURL("**/experiments/acid-base?assignment=header-task");
    await page.getByRole("button", { name: "Menu akun Siswa Demo" }).click();
    await page
      .locator(".header-account-menu")
      .getByRole("link", { name: "Settings", exact: true })
      .click();
    await page.waitForURL("**/settings");
    await page.goto(`${baseUrl}/sandbox/chemistry`);
    await page
      .getByRole("button", { name: "Ambil Gelas kimia", exact: true })
      .waitFor();
    const desktopRack = await page.locator(".sandbox-right").boundingBox();
    const desktopBench = await page.locator(".sandbox-bench").boundingBox();
    assert.ok(
      desktopRack.x > desktopBench.x + desktopBench.width - 1,
      "Desktop rack remains beside bench",
    );
    assert.equal(
      await page
        .locator(".sandbox-rack-list")
        .first()
        .evaluate((el) => getComputedStyle(el).display),
      "grid",
    );
    await page.screenshot({ path: "../.impeccable/review/header-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".sandbox-rack").scrollIntoViewIfNeeded();
    const bench = await page.locator(".sandbox-bench").boundingBox();
    const rack = await page.locator(".sandbox-right").boundingBox();
    const observations = await page
      .locator(".sandbox-observations")
      .boundingBox();
    assert.ok(
      rack.y >= bench.y + bench.height,
      "Mobile inventory is below the bench",
    );
    assert.ok(
      rack.y < observations.y,
      "Mobile inventory precedes observations",
    );
    assert.equal(
      await page.locator(".sandbox-panel-disclosure").isVisible(),
      false,
    );
    const scroller = page.locator(".sandbox-rack-groups");
    assert.ok(
      await scroller.evaluate((el) => el.scrollWidth > el.clientWidth),
      "Inventory scrolls horizontally",
    );
    const rackBounds = await scroller.boundingBox();
    const touch = await page.context().newCDPSession(page);
    const touchY = rackBounds.y + 60;
    const touchX = rackBounds.x + rackBounds.width - 30;
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: touchX, y: touchY }],
    });
    for (let offset = 25; offset <= 175; offset += 25) {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: touchX - offset, y: touchY }],
      });
      await page.waitForTimeout(16);
    }
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touch.detach();
    assert.ok(await scroller.evaluate((el) => el.scrollLeft > 0));
    await page
      .locator('[aria-label="Pilihan rak"]')
      .getByRole("button", { name: /Bahan/ })
      .click();
    assert.equal(await scroller.evaluate((el) => el.scrollLeft), 0);
    await page
      .getByRole("button", { name: /^Ambil Air/ })
      .first()
      .waitFor();
    await page
      .locator('[aria-label="Pilihan rak"]')
      .getByRole("button", { name: /Alat/ })
      .click();
    await page
      .getByRole("button", { name: "Ambil Gelas kimia", exact: true })
      .click();
    assert.ok((await page.locator(".chemistry-bench-item").count()) > 0);
    assert.equal(
      await page.locator(".sandbox-rack").isVisible(),
      true,
      "Rack remains visible after placing an object",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Mobile page has no horizontal overflow",
    );
    await page.locator(".sandbox-bench").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "../.impeccable/review/mobile-inventory.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Bantuan", exact: true }).click();
    await help.waitFor();
    await help.evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
    const panel = await help.boundingBox();
    assert.ok(
      panel.x >= 0 && panel.x + panel.width <= 390,
      "Mobile panel fits viewport",
    );
    await page.screenshot({ path: "../.impeccable/review/help-mobile.png" });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Menu akun Siswa Demo" }).click();
    await page
      .locator(".header-account-menu")
      .getByRole("button", { name: "Keluar akun" })
      .click();
    await page.waitForURL(baseUrl + "/");
    assert.equal(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("labora-user")),
      ),
      null,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Header panels, notification persistence, account actions, desktop layout, and mobile inventory passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
