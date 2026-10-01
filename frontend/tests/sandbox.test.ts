import { strict as assert } from "node:assert";
import { catalog, materials } from "../lib/sandbox/catalog";
import { historyReducer, initialLab, reduceLab } from "../lib/sandbox/engine";
import { Action, Entity, LabState } from "../lib/sandbox/types";
import { rules, ruleCounts } from "../lib/sandbox/rules";
import {
  buoyancy,
  heatChange,
  indicatorColor,
  lens,
  molarGasVolume,
  ohm,
  pendulum,
  ph,
  projectile,
  punnett,
  snell,
} from "../lib/sandbox/measurements";
import { isLabState } from "../services/labRepository";
import { actionFeedback, observationFeedback } from "../lib/sandbox/feedback";
import {
  developChromatogram,
  separate,
  suspendedMass,
  vaporize,
} from "../lib/sandbox/separation";
import {
  equilibriumTemperature,
  mixtureHeatCapacity,
} from "../lib/sandbox/measurements";

const close = (a: number, b: number, epsilon = 0.001) =>
  assert.ok(Math.abs(a - b) < epsilon, `${a} != ${b}`);
function add(s: LabState, material: string) {
  const id = `e${s.nextId}`;
  return { state: reduceLab(s, { type: "add", material }), id };
}
function mix(ids: string[], amounts?: number[]) {
  let s = initialLab();
  const b = add(s, "beaker");
  s = b.state;
  for (const [i, id] of ids.entries()) {
    const item = add(s, id);
    s = item.state;
    s = reduceLab(s, {
      type: "pour",
      source: item.id,
      target: b.id,
      amount: amounts?.[i] ?? (materials[id].phase === "solid" ? 1 : 10),
    });
  }
  return { s, id: b.id, e: s.entities.find((e) => e.id === b.id)! };
}
function entity(s: LabState, id: string) {
  return s.entities.find((e) => e.id === id)!;
}
assert.ok(ruleCounts.chemistry >= 50);
assert.ok(ruleCounts.physics >= 25);
assert.ok(ruleCounts.biology >= 15);
assert.equal(new Set(rules.map((r) => r.id)).size, rules.length);
assert.equal(new Set(catalog.map((m) => m.id)).size, catalog.length);
for (const rule of rules)
  for (const id of [
    ...rule.trigger,
    ...(rule.products || []).map(([id]) => id),
  ])
    assert.ok(materials[id], `${rule.id}: missing ${id}`);

close(mix(["hcl01"]).e.measurements.pH, 1);
close(mix(["naoh01"]).e.measurements.pH, 13);
close(mix(["acetic"]).e.measurements.pH, 2.875, 0.04);
close(mix(["ammonia"]).e.measurements.pH, 11.125, 0.04);
close(mix(["water"]).e.measurements.pH, 7);
close(mix(["hcl01", "naoh01"]).e.measurements.pH, 7, 0.02);
close(mix(["hcl01", "water"], [10, 90]).e.measurements.pH, 2, 0.02);
assert.ok(mix(["acetic", "naoh01"]).e.measurements.pH > 7);
assert.ok(mix(["hcl01", "ammonia"]).e.measurements.pH < 7);
close(heatChange(418, 100), 1);
close(ohm(6, 3), 2);
close(snell(1, 1.5, 30)!, 19.47122);
assert.equal(snell(1.5, 1, 60), null);
close(lens(0.1, 0.2).distance, 0.2);
close(lens(0.1, 0.2).magnification, -1);
close(buoyancy(1000, 0.001), 9.8);
close(pendulum(1), 2.0070899);
close(projectile(14, 45).range, 20);
assert.equal(indicatorColor("pp", 7), "#d5edf7");
assert.equal(indicatorColor("btb", 7), "#63a16f");
assert.deepEqual(punnett(true, false, 42), punnett(true, false, 42));
assert.notDeepEqual(punnett(true, false, 42), punnett(true, false, 43));
close(molarGasVolume(25), 24465.4037, 0.01);

for (const r of rules.filter((r) => r.model === "reaction")) {
  let { s, id } = mix(r.trigger);
  s = reduceLab(s, { type: "tick", dt: 2 });
  const e = entity(s, id);
  assert.ok(
    e.contents.every((p) => p.mass >= 0 && p.moles >= 0),
    r.id,
  );
  assert.ok(Object.values(e.measurements).every(Number.isFinite), r.id);
}
for (const [a, b, color] of [
  ["agno3", "nacl", "agcl"],
  ["bacl2", "na2so4", "baso4"],
  ["pbno3", "ki", "pbi2"],
  ["cuso4", "naoh01", "cuoh2"],
  ["fecl3", "naoh1", "feoh3"],
  ["cacl2", "na2co3", "caco3"],
])
  assert.equal(mix([a, b]).e.precipitate, color);
