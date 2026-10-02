import { seeded } from "./measurements";

export type FlowerGenes = "PP" | "Pp" | "pp";
export type SeedGenes = "RR" | "Rr" | "rr";
export type Genes = `${FlowerGenes}${SeedGenes}`;
export type Prediction = "purple" | "white" | "both" | "unknown" | "0" | "0.0625" | "0.125" | "0.25" | "0.5" | "1";
export type GardenPlant = { id: string; name: string; genes: Genes; generation: number; revealed: boolean };
export type GardenRun = { id: number; mission: number; parents: [string, string]; generation: number; children: Genes[]; prediction: Prediction; correct: boolean; passed: boolean; feedback: string };
export type GardenState = { version: 1; seed: number; mission: number; plants: GardenPlant[]; history: GardenRun[]; nextRun: number; mystery: { total: number; white: number } };
export const GARDEN_STORAGE_KEY = "labora-garden-v1";
export const GARDEN_MISSIONS = [
  { id: "carrier", name: "Ungu, membawa putih", goal: "Pilih persilangan yang menghasilkan 100% keturunan Pp: berbunga ungu, tetapi membawa alel putih.", traits: 1 as const, hint: "Satu induk harus selalu menyumbang P, dan satu lagi selalu menyumbang p. Bunga ungu belum tentu PP." },
  { id: "next-generation", name: "Dari anak ke induk", goal: "Gunakan dua induk generasi anak untuk membuat peluang bunga putih sedikitnya 25%. Tanaman yang sama boleh menyerbuk sendiri.", traits: 1 as const, hint: "Anak Pp dari misi pertama bisa menghasilkan gamet P atau p. Bagaimana supaya kedua induk bisa menyumbang p?" },
  { id: "mystery", name: "Detektif genotipe", goal: "Uji tanaman misteri yang berbunga ungu dengan induk pp, lalu simpulkan apa yang benar-benar didukung hasil pengamatan.", traits: 1 as const, hint: "Induk pp tidak dapat menyumbang P. Jika ada anak putih, alel p lainnya pasti berasal dari tanaman misteri. Semua anak ungu dalam sampel kecil belum membuktikan PP." },
  { id: "two-traits", name: "Dua sifat, satu strategi", goal: "Gunakan induk tantangan PpRr. Cari pasangan yang memberi peluang bunga putih dan biji keriput sedikitnya 25%.", traits: 2 as const, hint: "Bunga putih dan biji keriput membutuhkan pprr. Pasangan pprr selalu menyumbang p dan r; periksa peluang gamet pr dari induk PpRr." },
];

export function flowerColor(genes: string): "purple" | "white" { return genes.slice(0, 2).includes("P") ? "purple" : "white"; }
export function seedShape(genes: string): "round" | "wrinkled" { return genes.slice(2).includes("R") ? "round" : "wrinkled"; }
export function phenotypeLabel(genes: string, traits: 1 | 2 = 1): string {
  return `${flowerColor(genes) === "purple" ? "Bunga ungu" : "Bunga putih"}${traits === 2 ? ` · biji ${seedShape(genes) === "round" ? "bulat" : "keriput"}` : ""}`;
}

export function gametes(genes: Genes, traits: 1 | 2): string[] {
  let result = [""];
  for (let locus = 0; locus < traits; locus++) result = result.flatMap(prefix => [prefix + genes[locus * 2], prefix + genes[locus * 2 + 1]]);
  return result;
}

export function punnettSquare(first: Genes, second: Genes, traits: 1 | 2) {
  const a = gametes(first, traits), b = gametes(second, traits);
  const cells = b.flatMap(fromB => a.map(fromA => ({ fromA, fromB, genes: Array.from({ length: traits }, (_, locus) => [fromA[locus], fromB[locus]].sort().join("")).join("") })));
  const genotypes: Record<string, number> = {}, phenotypes: Record<string, number> = {};
  for (const cell of cells) {
    genotypes[cell.genes] = (genotypes[cell.genes] || 0) + 1;
    const label = phenotypeLabel(cell.genes, traits);
    phenotypes[label] = (phenotypes[label] || 0) + 1;
  }
  return { a, b, cells, genotypes, phenotypes };
}

function probability(a: Genes, b: Genes, matches: (genes: string) => boolean): number {
  const cells = punnettSquare(a, b, 2).cells;
  return cells.filter(cell => matches(cell.genes)).length / cells.length;
}

function colorPrediction(a: Genes, b: Genes): Prediction {
  const white = probability(a, b, genes => flowerColor(genes) === "white");
  return white === 1 ? "white" : white === 0 ? "purple" : "both";
}

export function expectedPrediction(state: GardenState, a: GardenPlant, b: GardenPlant): Prediction {
  if (state.mission === 3) return String(probability(a.genes, b.genes, genes => genes === "pprr")) as Prediction;
  const candidates = (plant: GardenPlant): Genes[] => plant.revealed ? [plant.genes] : ["PPRR", "PpRR"];
  const answers = new Set(candidates(a).flatMap(first => candidates(b).map(second => colorPrediction(first, second))));
  return answers.size === 1 ? [...answers][0] : "unknown";
}

