import { Entity, LabState, Rule } from "../../lib/sandbox/types";
import { materials } from "../../lib/sandbox/catalog";
import { chemistryRules } from "./rules";
import { emit, join, has, connected } from "../../lib/sandbox/simulation-utils";
import { heatChange, indicatorColor, molarGasVolume, ph, totalMass, totalVolume } from "../../lib/sandbox/measurements";
import { developChromatogram, suspendedMass } from "../../lib/sandbox/separation";
import { canDipLitmus, isLitmus, testedLitmusColor, litmusRed, litmusBlue, litmusExplanation } from "../../lib/sandbox/litmus";

function reaction(s: LabState, e: Entity, r: Rule, dt: number) {
  // TODO-REVIEW-GURU: Q10 kinetics and omitted spectator ions are teaching approximations; validate each reaction family before curricular release.
  const parts = r.trigger.map((id) => e.contents.find((p) => p.material === id));
  if (parts.some((p) => !p || p.mass <= 1e-8)) return;
  if (r.minTemperature !== undefined && e.temperature < r.minTemperature) return;
  if (r.model === "copper-excess" && parts[1]!.moles < 4 * parts[0]!.moles) return;
  if (r.model === "copper-complex" && parts[1]!.moles >= 4 * parts[0]!.moles) return;
  if (["test", "complex", "copper-complex", "copper-excess"].includes(r.model)) {
    if (!e.applied[r.id]) {
      e.color = r.color || e.color;
      e.precipitate = r.precipitate || e.precipitate;
      e.applied[r.id] = 1;
      emit(s, e, r.precipitate ? "precipitate.formed" : r.event, r.observation);
    }
    return;
  }
  if (!r.stoichiometry) return;
  const limit = Math.min(...parts.map((p, i) => r.stoichiometry![i] > 0 ? p!.moles / r.stoichiometry![i] : Infinity));
  const strong = parts.find((p) => p?.material === "hcl1");
  const temperatureFactor = Math.pow(2, (e.temperature - 25) / 10);
  const progress = Math.min(limit, (r.rate || 0.001) * dt * temperatureFactor * (strong ? 3 : 1));
  if (!(progress > 1e-12)) return;
  parts.forEach((p, i) => {
    const n = progress * r.stoichiometry![i];
    p!.moles = Math.max(0, p!.moles - n);
    p!.mass = Math.max(0, p!.mass - n * (materials[p!.material].molarMass || 0));
  });
  for (const [id, ratio] of r.products || []) {
    const moles = progress * ratio;
    const mass = moles * (materials[id]?.molarMass || 100);
    join(e, { material: id, moles, mass, volume: 0 });
  }
  if (r.gas) {
    const mol = progress * (r.gasRatio || 1);
    e.gas += mol;
    e.params.gasMass = (e.params.gasMass || 0) + mol * (materials[r.gas]?.molarMass || 0);
  }
  e.temperature += heatChange(progress * (r.heat || 0), Math.max(1, totalMass(e)));
  if (r.precipitate) e.precipitate = r.precipitate;
  if (r.color) e.color = r.color;
  e.applied[r.id] = (e.applied[r.id] || 0) + progress;
  // Solvent/product water carries the non-gas mass balance; the model does not track every spectator ion.
  const reactedMass = parts.reduce((n, p, i) => n + progress * r.stoichiometry![i] * (materials[p!.material].molarMass || 0), 0);
  const productMass = (r.products || []).reduce((n, [id, ratio]) => n + progress * ratio * (materials[id]?.molarMass || 100), 0);
  const gasMass = r.gas ? progress * (r.gasRatio || 1) * (materials[r.gas]?.molarMass || 0) : 0;
  if (reactedMass > productMass + gasMass) join(e, { material: "water", moles: 0, mass: reactedMass - productMass - gasMass, volume: 0 });
  emit(s, e, r.event, r.observation);
}

