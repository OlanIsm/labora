require("tsx/cjs");
const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const { experiments } = require("../../shared/experiment-engine/catalog.ts");
const {
  act,
  initialRuntime,
} = require("../../shared/experiment-engine/engine.ts");
const base = process.env.LABORA_BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  try {
    for (const [id, scenario] of [
      ["acid-base", "success"],
      ["microscope", "success"],
      ["acid-base", "failure"],
      ["microscope", "rejected"],
      ["acid-base", "conflict"],
    ]) {
      const exp = experiments.find((experiment) => experiment.id === id);
      const startingState =
        id === "microscope"
          ? {
              ...initialRuntime(),
              step: 3,
              placed: ["slide", "sample", "water"],
              done: [0, 1, 2],
            }
          : initialRuntime();
      let session = {
        id: "7aae78a2-1cdb-4c3b-b84e-aa1c4ae754ee",
        revision: 0,
        mode: "guided",
        status: "active",
        experimentId: id,
        definition: exp,
        state: startingState,
        lastSavedAt: new Date().toISOString(),
      };
      const events = [];
      const errors = [];
      let responses = 0;
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/api/v1/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        const fulfill = (data) =>
          route.fulfill({ json: { data, requestId: "latency-test" } });
        if (path.endsWith("/actions")) {
          const body = route.request().postDataJSON();
          events.push(body);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          responses++;
          if (scenario === "failure" && events.length === 1)
            return route.fulfill({
              status: 503,
              json: {
                error: {
                  code: "UNAVAILABLE",
                  message: "Koneksi percobaan terputus.",
                },
                requestId: "latency-test",
              },
            });
          assert.equal(body.revision, session.revision);
          session = {
            ...session,
            revision: session.revision + 1,
            state:
              scenario === "rejected"
                ? {
                    ...session.state,
                    feedback: "Tindakan ditolak oleh server.",
                  }
                : act(exp, session.state, body.action, body.item),
          };
          if (scenario === "conflict")
            return route.fulfill({
              status: 409,
              json: {
                error: {
                  code: "REVISION_CONFLICT",
                  message: "Sesi sudah diperbarui.",
                },
                requestId: "latency-test",
              },
            });
          return fulfill({
            session,
            accepted: scenario !== "rejected",
            feedback: session.state.feedback,
          });
        }
        if (path.endsWith("/me"))
          return fulfill({
            id: "c479bc35-2b33-4a81-b90f-d6a92fef280e",
            mode: "account",
            role: "student",
            name: "Latency Student",
            email: "latency@example.test",
          });
        if (path.endsWith("/auth/config")) return fulfill({ configured: true });
        if (path.endsWith("/sessions")) return fulfill([session]);
        if (path.endsWith(`/sessions/${session.id}`)) return fulfill(session);
        if (path.endsWith("/experiments")) return fulfill(experiments);
        if (path.includes("/experiments/"))
          return fulfill({
            definition: experiments.find((experiment) =>
              path.endsWith(`/${experiment.id}`),
            ),
          });
        return fulfill([]);
      });
      await page.goto(`${base}/challenges/run/${id}`);
      const item = exp.items.find(
        (item) => item.id === exp.steps[startingState.step].item,
      );
      const actionButton = page.getByRole("button", {
        name: `Letakkan ${item.name.toLowerCase()}`,
        exact: true,
      });
      await actionButton.waitFor();
      await page.waitForFunction(
        () => !document.querySelector(".step-actions .primary")?.disabled,
      );
      const source = await page.locator(".inventory-item.needed").boundingBox();
      const target = await page.locator(".workspace-scene").boundingBox();
      await page.mouse.move(
        source.x + source.width / 2,
        source.y + source.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        source.x + source.width / 2 - 12,
        source.y + source.height / 2,
        { steps: 3 },
      );
      await page.mouse.move(
        target.x + target.width / 2,
        target.y + target.height / 2,
        { steps: 20 },
      );
      const droppedAt = performance.now();
      await page.mouse.up();
      const placed =
        id === "acid-base"
          ? page.locator(".vessel-target.visible")
          : page.getByText("Fokuskan mikroskop untuk mengamati", {
              exact: true,
            });
      await placed.waitFor({ timeout: 800 });
      const elapsed = Math.round(performance.now() - droppedAt);
      assert.ok(
        elapsed < 800,
        `Placement must appear before the 3-second response (${elapsed}ms)`,
      );
      assert.equal(responses, 0);
      assert.ok(
        await page.locator(".step-actions .primary").isDisabled(),
        "Prevent out-of-order actions until acknowledged",
      );
      await page.waitForFunction(
        () => !document.querySelector(".step-actions .primary")?.disabled,
      );
      if (scenario === "failure" || scenario === "rejected") {
        assert.equal(
          await placed.count(),
          0,
          "Unconfirmed placement rolls back",
        );
        await actionButton.waitFor();
      }
      if (scenario === "failure") {
        await actionButton.click();
        await placed.waitFor({ timeout: 800 });
        await page.waitForFunction(
          () => !document.querySelector(".step-actions .primary")?.disabled,
        );
        assert.equal(
          events[0].eventId,
          events[1].eventId,
          "Retry reuses idempotency key",
        );
      }
      if (scenario === "conflict")
        await page
          .getByText(
            "Sesi diperbarui dari perangkat lain. Lanjutkan dari langkah terbaru.",
            { exact: true },
          )
          .waitFor();
      assert.equal(
        session.state.step,
        startingState.step + (scenario === "rejected" ? 0 : 1),
      );
      const pending = await page.evaluate(() =>
        Object.keys(localStorage).filter((key) =>
          key.startsWith("labora-pending-v1:"),
        ),
      );
      assert.deepEqual(pending, []);
      assert.deepEqual(errors, []);
      console.log(
        `${id} ${scenario}: placement ${elapsed}ms, 3000ms API delay; reconciliation passed`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
