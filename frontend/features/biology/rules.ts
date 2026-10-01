import { Rule } from "../../lib/sandbox/types";

const living: [string, string, string][] = [
  ["microscopy", "microscope", "Pengamatan preparat"],
  ["stain", "stain", "Pewarna preparat"],
  ["osmosis", "osmosis", "Osmosis kentang"],
  ["plasmolysis", "osmosis", "Plasmolisis dan pemulihan"],
  ["photosynthesis", "photosynthesis", "Fotosintesis Elodea"],
  ["light-distance", "photosynthesis", "Jarak dan warna lampu"],
  ["fermentation", "fermentation", "Fermentasi ragi"],
  ["catalase", "catalase", "Enzim katalase"],
  ["amylase", "amylase", "Enzim amilase"],
  ["food", "food", "Uji makanan"],
  ["germination", "growth", "Perkecambahan"],
  ["etiolation", "growth", "Etiolasi dan fototropisme"],
  ["transpiration", "transpiration", "Transpirasi"],
  ["monohybrid", "genetics", "Persilangan monohibrid"],
  ["dihybrid", "genetics", "Persilangan dihibrid"],
  ["test-cross", "genetics", "Uji silang"],
  ["ecosystem", "ecosystem", "Ekosistem akuarium"],
  ["soil", "soil", "pH tanah dan pertumbuhan"],
];
export const biologyRules: Rule[] = living.map(([id, model, label]) => ({
  id: `biology-${id}`, label, discipline: "biology", trigger: [],
  model: `biology:${model}`, event: "observation.changed",
  observation: "Perubahan sampel teramati.",
}));
