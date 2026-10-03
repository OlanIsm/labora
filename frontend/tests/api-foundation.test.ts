import assert from "node:assert/strict";
import { AppError, errorResponse } from "@backend/shared/errors";
import { apiHandler, readJson } from "@backend/shared/http";
import {
  credentials,
  profileUpdate,
} from "@backend/modules/identity/validation";
import { apiFetch, ApiError } from "../shared/infrastructure/api";
import { csvCell } from "../shared/infrastructure/download";

async function main() {
  assert.equal(csvCell('A,"B"'), '"A,""B"""');
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell(" \t+SUM(1,2)"), '"\' \t+SUM(1,2)"');
  const request = (body: string, headers: Record<string, string> = {}) =>
    new Request("http://localhost/api/v1/test", {
      method: "POST",
      body,
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
        ...headers,
      },
    });
  const handler = apiHandler(
    async (req) => credentials(await readJson(req), true),
    201,
  );
  const response = await handler(
    request(
      JSON.stringify({
        email: "SISWA@example.com",
        password: "safe-password",
        name: " Alex ",
      }),
    ),
  );
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.data.email, "siswa@example.com");
  assert.match(body.requestId, /^[0-9a-f-]{36}$/);
  assert.equal(response.headers.get("x-request-id"), body.requestId);
  assert.equal(response.headers.get("cache-control"), "no-store");
  for (const [req, status, code] of [
    [request("{"), 400, "BAD_REQUEST"],
    [request("[]"), 400, "BAD_REQUEST"],
    [request("{}"), 422, "VALIDATION_ERROR"],
    [request("{}", { origin: "https://another.example" }), 403, "FORBIDDEN"],
    [
      request("{}", { "content-type": "text/plain" }),
      415,
      "UNSUPPORTED_MEDIA_TYPE",
    ],
    [request(" ".repeat(33_000)), 413, "PAYLOAD_TOO_LARGE"],
  ] as const) {
    const result = await handler(req);
    assert.equal(result.status, status);
    assert.equal((await result.json()).error.code, code);
  }
  assert.throws(
    () =>
      credentials({
        email: "student@example.com",
        password: "safe-password",
        role: "teacher",
      }),
    (error: unknown) =>
      error instanceof AppError && error.code === "VALIDATION_ERROR",
  );
  assert.throws(
    () =>
      profileUpdate({
        name: "Alex",
        className: "Other school",
        role: "teacher",
      }),
    AppError,
  );
  const hidden = await errorResponse(
    new Error("secret database password and SQL"),
    "request-1",
  ).text();
  assert.equal(hidden.includes("password"), false);
  assert.equal(JSON.parse(hidden).error.code, "INTERNAL_ERROR");
  const limited = errorResponse(
    new AppError("RATE_LIMITED", undefined, 60),
    "request-2",
  );
  assert.equal(limited.headers.get("retry-after"), "60");

  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "/api/v1/me");
      assert.equal(options?.credentials, "same-origin");
      return Response.json({
        data: { name: "Alex" },
        requestId: "transport-1",
      });
    };
    assert.deepEqual(await apiFetch("/me"), { name: "Alex" });
    globalThis.fetch = async () =>
      errorResponse(
        new AppError("VALIDATION_ERROR", { name: ["Isi nama."] }),
        "transport-2",
      );
    await assert.rejects(
      apiFetch("/me"),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 422 &&
        error.requestId === "transport-2" &&
        error.fieldErrors?.name[0] === "Isi nama.",
    );
    globalThis.fetch = async () =>
      new Response("<html>proxy failure</html>", { status: 502 });
    await assert.rejects(
      apiFetch("/me"),
      (error: unknown) =>
        error instanceof ApiError && error.code === "INVALID_RESPONSE",
    );
    globalThis.fetch = async () => {
      throw new TypeError("Failed to fetch");
    };
    await assert.rejects(
      apiFetch("/me"),
      (error: unknown) =>
        error instanceof ApiError && error.code === "NETWORK_ERROR",
    );
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      apiFetch("/me", { signal: controller.signal }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "CANCELLED",
    );
  } finally {
    globalThis.fetch = original;
  }
  console.log(
    "API foundation passed: envelopes, safe errors, origin checks, bounded payloads, role validation and API transport failures.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