export function chemical(s: LabState, e: Entity, dt: number) {
  for (const r of chemistryRules) {
    if (["reaction", "test", "complex", "copper-complex", "copper-excess"].includes(r.model)) {
      reaction(s, e, r, dt);
      continue;
    }
    if (!r.trigger.every((id) => has(e, id) || connected(s, e, id))) continue;
    if (r.model.startsWith("indicator:")) {
      if (r.trigger.some(isLitmus)) continue;
      const color = indicatorColor(r.model.split(":")[1], ph(e));
      if (e.color !== color) { e.color = color; emit(s, e, r.event, r.observation); }
      e.applied[r.id] = 1;
    }
    if (r.model === "layers" && !has(e, "soap")) {
      e.status = "Dua lapisan";
      if (!e.applied[r.id]) emit(s, e, r.event, r.observation);
      e.applied[r.id] = 1;
    }
    if (r.model === "emulsion" && e.params.stirred) {
      e.status = "Emulsi keruh";
      e.color = "#d0d8aa";
      if (!e.applied[r.id]) emit(s, e, r.event, r.observation);
      e.applied[r.id] = 1;
    }
    if (r.model === "miscible") { e.status = "Satu fase cairan"; e.applied[r.id] = 1; }
    if (r.model === "solubility") {
      e.applied[r.id] = 1;
      if (suspendedMass(e) > 0.001) e.status = "Padatan tersisa / jenuh";
    }
    if (r.model === "flame" && s.entities.some((x) => e.connections.includes(x.id) && x.material === "burner" && x.active)) {
      e.color = r.color!;
      e.status = "Nyala berwarna";
      e.applied[r.id] = 1;
      emit(s, e, r.event, r.observation);
    }
    if (r.model === "combustion" && connected(s, e, "burner") && s.entities.some((x) => x.material === "burner" && x.active)) {
      const p = e.contents.find((x) => x.material === "mg")!;
      const n = Math.min(p.moles, 0.001 * dt);
      p.moles -= n;
      p.mass -= n * 24.31;
      join(e, { material: "mgo", moles: n, mass: n * 40.3, volume: 0 });
      e.precipitate = "mgo";
      e.status = "Nyala putih virtual";
      e.applied[r.id] = 1;
      emit(s, e, r.event, r.observation);
    }
    if (r.model === "fruit-battery") { e.measurements["Tegangan sel (V)"] = 0.9; e.applied[r.id] = 1; }
    if (r.model === "electrolysis" || r.model === "electrolysis-copper") {
      const device = s.entities.find((x) => e.connections.includes(x.id) && x.material === "electrolysis" && x.active);
      if (!device) continue;
      const charge = Math.max(0, device.params.voltage / Math.max(1, device.params.resistance)) * dt;
      if (r.model === "electrolysis") {
        const h2 = charge / (2 * 96485);
        e.measurements["H₂ katoda (mL)"] = (e.measurements["H₂ katoda (mL)"] || 0) + h2 * molarGasVolume(e.temperature);
        e.measurements["O₂ anoda (mL)"] = e.measurements["H₂ katoda (mL)"] / 2;
      } else {
        const deposit = (charge / (2 * 96485)) * 63.55;
        e.measurements["Cu katoda (g)"] = (e.measurements["Cu katoda (g)"] || 0) + deposit;
        e.measurements["Cu anoda hilang (g)"] = device.params.polarity > 0 ? e.measurements["Cu katoda (g)"] : 0;
      }
      e.applied[r.id] = (e.applied[r.id] || 0) + charge;
    }
  }
  // TODO-REVIEW-GURU: dissolution and complex equilibria are qualitative except listed solubility limits.
  const max = materials[e.material]?.capacity || Infinity;
  const volume = totalVolume(e);
  if (volume > max) {
    const keep = max / volume;
    e.contents.forEach((p) => { p.mass *= keep; p.moles *= keep; p.volume *= keep; });
    e.status = "Meluber";
    emit(s, e, "container.overflow", "Cairan meluber; sebagian isi keluar dari wadah.");
  }
  e.measurements["pH"] = ph(e);
  e.measurements["Suhu (°C)"] = e.temperature;
  e.measurements["Volume (mL)"] = totalVolume(e);
  e.measurements["Padatan tak larut (g)"] = suspendedMass(e);
  e.measurements["Massa isi (g)"] = totalMass(e) + (e.sealed ? e.params.gasMass || 0 : 0);
  e.measurements["Gas terbentuk (mL)"] = e.gas * molarGasVolume(e.temperature);
  const ions = e.contents.reduce((n, p) => n + (materials[p.material]?.ions || 0) * p.moles, 0);
  const weak = e.contents.reduce((n, p) => n + (materials[p.material]?.ka || materials[p.material]?.kb
    ? Math.sqrt(1.8e-5 * Math.max(0, p.moles / Math.max(0.001, totalVolume(e) / 1000))) : 0), 0);
  e.measurements["Daya hantar relatif"] = ions > 1e-7
    ? Math.min(100, (100 * ions) / Math.max(0.001, totalVolume(e) / 1000))
    : weak > 0 ? Math.min(25, weak * 1000) : 0;
}

export function chromatography(s: LabState, e: Entity, dt: number) {
  const solvent = s.entities.find((x) => e.connections.includes(x.id) && materials[x.material]?.kind === "container");
  const previous = e.status;
  developChromatogram(e, solvent, dt);
  if (previous !== e.status) emit(s, e, "observation.changed", e.status);
  if (e.measurements["Rf pigmen 1 model"] !== undefined) e.applied["separate-chromatography"] = 1;
}

export function testLitmus(s: LabState, e: Entity) {
  const vessel = s.entities.find((v) => e.connections.includes(v.id) && canDipLitmus(v));
  if (!vessel) return;
  const currentColor = e.color === litmusRed || e.color === litmusBlue ? e.color : materials[e.material].color!;
  const pH = ph(vessel);
  const nextColor = testedLitmusColor(pH, currentColor);
  const changed = nextColor !== e.color;
  const condition = pH <= 4.5 ? -1 : pH >= 8.3 ? 1 : 0;
  if (e.params.litmusTested !== 1 || changed || e.params.litmusCondition !== condition) {
    e.params.litmusBefore = currentColor === litmusRed ? 0 : 1;
    e.params.litmusAfter = nextColor === litmusRed ? 0 : 1;
    e.params.litmusCondition = condition;
    e.params.litmusTested = 1;
  }
  const nextStatus = nextColor === litmusRed ? "Kertas lakmus berwarna merah" : "Kertas lakmus berwarna biru";
  const explanation = litmusExplanation(e);
  if (changed || e.status !== nextStatus) emit(s, e, changed ? "indicator.changed" : "observation.unchanged", explanation ? `${explanation.summary} ${explanation.reason}` : "Warna kertas lakmus tetap.");
  e.color = nextColor;
  e.status = nextStatus;
}
