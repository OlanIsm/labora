import assert from "node:assert/strict";
import {
  chemistryMaterials,
  chemistryContainers,
  chemistryTools,
} from "../catalog";
import { chemistryRules } from "../rules";
import { chemistryFields } from "../controlFields";
import { dipLitmusDrop, pourDrop } from "../drop";
import { litmusRed, litmusExplanation } from "../litmus";
import { initialLab, reduceLab, historyReducer } from "../../../domain/engine";

assert.ok(
  [...chemistryMaterials, ...chemistryContainers, ...chemistryTools].every(
    (m) => m.discipline === "chemistry",
  ),
);
assert.ok(chemistryRules.every((r) => r.discipline === "chemistry"));
assert.ok(chemistryFields.chromatography.some(([key]) => key === "rf1"));
let state = reduceLab(initialLab(), { type: "add", material: "beaker" });
const vessel = state.entities[0].id;
state = pourDrop(state, vessel, { material: "hcl01" })!.state;
const contents = structuredClone(state.entities[0].contents);
const tested = dipLitmusDrop(state, vessel, { material: "litmus-blue" })!;
const paper = tested.state.entities.find((e) => e.id === tested.paperId)!;
assert.equal(paper.color, litmusRed);
assert.ok(litmusExplanation(paper)?.reason.includes("larutan bersifat asam"));
assert.deepEqual(tested.state.entities[0].contents, contents);
const history = historyReducer(
  { past: [], present: state, future: [] },
  { type: "load", state: tested.state },
);
assert.deepEqual(historyReducer(history, { type: "undo" }).present, state);
console.log("Chemistry module checks passed.");
