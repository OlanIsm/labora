import type { Material } from "../../domain/types";

export const biologyContainers: Material[] = [
  {
    id: "aquarium",
    name: "Akuarium",
    capacity: 1000,
    kind: "container",
    discipline: "biology",
    color: "#bde8f4",
  },
  {
    id: "incubator",
    name: "Tabung inkubasi",
    capacity: 100,
    kind: "container",
    discipline: "biology",
    color: "#bde8f4",
  },
];
const apparatus: [string, string, string][] = [
  ["microscope", "Mikroskop", "microscope"],
  ["slide", "Kaca objek + penutup", "support"],
  ["tweezers", "Pinset", "support"],
  ["razor", "Silet virtual", "support"],
  ["methylene", "Metilen biru", "stain"],
  ["onion", "Epidermis bawang", "microscope"],
  ["cheek", "Sel pipi", "microscope"],
  ["elodea", "Daun Elodea", "photosynthesis"],
  ["paramecium", "Paramecium", "microscope"],
  ["yeast-slide", "Preparat ragi", "microscope"],
  ["stomata", "Epidermis daun / stomata", "microscope"],
  ["blood", "Preparat sel darah", "microscope"],
  ["potato", "Kentang", "osmosis"],
  ["salt-solution", "Larutan garam", "osmosis"],
  ["sugar-solution", "Larutan gula", "osmosis"],
  ["grow-light", "Lampu tumbuhan", "photosynthesis"],
  ["liver", "Hati segar", "catalase"],
  ["boiled-liver", "Hati direbus", "catalase"],
  ["seed", "Biji kacang / kecambah", "growth"],
  ["dark-box", "Kotak gelap", "growth"],
  ["transpiration-bag", "Kantong transpirasi", "transpiration"],
  ["potometer", "Potometer", "transpiration"],
  ["fan", "Kipas", "transpiration"],
  ["punnett", "Papan Punnett", "genetics"],
  ["fish", "Ikan virtual", "ecosystem"],
  ["feed", "Pakan", "ecosystem"],
  ["rice", "Nasi", "food"],
  ["bread", "Roti", "food"],
  ["milk", "Susu", "food"],
  ["egg", "Telur", "food"],
  ["apple", "Apel", "food"],
  ["soil", "Tanah", "soil"],
];
export const biologyCatalog = apparatus.map(([id, name, model]): Material => ({
  id,
  name,
  model,
  kind: "apparatus",
  discipline: "biology",
}));

export const specimens: Record<
  string,
  {
    name: string;
    shape: "plant" | "animal" | "blood" | "stomata" | "yeast" | "ciliate";
    structures: string[];
  }
> = {
  onion: {
    name: "Epidermis bawang",
    shape: "plant",
    structures: ["dinding sel", "sitoplasma", "inti", "vakuola"],
  },
  cheek: {
    name: "Sel pipi",
    shape: "animal",
    structures: ["membran", "sitoplasma", "inti"],
  },
  elodea: {
    name: "Elodea",
    shape: "plant",
    structures: ["dinding sel", "vakuola", "kloroplas"],
  },
  paramecium: {
    name: "Paramecium",
    shape: "ciliate",
    structures: ["silia", "inti", "vakuola"],
  },
  "yeast-slide": {
    name: "Ragi",
    shape: "yeast",
    structures: ["dinding sel", "tunas"],
  },
  stomata: {
    name: "Stomata",
    shape: "stomata",
    structures: ["sel penjaga", "celah stomata"],
  },
  blood: {
    name: "Apusan darah",
    shape: "blood",
    structures: ["eritrosit", "leukosit", "trombosit"],
  },
};
