import assert from "node:assert/strict";
import { sessionRepository } from "../features/auth";
import { ApiError } from "../shared/infrastructure/api";

async function main() {
  const originalFetch = globalThis.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) || null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  });
  const account = {
    id: "c479bc35-2b33-4a81-b90f-d6a92fef280e",
    name: "Verified",
    email: "student@example.com",
    mode: "account" as const,
    role: "student" as const,
  };
  let calls: string[] = [];
  try {
    values.set("labora-user", JSON.stringify({ ...account, role: "teacher" }));
    assert.equal(
      sessionRepository.localUser(),
      null,
      "A cached account is not authentication",
    );
    globalThis.fetch = async (url) => {
      calls.push(String(url));
      return String(url).endsWith("/auth/config")
        ? Response.json({ data: { configured: true }, requestId: "config" })
        : Response.json({ data: account, requestId: "identity" });
    };
    assert.deepEqual(await sessionRepository.restore(), account);
    assert.equal(sessionRepository.configured, true);
    assert.deepEqual(calls, ["/api/v1/auth/config", "/api/v1/me"]);
    globalThis.fetch = async (url) =>
      String(url).endsWith("/auth/config")
        ? Response.json({ data: { configured: true }, requestId: "config" })
        : Response.json(
            {
              error: {
                code: "UNAUTHENTICATED",
                message: "Masuk.",
                retryable: false,
              },
              requestId: "expired",
            },
            { status: 401 },
          );
    assert.equal(
      await sessionRepository.restore(),
      null,
      "Expired cookie does not restore forged cached role",
    );
    globalThis.fetch = async () => {
      throw new TypeError("Offline");
    };
    await assert.rejects(sessionRepository.restore(), ApiError);
    await assert.rejects(
      sessionRepository.authenticate({
        mode: "login",
        profile: account,
        password: "valid-password",
      }),
      ApiError,
      "Unavailable auth never becomes a local school profile",
    );
    globalThis.fetch = async (url) =>
      Response.json({
        data: String(url).endsWith("/auth/config")
          ? { configured: false }
          : { signedOut: true },
        requestId: "demo",
      });
    await sessionRepository.restore();
    const demo = await sessionRepository.enterDemo!({
      name: "Demo",
      email: "demo-student@labora.local",
      role: "student",
    });
    assert.equal(demo.mode, "demo");
    assert.equal(sessionRepository.localUser()?.mode, "demo");
    await sessionRepository.signOut();
    assert.equal(sessionRepository.localUser(), null);
    console.log(
      "Auth API passed: verified identity, cookie expiry, no offline privilege fallback, and explicit demo isolation.",
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