assert.equal(mix(["fecl3", "kscn"]).e.color, "#a42d41");
assert.ok(mix(["hcl01", "caco3"]).e.gas > 0);
assert.ok(mix(["h2o2", "mno2"]).e.gas > 0);
assert.equal(mix(["oil", "water"]).e.status, "Dua lapisan");
let emulsion = mix(["oil", "water", "soap"]);
emulsion.s = reduceLab(emulsion.s, {
  type: "operate",
  id: emulsion.id,
  operation: "stir",
});
assert.equal(entity(emulsion.s, emulsion.id).status, "Emulsi keruh");
assert.equal(mix(["iodine", "starch"]).e.color, "#2d3455");
assert.equal(mix(["biuret", "protein"]).e.color, "#765394");
let heated = mix(["glucose", "benedict"]);
heated.s = reduceLab(heated.s, {
  type: "set",
  id: heated.id,
  key: "temperature",
  value: 80,
});
assert.equal(entity(heated.s, heated.id).color, "#ad572d");
assert.ok(mix(["benedict", "sucrose"]).e.color !== "#ad572d");
const unknown = mix(["sand", "sucrose"]);
assert.equal(unknown.e.gas, 0);
assert.equal(unknown.e.precipitate, "");
const overflow = mix(["water"], [100]);
let tube = add(overflow.s, "test-tube");
let overflowing = reduceLab(tube.state, {
  type: "pour",
  source: overflow.id,
  target: tube.id,
  amount: 100,
});
assert.equal(entity(overflowing, tube.id).measurements["Volume (mL)"], 25);
assert.ok(overflowing.events.some((e) => e.type === "container.overflow"));

for (const material of catalog.filter(
  (m) => m.discipline === "physics" || m.discipline === "biology",
)) {
  const item = add(initialLab(material.discipline), material.id);
  let state = reduceLab(item.state, {
    type: "toggle",
    id: item.id,
    key: "active",
  });
  state = reduceLab(state, { type: "tick", dt: 1 });
  assert.ok(
    Object.values(entity(state, item.id).measurements).every(Number.isFinite),
    material.id,
  );
  assert.ok(isLabState(state), material.id);
}
let pend = add(initialLab("physics"), "pendulum");
let first = entity(pend.state, pend.id).measurements["Periode (s)"];
let changed = reduceLab(pend.state, {
  type: "set",
  id: pend.id,
  key: "mass",
  value: 5,
});
close(entity(changed, pend.id).measurements["Periode (s)"], first);
changed = reduceLab(changed, {
  type: "set",
  id: pend.id,
  key: "length",
  value: 2,
});
assert.ok(entity(changed, pend.id).measurements["Periode (s)"] > first);
let prism = add(initialLab("physics"), "glass-block");
let tir = reduceLab(prism.state, {
  type: "set",
  id: prism.id,
  key: "n1",
  value: 1.5,
});
tir = reduceLab(tir, { type: "set", id: prism.id, key: "n2", value: 1 });
tir = reduceLab(tir, { type: "set", id: prism.id, key: "angle", value: 60 });
assert.equal(entity(tir, prism.id).status, "Pemantulan sempurna");
let circuit = initialLab("physics");
const circuitIds: Record<string, string> = {};
for (const m of ["battery", "resistor", "wire", "fuse"]) {
  const item = add(circuit, m);
  circuit = item.state;
  circuitIds[m] = item.id;
}
for (const m of ["resistor", "wire", "fuse"])
  circuit = reduceLab(circuit, {
    type: "connect",
    source: circuitIds.battery,
    target: circuitIds[m],
  });
