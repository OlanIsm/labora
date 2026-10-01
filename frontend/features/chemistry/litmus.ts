import { Entity } from "../../lib/sandbox/types";
import { materials } from "../../lib/sandbox/catalog";

export const isLitmus = (id: string) => id === "litmus-red" || id === "litmus-blue";
export const litmusRed = "#b54458";
export const litmusBlue = "#37699c";
export function canDipLitmus(vessel: Entity) {
  return materials[vessel.material]?.kind === "container" && !vessel.sealed &&
    vessel.contents.some((p) => materials[p.material]?.phase === "liquid" && p.volume > 0);
}
export function testedLitmusColor(pH: number, currentColor: string) {
  // TODO-REVIEW-GURU: retain the paper's previous color within the 4.5–8.3 transition range; no continuous shade model.
  return pH <= 4.5 ? litmusRed : pH >= 8.3 ? litmusBlue : currentColor;
}
export function litmusExplanation(paper: Entity) {
  if (!isLitmus(paper.material) || paper.params.litmusTested !== 1) return undefined;
  const before = paper.params.litmusBefore === 0 ? "merah" : "biru";
  const after = paper.params.litmusAfter === 0 ? "merah" : "biru";
  if (before !== after) return {
    summary: `Kertas berubah dari ${before} menjadi ${after}.`,
    reason: `Perubahan ini menunjukkan larutan bersifat ${after === "merah" ? "asam" : "basa"}. Zat indikator pada kertas merespons sifat larutan, sehingga kertas berubah warna. Cairannya tidak ikut diwarnai.`,
    hint: "Warna hasil tetap tersimpan setelah kertas diangkat. Lakmus tidak memberikan angka pH yang tepat.",
  };
  return {
    summary: `Kertas tetap berwarna ${after}.`,
    reason: "Belum ada perubahan warna teramati. Hasil dari satu jenis lakmus yang tidak berubah belum cukup untuk memastikan sifat larutan.",
    hint: `Coba uji dengan lakmus ${after === "merah" ? "biru" : "merah"} juga. Larutan netral tidak mengubah warna kedua jenis kertas.`,
  };
}
