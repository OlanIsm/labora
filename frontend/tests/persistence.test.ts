import assert from "node:assert/strict";
import { browserStorage } from "../shared/infrastructure/browserStorage";
import { sessionRepository } from "../features/auth";
import { assignmentRepository } from "../features/assignments";
import { progressRepository, createRecord } from "../features/progress";
import {
  runtimeRepository,
  experiments,
  initialRuntime,
} from "../features/experiments";
import type { Assignment } from "../features/assignments/model";
import type { User } from "../features/auth/model";

async function main() {
  const values = new Map<string, string>();
  let blocked = false;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem(key: string) {
          if (blocked) throw new Error("Storage blocked");
          return values.get(key) || null;
        },
        setItem(key: string, value: string) {
          if (blocked) throw new Error("Storage blocked");
          values.set(key, value);
        },
        removeItem(key: string) {
          if (blocked) throw new Error("Storage blocked");
          values.delete(key);
        },
      },
    },
  });
  try {
    const user: User = {
      name: "Siswa Demo",
      email: "demo-student@labora.local",
      role: "student",
      className: "VIII A",
    };
    sessionRepository.saveLocal(user);
    assert.deepEqual(sessionRepository.localUser(), user);
    assert.ok(
      values.has("labora-user"),
      "Existing profile storage key remains compatible",
    );
    if (!sessionRepository.configured) {
      assert.deepEqual(await sessionRepository.restore(), user);
      assert.deepEqual(
        await sessionRepository.authenticate({
          mode: "login",
          profile: user,
          password: "local-demo",
        }),
        user,
      );
    }
    await sessionRepository.updateProfile({ ...user, name: "Alex" });
    assert.equal(sessionRepository.localUser()?.name, "Alex");

    const runtime = { ...initialRuntime(), step: 2 };
    runtimeRepository.save("acid-base", runtime);
    assert.deepEqual(runtimeRepository.load("acid-base"), runtime);
    assert.ok(values.has("labora-runtime-acid-base"));
    runtimeRepository.clear("acid-base");
    assert.equal(runtimeRepository.load("acid-base"), null);

    const assignment: Assignment = {
      id: "assignment-1",
      experimentId: "acid-base",
      title: "Larutan misteri",
      instructions: "Amati warna indikator.",
      className: "VIII A",
      stages: [],
      createdAt: new Date().toISOString(),
    };
    await assignmentRepository.save(assignment, user);
    assert.deepEqual(assignmentRepository.listLocal(), [assignment]);
    assert.equal(
      await assignmentRepository.loadRemote(user),
      null,
      "Demo assignments stay local",
    );

    const record = createRecord(experiments[0], initialRuntime(), user);
    progressRepository.saveLocal(record);
    progressRepository.saveLocal({ ...record, score: 100 });
    assert.equal(
      progressRepository.listLocal().length,
      1,
      "Repeating an experiment replaces its existing result",
    );
    assert.equal(progressRepository.listLocal()[0].score, 100);
    assert.equal(progressRepository.listLocal()[0].className, "VIII A");
    assert.equal(await progressRepository.loadRemote(user), null);
    await progressRepository.saveRemote(record, user);

    values.set("labora-records", "invalid-json");
    assert.deepEqual(progressRepository.listLocal(), []);
    values.set("labora-assignments", JSON.stringify({ unexpected: true }));
    assert.deepEqual(assignmentRepository.listLocal(), []);
    blocked = true;
    assert.equal(sessionRepository.localUser(), null);
    assert.doesNotThrow(() => runtimeRepository.clear("acid-base"));
    assert.doesNotThrow(() => browserStorage.write("labora-user", user));
    console.log(
      "Persistence passed: existing keys, profile updates, runtime reset, assignment saves, result replacement, demo isolation, and blocked/corrupt storage.",
    );
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
