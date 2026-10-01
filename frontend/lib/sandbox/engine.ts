import { Action, Entity, LabState, Portion, Rule } from "./types";
import { catalog, defaultParams, materials } from "./catalog";
import { rules } from "./rules";
import {
  developChromatogram,
  separate,
  suspendedMass,
  vaporize,
} from "./separation";
import {
  buoyancy,
  G,
  heatChange,
  equilibriumTemperature,
  mixtureHeatCapacity,
  indicatorColor,
  lens,
  molarGasVolume,
  ohm,
  pendulum,
  ph,
  projectile,
  punnett,
  snell,
  totalMass,
  totalVolume,
} from "./measurements";

export const initialLab = (
  discipline: LabState["discipline"] = "chemistry",
): LabState => ({
  version: 1,
  discipline,
  environment: { temperature: 25, pressure: 1, gravity: G },
  time: 0,
  nextId: 1,
  seed: 42,
  entities: [],
  events: [],
  notes: [],
  samples: [],
});
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const finite = (value: number, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;
const positive = (value: number) => Math.max(0, finite(value));
function emit(
  s: LabState,
  e: Entity,
  type: LabState["events"][number]["type"],
  message: string,
) {
  const last = [...s.events].reverse().find((x) => x.entity === e.id);
  if (last?.message === message && s.time - last.time < 5) return;
  s.events.push({ id: s.nextId++, time: s.time, type, entity: e.id, message });
  s.events = s.events.slice(-100);
}
function portion(id: string, amount: number): Portion {
  const m = materials[id];
  const liquid = m.phase === "liquid";
  const mass = liquid ? amount * (m.density || 1) : amount;
  return {
    material: id,
    moles:
      liquid && m.concentration
        ? (m.concentration * amount) / 1000
        : mass / (m.molarMass || 100),
    mass,
    volume: liquid ? amount : amount / (m.density || 2),
  };
}
function join(e: Entity, p: Portion) {
  const existing = e.contents.find((x) => x.material === p.material);
  if (existing) {
    existing.moles += p.moles;
    existing.mass += p.mass;
    existing.volume += p.volume;
  } else e.contents.push({ ...p });
}
function has(e: Entity, id: string) {
  return e.contents.some(
    (p) => p.material === id && (p.moles > 1e-10 || p.mass > 1e-8),
  );
}
function connected(s: LabState, e: Entity, id: string) {
  return e.connections.some(
    (k) => s.entities.find((x) => x.id === k)?.material === id,
  );
}
function reaction(s: LabState, e: Entity, r: Rule, dt: number) {
  // TODO-REVIEW-GURU: Q10 kinetics and omitted spectator ions are teaching approximations; validate each reaction family before curricular release.
  const parts = r.trigger.map((id) =>
    e.contents.find((p) => p.material === id),
  );
  if (parts.some((p) => !p || p.mass <= 1e-8)) return;
  if (r.minTemperature !== undefined && e.temperature < r.minTemperature)
    return;
  if (r.model === "copper-excess" && parts[1]!.moles < 4 * parts[0]!.moles)
    return;
  if (r.model === "copper-complex" && parts[1]!.moles >= 4 * parts[0]!.moles)
    return;
  if (
    ["test", "complex", "copper-complex", "copper-excess"].includes(r.model)
  ) {
    if (!e.applied[r.id]) {
      e.color = r.color || e.color;
      e.precipitate = r.precipitate || e.precipitate;
      e.applied[r.id] = 1;
      emit(s, e, r.precipitate ? "precipitate.formed" : r.event, r.observation);
    }
    return;
  }
  if (!r.stoichiometry) return;
  const limit = Math.min(
    ...parts.map((p, i) =>
      r.stoichiometry![i] > 0 ? p!.moles / r.stoichiometry![i] : Infinity,
    ),
  );
  const strong = parts.find((p) => p?.material === "hcl1");
  const temperatureFactor = Math.pow(2, (e.temperature - 25) / 10);
  const progress = Math.min(
    limit,
    (r.rate || 0.001) * dt * temperatureFactor * (strong ? 3 : 1),
  );
  if (!(progress > 1e-12)) return;
  parts.forEach((p, i) => {
    const n = progress * r.stoichiometry![i];
    p!.moles = Math.max(0, p!.moles - n);
    p!.mass = Math.max(
      0,
      p!.mass - n * (materials[p!.material].molarMass || 0),
    );
  });
  for (const [id, ratio] of r.products || []) {
    const moles = progress * ratio;
    const mass = moles * (materials[id]?.molarMass || 100);
    join(e, { material: id, moles, mass, volume: 0 });
  }
  if (r.gas) {
    const mol = progress * (r.gasRatio || 1);
    e.gas += mol;
    e.params.gasMass =
      (e.params.gasMass || 0) + mol * (materials[r.gas]?.molarMass || 0);
  }
  e.temperature += heatChange(
    progress * (r.heat || 0),
    Math.max(1, totalMass(e)),
  );
  if (r.precipitate) e.precipitate = r.precipitate;
  if (r.color) e.color = r.color;
  e.applied[r.id] = (e.applied[r.id] || 0) + progress;
  // Solvent/product water carries the non-gas mass balance; the model does not track every spectator ion.
  const reactedMass = parts.reduce(
    (n, p, i) =>
      n +
      progress * r.stoichiometry![i] * (materials[p!.material].molarMass || 0),
    0,
  );
  const productMass = (r.products || []).reduce(
    (n, [id, ratio]) =>
      n + progress * ratio * (materials[id]?.molarMass || 100),
    0,
  );
  const gasMass = r.gas
    ? progress * (r.gasRatio || 1) * (materials[r.gas]?.molarMass || 0)
    : 0;
  if (reactedMass > productMass + gasMass)
    join(e, {
      material: "water",
      moles: 0,
      mass: reactedMass - productMass - gasMass,
      volume: 0,
    });
  emit(s, e, r.event, r.observation);
}
function chemical(s: LabState, e: Entity, dt: number) {
  for (const r of rules.filter((r) => r.discipline === "chemistry")) {
    if (
      [
        "reaction",
        "test",
        "complex",
        "copper-complex",
        "copper-excess",
      ].includes(r.model)
    ) {
      reaction(s, e, r, dt);
      continue;
    }
    if (!r.trigger.every((id) => has(e, id) || connected(s, e, id))) continue;
    if (r.model.startsWith("indicator:")) {
      const color = indicatorColor(r.model.split(":")[1], ph(e));
      if (e.color !== color) {
        e.color = color;
        emit(s, e, r.event, r.observation);
      }
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
    if (r.model === "miscible") {
      e.status = "Satu fase cairan";
      e.applied[r.id] = 1;
    }
    if (r.model === "solubility") {
      e.applied[r.id] = 1;
      if (suspendedMass(e) > 0.001) e.status = "Padatan tersisa / jenuh";
    }
    if (
      r.model === "flame" &&
      s.entities.some(
        (x) =>
          e.connections.includes(x.id) && x.material === "burner" && x.active,
      )
    ) {
      e.color = r.color!;
      e.status = "Nyala berwarna";
      e.applied[r.id] = 1;
      emit(s, e, r.event, r.observation);
    }
    if (
      r.model === "combustion" &&
      connected(s, e, "burner") &&
      s.entities.some((x) => x.material === "burner" && x.active)
    ) {
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
    if (r.model === "fruit-battery") {
      e.measurements["Tegangan sel (V)"] = 0.9;
      e.applied[r.id] = 1;
    }
    if (r.model === "electrolysis" || r.model === "electrolysis-copper") {
      const device = s.entities.find(
        (x) =>
          e.connections.includes(x.id) &&
          x.material === "electrolysis" &&
          x.active,
      );
      if (!device) continue;
      const charge =
        Math.max(
          0,
          device.params.voltage / Math.max(1, device.params.resistance),
        ) * dt;
      if (r.model === "electrolysis") {
        const h2 = charge / (2 * 96485);
        e.measurements["H₂ katoda (mL)"] =
          (e.measurements["H₂ katoda (mL)"] || 0) +
          h2 * molarGasVolume(e.temperature);
        e.measurements["O₂ anoda (mL)"] = e.measurements["H₂ katoda (mL)"] / 2;
      } else {
        const deposit = (charge / (2 * 96485)) * 63.55;
        e.measurements["Cu katoda (g)"] =
          (e.measurements["Cu katoda (g)"] || 0) + deposit;
        e.measurements["Cu anoda hilang (g)"] =
          device.params.polarity > 0 ? e.measurements["Cu katoda (g)"] : 0;
      }
      e.applied[r.id] = (e.applied[r.id] || 0) + charge;
    }
  }
  // TODO-REVIEW-GURU: dissolution and complex equilibria are qualitative except listed solubility limits.
  const max = materials[e.material]?.capacity || Infinity;
  const volume = totalVolume(e);
  if (volume > max) {
    const keep = max / volume;
    e.contents.forEach((p) => {
      p.mass *= keep;
      p.moles *= keep;
      p.volume *= keep;
    });
    e.status = "Meluber";
    emit(
      s,
      e,
      "container.overflow",
      "Cairan meluber; sebagian isi keluar dari wadah.",
    );
  }
  e.measurements["pH"] = ph(e);
  e.measurements["Suhu (°C)"] = e.temperature;
  e.measurements["Volume (mL)"] = totalVolume(e);
  e.measurements["Padatan tak larut (g)"] = suspendedMass(e);
  e.measurements["Massa isi (g)"] =
    totalMass(e) + (e.sealed ? e.params.gasMass || 0 : 0);
  e.measurements["Gas terbentuk (mL)"] = e.gas * molarGasVolume(e.temperature);
  const ions = e.contents.reduce(
    (n, p) => n + (materials[p.material]?.ions || 0) * p.moles,
    0,
  );
  const weak = e.contents.reduce(
    (n, p) =>
      n +
      (materials[p.material]?.ka || materials[p.material]?.kb
        ? Math.sqrt(
            1.8e-5 *
              Math.max(0, p.moles / Math.max(0.001, totalVolume(e) / 1000)),
          )
        : 0),
    0,
  );
  e.measurements["Daya hantar relatif"] =
    ions > 1e-7
      ? Math.min(100, (100 * ions) / Math.max(0.001, totalVolume(e) / 1000))
      : weak > 0
        ? Math.min(25, weak * 1000)
        : 0;
}
function physics(s: LabState, e: Entity, dt: number, model: string) {
  const p = e.params;
  const t = p.time || 0;
  const rad = (p.angle * Math.PI) / 180;
  const m = Math.max(0.001, p.mass);
  if (model === "incline" || model === "friction") {
    const a = Math.max(0, G * (Math.sin(rad) - p.friction * Math.cos(rad)));
    const v = a * t;
    Object.assign(e.measurements, {
      "Percepatan (m/s²)": a,
      "Posisi (m)": 0.5 * a * t * t,
      "Kecepatan (m/s)": v,
      "Energi kinetik (J)": 0.5 * m * v * v,
      "Kalor gesekan (J)": p.friction * m * G * Math.cos(rad) * 0.5 * a * t * t,
    });
    e.status = a === 0 ? "Diam" : "Bergerak";
  }
  if (model === "newton")
    Object.assign(e.measurements, {
      "Percepatan (m/s²)": p.force / m,
      "Gaya (N)": p.force,
      "Posisi (m)": ((0.5 * p.force) / m) * t * t,
    });
  if (model === "fall")
    Object.assign(e.measurements, {
      "Jarak jatuh (m)": 0.5 * G * t * t,
      "Kecepatan (m/s)": G * t,
    });
  if (model === "projectile") {
    const values = projectile(p.speed, p.angle);
    const elapsed = Math.min(t, values.duration);
    const drag =
      p.friction > 0 && p.topology === 1 ? Math.exp(-p.friction * elapsed) : 1;
    Object.assign(e.measurements, {
      "Jangkauan ideal (m)": values.range,
      "Tinggi maksimum (m)": values.height,
      "Waktu terbang (s)": values.duration,
      "x (m)": p.speed * Math.cos(rad) * elapsed * drag,
      "y (m)": Math.max(
        0,
        (p.speed * Math.sin(rad) * elapsed - 0.5 * G * elapsed * elapsed) *
          drag,
      ),
    });
  }
  if (model === "spring") {
    const k =
      p.topology === 1
        ? p.spring / 2
        : p.topology === 2
          ? p.spring * 2
          : p.spring;
    Object.assign(e.measurements, {
      "k efektif (N/m)": k,
      "Pertambahan panjang (m)": p.force / Math.max(0.001, k),
      "Periode (s)": 2 * Math.PI * Math.sqrt(m / Math.max(0.001, k)),
      "Energi pegas (J)": (p.force * p.force) / (2 * Math.max(0.001, k)),
    });
  }
  if (model === "pendulum")
    Object.assign(e.measurements, {
      "Periode (s)": pendulum(p.length, p.amplitude),
      "Sudut saat ini (°)":
        p.amplitude *
        Math.cos(
          (2 * Math.PI * t) / Math.max(0.01, pendulum(p.length, p.amplitude)),
        ),
    });
  if (model === "collision") {
    const n = Math.max(0.001, p.mass2);
    const v1 =
      (m * p.speed + n * p.speed2 - n * p.restitution * (p.speed - p.speed2)) /
      (m + n);
    const v2 =
      (m * p.speed + n * p.speed2 + m * p.restitution * (p.speed - p.speed2)) /
      (m + n);
    Object.assign(e.measurements, {
      "v₁ akhir (m/s)": v1,
      "v₂ akhir (m/s)": v2,
      "Momentum (kg m/s)": m * p.speed + n * p.speed2,
      "EK awal (J)": 0.5 * m * p.speed ** 2 + 0.5 * n * p.speed2 ** 2,
      "EK akhir (J)": 0.5 * m * v1 * v1 + 0.5 * n * v2 * v2,
    });
  }
  if (model === "buoyancy") {
    const volume = m / Math.max(1, p.density);
    const up = buoyancy(p.fluidDensity, volume);
    Object.assign(e.measurements, {
      "Gaya apung maksimum (N)": up,
      "Berat (N)": m * G,
      "Berat semu (N)": Math.max(0, m * G - up),
      "Volume benda (m³)": volume,
    });
    e.status =
      p.density < p.fluidDensity
        ? "Terapung"
        : p.density === p.fluidDensity
          ? "Melayang"
          : "Tenggelam";
  }
  if (model === "hydrostatic")
    Object.assign(e.measurements, {
      "Tekanan (Pa)": p.fluidDensity * G * p.depth,
      "Tinggi kolom kedua (m)": (p.depth * p.fluidDensity) / 1000,
      "Gaya keluaran (N)": (p.force * p.mass2) / Math.max(0.001, p.mass),
    });
  if (model === "heat") {
    if (e.active) e.temperature += (p.power * dt) / (m * 4180);
    e.measurements["Q masuk (J)"] =
      (e.measurements["Q masuk (J)"] || 0) + (e.active ? p.power * dt : 0);
    e.measurements["Suhu campuran ideal (°C)"] =
      (m * 4180 * e.temperature +
        Math.max(0.001, p.mass2) * 900 * p.amplitude) /
      (m * 4180 + Math.max(0.001, p.mass2) * 900);
  }
  if (model === "phase") {
    p.energy = (p.energy || 0) + (e.active ? p.power * dt : 0);
    const q = p.energy / m;
    e.temperature =
      q < 334000 ? 0 : q < 334000 + 418000 ? (q - 334000) / 4180 : 100;
    e.measurements["Fraksi cair"] = Math.min(1, q / 334000);
    e.measurements["Fraksi uap"] = Math.max(
      0,
      Math.min(1, (q - 752000) / 2260000),
    );
    e.status =
      q < 334000 ? "Es mencair" : q < 752000 ? "Air memanas" : "Air mendidih";
  }
  if (model === "expansion")
    Object.assign(e.measurements, {
      "Pemuaian panjang (m)": 23e-6 * p.length * (e.temperature - 25),
      "Laju konduksi relatif":
        (205 * Math.abs(e.temperature - 25)) / Math.max(0.01, p.length),
    });
  if (model === "radiation")
    e.measurements["Daya radiasi (W/m²)"] =
      5.670374419e-8 *
      (p.polarity > 0 ? 0.95 : 0.2) *
      ((e.temperature + 273.15) ** 4 -
        (s.environment.temperature + 273.15) ** 4);
  if (model === "circuit" || model === "led" || model === "rc") {
    const network = s.entities.filter(
      (x) => x.id === e.id || e.connections.includes(x.id),
    );
    const supply = network.find((x) => x.material === "battery") || e;
    const loads = network.filter((x) =>
      ["resistor", "rheostat", "lamp"].includes(x.material),
    );
    const closed =
      e.active &&
      network.some((x) => x.material === "wire") &&
      !network.some((x) => x.material === "switch" && !x.active);
    const resistances = loads.map((x) => Math.max(0.001, x.params.resistance));
    const resistance =
      p.topology === 2
        ? resistances.length
          ? 1 / resistances.reduce((n, r) => n + 1 / r, 0)
          : 0.01
        : resistances.reduce((n, r) => n + r, 0) || 0.01;
    let current = closed ? ohm(supply.params.voltage, resistance) : 0;
    const fuse = network.find((x) => x.material === "fuse");
    if (current > 5 && fuse) {
      fuse.status = "Sekring putus";
      current = 0;
      emit(
        s,
        fuse,
        "fuse.blown",
        "Sekring putus. Ganti sekring atau reset meja.",
      );
    }
    if (fuse?.status === "Sekring putus") current = 0;
    if (closed && resistance < 0.1) {
      e.status = "Korsleting virtual";
      emit(
        s,
        e,
        "circuit.short",
        "Korsleting teramati; sumber daya memanas secara virtual.",
      );
    }
    if (
      current > 0 &&
      loads.some((x) => x.material === "lamp") &&
      supply.params.voltage > 12
    ) {
      network
        .filter((x) => x.material === "lamp")
        .forEach((x) => (x.status = "Lampu putus"));
      emit(s, e, "lamp.broken", "Lampu putus karena tegangan terlalu tinggi.");
      current = 0;
    }
    if (model === "led") {
      current =
        p.polarity < 0
          ? 0
          : closed
            ? Math.max(
                0,
                (supply.params.voltage - 2) / Math.max(0.001, resistance),
              )
            : 0;
      e.status =
        current > 0.025
          ? "LED rusak virtual"
          : current > 0
            ? "LED menyala"
            : "LED padam";
    }
    if (model === "rc") {
      const tau = Math.max(0.000001, p.resistance * p.capacitance);
      e.measurements["Tegangan kapasitor (V)"] =
        p.voltage *
        (p.polarity > 0 ? 1 - Math.exp(-t / tau) : Math.exp(-t / tau));
      e.measurements["Konstanta waktu RC (s)"] = tau;
    }
    Object.assign(e.measurements, {
      "Arus (A)": current,
      "Tegangan (V)": supply.params.voltage,
      "Hambatan efektif (Ω)": resistance,
      "Daya (W)": current * supply.params.voltage,
    });
    e.measurements["Energi (J)"] =
      (e.measurements["Energi (J)"] || 0) +
      current * supply.params.voltage * dt;
    if (!e.status.includes("putus") && !e.status.includes("Korsleting"))
      e.status =
        closed && current > 0 ? "Rangkaian tertutup" : "Rangkaian terbuka";
  }
  if (model === "magnet") {
    const opposite =
      p.polarity *
        (s.entities.find((x) => e.connections.includes(x.id))?.params
          .polarity || 1) <
      0;
    e.status = opposite ? "Tarik-menarik" : "Tolak-menolak";
    e.measurements["Arah kompas (°)"] = p.polarity > 0 ? 0 : 180;
  }
  if (model === "induction") {
    Object.assign(e.measurements, {
      "GGL induksi relatif (V)": p.turns * p.motion * 0.001,
      "Kekuatan elektromagnet relatif": p.turns * ohm(p.voltage, p.resistance),
    });
    e.status =
      p.motion === 0 ? "Magnet diam · GGL nol" : "Galvanometer menyimpang";
  }
  if (model === "reflection") e.measurements["Sudut pantul (°)"] = p.angle;
  if (model === "snell" || model === "dispersion") {
    const refracted = snell(p.n1, p.n2, p.angle);
    e.measurements["Sudut bias (°)"] = refracted === null ? -1 : refracted;
    e.status =
      refracted === null
        ? "Pemantulan sempurna"
        : model === "dispersion"
          ? "Spektrum cahaya putih"
          : "Sinar dibiaskan";
    e.measurements["Sudut kritis (°)"] =
      p.n1 > p.n2 ? (Math.asin(p.n2 / p.n1) * 180) / Math.PI : 90;
  }
  if (model === "lens") {
    const image = lens(p.focal, p.distance);
    Object.assign(e.measurements, {
      "Jarak bayangan (m)": Number.isFinite(image.distance)
        ? image.distance
        : 1e6,
      Perbesaran: Number.isFinite(image.magnification)
        ? image.magnification
        : 1e6,
      "Perbesaran teleskop": Math.abs(p.focal / Math.max(0.001, p.length)),
    });
    e.status =
      image.distance > 0
        ? "Bayangan nyata · terbalik"
        : "Bayangan maya · tegak";
  }
  if (model === "wave")
    Object.assign(e.measurements, {
      "Cepat rambat (m/s)": p.frequency * p.wavelength,
      "Frekuensi dasar (Hz)":
        (p.frequency * p.wavelength) / (2 * Math.max(0.001, p.length)),
    });
  if (model === "sound")
    Object.assign(e.measurements, {
      "Nada teramati (Hz)": (p.frequency * 343) / Math.max(1, 343 - p.motion),
      "Panjang resonansi (m)": 343 / (4 * Math.max(1, p.frequency)),
      "Bunyi di medium": p.fluidDensity === 0 ? 0 : 1,
    });
}
function biology(s: LabState, e: Entity, dt: number, model: string) {
  // TODO-REVIEW-GURU: growth, enzymes, transpiration and aquarium values are relative teaching models, not calibrated biological measurements.
  const p = e.params;
  const temp = e.temperature;
  const t = p.time;
  const linked = s.entities.filter((x) => e.connections.includes(x.id));
  const sample = linked.find((x) =>
    [
      "onion",
      "cheek",
      "elodea",
      "paramecium",
      "yeast-slide",
      "stomata",
      "blood",
    ].includes(x.material),
  );
  if (model === "microscope" || model === "stain") {
    e.measurements["Perbesaran (×)"] = p.magnification;
    e.measurements["Ketajaman relatif"] =
      Math.max(0, 1 - Math.abs(p.focus) / 10) * Math.min(1, p.light / 50);
    e.status = sample
      ? materials[sample.material].name
      : materials[e.material].name;
  }
  const activity =
    Math.max(0, Math.min(1, (temp + 5) / 35)) *
    Math.max(0, 1 - Math.max(0, temp - 40) / 20) *
    Math.max(0, 1 - Math.abs(p.ph - 7) / 5);
  if (model === "osmosis") {
    const osmoticPressure = 8.314 * (temp + 273.15) * p.concentration * 1000;
    // TODO-REVIEW-GURU: tissue permeability and isotonic concentration are illustrative, not cultivar measurements.
    const relative = Math.max(
      -0.3,
      Math.min(0.3, (0.15 - p.concentration) * 0.05 * t),
    );
    Object.assign(e.measurements, {
      "Massa sampel (g)": p.mass * 1000 * (1 + relative),
      "Tekanan osmotik (Pa)": osmoticPressure,
      "Perubahan massa (%)": relative * 100,
    });
    e.status =
      p.concentration > 0.15
        ? "Plasmolisis / jaringan lunak"
        : p.concentration === 0.15
          ? "Isotonik"
          : "Turgid / jaringan kaku";
  }
  if (model === "photosynthesis") {
    // TODO-REVIEW-GURU: relative oxygen rate is a saturating teaching model, not a calibrated plant prediction.
    const light = p.light / Math.max(0.01, p.distance * p.distance);
    const bicarbonate = linked.some((x) => has(x, "nahco3")) ? 1.5 : 1;
    const rate =
      (light / (light + 100)) *
      activity *
      bicarbonate *
      (p.polarity < 0 ? 0.3 : 1);
    e.measurements["Laju O₂ relatif"] = rate;
    e.measurements["O₂ relatif terkumpul"] =
      (e.measurements["O₂ relatif terkumpul"] || 0) +
      (e.active ? rate * dt : 0);
    e.status = rate === 0 ? "Tidak ada gelembung" : "Gelembung O₂ teramati";
  }
  if (model === "fermentation") {
    const sugar = e.contents.find(
      (x) => x.material === "glucose" || x.material === "sucrose",
    );
    const yeast = has(e, "yeast");
    const rate =
      yeast && sugar && temp < 60
        ? Math.min(sugar.moles, activity * 0.00002 * dt)
        : 0;
    if (sugar) {
      sugar.moles -= rate;
      sugar.mass = Math.max(
        0,
        sugar.mass - rate * (materials[sugar.material].molarMass || 180),
      );
    }
    e.gas += rate * 2;
    e.measurements["CO₂ (mL)"] = e.gas * molarGasVolume(temp);
    e.status =
      temp >= 60
        ? "Ragi tidak aktif"
        : rate > 0
          ? "Balon bertambah besar"
          : "Tidak ada gas teramati";
  }
  if (model === "catalase") {
    const liver =
      linked.some((x) => x.material === "liver") || e.material === "liver";
    const boiled =
      linked.some((x) => x.material === "boiled-liver") ||
      e.material === "boiled-liver";
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
    const benedict =
      has(e, "benedict") || linked.some((x) => has(x, "benedict"));
    const biuret = has(e, "biuret") || linked.some((x) => has(x, "biuret"));
    if (iodine && ["rice", "bread"].includes(e.material)) e.color = "#2d3455";
    if (benedict && temp >= 70 && ["apple", "milk"].includes(e.material))
      e.color = "#ad572d";
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
    e.status =
      p.water <= 0
        ? "Tidak berkecambah"
        : dark
          ? "Pucat · etiolasi"
          : "Hijau · kompak";
  }
  if (model === "transpiration") {
    const rate = Math.max(
      0,
      (p.light / 100) *
        (1 + p.wind) *
        (1 - p.humidity / 100) *
        (1 + Math.max(-20, temp - 25) / 30),
    );
    e.measurements["Laju transpirasi relatif"] = rate;
    e.measurements["Air terkumpul relatif"] =
      (e.measurements["Air terkumpul relatif"] || 0) +
      (e.active ? rate * dt : 0);
    e.measurements["Gerak gelembung potometer relatif"] = rate * t;
    e.status = rate > 0 ? "Embun teramati" : "Tidak ada embun baru";
  }
  if (model === "genetics") {
    const counts = punnett(p.genotype === 1, p.topology === 1, p.seed);
    counts.forEach(
      (n, i) => (e.measurements[`Fenotipe ${i + 1} (dari 160)`] = n),
    );
    e.status = p.genotype === 1 ? "Dihibrid" : "Monohibrid";
  }
  if (model === "ecosystem") {
    const produced = (p.light / (p.light + 100)) * p.plants * 0.08;
    const consumed = p.fish * 0.03 + p.feed * 0.01;
    e.params.oxygen = Math.max(
      0,
      Math.min(
        14,
        (p.oxygen ?? 8) + (e.active ? (produced - consumed) * dt : 0),
      ),
    );
    e.measurements["O₂ relatif"] = e.params.oxygen;
    e.measurements["CO₂ relatif"] = 14 - e.params.oxygen;
    e.status = e.params.oxygen < 3 ? "Ikan stres · O₂ rendah" : "Ikan tenang";
  }
  if (model === "soil") {
    e.measurements["pH tanah"] = p.ph;
    e.measurements["Pertumbuhan relatif"] = Math.max(
      0,
      1 - Math.abs(p.ph - 7) / 5,
    );
    e.color = indicatorColor("cabbage", p.ph);
  }
}
function evaluate(s: LabState, dt: number) {
  for (const e of s.entities) {
    const m = materials[e.material];
    if (!m) continue;
    if (e.active) e.params.time = (e.params.time || 0) + dt;
    if (m.kind === "container") {
      const heater = s.entities.find(
        (x) =>
          e.connections.includes(x.id) &&
          ["burner", "heater"].includes(x.material) &&
          x.active,
      );
      if (heater)
        e.temperature += heatChange(
          heater.params.power * dt,
          Math.max(1, totalMass(e)),
        );
      else
        e.temperature +=
          (s.environment.temperature - e.temperature) *
          (1 - Math.exp(-dt / 120));
      chemical(s, e, dt);
      if (has(e, "yeast")) biology(s, e, dt, "fermentation");
      if (has(e, "saliva") && has(e, "starch")) biology(s, e, dt, "amylase");
      if (e.material === "aquarium") biology(s, e, dt, "ecosystem");
    }
    if (m.discipline === "physics" && m.model) physics(s, e, dt, m.model);
    if (m.model === "chromatography") {
      const solvent = s.entities.find(
        (x) =>
          e.connections.includes(x.id) &&
          materials[x.material]?.kind === "container",
      );
      const previous = e.status;
      developChromatogram(e, solvent, dt);
      if (previous !== e.status) emit(s, e, "observation.changed", e.status);
      if (e.measurements["Rf pigmen 1 model"] !== undefined)
        e.applied["separate-chromatography"] = 1;
    }
    if (m.discipline === "biology" && m.model) biology(s, e, dt, m.model);
    for (const r of rules.filter(
      (r) => r.model === `${m.discipline}:${m.model}`,
    ))
      e.applied[r.id] = 1;
    e.measurements["Suhu (°C)"] = e.temperature;
  }
  for (const instrument of s.entities.filter(
    (e) =>
      materials[e.material]?.kind === "instrument" ||
      ["electrolyte-tester", "balloon", "stopwatch"].includes(e.material),
  )) {
    const target = s.entities.find(
      (e) =>
        instrument.connections.includes(e.id) &&
        materials[e.material]?.kind !== "instrument",
    );
    if (target) instrument.measurements = { ...target.measurements };
    else instrument.measurements = {};
    instrument.measurements["Waktu (s)"] = s.time;
  }
}
export function reduceLab(state: LabState, action: Action): LabState {
  const s = clone(state);
  const find = (id: string) => s.entities.find((x) => x.id === id);
  if (action.type === "add") {
    const m = materials[action.material];
    if (!m || !catalog.some((x) => x.id === m.id)) return state;
    const id = `e${s.nextId++}`;
    const e: Entity = {
      id,
      material: m.id,
      label: m.name,
      x: Math.max(
        0,
        Math.min(76, finite(action.x ?? (s.entities.length % 4) * 22 + 5)),
      ),
      y: Math.max(
        0,
        Math.min(
          72,
          finite(action.y ?? Math.floor(s.entities.length / 4) * 20 + 5),
        ),
      ),
      contents:
        m.kind === "material"
          ? [portion(m.id, m.phase === "solid" ? 10 : 100)]
          : [],
      temperature: 25,
      params: defaultParams(m),
      active: false,
      sealed: false,
      color: m.color || "#bde8f4",
      gas: 0,
      precipitate: "",
      status: "",
      measurements: {},
      applied: {},
      connections: [],
    };
    s.entities.push(e);
    emit(s, e, "apparatus.added", `${m.name} di meja.`);
  }
  if (action.type === "remove") {
    s.entities = s.entities.filter((x) => x.id !== action.id);
    s.entities.forEach(
      (e) => (e.connections = e.connections.filter((id) => id !== action.id)),
    );
  }
  if (action.type === "move") {
    const e = find(action.id);
    if (e) {
      e.x = Math.round(Math.max(0, Math.min(76, finite(action.x))) / 4) * 4;
      e.y = Math.round(Math.max(0, Math.min(72, finite(action.y))) / 4) * 4;
    }
  }
  if (action.type === "label") {
    const e = find(action.id);
    if (e) e.label = action.label.slice(0, 60);
  }
  if (action.type === "set") {
    const e = find(action.id);
    if (e) {
      if (action.key === "temperature")
        e.temperature = Math.max(-20, Math.min(200, finite(action.value)));
      else e.params[action.key] = finite(action.value);
    }
  }
  if (action.type === "toggle") {
    const e = find(action.id);
    if (e) {
      e[action.key] = !e[action.key];
      if (action.key === "sealed" && !e.sealed) e.params.gasMass = 0;
      emit(
        s,
        e,
        "apparatus.changed",
        action.key === "sealed"
          ? e.sealed
            ? "Wadah tertutup."
            : "Wadah terbuka."
          : e.active
            ? "Alat dinyalakan."
            : "Alat dimatikan.",
      );
    }
  }
  if (action.type === "connect") {
    const a = find(action.source),
      b = find(action.target);
    if (a && b && a !== b) {
      if (a.connections.includes(b.id)) {
        a.connections = a.connections.filter((id) => id !== b.id);
        b.connections = b.connections.filter((id) => id !== a.id);
        emit(s, a, "connection.removed", "Sambungan dilepas.");
      } else {
        a.connections.push(b.id);
        b.connections.push(a.id);
        emit(s, a, "connection.added", `${a.label} tersambung ke ${b.label}.`);
      }
    }
  }
  if (action.type === "pour") {
    const source = find(action.source),
      target = find(action.target);
    if (source && target && source !== target) {
      const sourceMaterial = materials[source.material];
      const available =
        sourceMaterial.phase === "solid"
          ? totalMass(source)
          : totalVolume(source);
      const ratio = Math.min(
        1,
        positive(action.amount) / Math.max(0.00001, available),
      );
      if (ratio > 0 && available > 0) {
        target.temperature = equilibriumTemperature(
          target.temperature,
          mixtureHeatCapacity(target.contents),
          source.temperature,
          mixtureHeatCapacity(source.contents) * ratio,
        );
        source.contents.forEach((p) => {
          join(target, {
            ...p,
            moles: p.moles * ratio,
            mass: p.mass * ratio,
            volume: p.volume * ratio,
          });
          p.moles *= 1 - ratio;
          p.mass *= 1 - ratio;
          p.volume *= 1 - ratio;
        });
        emit(
          s,
          target,
          "mixture.mixed",
          `${source.label} ditambahkan (${Math.min(available, positive(action.amount)).toFixed(1)} ${sourceMaterial.phase === "solid" ? "g" : "mL"}).`,
        );
        if (target.material === "chromatography")
          emit(
            s,
            target,
            "sample.spotted",
            "Sampel ditotolkan pada kertas kromatografi.",
          );
        else if (materials[target.material]?.kind !== "container")
          emit(
            s,
            target,
            "material.spilled",
            "Bahan berada di permukaan alat; tidak ada wadah penampung.",
          );
      } else
        emit(s, target, "mixture.empty", "Tidak ada bahan yang berpindah.");
    }
  }
  if (action.type === "operate") {
    const e = find(action.id);
    if (e) {
      const op = action.operation;
      if (op === "stir") {
        e.params.stirred = 1;
        emit(s, e, "mixture.stirred", "Isi wadah diaduk.");
      }
      if (op === "launch") {
        e.active = true;
        e.params.time = 0;
        emit(s, e, "motion.started", "Gerakan dimulai.");
      }
      if (["filter", "decant", "distill", "magnet"].includes(op)) {
        const receiver = s.entities.find(
          (x) =>
            e.connections.includes(x.id) &&
            materials[x.material]?.kind === "container",
        );
        if (receiver) {
          const moving =
            op === "distill"
              ? vaporize(e)
              : separate(e, op as "filter" | "decant" | "magnet");
          receiver.temperature = equilibriumTemperature(
            receiver.temperature,
            mixtureHeatCapacity(receiver.contents),
            e.temperature,
            mixtureHeatCapacity(moving),
          );
          moving.forEach((p) => join(receiver, p));
          emit(
            s,
            e,
            moving.length ? "mixture.separated" : "observation.unchanged",
            moving.length
              ? `${op === "magnet" ? "Serbuk besi" : "Fraksi campuran"} dipindahkan ke ${receiver.label}.`
              : "Tidak ada fraksi yang berpindah pada kondisi ini.",
          );
        } else
          emit(
            s,
            e,
            "observation.changed",
            "Belum ada wadah penerima tersambung.",
          );
      }
      if (op === "evaporate") {
        const vapor = vaporize(e);
        emit(
          s,
          e,
          vapor.length ? "solvent.evaporated" : "observation.unchanged",
          vapor.length
            ? "Pelarut menguap; zat terlarut tertinggal."
            : "Tidak ada penguapan teramati; periksa suhu dan pelarut.",
        );
      }
      if (op === "measure")
        emit(s, e, "instrument.read", "Pembacaan alat diperbarui.");
    }
  }
  if (action.type === "tick") {
    const dt = Math.min(5, positive(action.dt));
    // Keep numerical integration identical at 1×, 2× and 5× playback.
    const steps = Math.floor((dt + 1e-9) / 0.2);
    for (let i = 0; i < steps; i++) {
      s.time += 0.2;
      evaluate(s, 0.2);
    }
    const remainder = dt - steps * 0.2;
    if (remainder > 1e-9) {
      s.time += remainder;
      evaluate(s, remainder);
    }
    if (
      !s.samples.length ||
      s.time - s.samples[s.samples.length - 1].time >= 1
    ) {
      for (const e of s.entities.filter(
        (e) => Object.keys(e.measurements).length,
      )) {
        s.samples.push({
          time: s.time,
          entity: e.id,
          values: { ...e.measurements },
        });
      }
      s.samples = s.samples.slice(-300);
    }
  } else evaluate(s, action.type === "pour" ? 0.25 : 0);
  if (action.type === "note")
    s.notes.push({ ...action.note, id: s.nextId++, time: s.time });
  if (action.type === "pour") {
    const target = find(action.target);
    if (target && s.events[s.events.length - 1]?.type === "mixture.mixed")
      emit(
        s,
        target,
        "observation.unchanged",
        "Tidak ada reaksi lain yang teramati saat ini.",
      );
  }
  s.entities.forEach((e) =>
    Object.keys(e.measurements).forEach(
      (key) => (e.measurements[key] = finite(e.measurements[key])),
    ),
  );
  return s;
}
export type History = {
  past: LabState[];
  present: LabState;
  future: LabState[];
};
export type HistoryAction =
  | Action
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; discipline: LabState["discipline"] }
  | { type: "load"; state: LabState };
export function historyReducer(h: History, a: HistoryAction): History {
  if (a.type === "undo") {
    if (!h.past.length) return h;
    return {
      past: h.past.slice(0, -1),
      present: h.past[h.past.length - 1],
      future: [h.present, ...h.future].slice(0, 40),
    };
  }
  if (a.type === "redo") {
    if (!h.future.length) return h;
    return {
      past: [...h.past, h.present].slice(-40),
      present: h.future[0],
      future: h.future.slice(1),
    };
  }
  if (a.type === "reset" || a.type === "load")
    return {
      past: [...h.past, h.present].slice(-40),
      present: a.type === "load" ? clone(a.state) : initialLab(a.discipline),
      future: [],
    };
  const present = reduceLab(h.present, a);
  return {
    past: a.type === "tick" ? h.past : [...h.past, h.present].slice(-40),
    present,
    future: a.type === "tick" ? h.future : [],
  };
}
