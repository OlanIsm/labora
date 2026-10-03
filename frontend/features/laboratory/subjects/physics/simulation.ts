import {
  buoyancy,
  G,
  lens,
  ohm,
  pendulum,
  projectile,
  snell,
} from "../../domain/measurements";
import { emit } from "../../domain/simulation-utils";
import type { Entity, LabState } from "../../domain/types";

export function physics(s: LabState, e: Entity, dt: number, model: string) {
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
