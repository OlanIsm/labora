import { Entity, LabState } from "../../lib/sandbox/types";
import { materials } from "../../lib/sandbox/catalog";
import { indicatorColor, molarGasVolume, punnett } from "../../lib/sandbox/measurements";
import { has } from "../../lib/sandbox/simulation-utils";

export function biology(s: LabState, e: Entity, dt: number, model: string) {
  // TODO-REVIEW-GURU: growth, enzymes, transpiration and aquarium values are relative teaching models, not calibrated biological measurements.
  const p = e.params;
  const temp = e.temperature;
  const t = p.time;
  const linked = s.entities.filter((x) => e.connections.includes(x.id));
  const sample = linked.find((x) => ["onion", "cheek", "elodea", "paramecium", "yeast-slide", "stomata", "blood"].includes(x.material));
  if (model === "microscope" || model === "stain") {
    e.measurements["Perbesaran (×)"] = p.magnification;
    e.measurements["Ketajaman relatif"] = Math.max(0, 1 - Math.abs(p.focus) / 10) * Math.min(1, p.light / 50);
    e.status = sample ? materials[sample.material].name : materials[e.material].name;
  }
  const activity = Math.max(0, Math.min(1, (temp + 5) / 35)) *
    Math.max(0, 1 - Math.max(0, temp - 40) / 20) * Math.max(0, 1 - Math.abs(p.ph - 7) / 5);
  if (model === "osmosis") {
    const osmoticPressure = 8.314 * (temp + 273.15) * p.concentration * 1000;
    // TODO-REVIEW-GURU: tissue permeability and isotonic concentration are illustrative, not cultivar measurements.
    const relative = Math.max(-0.3, Math.min(0.3, (0.15 - p.concentration) * 0.05 * t));
    Object.assign(e.measurements, {
      "Massa sampel (g)": p.mass * 1000 * (1 + relative),
      "Tekanan osmotik (Pa)": osmoticPressure, "Perubahan massa (%)": relative * 100,
    });
    e.status = p.concentration > 0.15 ? "Plasmolisis / jaringan lunak" : p.concentration === 0.15 ? "Isotonik" : "Turgid / jaringan kaku";
  }
  if (model === "photosynthesis") {
    // TODO-REVIEW-GURU: relative oxygen rate is a saturating teaching model, not a calibrated plant prediction.
    const light = p.light / Math.max(0.01, p.distance * p.distance);
    const bicarbonate = linked.some((x) => has(x, "nahco3")) ? 1.5 : 1;
    const rate = (light / (light + 100)) * activity * bicarbonate * (p.polarity < 0 ? 0.3 : 1);
    e.measurements["Laju O₂ relatif"] = rate;
    e.measurements["O₂ relatif terkumpul"] = (e.measurements["O₂ relatif terkumpul"] || 0) + (e.active ? rate * dt : 0);
    e.status = rate === 0 ? "Tidak ada gelembung" : "Gelembung O₂ teramati";
  }
  if (model === "fermentation") {
    const sugar = e.contents.find((x) => x.material === "glucose" || x.material === "sucrose");
    const yeast = has(e, "yeast");
    const rate = yeast && sugar && temp < 60 ? Math.min(sugar.moles, activity * 0.00002 * dt) : 0;
    if (sugar) {
      sugar.moles -= rate;
      sugar.mass = Math.max(0, sugar.mass - rate * (materials[sugar.material].molarMass || 180));
    }
    e.gas += rate * 2;
    e.measurements["CO₂ (mL)"] = e.gas * molarGasVolume(temp);
    e.status = temp >= 60 ? "Ragi tidak aktif" : rate > 0 ? "Balon bertambah besar" : "Tidak ada gas teramati";
  }
  if (model === "catalase") {
    const liver = linked.some((x) => x.material === "liver") || e.material === "liver";
    const boiled = linked.some((x) => x.material === "boiled-liver") || e.material === "boiled-liver";
    const vessel = has(e, "h2o2") ? e : linked.find((x) => has(x, "h2o2"));
    const substrate = vessel?.contents.find((x) => x.material === "h2o2");
    const rate = liver && !boiled && substrate ? activity : 0;
    e.measurements["Aktivitas katalase relatif"] = rate;
    const consumed = Math.min(substrate?.moles || 0, rate * 0.001 * dt);
    if (substrate) {
      substrate.moles -= consumed;
      substrate.mass = Math.max(0, substrate.mass - consumed * 34.01);
    }
    e.gas += consumed / 2;
    e.measurements["O₂ terukur (mL)"] = e.gas * molarGasVolume(temp);
    e.status = rate > 0.05 ? "Busa O₂ teramati" : "Tidak ada busa teramati";
  }
  if (model === "amylase") {
    p.converted = Math.min(1, (p.converted || 0) + activity * dt * 0.005);
    e.measurements["Amilum tersisa (%)"] = 100 * (1 - p.converted);
    e.measurements["Gula pereduksi relatif (%)"] = 100 * p.converted;
    e.color = p.converted > 0.95 ? "#d5edf7" : "#2d3455";
  }
  if (model === "food") {
    const iodine = has(e, "iodine") || linked.some((x) => has(x, "iodine"));
    const benedict = has(e, "benedict") || linked.some((x) => has(x, "benedict"));
    const biuret = has(e, "biuret") || linked.some((x) => has(x, "biuret"));
    if (iodine && ["rice", "bread"].includes(e.material)) e.color = "#2d3455";
    if (benedict && temp >= 70 && ["apple", "milk"].includes(e.material)) e.color = "#ad572d";
    if (biuret && ["milk", "egg"].includes(e.material)) e.color = "#765394";
    e.status = "Warna sampel teramati";
  }
  if (model === "growth") {
    const grow = e.active && p.water > 0 && temp > 10 && temp < 45;
    const dark = p.light === 0;
    const rate = grow ? dt * 0.01 : 0;
    p.height = (p.height || 0) + rate * (dark ? 1.7 : 1);
    e.measurements["Tinggi relatif"] = p.height || 0;
    e.measurements["Arah tumbuh (°)"] = p.angle;
    e.status = p.water <= 0 ? "Tidak berkecambah" : dark ? "Pucat · etiolasi" : "Hijau · kompak";
  }
  if (model === "transpiration") {
    const rate = Math.max(0, (p.light / 100) * (1 + p.wind) * (1 - p.humidity / 100) * (1 + Math.max(-20, temp - 25) / 30));
    e.measurements["Laju transpirasi relatif"] = rate;
    e.measurements["Air terkumpul relatif"] = (e.measurements["Air terkumpul relatif"] || 0) + (e.active ? rate * dt : 0);
    e.measurements["Gerak gelembung potometer relatif"] = rate * t;
    e.status = rate > 0 ? "Embun teramati" : "Tidak ada embun baru";
  }
  if (model === "genetics") {
    const counts = punnett(p.genotype === 1, p.topology === 1, p.seed);
    counts.forEach((n, i) => (e.measurements[`Fenotipe ${i + 1} (dari 160)`] = n));
    e.status = p.genotype === 1 ? "Dihibrid" : "Monohibrid";
  }
  if (model === "ecosystem") {
    const produced = (p.light / (p.light + 100)) * p.plants * 0.08;
    const consumed = p.fish * 0.03 + p.feed * 0.01;
    e.params.oxygen = Math.max(0, Math.min(14, (p.oxygen ?? 8) + (e.active ? (produced - consumed) * dt : 0)));
    e.measurements["O₂ relatif"] = e.params.oxygen;
    e.measurements["CO₂ relatif"] = 14 - e.params.oxygen;
    e.status = e.params.oxygen < 3 ? "Ikan stres · O₂ rendah" : "Ikan tenang";
  }
  if (model === "soil") {
    e.measurements["pH tanah"] = p.ph;
    e.measurements["Pertumbuhan relatif"] = Math.max(0, 1 - Math.abs(p.ph - 7) / 5);
    e.color = indicatorColor("cabbage", p.ph);
  }
}
