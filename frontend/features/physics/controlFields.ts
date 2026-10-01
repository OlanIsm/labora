import { Field } from "../../lib/sandbox/controlFields";

const mass: Field = ["mass", "Massa (kg)", 0.01, 10, 0.01];
const temp: Field = ["temperature", "Suhu (°C)", -10, 120, 1];
export const physicsFields: Record<string, Field[]> = {
  incline: [mass, ["angle", "Sudut (°)", 0, 80, 1], ["friction", "Koefisien gesek", 0, 1, 0.01]],
  friction: [mass, ["angle", "Sudut (°)", 0, 80, 1], ["friction", "Koefisien gesek", 0, 1, 0.01]],
  fall: [mass],
  projectile: [["speed", "Kecepatan awal (m/s)", 0, 40, 1], ["angle", "Sudut (°)", 0, 90, 1], ["topology", "Hambatan udara: 0 tanpa, 1 dengan", 0, 1, 1], ["friction", "Hambatan relatif", 0, 1, 0.01]],
  newton: [mass, ["force", "Gaya (N)", 0, 50, 0.5]],
  spring: [mass, ["spring", "k pegas (N/m)", 1, 500, 1], ["force", "Gaya (N)", 0, 50, 0.5], ["topology", "Pegas: 0 tunggal, 1 seri, 2 paralel", 0, 2, 1]],
  pendulum: [mass, ["length", "Panjang tali (m)", 0.1, 3, 0.1], ["amplitude", "Amplitudo (°)", 1, 60, 1]],
  collision: [mass, ["mass2", "Massa troli kedua (kg)", 0.01, 10, 0.01], ["speed", "v₁ (m/s)", -10, 10, 0.1], ["speed2", "v₂ (m/s)", -10, 10, 0.1], ["restitution", "Koefisien restitusi", 0, 1, 0.05]],
  buoyancy: [mass, ["density", "Massa jenis benda (kg/m³)", 100, 9000, 100], ["fluidDensity", "Massa jenis cairan (kg/m³)", 789, 1300, 1]],
  hydrostatic: [["depth", "Kedalaman (m)", 0, 5, 0.1], ["fluidDensity", "Massa jenis cairan (kg/m³)", 789, 1300, 1], ["force", "Gaya masuk (N)", 0, 100, 1], mass, ["mass2", "Rasio luas keluaran", 0.1, 10, 0.1]],
  heat: [mass, ["mass2", "Massa logam Al (kg)", 0.01, 5, 0.01], ["amplitude", "Suhu logam (°C)", 0, 150, 1], ["power", "Daya (W)", 0, 2000, 10], temp],
  phase: [mass, ["power", "Daya (W)", 0, 2000, 10]],
  expansion: [["length", "Panjang awal (m)", 0.1, 3, 0.1], temp],
  radiation: [temp, ["polarity", "Permukaan: 1 hitam, -1 putih", -1, 1, 2]],
  circuit: [["voltage", "Tegangan (V)", 0, 24, 0.5], ["resistance", "Hambatan (Ω)", 0.01, 1000, 1], ["topology", "Susunan: 0 seri, 2 paralel", 0, 2, 2]],
  rc: [["voltage", "Tegangan (V)", 0, 24, 0.5], ["resistance", "Hambatan (Ω)", 1, 10000, 10], ["capacitance", "Kapasitansi (F)", 0.0001, 0.01, 0.0001], ["polarity", "1 isi, -1 kosongkan", -1, 1, 2]],
  led: [["voltage", "Tegangan (V)", 0, 24, 0.5], ["resistance", "Hambatan (Ω)", 1, 1000, 1], ["polarity", "Polaritas", -1, 1, 2]],
  magnet: [["polarity", "Kutub", -1, 1, 2]],
  induction: [["turns", "Jumlah lilitan", 10, 1000, 10], ["motion", "Kecepatan magnet relatif", -10, 10, 0.5], ["voltage", "Tegangan (V)", 0, 24, 0.5], ["resistance", "Hambatan (Ω)", 1, 1000, 1]],
  reflection: [["angle", "Sudut datang (°)", 0, 89, 1]],
  snell: [["angle", "Sudut datang (°)", 0, 89, 1], ["n1", "Indeks bias awal", 1, 1.5, 0.01], ["n2", "Indeks bias kedua", 1, 1.5, 0.01]],
  dispersion: [["angle", "Sudut (°)", 0, 89, 1]],
  lens: [["focal", "Fokus (m)", -0.5, 0.5, 0.01], ["distance", "Jarak benda (m)", 0.01, 2, 0.01], ["length", "Fokus lensa kedua (m)", 0.01, 1, 0.01]],
  wave: [["frequency", "Frekuensi (Hz)", 1, 50, 1], ["wavelength", "Panjang gelombang (m)", 0.1, 5, 0.1], ["length", "Panjang tali (m)", 0.1, 10, 0.1]],
  sound: [["frequency", "Frekuensi (Hz)", 100, 2000, 10], ["motion", "Kecepatan sumber (m/s)", -100, 100, 1], ["fluidDensity", "Medium: 0 vakum, 1 udara", 0, 1, 1]],
};
