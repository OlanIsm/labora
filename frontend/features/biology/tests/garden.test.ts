import assert from "node:assert/strict";
import { GARDEN_MISSIONS, GardenState, Genes, concludeMystery, expectedPrediction, growCross, initialGarden, isGardenState, missionComplete, mysteryEvidence, nextGardenMission, punnettSquare, saveOffspring } from "../garden";

const mono = punnettSquare("PpRR", "PpRR", 1);
assert.deepEqual(mono.genotypes, { PP: 1, Pp: 2, pp: 1 });
assert.deepEqual(mono.phenotypes, { "Bunga ungu": 3, "Bunga putih": 1 });
const dihybrid = punnettSquare("PpRr", "PpRr", 2);
assert.deepEqual(dihybrid.phenotypes, { "Bunga ungu · biji bulat": 9, "Bunga ungu · biji keriput": 3, "Bunga putih · biji bulat": 3, "Bunga putih · biji keriput": 1 });
const genotypes: Genes[] = ["PPRR", "PPRr", "PPrr", "PpRR", "PpRr", "Pprr", "ppRR", "ppRr", "pprr"];
for (const a of genotypes) for (const b of genotypes) {
  const square = punnettSquare(a, b, 2);
  assert.equal(square.cells.length, 16);
  assert.equal(Object.values(square.genotypes).reduce((sum, count) => sum + count, 0), 16);
  assert.ok(square.cells.every(cell => genotypes.includes(cell.genes as Genes)));
}

let game = initialGarden(1);
assert.ok(isGardenState(game));
assert.equal(growCross(game, "missing", "white-pure", "purple"), game);
assert.equal(nextGardenMission(game), game, "Cannot skip an unfinished mission");
game = growCross(game, "purple-carrier", "purple-carrier", "both");
assert.equal(game.history.at(-1)!.correct, true);
assert.equal(missionComplete(game), false, "Correct prediction alone must not complete an unsuitable breeding plan");
game = growCross(game, "purple-pure", "white-pure", "both");
assert.equal(missionComplete(game), false, "Correct parent choice still requires a correct prediction");
game = growCross(game, "purple-pure", "white-pure", "purple");
assert.ok(missionComplete(game));
assert.ok(game.history.at(-1)!.children.every(genes => genes === "PpRR"));
assert.equal(game.plants.find(plant => plant.genes === "PpRR")!.generation, 1, "A real offspring must become usable breeding stock");
assert.equal(saveOffspring(game, game.history.at(-1)!.id, "pprr"), game, "Cannot save a genotype that did not occur in the sample");
game = nextGardenMission(game);
game = growCross(game, "purple-pure", "white-pure", "purple");
assert.equal(missionComplete(game), false, "Mission two requires actual offspring as parents");
game = growCross(game, "purple-carrier", "purple-carrier", "both");
assert.ok(missionComplete(game));
const secondGeneration = game.history.at(-1)!;
assert.equal(secondGeneration.generation, 2);
for (const genes of new Set(secondGeneration.children)) game = saveOffspring(game, secondGeneration.id, genes);
assert.ok(game.plants.filter(plant => secondGeneration.children.includes(plant.genes) && plant.id !== "mystery").every(plant => plant.generation === 2));
const afterSaving = game;
for (const genes of new Set(secondGeneration.children)) game = saveOffspring(game, secondGeneration.id, genes);
assert.equal(game, afterSaving, "Saving the same sample repeatedly must not create fictitious new generations");
game = nextGardenMission(game);
const beforeMystery = game;
const mystery = game.plants.find(plant => plant.id === "mystery")!;
assert.equal(mystery.revealed, false);
assert.equal(expectedPrediction(game, mystery, game.plants.find(plant => plant.id === "white-pure")!), "unknown");
game = growCross(game, "mystery", "purple-pure", "purple");
assert.equal(mysteryEvidence(game).total, 0, "A dominant partner is not the required test cross");
assert.equal(concludeMystery(game, "PP"), game);
game = growCross(game, "mystery", "white-pure", "unknown");
assert.equal(mysteryEvidence(game).total, 20);
assert.equal(missionComplete(concludeMystery(game, "PP")), false, "No finite sample of purple offspring proves PP");
game = concludeMystery(game, mysteryEvidence(game).white > 0 ? "Pp" : "unknown");
assert.ok(missionComplete(game));
assert.equal(game.plants.find(plant => plant.id === "mystery")!.revealed, true);
game = nextGardenMission(game);
game = growCross(game, "dihybrid", "dihybrid", "0.0625");
assert.equal(game.history.at(-1)!.correct, true);
assert.equal(missionComplete(game), false, "Dihybrid self-cross has only 1/16 target probability, below the mission goal");
game = growCross(game, "dihybrid", "recessive-test", "0.25");
assert.ok(missionComplete(game));
game = nextGardenMission(game);
assert.equal(game.mission, GARDEN_MISSIONS.length);
assert.ok(game.history.filter(run => run.passed).length === 4);
assert.ok(isGardenState(JSON.parse(JSON.stringify(game))), "Completed progress must survive storage round trip");

let repeated = beforeMystery;
let whiteCount = 0;
for (let i = 0; i < 24; i++) {
  repeated = growCross(repeated, "mystery", "white-pure", "unknown");
  whiteCount += repeated.history.at(-1)!.children.filter(genes => genes.startsWith("pp")).length;
}
assert.equal(mysteryEvidence(repeated).total, 480);
assert.equal(mysteryEvidence(repeated).white, whiteCount, "Evidence must persist even when older trial history is compacted");
assert.ok(repeated.history.length <= 24);
assert.ok(isGardenState(repeated));

let retainedTest = growCross(beforeMystery, "mystery", "white-pure", "unknown");
const recordedWhite = retainedTest.mystery.white;
for (let i = 0; i < 24; i++) retainedTest = growCross(retainedTest, "mystery", "purple-pure", "purple");
assert.equal(mysteryEvidence(retainedTest).runs.length, 1, "The last valid test cross must survive later unrelated trials");
assert.ok(missionComplete(concludeMystery(retainedTest, recordedWhite > 0 ? "Pp" : "unknown")));
assert.ok(isGardenState(retainedTest));

function reachMystery(seed: number): GardenState {
  let state = initialGarden(seed);
  state = nextGardenMission(growCross(state, "purple-pure", "white-pure", "purple"));
  return nextGardenMission(growCross(state, "purple-carrier", "purple-carrier", "both"));
}
let homozygous = reachMystery(100000);
assert.equal(homozygous.plants.find(plant => plant.id === "mystery")!.genes, "PPRR");
homozygous = growCross(homozygous, "mystery", "white-pure", "unknown");
assert.equal(mysteryEvidence(homozygous).white, 0);
assert.equal(missionComplete(concludeMystery(homozygous, "PP")), false);
assert.equal(missionComplete(concludeMystery(homozygous, "Pp")), false);
assert.ok(missionComplete(concludeMystery(homozygous, "unknown")), "Recognizing inconclusive evidence must complete the detective mission");

assert.equal(isGardenState(null), false);
assert.equal(isGardenState({ ...game, plants: [{ ...game.plants[0], genes: "garbage" }] }), false);
assert.equal(isGardenState({ ...game, mystery: { total: 1, white: 2 } }), false);
assert.equal(isGardenState({ ...game, history: [{ ...game.history[0], children: ["bad"] }] }), false);
assert.equal(isGardenState({ ...game, history: [] }), false, "Completed stages require actual successful mission records");
console.log("Garden checks passed: exact mono/dihybrid probabilities, usable offspring, four missions, uncertainty-aware test crosses, persistent evidence, and validated saved progress.");
