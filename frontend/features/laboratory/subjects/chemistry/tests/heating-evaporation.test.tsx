import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { initialLab, reduceLab, historyReducer } from "../../../domain/engine";
import { totalMass, totalVolume } from "../../../domain/measurements";
import { isLabState } from "../../../infrastructure/labRepository";
import { chemistryTools } from "../catalog";
import ApparatusControls from "../../../ui/workbench/ApparatusControls";
import type { LabState } from "../../../domain/types";

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function setup(
  material = "water",
  amount = 10,
  temperature = 100,
  target = 120,
) {
  let state = reduceLab(initialLab(), { type: "add", material: "beaker" });
  const vessel = state.entities[0].id;
  state = reduceLab(state, { type: "add", material });
  state = reduceLab(state, {
    type: "pour",
    source: state.entities.at(-1)!.id,
    target: vessel,
    amount,
  });
  state = reduceLab(state, { type: "add", material: "burner" });
  const burner = state.entities.at(-1)!.id;
  state = reduceLab(state, { type: "connect", source: burner, target: vessel });
  state = reduceLab(state, {
    type: "set",
    id: burner,
    key: "targetTemperature",
    value: target,
  });
  state = reduceLab(state, {
    type: "set",
    id: vessel,
    key: "temperature",
    value: temperature,
  });
  state = reduceLab(state, { type: "toggle", id: burner, key: "active" });
  return { state, vessel, burner };
}
const get = (state: LabState, id: string) =>
  state.entities.find((e) => e.id === id)!;
const water = setup();
let warmed = reduceLab(water.state, { type: "tick", dt: 5 });
const evaporated = get(warmed, water.vessel);
close(evaporated.temperature, 100);
close(totalMass(evaporated), 10 - 500 / 2257);
close(totalVolume(evaporated), totalMass(evaporated));
close(evaporated.measurements["Massa menguap (g)"], 500 / 2257);
assert.ok(
  warmed.events.some(
    (e) => e.entity === water.vessel && e.type === "solvent.evaporated",
  ),
);
let smallSteps = water.state;
for (let step = 0; step < 25; step++)
  smallSteps = reduceLab(smallSteps, { type: "tick", dt: 0.2 });
close(totalMass(get(smallSteps, water.vessel)), totalMass(evaporated));
const unchanged = reduceLab(warmed, {
  type: "move",
  id: water.vessel,
  x: 30,
  y: 30,
});
close(totalMass(get(unchanged, water.vessel)), totalMass(evaporated));
const sealed = reduceLab(water.state, {
  type: "toggle",
  id: water.vessel,
  key: "sealed",
});
const sealedTick = reduceLab(sealed, { type: "tick", dt: 5 });
close(totalVolume(get(sealedTick, water.vessel)), 10);
for (const operation of [
  "evaporate",
  "distill",
  "filter",
  "decant",
  "magnet",
] as const) {
  const blocked = reduceLab(sealedTick, {
    type: "operate",
    id: water.vessel,
    operation,
  });
  close(totalMass(get(blocked, water.vessel)), 10);
  assert.ok(blocked.events.at(-1)!.message.includes("Buka wadah"));
}
const low = setup("water", 0.1, 25, 60);
let lowState = low.state;
for (let step = 0; step < 10; step++)
  lowState = reduceLab(lowState, { type: "tick", dt: 5 });
close(get(lowState, low.vessel).temperature, 60);
close(totalVolume(get(lowState, low.vessel)), 0.1);
let dry = setup("water", 0.01);
dry.state = reduceLab(dry.state, { type: "tick", dt: 5 });
assert.ok(
  get(dry.state, dry.vessel).contents.every(
    (p) => p.mass >= 0 && p.volume >= 0 && p.moles >= 0,
  ),
);
assert.ok(get(dry.state, dry.vessel).temperature <= 120);
assert.ok(isLabState(dry.state));
const acid = setup("hcl01");
const acidMoles = get(acid.state, acid.vessel).contents[0].moles;
const acidAfter = reduceLab(acid.state, { type: "tick", dt: 5 });
close(get(acidAfter, acid.vessel).contents[0].moles, acidMoles);
assert.ok(
  get(acidAfter, acid.vessel).measurements.pH <
    get(acid.state, acid.vessel).measurements.pH,
);
const ethanol = setup("ethanol", 10, 78.37, 90);
const ethanolAfter = reduceLab(ethanol.state, { type: "tick", dt: 5 });
close(get(ethanolAfter, ethanol.vessel).temperature, 78.37);
close(
  get(ethanolAfter, ethanol.vessel).measurements["Massa menguap (g)"],
  500 / 846,
);
const salt = setup();
salt.state = reduceLab(salt.state, { type: "add", material: "nacl" });
salt.state = reduceLab(salt.state, {
  type: "pour",
  source: salt.state.entities.at(-1)!.id,
  target: salt.vessel,
  amount: 1,
});
salt.state = reduceLab(salt.state, {
  type: "set",
  id: salt.vessel,
  key: "temperature",
  value: 100,
});
const saltAfter = reduceLab(salt.state, { type: "tick", dt: 5 });
close(
  get(saltAfter, salt.vessel).contents.find((p) => p.material === "nacl")!.mass,
  1,
);
assert.equal(chemistryTools.find((m) => m.id === "burner")!.name, "Pembakar");
const controls = renderToStaticMarkup(
  <ApparatusControls
    entity={get(water.state, water.burner)}
    state={water.state}
    dispatch={() => {}}
    target=""
    setTarget={() => {}}
    onAction={() => {}}
  />,
);
assert.ok(
  controls.includes("Suhu target (°C)") && controls.includes('max="200"'),
);
const clamped = reduceLab(water.state, {
  type: "set",
  id: water.burner,
  key: "targetTemperature",
  value: 999,
});
assert.equal(get(clamped, water.burner).params.targetTemperature, 200);
const history = historyReducer(
  { past: [], present: water.state, future: [] },
  { type: "operate", id: water.vessel, operation: "evaporate" },
);
assert.deepEqual(
  historyReducer(history, { type: "undo" }).present,
  water.state,
);
console.log(
  "Heating/evaporation checks passed: adjustable target, latent-heat mass/volume loss, deterministic playback, sealed guards, salt/acid retention, ethanol, dry bounds, controls and undo.",
);
