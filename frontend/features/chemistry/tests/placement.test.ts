import assert from "node:assert/strict";
import { findBenchSpace } from "../placement";

const occupied: { x: number; y: number; width: number; height: number }[] = [];
for (let index = 0; index < 18; index++) {
  const position = findBenchSpace(900, 560, 90, 140, occupied);
  assert.ok(position, "The larger desktop bench must fit 18 ordinary objects");
  const rectangle = { x: position.x * 9, y: position.y * 5.6, width: 90, height: 140 };
  assert.ok(occupied.every(rect => rectangle.x + 90 <= rect.x || rectangle.x >= rect.x + rect.width || rectangle.y + 140 <= rect.y || rectangle.y >= rect.y + rect.height));
  occupied.push(rectangle);
}
assert.equal(findBenchSpace(50, 50, 90, 140, []), undefined);
assert.ok(findBenchSpace(320, 520, 70, 128, []));
console.log("Chemistry placement checks passed: 18 non-overlapping objects, mobile placement and insufficient space.");