circuit = reduceLab(circuit, {
  type: "toggle",
  id: circuitIds.battery,
  key: "active",
});
close(entity(circuit, circuitIds.battery).measurements["Arus (A)"], 0.06);
circuit = reduceLab(circuit, {
  type: "set",
  id: circuitIds.resistor,
  key: "resistance",
  value: 0.01,
});
assert.ok(circuit.events.some((e) => e.type === "fuse.blown"));
assert.equal(entity(circuit, circuitIds.battery).measurements["Arus (A)"], 0);
let potato = add(initialLab("biology"), "potato");
let salty = reduceLab(potato.state, {
  type: "set",
  id: potato.id,
  key: "concentration",
  value: 1,
});
salty = reduceLab(salty, { type: "toggle", id: potato.id, key: "active" });
salty = reduceLab(salty, { type: "tick", dt: 5 });
assert.ok(entity(salty, potato.id).measurements["Perubahan massa (%)"] < 0);
let plant = add(initialLab("biology"), "elodea");
const lit = entity(plant.state, plant.id).measurements["Laju O₂ relatif"];
let dark = reduceLab(plant.state, {
  type: "set",
  id: plant.id,
  key: "light",
  value: 0,
});
assert.ok(lit > 0);
assert.equal(entity(dark, plant.id).measurements["Laju O₂ relatif"], 0);
const state = initialLab();
const actions: Action[] = [
  { type: "add", material: "beaker" },
  { type: "add", material: "hcl01" },
  { type: "pour", source: "e3", target: "e1", amount: 10 },
  { type: "tick", dt: 1 },
];
const run = () => actions.reduce(reduceLab, state);
assert.deepEqual(run(), run());
assert.equal(state.entities.length, 0);
let history = {
  past: [] as LabState[],
  present: initialLab(),
  future: [] as LabState[],
};
history = historyReducer(history, { type: "add", material: "beaker" });
const snapshot = history.present;
history = historyReducer(history, { type: "undo" });
assert.equal(history.present.entities.length, 0);
history = historyReducer(history, { type: "redo" });
assert.deepEqual(history.present, snapshot);
history = historyReducer(history, { type: "reset", discipline: "chemistry" });
assert.equal(history.present.entities.length, 0);
history = historyReducer(history, { type: "undo" });
assert.deepEqual(history.present, snapshot);
assert.equal(isLabState({}), false);
assert.equal(isLabState({ ...snapshot, entities: [{ id: "bad" }] }), false);
assert.equal(isLabState(snapshot), true);
console.log(
  `Sandbox checks passed: ${ruleCounts.chemistry} chemistry, ${ruleCounts.physics} physics, ${ruleCounts.biology} biology rule definitions.`,
);
let empty = add(initialLab(), "beaker");
const receiver = add(empty.state, "beaker");
const emptyPour = reduceLab(receiver.state, {
  type: "pour",
  source: empty.id,
  target: receiver.id,
  amount: 10,
});
assert.ok(emptyPour.events.some((e) => e.type === "mixture.empty"));
const timed = mix(["hcl01", "caco3"]);
const fast = reduceLab(timed.s, { type: "tick", dt: 1 });
let slow = timed.s;
for (let i = 0; i < 5; i++) slow = reduceLab(slow, { type: "tick", dt: 0.2 });
close(entity(fast, timed.id).gas, entity(slow, timed.id).gas, 1e-12);
close(
  entity(fast, timed.id).temperature,
  entity(slow, timed.id).temperature,
  1e-12,
);
assert.equal(
  isLabState({ ...snapshot, environment: { temperature: "bad" } }),
  false,
);
assert.equal(
  isLabState({
    ...snapshot,
    entities: snapshot.entities.map((e) => ({ ...e, contents: [null] })),
  }),
  false,
);

const saturated = mix(["water", "nacl", "sand"], [10, 10, 1]);
const separationSource = structuredClone(saturated.e);
const massBefore = separationSource.contents.reduce(
  (sum, p) => sum + p.mass,
  0,
);
close(suspendedMass(separationSource), 7.4);
const filtrate = separate(separationSource, "filter");
close(filtrate.find((p) => p.material === "nacl")!.mass, 3.6);
assert.ok(!filtrate.some((p) => p.material === "sand"));
close(separationSource.contents.find((p) => p.material === "nacl")!.mass, 6.4);
close(
  separationSource.contents.reduce((sum, p) => sum + p.mass, 0) +
    filtrate.reduce((sum, p) => sum + p.mass, 0),
  massBefore,
);

const hotKno3 = mix(["water", "kno3"], [10, 10]);
const coldResidue = suspendedMass(hotKno3.e);
hotKno3.e.temperature = 80;
assert.ok(suspendedMass(hotKno3.e) < coldResidue);

