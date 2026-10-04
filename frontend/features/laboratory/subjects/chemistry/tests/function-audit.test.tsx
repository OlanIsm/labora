import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  chemistryMaterials,
  chemistryContainers,
  chemistryTools,
} from "../catalog";
import { chemistryGuides, illustrativeTools } from "../equipmentGuides";
import { reduceLab, initialLab } from "../../../domain/engine";
import { totalMass } from "../../../domain/measurements";
import { isLabState } from "../../../infrastructure/labRepository";
import { pourDrop, dipLitmusDrop } from "../drop";
import { graphSamples } from "../MeasurementGraph";
import ApparatusControls from "../../../ui/workbench/ApparatusControls";
import type { LabState } from "../../../domain/types";

const add = (state: LabState, material: string) =>
  reduceLab(state, { type: "add", material });
const get = (state: LabState, id: string) =>
  state.entities.find((e) => e.id === id)!;
const noop = () => {};

for (const material of chemistryMaterials) {
  let state = add(initialLab(), "beaker");
  const vessel = state.entities[0].id;
  if (material.id.startsWith("litmus-")) {
    state = pourDrop(state, vessel, { material: "hcl01" })!.state;
    const result = dipLitmusDrop(state, vessel, { material: material.id });
    assert.ok(
      result && get(result.state, result.paperId).params.litmusTested === 1,
      material.id,
    );
    continue;
  }
  state = add(state, material.id);
  const source = state.entities.at(-1)!.id;
  const moved = reduceLab(state, {
    type: "pour",
    source,
    target: vessel,
    amount: 1,
  });
  assert.ok(totalMass(get(moved, vessel)) > 0, `Transfer ${material.id}`);
  assert.ok(
    totalMass(get(moved, source)) < totalMass(get(state, source)),
    material.id,
  );
  assert.ok(isLabState(reduceLab(moved, { type: "tick", dt: 2 })), material.id);
}
for (const material of [...chemistryContainers, ...chemistryTools]) {
  assert.ok(chemistryGuides[material.id], `Usage guide ${material.id}`);
  let state = add(initialLab(), material.id);
  const id = state.entities[0].id;
  assert.ok(isLabState(state), material.id);
  const controls = renderToStaticMarkup(
    <ApparatusControls
      entity={get(state, id)}
      state={state}
      dispatch={noop}
      target=""
      setTarget={noop}
      onAction={noop}
    />,
  );
  if (illustrativeTools.includes(material.id)) {
    assert.ok(controls.includes("Alat ilustratif"), material.id);
    assert.ok(
      !controls.includes("Sambungkan") && !controls.includes("Nyalakan"),
      material.id,
    );
  }
  if (material.kind === "container") {
    state = pourDrop(state, id, { material: "water" })!.state;
    assert.ok(totalMass(get(state, id)) > 0, material.id);
    const closed = reduceLab(state, { type: "toggle", id, key: "sealed" });
    assert.equal(
      pourDrop(closed, id, { material: "water" }),
      null,
      material.id,
    );
  }
}

let state = add(initialLab(), "beaker");
const vessel = state.entities[0].id;
state = pourDrop(state, vessel, { material: "hcl01" })!.state;
for (const [material, key] of [
  ["ph-meter", "pH"],
  ["thermometer", "Suhu (°C)"],
  ["balance", "Massa isi (g)"],
  ["electrolyte-tester", "Daya hantar relatif"],
  ["balloon", "Gas terbentuk (mL)"],
]) {
  state = add(state, material);
  const id = state.entities.at(-1)!.id;
  state = reduceLab(state, { type: "connect", source: id, target: vessel });
  assert.equal(
    get(state, id).measurements[key],
    get(state, vessel).measurements[key],
    material,
  );
  state = reduceLab(state, { type: "connect", source: id, target: vessel });
  assert.equal(
    get(state, id).measurements[key],
    undefined,
    `Disconnected ${material}`,
  );
}

state = reduceLab(state, { type: "tick", dt: 5 });
state = add(state, "stopwatch");
const watch = state.entities.at(-1)!.id;
assert.equal(get(state, watch).measurements["Waktu (s)"], 0);
state = reduceLab(state, { type: "toggle", id: watch, key: "active" });
state = reduceLab(state, { type: "tick", dt: 2 });
assert.ok(Math.abs(get(state, watch).measurements["Waktu (s)"] - 2) < 1e-9);
state = reduceLab(state, { type: "toggle", id: watch, key: "active" });
state = reduceLab(state, { type: "tick", dt: 2 });
assert.ok(Math.abs(get(state, watch).measurements["Waktu (s)"] - 2) < 1e-9);
state = reduceLab(state, { type: "set", id: watch, key: "time", value: 0 });
assert.equal(get(state, watch).measurements["Waktu (s)"], 0);

state = add(state, "dropper");
const dropper = state.entities.at(-1)!.id;
state = pourDrop(state, dropper, { material: "water" })!.state;
const before = totalMass(get(state, vessel));
state = reduceLab(state, {
  type: "pour",
  source: dropper,
  target: vessel,
  amount: 1,
});
assert.ok(Math.abs(totalMass(get(state, vessel)) - before - 1) < 1e-8);
const sealed = reduceLab(state, { type: "toggle", id: vessel, key: "sealed" });
assert.deepEqual(
  reduceLab(sealed, {
    type: "pour",
    source: dropper,
    target: vessel,
    amount: 1,
  }),
  sealed,
);

state = add(state, "burner");
const burner = state.entities.at(-1)!.id;
state = reduceLab(state, { type: "connect", source: burner, target: vessel });
state = reduceLab(state, { type: "toggle", id: burner, key: "active" });
state = reduceLab(state, { type: "tick", dt: 0.2 });
const samples = graphSamples(state, get(state, vessel), "Suhu (°C)");
assert.equal(samples.at(-1)!.time, state.time);
assert.equal(samples.at(-1)!.value, get(state, vessel).temperature);
const advanced = reduceLab(state, { type: "tick", dt: 0.2 });
assert.ok(
  graphSamples(advanced, get(advanced, vessel), "Suhu (°C)").at(-1)!.value >
    samples.at(-1)!.value,
);

let electrolysis = add(initialLab(), "beaker");
const cellVessel = electrolysis.entities[0].id;
electrolysis = pourDrop(electrolysis, cellVessel, { material: "water" })!.state;
electrolysis = add(electrolysis, "electrolysis");
const cell = electrolysis.entities.at(-1)!.id;
electrolysis = reduceLab(electrolysis, {
  type: "connect",
  source: cell,
  target: cellVessel,
});
electrolysis = reduceLab(electrolysis, {
  type: "toggle",
  id: cell,
  key: "active",
});
electrolysis = reduceLab(electrolysis, { type: "tick", dt: 2 });
assert.ok(get(electrolysis, cellVessel).measurements["H₂ katoda (mL)"] > 0);
assert.equal(
  get(electrolysis, cellVessel).measurements["H₂ katoda (mL)"],
  2 * get(electrolysis, cellVessel).measurements["O₂ anoda (mL)"],
);
console.log(
  `Chemistry functional audit passed: ${chemistryMaterials.length} material transfers/tests; ${chemistryContainers.length + chemistryTools.length} apparatus metadata/controls; meter disconnects, stopwatch, pipette, sealed transfers, live graph and electrolysis. Reaction-by-reaction scientific calibration remains outside this smoke audit.`,
);
