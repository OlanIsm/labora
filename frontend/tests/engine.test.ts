import { strict as assert } from "node:assert";
import {
  experiments,
  getExperiment,
} from "../../backend/modules/catalog/definitions";
import {
  act,
  answer,
  initialRuntime,
  score,
} from "../features/experiments/domain/engine";
import {
  ohmsLaw,
  classifyPH,
  dilution,
  pendulumPeriod,
} from "../features/experiments/domain/science";

let exp = experiments[0];
let s = initialRuntime();
s = act(exp, s, "place", "indicator");
assert.equal(s.step, 0);
assert.deepEqual(s.placed, []);
assert.match(s.feedback, /Belum sesuai/);
s = act(exp, s, "place", "beaker");
assert.equal(s.step, 1);
assert.deepEqual(s.placed, ["beaker"]);
assert.match(s.feedback, /Siap dipakai.*Berikutnya:/);
s = act(exp, s, "add", "indicator");
assert.equal(s.step, 1);
assert.match(s.feedback, /Belum sesuai/);
s = act(exp, s, "pour", "solution");
assert.equal(s.step, 2);
assert.deepEqual(s.placed, ["beaker", "solution"]);
s = act(exp, s, "add", "indicator");
assert.equal(s.step, 3);
assert.deepEqual(s.placed, ["beaker", "solution", "indicator"]);
assert.match(s.feedback, /merah.*asam.*pengamatanmu/);
s = answer(exp, s, 1);
assert.equal(s.step, 4);
assert.equal(score(exp, s).total, 100);

exp = getExperiment("mixture")!;
s = initialRuntime();
s = act(exp, s, "add", "reagent");
assert.equal(s.step, 0);
assert.deepEqual(s.placed, []);
assert.match(s.feedback, /Belum sesuai/);
s = act(exp, s, "place", "beaker");
assert.equal(s.step, 1);
assert.deepEqual(s.placed, ["beaker"]);
s = act(exp, s, "add", "reagent");
assert.equal(s.step, 1);
assert.match(s.feedback, /Belum sesuai/);
s = act(exp, s, "pour", "solution");
assert.equal(s.step, 2);
assert.deepEqual(s.placed, ["beaker", "solution"]);
s = act(exp, s, "add", "reagent");
assert.equal(s.step, 3);
assert.deepEqual(s.placed, ["beaker", "solution", "reagent"]);
s = answer(exp, s, 0);
assert.equal(s.step, 4);
assert.equal(score(exp, s).total, 100);

exp = getExperiment("dilution")!;
s = initialRuntime();
s = act(exp, s, "add", "water");
assert.equal(s.step, 0);
assert.deepEqual(s.placed, []);
assert.match(s.feedback, /Belum sesuai/);
s = act(exp, s, "place", "cylinder");
assert.equal(s.step, 1);
assert.deepEqual(s.placed, ["cylinder"]);
s = act(exp, s, "add", "water");
assert.equal(s.step, 1);
assert.match(s.feedback, /Belum sesuai/);
s = act(exp, s, "add", "concentrate");
assert.equal(s.step, 2);
assert.deepEqual(s.placed, ["cylinder", "concentrate"]);
s = act(exp, s, "add", "water");
assert.equal(s.step, 3);
assert.deepEqual(s.placed, ["cylinder", "concentrate", "water"]);
s = answer(exp, s, 1);
assert.equal(s.step, 4);
assert.equal(score(exp, s).total, 100);

assert.equal(ohmsLaw(6, 3), 2);
assert.equal(classifyPH(3), "Acidic");
assert.equal(dilution(2, 10, 20), 1);
assert.ok(pendulumPeriod(2) > pendulumPeriod(1));

assert.equal(experiments.length, 9);
for (const experiment of experiments) {
  for (const correct of [true, false]) {
    let state = initialRuntime();
    for (const [index, step] of experiment.steps.entries()) {
      assert.equal(state.step, index, experiment.id);
      if (step.question) {
        assert.notEqual(step.question.answer, undefined);
        const expected = step.question.answer!;
        const choice = correct
          ? expected
          : (expected + 1) % step.question.options.length;
        state = answer(experiment, state, choice);
        assert.equal(state.answers[index].correct, correct);
        assert.equal(state.answers[index].attempts, 1);
        assert.equal(
          state.answers[index].expected,
          step.question.options[expected],
        );
        assert.match(
          state.feedback,
          correct ? /^Benar!/ : /^Belum tepat, nggak apa-apa\./,
        );
      } else {
        const item = step.item!;
        if (
          experiment.subject !== "chemistry" &&
          step.action !== "place" &&
          !state.placed.includes(item)
        ) {
          const blocked = act(experiment, state, step.action, item);
          assert.equal(blocked.step, index);
          assert.deepEqual(blocked.placed, state.placed);
          assert.match(blocked.feedback, /terlebih dahulu/);
          state = act(experiment, state, "place", item);
          assert.equal(state.step, index);
          assert.match(state.feedback, /sudah ada di meja/);
        }
        const wrong = act(
          experiment,
          state,
          step.action === "add" ? "pour" : "add",
          item,
        );
        assert.equal(wrong.step, index);
        assert.deepEqual(wrong.done, state.done);
        assert.deepEqual(wrong.placed, state.placed);
        assert.match(
          wrong.feedback,
          experiment.subject !== "chemistry" && !state.placed.includes(item)
            ? /terlebih dahulu/
            : /ikuti langkah ini/i,
        );
        state = act(experiment, state, step.action, item);
        assert.equal(state.step, index + 1, experiment.id);
      }
    }
    assert.equal(state.step, experiment.steps.length);
    assert.deepEqual(
      state.done,
      experiment.steps.map((_, index) => index),
    );
    assert.deepEqual(score(experiment, state), {
      quiz: correct ? 100 : 0,
      accuracy: 100,
      total: correct ? 100 : 40,
    });
    assert.equal(state.launched, experiment.visual === "projectile");
    assert.equal(state.observed, ["cell", "blood"].includes(experiment.visual));
    assert.strictEqual(
      act(experiment, state, "place", experiment.items[0].id),
      state,
    );
    assert.strictEqual(answer(experiment, state, 0), state);
  }
}
console.log("Engine checks passed");