export function initialGarden(seed: number): GardenState {
  return { version: 1, seed: seed >>> 0, mission: 0, nextRun: 1, history: [], mystery: { total: 0, white: 0 }, plants: [
    { id: "purple-pure", name: "Ungu homozigot", genes: "PPRR", generation: 0, revealed: true },
    { id: "purple-carrier", name: "Ungu pembawa putih", genes: "PpRR", generation: 0, revealed: true },
    { id: "white-pure", name: "Bunga putih", genes: "ppRR", generation: 0, revealed: true },
  ] };
}

export function missionComplete(state: GardenState): boolean { return state.history.some(run => run.mission === state.mission && run.passed); }

function isMysteryTest(run: GardenRun, plants: GardenPlant[]): boolean {
  return run.mission === 2 && run.parents.includes("mystery") && run.parents.some(id => id !== "mystery" && plants.find(plant => plant.id === id)?.genes.startsWith("pp"));
}

export function saveOffspring(state: GardenState, runId: number, genes: Genes): GardenState {
  const run = state.history.find(run => run.id === runId);
  if (!run || !run.children.includes(genes) || run.parents.some(id => !state.plants.find(plant => plant.id === id)?.revealed)) return state;
  const generation = run.generation;
  const existing = state.plants.find(plant => plant.id !== "mystery" && plant.genes === genes && plant.revealed);
  if (existing && existing.generation >= generation) return state;
  const offspring: GardenPlant = { id: existing?.id || `offspring-${genes}`, name: `Keturunan generasi ${generation}`, genes, generation, revealed: true };
  return { ...state, plants: existing ? state.plants.map(plant => plant.id === existing.id ? offspring : plant) : [...state.plants, offspring] };
}

export function growCross(state: GardenState, firstId: string, secondId: string, prediction: Prediction): GardenState {
  const first = state.plants.find(plant => plant.id === firstId), second = state.plants.find(plant => plant.id === secondId);
  if (!first || !second || missionComplete(state)) return state;
  const correct = prediction === expectedPrediction(state, first, second);
  const random = seeded(state.seed + state.nextRun * 997);
  const possibilities = punnettSquare(first.genes, second.genes, 2).cells;
  const children = Array.from({ length: 20 }, () => possibilities[Math.floor(random() * possibilities.length)].genes as Genes);
  const useChallenge = first.id === "dihybrid" || second.id === "dihybrid";
  const meetsGoal = state.mission === 0 ? probability(first.genes, second.genes, genes => genes.startsWith("Pp")) === 1
    : state.mission === 1 ? first.generation > 0 && second.generation > 0 && probability(first.genes, second.genes, genes => flowerColor(genes) === "white") >= 0.25
      : state.mission === 3 ? useChallenge && probability(first.genes, second.genes, genes => genes === "pprr") >= 0.25 : false;
  const passed = correct && meetsGoal;
  const feedback = !correct ? "Prediksimu belum cocok dengan peluang persilangan ini. Sampel sudah tumbuh; bandingkan dengan papan Punnett, lalu coba prediksi lagi."
    : state.mission === 2 ? "Prediksi dicatat. Untuk menyelidiki genotipe, gunakan tanaman misteri dan induk pp, lalu baca bukti dari sampel."
      : passed ? "Rencana dan prediksimu tepat! Misi selesai. Peluang dihitung dari persilangan; jumlah anak dalam sampel bisa berbeda dari rasio teoritis. Satu anak disimpan untuk menjadi induk berikutnya."
        : state.mission === 1 ? "Prediksi tepat, tetapi misi ini membutuhkan kedua induk dari generasi anak dan peluang putih sedikitnya 25%. Pilih keturunan yang tersimpan di koleksi."
          : state.mission === 3 ? "Prediksi tepat. Untuk menyelesaikan misi, gunakan PpRr dan cari pasangan yang memberi peluang pprr sedikitnya 25%."
            : state.mission >= GARDEN_MISSIONS.length ? "Persilangan bebas selesai. Periksa peluang teoritis dan sampel nyata, lalu simpan keturunan yang ingin dipakai lagi."
              : "Prediksi tepat, tetapi pasangan ini belum menjamin semua anak Pp. Coba induk yang selalu menyumbang P dan induk yang selalu menyumbang p.";
  const run: GardenRun = { id: state.nextRun, mission: state.mission, parents: [first.id, second.id], generation: Math.max(first.generation, second.generation) + 1, children, prediction, correct, passed, feedback };
  const all = [...state.history, run];
  const isTestCross = isMysteryTest(run, state.plants);
  const mystery = isTestCross ? { total: state.mystery.total + children.length, white: state.mystery.white + children.filter(genes => flowerColor(genes) === "white").length } : state.mystery;
  const lastTest = all.filter(item => isMysteryTest(item, state.plants)).at(-1);
  let next: GardenState = { ...state, mystery, nextRun: state.nextRun + 1, history: all.filter((item, index) => item.passed || item.id === lastTest?.id || index >= all.length - 20) };
  if (passed) next = saveOffspring(next, run.id, children[0]);
  return next;
}

