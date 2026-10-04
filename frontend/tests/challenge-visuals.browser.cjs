const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const base = process.env.LABORA_BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() =>
      localStorage.setItem(
        "labora-user",
        JSON.stringify({
          name: "Siswa Demo",
          email: "demo-student@labora.local",
          role: "student",
          mode: "demo",
          className: "Kelas Demo",
        }),
      ),
    );
    const actions = {
      microscope: [
        "Letakkan kaca objek",
        "Tambahkan sampel tumbuhan",
        "Tambahkan tetes air",
        "Letakkan mikroskop",
        "Amati dengan mikroskop",
      ],
      "blood-cells": [
        "Letakkan preparat apusan darah",
        "Letakkan mikroskop",
        "Amati dengan mikroskop",
      ],
      transpiration: [
        "Letakkan tumbuhan",
        "Tambahkan air",
        "Letakkan kantong bening",
      ],
      projectile: ["Letakkan pelontar", "Letakkan bola", "Luncurkan pelontar"],
    };
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [id, labels] of Object.entries(actions)) {
        await page.goto(`${base}/challenges/run/${id}`);
        await page
          .getByRole("button", { name: labels[0], exact: true })
          .waitFor();
        if (id === "microscope" || id === "blood-cells") {
          const field = await page
            .locator(".workspace .microscope-field")
            .boundingBox();
          assert.ok(
            Math.abs(field.width - field.height) < 1,
            `${id}: empty field stays circular at ${width}px`,
          );
          assert.equal(
            await page.locator(".workspace .cell-pattern").isVisible(),
            false,
          );
        }
        if (id === "projectile") {
          assert.equal(
            await page.locator(".workspace .projectile-ball").count(),
            0,
          );
          assert.equal(
            await page.locator(".workspace .projectile-trajectory").count(),
            0,
          );
        }
        for (const label of labels) {
          if (
            id === "projectile" &&
            width === 1440 &&
            label === "Luncurkan pelontar"
          ) {
            const source = await page
              .locator(".inventory")
              .getByRole("button", { name: /^Pelontar,/ })
              .boundingBox();
            const target = await page.locator(".workspace").boundingBox();
            await page.mouse.move(
              source.x + source.width / 2,
              source.y + source.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(
              target.x + target.width / 2,
              target.y + target.height / 2,
              { steps: 15 },
            );
            await page.mouse.up();
            await page
              .locator(".workspace animateMotion")
              .waitFor({ state: "attached" });
          } else {
            await page
              .getByRole("button", { name: label, exact: true })
              .click();
          }
        }
        if (id === "microscope" || id === "blood-cells") {
          await page.locator(".workspace .microscope-field.focused").waitFor();
          const field = await page
            .locator(".workspace .microscope-field")
            .boundingBox();
          assert.ok(
            Math.abs(field.width - field.height) < 1,
            `${id}: focused field stays circular`,
          );
          const pattern = await page
            .locator(".workspace .cell-pattern")
            .getAttribute("style");
          await page
            .locator(".lab-controls button")
            .getByText("400×", { exact: true })
            .click();
          assert.notEqual(
            await page
              .locator(".workspace .cell-pattern")
              .getAttribute("style"),
            pattern,
          );
        }
        if (id === "transpiration") {
          assert.match(
            await page.locator(".workspace .science-readout").innerText(),
            /Tetes air di dalam kantong/,
          );
          const visual = await page
            .locator(".workspace .plant-visual")
            .boundingBox();
          const readout = await page
            .locator(".workspace .science-readout")
            .boundingBox();
          assert.ok(
            readout.y + readout.height <= visual.y + visual.height,
            "Transpiration readout is not clipped",
          );
        }
        if (id === "projectile") {
          const ball = page.locator(".workspace .projectile-ball");
          await ball.evaluate((node) => node.ownerSVGElement.setCurrentTime(0));
          const start = await ball.boundingBox();
          await page.waitForTimeout(400);
          const middle = await ball.boundingBox();
          assert.ok(
            middle.x > start.x && middle.y < start.y,
            `Ball moves forwards and upwards along the parabola: ${JSON.stringify({ start, middle })}`,
          );
          const path = await page
            .locator(".projectile-trajectory")
            .getAttribute("d");
          await page.getByLabel("Sudut peluncuran").press("Home");
          assert.notEqual(
            await page.locator(".projectile-trajectory").getAttribute("d"),
            path,
          );
          await page
            .getByRole("button", { name: "Luncurkan lagi", exact: true })
            .click();
          assert.match(
            await page.locator(".lab-progress").innerText(),
            /Langkah 4 dari 4/,
          );
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.waitForFunction(
            () => !document.querySelector(".workspace animateMotion"),
          );
          assert.ok(
            Number(await ball.getAttribute("cx")) > 40,
            "Reduced motion retains the landing position",
          );
          await page.emulateMedia({ reducedMotion: "no-preference" });
        }
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${id}: no overflow at ${width}px`,
        );
        if (process.env.LABORA_SCREENSHOTS) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({
            path: `${process.env.LABORA_SCREENSHOTS}/${width}-guided-${id}.png`,
            fullPage: true,
          });
        }
        await page
          .getByRole("link", { name: "Tentang eksperimen", exact: true })
          .click();
        await page.waitForURL(`**/experiments/${id}?from=challenges`);
        await page
          .getByRole("link", { name: "Kembali ke tantangan", exact: true })
          .click();
        await page.waitForURL("**/challenges");
        await page.evaluate(
          (id) => localStorage.removeItem(`labora-runtime-${id}`),
          id,
        );
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "Challenge visuals passed: round fields before/after focus, cell zoom, transpiration stages, moving projectile, angle/replay/reduced motion, two-stage back navigation, desktop/mobile overflow, and no page errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