const acidEvaporation = mix(["hcl01"], [10]);
const acidMoles = acidEvaporation.e.contents.find(
  (p) => p.material === "hcl01",
)!.moles;
assert.deepEqual(vaporize(acidEvaporation.e), []);
acidEvaporation.e.temperature = 100;
const vapor = vaporize(acidEvaporation.e);
close(vapor[0].mass, 2);
close(acidEvaporation.e.contents[0].mass, 8);
close(acidEvaporation.e.contents[0].volume, 8);
close(acidEvaporation.e.contents[0].moles, acidMoles, 1e-12);
assert.ok(ph(acidEvaporation.e) < 1);
for (let i = 0; i < 200; i++) vaporize(acidEvaporation.e);
assert.ok(acidEvaporation.e.contents[0].mass >= acidMoles * 36.46 - 1e-10);

let distillation = mix(["ethanol", "water"], [10, 10]);
const receiving = add(distillation.s, "beaker");
let distilling = reduceLab(receiving.state, {
  type: "connect",
  source: distillation.id,
  target: receiving.id,
});
distilling = reduceLab(distilling, {
  type: "set",
  id: distillation.id,
  key: "temperature",
  value: 80,
});
const distillationMass = distilling.entities.reduce(
  (n, e) => n + e.contents.reduce((n, p) => n + p.mass, 0),
  0,
);
distilling = reduceLab(distilling, {
  type: "operate",
  id: distillation.id,
  operation: "distill",
});
assert.ok(
  entity(distilling, receiving.id).contents.some(
    (p) => p.material === "ethanol" && p.mass > 0,
  ),
);
assert.ok(
  !entity(distilling, receiving.id).contents.some(
    (p) => p.material === "water",
  ),
);
close(
  distilling.entities.reduce(
    (n, e) => n + e.contents.reduce((n, p) => n + p.mass, 0),
    0,
  ),
  distillationMass,
);

let filterState = reduceLab(saturated.s, { type: "add", material: "beaker" });
const filterReceiver = filterState.entities.at(-1)!;
filterState = reduceLab(filterState, {
  type: "connect",
  source: saturated.id,
  target: filterReceiver.id,
});
filterState = reduceLab(filterState, {
  type: "operate",
  id: saturated.id,
  operation: "filter",
});
close(
  entity(filterState, saturated.id).contents.find((p) => p.material === "sand")!
    .mass,
  1,
);
close(
  entity(filterState, filterReceiver.id).contents.find(
    (p) => p.material === "nacl",
  )!.mass,
  3.6,
);
assert.ok(isLabState(filterState));
console.log(
  "Separation checks passed: saturation, filtrate/residue, mass balance, solvent loss and temperature-dependent distillation.",
);

const paper = add(initialLab(), "chromatography");
const paperEntity = structuredClone(entity(paper.state, paper.id));
developChromatogram(paperEntity, undefined, 10);
assert.equal(paperEntity.measurements["Front pelarut model (mm)"], undefined);
const chromatographicSolvent = mix(["water"], [10]).e;
developChromatogram(paperEntity, chromatographicSolvent, 10);
assert.equal(paperEntity.measurements["Front pelarut model (mm)"], 0);
paperEntity.active = true;
developChromatogram(paperEntity, chromatographicSolvent, 10);
assert.ok(paperEntity.measurements["Front pelarut model (mm)"] > 0);
assert.equal(paperEntity.measurements["Rf pigmen 1 model"], undefined);
paperEntity.contents.push({
  material: "dye",
  mass: 0.1,
  moles: 0.001,
  volume: 0.1,
});
developChromatogram(paperEntity, chromatographicSolvent, 10);
close(paperEntity.measurements["Rf pigmen 1 model"], 0.2, 1e-12);
close(paperEntity.measurements["Rf pigmen 3 model"], 0.8, 1e-12);
const stoppedFront = paperEntity.measurements["Front pelarut model (mm)"];
paperEntity.active = false;
developChromatogram(paperEntity, chromatographicSolvent, 10);
close(paperEntity.measurements["Front pelarut model (mm)"], stoppedFront);
paperEntity.active = true;
developChromatogram(paperEntity, chromatographicSolvent, 1e6);
close(paperEntity.measurements["Front pelarut model (mm)"], 80);
console.log(
  "Chromatography model checks passed: solvent/sample requirements, measured Rf, pause and bounded front.",
);