export function mysteryEvidence(state: GardenState) {
  const runs = state.history.filter(run => isMysteryTest(run, state.plants));
  return { runs, ...state.mystery };
}

export function concludeMystery(state: GardenState, conclusion: "PP" | "Pp" | "unknown"): GardenState {
  if (state.mission !== 2 || missionComplete(state)) return state;
  const evidence = mysteryEvidence(state);
  const correct = evidence.total > 0 && conclusion === (evidence.white > 0 ? "Pp" : "unknown");
  const run = evidence.runs.at(-1);
  if (!run) return state;
  const passed = correct && run.correct;
  const feedback = passed ? evidence.white > 0
    ? "Tepat! Anak putih menerima p dari kedua induk. Tanaman misteri yang berbunga ungu pasti Pp. Catatan genotipenya sekarang dibuka."
    : "Tepat! Sampel tanpa anak putih belum membuktikan PP; Pp juga bisa menghasilkan sampel yang semuanya ungu. Kamu membedakan bukti dari kepastian. Catatan genotipe sekarang dibuka untuk dibandingkan."
    : evidence.white > 0 ? "Adanya anak putih membuktikan tanaman misteri menyumbang p. Karena induknya ungu, genotipe yang didukung bukti adalah Pp. Pastikan prediksi sebelum menanam juga tepat."
      : "Tidak melihat anak putih dalam sampel kecil belum membuktikan PP. Kesimpulan yang didukung bukti saat ini adalah belum pasti. Pastikan prediksi sebelum menanam juga tepat.";
  return { ...state, plants: passed ? state.plants.map(plant => plant.id === "mystery" ? { ...plant, revealed: true } : plant) : state.plants,
    history: state.history.map(item => item.id === run.id ? { ...item, passed, feedback } : item) };
}

export function nextGardenMission(state: GardenState): GardenState {
  if (!missionComplete(state)) return state;
  const mission = state.mission + 1;
  const additions: GardenPlant[] = mission === 2 ? [{ id: "mystery", name: "Tanaman misteri", genes: seeded(state.seed)() < 0.5 ? "PpRR" : "PPRR", generation: 0, revealed: false }]
    : mission === 3 ? [{ id: "dihybrid", name: "Induk tantangan", genes: "PpRr", generation: 0, revealed: true }, { id: "recessive-test", name: "Induk uji dua sifat", genes: "pprr", generation: 0, revealed: true }] : [];
  return { ...state, mission, plants: [...state.plants, ...additions] };
}

export function isGardenState(value: unknown): value is GardenState {
  if (!value || typeof value !== "object") return false;
  const s = value as GardenState;
  const integer = (n: number) => Number.isSafeInteger(n) && n >= 0;
  const validGenes = (genes: unknown) => typeof genes === "string" && /^(PP|Pp|pp)(RR|Rr|rr)$/.test(genes);
  const predictions = ["purple", "white", "both", "unknown", "0", "0.0625", "0.125", "0.25", "0.5", "1"];
  if (s.version !== 1 || !integer(s.seed) || !integer(s.mission) || s.mission > GARDEN_MISSIONS.length || !integer(s.nextRun) || s.nextRun < 1 ||
    !Array.isArray(s.plants) || s.plants.length < 3 || s.plants.length > 12 || !Array.isArray(s.history) || s.history.length > 24 || !s.mystery || !integer(s.mystery.total) || !integer(s.mystery.white) || s.mystery.white > s.mystery.total) return false;
  if (!s.plants.every(plant => plant && typeof plant.id === "string" && typeof plant.name === "string" && validGenes(plant.genes) && integer(plant.generation) && plant.generation < s.nextRun && typeof plant.revealed === "boolean")) return false;
  const ids = new Set(s.plants.map(plant => plant.id));
  if (ids.size !== s.plants.length) return false;
  const validHistory = s.history.every(run => run && integer(run.id) && run.id > 0 && run.id < s.nextRun && integer(run.generation) && run.generation > 0 && run.generation <= run.id && integer(run.mission) && run.mission <= s.mission &&
    Array.isArray(run.parents) && run.parents.length === 2 && run.parents.every(id => ids.has(id)) && Array.isArray(run.children) && run.children.length === 20 && run.children.every(validGenes) &&
    predictions.includes(run.prediction) && typeof run.correct === "boolean" && typeof run.passed === "boolean" && typeof run.feedback === "string");
  if (!validHistory || new Set(s.history.map(run => run.id)).size !== s.history.length) return false;
  const required: [string, Genes][] = [["purple-pure", "PPRR"], ["purple-carrier", "PpRR"], ["white-pure", "ppRR"]];
  if (s.mission >= 3) required.push(["dihybrid", "PpRr"], ["recessive-test", "pprr"]);
  return required.every(([id, genes]) => s.plants.some(plant => plant.id === id && plant.genes === genes && plant.revealed)) &&
    Array.from({ length: s.mission }, (_, mission) => s.history.some(run => run.mission === mission && run.passed)).every(Boolean) &&
    (s.mission < 2 || s.plants.some(plant => plant.id === "mystery" && ["PPRR", "PpRR"].includes(plant.genes)));
}
