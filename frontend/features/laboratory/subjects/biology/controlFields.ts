import type { Field } from "../../domain/controlFields";

const light: Field = ["light", "Cahaya relatif", 0, 1000, 10];
const temp: Field = ["temperature", "Suhu (°C)", -10, 120, 1];
export const biologyFields: Record<string, Field[]> = {
  microscope: [
    ["magnification", "Perbesaran (×)", 40, 400, 20],
    ["focus", "Fokus kasar / halus", -10, 10, 0.2],
    light,
  ],
  osmosis: [
    ["mass", "Massa awal sampel (kg)", 0.01, 1, 0.01],
    ["concentration", "Konsentrasi larutan (M)", 0, 1, 0.01],
    temp,
  ],
  photosynthesis: [
    light,
    ["distance", "Jarak lampu (m)", 0.1, 3, 0.1],
    ["polarity", "Warna: 1 putih/merah, -1 hijau", -1, 1, 2],
    temp,
  ],
  growth: [
    light,
    ["water", "Air: 0 tanpa, 1 tersedia", 0, 1, 1],
    ["angle", "Arah sumber cahaya (°)", -90, 90, 5],
    temp,
  ],
  transpiration: [
    light,
    ["wind", "Angin relatif", 0, 3, 0.1],
    ["humidity", "Kelembapan (%)", 0, 100, 5],
    temp,
  ],
  catalase: [temp, ["ph", "pH lingkungan", 0, 14, 0.1]],
  genetics: [
    ["genotype", "0 monohibrid, 1 dihibrid", 0, 1, 1],
    ["topology", "0 F₂, 1 uji silang", 0, 1, 1],
    ["seed", "Seed pengamatan", 1, 1000, 1],
  ],
  ecosystem: [
    light,
    ["fish", "Jumlah ikan", 0, 20, 1],
    ["plants", "Jumlah tanaman", 0, 20, 1],
    ["feed", "Pakan relatif", 0, 10, 1],
  ],
  soil: [["ph", "pH tanah", 0, 14, 0.1]],
};
