const { chromium } = require(process.env.LABORA_PLAYWRIGHT || "playwright");
const assert = require("node:assert/strict");
const base = process.env.LABORA_BASE_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const api = page.request;
    async function check(response, status, code) {
      assert.equal(response.status(), status);
      const body = await response.json();
      assert.equal(body.error.code, code);
      assert.match(body.requestId, /^[0-9a-f-]{36}$/);
      assert.equal(response.headers()["x-request-id"], body.requestId);
      assert.equal(response.headers()["cache-control"], "no-store");
      assert.equal(JSON.stringify(body).includes("stack"), false);
    }
    const configResponse = await api.get(`${base}/api/v1/auth/config`);
    assert.equal(configResponse.status(), 200);
    const config = (await configResponse.json()).data;
    assert.deepEqual(Object.keys(config), ["configured"]);
    const headers = { origin: base, "content-type": "application/json" };
    await check(
      await api.post(`${base}/api/v1/auth/login`, { headers, data: "{" }),
      400,
      "BAD_REQUEST",
    );
    await check(
      await api.post(`${base}/api/v1/auth/register`, {
        headers,
        data: {
          name: "Alex",
          email: "alex@example.com",
          password: "valid-password",
          role: "teacher",
        },
      }),
      422,
      "VALIDATION_ERROR",
    );
    await check(
      await api.post(`${base}/api/v1/auth/logout`, {
        headers: { origin: "https://another.example" },
      }),
      403,
      "FORBIDDEN",
    );
    await check(await api.post(`${base}/api/v1/auth/logout`), 403, "FORBIDDEN");
    await check(
      await api.get(`${base}/api/v1/auth/login`),
      405,
      "METHOD_NOT_ALLOWED",
    );
    await check(await api.get(`${base}/api/v1/unknown`), 404, "NOT_FOUND");
    await check(
      await api.post(`${base}/api/v1/auth/login`, {
        headers,
        data: " ".repeat(33_000),
      }),
      413,
      "PAYLOAD_TOO_LARGE",
    );
    if (!config.configured) {
      await check(
        await api.post(`${base}/api/v1/auth/login`, {
          headers,
          data: { email: "alex@example.com", password: "valid-password" },
        }),
        503,
        "NOT_CONFIGURED",
      );
      await check(await api.get(`${base}/api/v1/me`), 503, "NOT_CONFIGURED");
      await page.addInitScript(() =>
        localStorage.setItem(
          "labora-user",
          JSON.stringify({
            id: "c479bc35-2b33-4a81-b90f-d6a92fef280e",
            mode: "account",
            role: "teacher",
            name: "Forged teacher",
            email: "forged@example.com",
          }),
        ),
      );
      await page.goto(`${base}/teacher`);
      await page.waitForURL("**/login");
      assert.equal(
        await page.locator(".app-sidebar").count(),
        0,
        "Forged local account cannot restore app identity",
      );
    }
    console.log(
      "API browser passed: runtime aliases, envelopes, origin/body guards, method errors and forged local identity rejection. Live Supabase checks require configured credentials/schema.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
