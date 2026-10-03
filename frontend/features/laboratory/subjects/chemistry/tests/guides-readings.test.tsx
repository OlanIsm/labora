import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  chemistryMaterials,
  chemistryContainers,
  chemistryTools,
} from "../catalog";
import { chemistryGuides } from "../equipmentGuides";
import ChemistryGuide, { chemistryGuideSteps } from "../ChemistryGuide";
import HoverReading from "../HoverReading";
import { initialLab, reduceLab } from "../../../domain/engine";
import { pourDrop } from "../drop";

const noop = () => {};
for (const material of [
  ...chemistryMaterials,
  ...chemistryContainers,
  ...chemistryTools,
]) {
  const guide = chemistryGuides[material.id];
  assert.ok(guide?.purpose && guide.usage, `Missing guide: ${material.id}`);
  const state = reduceLab(initialLab(), { type: "add", material: material.id });
  const entity = state.entities[0];
  const steps = chemistryGuideSteps(entity);
  assert.equal(steps.length, 5);
  assert.ok(
    steps[0].text.includes(entity.label) &&
      steps[0].text.includes(guide.purpose),
  );
  assert.equal(steps[1].text, guide.usage);
  assert.ok(
    renderToStaticMarkup(
      <ChemistryGuide
        open
        state={state}
        selected={entity}
        onOpen={noop}
        onClose={noop}
        onNavigate={noop}
      />,
    ).includes(guide.purpose.replaceAll("&", "&amp;")),
  );
}
for (const [material, unit] of [
  ["ph-meter", "pH"],
  ["thermometer", "°C"],
  ["balance", " g"],
  ["electrolyte-tester", "Daya hantar relatif"],
]) {
  let state = reduceLab(initialLab(), { type: "add", material: "beaker" });
  const vesselId = state.entities[0].id;
  state = pourDrop(state, vesselId, { material: "water" })!.state;
  state = reduceLab(state, { type: "add", material });
  const id = state.entities.at(-1)!.id;
  assert.ok(
    renderToStaticMarkup(
      <HoverReading entity={state.entities.at(-1)!} state={state} />,
    ).includes("Belum tersambung"),
  );
  state = reduceLab(state, { type: "connect", source: id, target: vesselId });
  const connected = renderToStaticMarkup(
    <HoverReading
      entity={state.entities.find((e) => e.id === id)!}
      state={state}
    />,
  );
  assert.ok(connected.includes(unit));
  assert.ok(!connected.includes("Belum tersambung"));
  state = reduceLab(state, { type: "connect", source: id, target: vesselId });
  assert.ok(
    renderToStaticMarkup(
      <HoverReading
        entity={state.entities.find((e) => e.id === id)!}
        state={state}
      />,
    ).includes("Belum tersambung"),
  );
}
const stopwatchState = reduceLab(initialLab(), {
  type: "add",
  material: "stopwatch",
});
assert.equal(
  renderToStaticMarkup(
    <HoverReading entity={stopwatchState.entities[0]} state={stopwatchState} />,
  ),
  "",
);
console.log(
  "Chemistry guide/readings checks passed: every catalog tool/material has five contextual steps; four meters show values/units only when connected; stopwatch stays independent.",
);