close(equilibriumTemperature(20, 418, 80, 418), 50);
close(equilibriumTemperature(20, 0, 80, 418), 80);
close(
  mixtureHeatCapacity([
    { material: "water", mass: 100, moles: 100 / 18.015, volume: 100 },
  ]),
  418,
);
const coldWater = mix(["water"], [20]);
let thermal = reduceLab(coldWater.s, {
  type: "set",
  id: coldWater.id,
  key: "temperature",
  value: 20,
});
const hotWater = add(thermal, "water");
thermal = reduceLab(hotWater.state, {
  type: "set",
  id: hotWater.id,
  key: "temperature",
  value: 80,
});
thermal = reduceLab(thermal, {
  type: "pour",
  source: hotWater.id,
  target: coldWater.id,
  amount: 20,
});
// The action also advances passive cooling for 0.25 s; its analytic value is checked explicitly.
close(
  entity(thermal, coldWater.id).temperature,
  25 + (50 - 25) * Math.exp(-0.25 / 120),
  1e-9,
);
close(entity(thermal, hotWater.id).temperature, 80);
assert.ok(isLabState(thermal));
console.log(
  "Thermal mixing checks passed: heat-capacity balance and temperature transfer.",
);

const feedbackBeaker = add(initialLab(), "beaker");
const takeFeedback = actionFeedback(
  { type: "add", material: "beaker" },
  initialLab(),
  feedbackBeaker.state,
);
assert.match(takeFeedback.detail, /masih kosong/);
assert.equal(takeFeedback.next, "rack");
const feedbackSource = add(feedbackBeaker.state, "hcl01");
const chooseAmount: Action = {
  type: "set",
  id: feedbackSource.id,
  key: "amount",
  value: 10,
};
const selectedAmount = reduceLab(feedbackSource.state, chooseAmount);
assert.match(
  actionFeedback(chooseAmount, feedbackSource.state, selectedAmount).hint,
  /belum dituang/,
);
const pourAction: Action = {
  type: "pour",
  source: feedbackSource.id,
  target: feedbackBeaker.id,
  amount: 10,
};
const poured = reduceLab(selectedAmount, pourAction);
assert.match(
  actionFeedback(pourAction, selectedAmount, poured).detail,
  /Bahan berpindah/,
);
assert.equal(
  actionFeedback(pourAction, selectedAmount, poured).target,
  feedbackBeaker.id,
);
const meterForFeedback = add(poured, "ph-meter");
const connectAction: Action = {
  type: "connect",
  source: meterForFeedback.id,
  target: feedbackBeaker.id,
};
const metered = reduceLab(meterForFeedback.state, connectAction);
assert.match(
  actionFeedback(connectAction, meterForFeedback.state, metered).detail,
  /pH terbaca 1/,
);
assert.match(
  actionFeedback(connectAction, meterForFeedback.state, metered).detail,
  /asam/,
);
const disconnected = reduceLab(metered, connectAction);
assert.equal(
  entity(disconnected, meterForFeedback.id).measurements.pH,
  undefined,
);
const readAction: Action = {
  type: "operate",
  id: meterForFeedback.id,
  operation: "measure",
};
const noReading = reduceLab(disconnected, readAction);
assert.match(
  actionFeedback(readAction, disconnected, noReading).title,
  /Belum ada/,
);

const notPoured: Action = { ...pourAction, amount: 0 };
assert.match(
  actionFeedback(
    notPoured,
    selectedAmount,
    reduceLab(selectedAmount, notPoured),
  ).detail,
  /nol/,
);
const launchPendulum = add(initialLab("physics"), "pendulum");
const launchAction: Action = {
  type: "operate",
  id: launchPendulum.id,
  operation: "launch",
};
const launched = reduceLab(launchPendulum.state, launchAction);
assert.equal(
  actionFeedback(launchAction, launchPendulum.state, launched).next,
  "run",
);
assert.equal(
  actionFeedback(launchAction, launchPendulum.state, launched, true).next,
  "observe",
);
const misplaced = actionFeedback(
  { type: "move", id: feedbackBeaker.id, x: 30, y: 30 },
  feedbackBeaker.state,
  reduceLab(feedbackBeaker.state, {
    type: "move",
    id: feedbackBeaker.id,
    x: 30,
    y: 30,
  }),
);
assert.match(misplaced.hint, /tidak menuang atau menyambungkan/);
const overflowFeedback = actionFeedback(
  { type: "pour", source: overflow.id, target: tube.id, amount: 100 },
  tube.state,
  overflowing,
);
assert.match(overflowFeedback.detail, /meluber/);
assert.match(
  observationFeedback(
    overflowing.events.find((e) => e.type === "container.overflow")!,
    overflowing,
  ).detail,
  /meluber/,
);
console.log(
  "Action feedback checks passed: truthful transfers, no-effect recovery, linked readings, disconnect, paused time and overflow.",
);
