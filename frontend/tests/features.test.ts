import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { catalog, materials } from "../features/laboratory/domain/catalog";
import { rules } from "../features/laboratory/domain/rules";
import { chemistryFields } from "../features/laboratory/subjects/chemistry/controlFields";
import { physicsFields } from "../features/laboratory/subjects/physics/controlFields";
import { biologyFields } from "../features/laboratory/subjects/biology/controlFields";

const subjects = ["chemistry", "biology", "physics"] as const;
const requested = process.argv[2];

function testFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return testFiles(path);
      return entry.isFile() && /\.test\.tsx?$/.test(entry.name) ? [path] : [];
    })
    .sort();
}

async function main() {
  assert.ok(
    !requested || subjects.some((subject) => subject === requested),
    "Pilih chemistry, biology, atau physics.",
  );
  assert.equal(
    new Set(catalog.map((m) => m.id)).size,
    catalog.length,
    "ID katalog tidak boleh bertabrakan antar pelajaran.",
  );
  assert.equal(
    new Set(rules.map((r) => r.id)).size,
    rules.length,
    "ID aturan tidak boleh bertabrakan antar pelajaran.",
  );
  const models = [chemistryFields, physicsFields, biologyFields].flatMap(
    Object.keys,
  );
  assert.equal(
    new Set(models).size,
    models.length,
    "Model kontrol shared tidak boleh saling menimpa antar pelajaran.",
  );
  for (const rule of rules) {
    for (const id of [
      ...rule.trigger,
      ...(rule.products || []).map(([id]) => id),
      ...(rule.gas ? [rule.gas] : []),
    ]) {
      assert.ok(
        materials[id],
        `${rule.id} memakai bahan tidak terdaftar: ${id}`,
      );
    }
  }
  for (const subject of subjects.filter(
    (subject) => !requested || requested === subject,
  )) {
    const files = testFiles(
      resolve("features", "laboratory", "subjects", subject, "tests"),
    );
    assert.ok(files.length, `Tes ${subject} belum tersedia.`);
    for (const file of files) await import(pathToFileURL(file).href);
  }
  console.log(
    "Subject checks passed: separate test discovery, unique IDs and recipe references.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
