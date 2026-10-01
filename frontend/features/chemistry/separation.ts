import { materials } from "../../lib/sandbox/catalog";
import { Entity, Portion } from "../../lib/sandbox/types";

export function aqueousVolume(entity: Entity): number {
  return entity.contents.reduce((sum, portion) => {
    const material = materials[portion.material];
    return (
      sum +
      (material?.phase === "liquid" && !["oil", "ethanol"].includes(material.id)
        ? portion.volume
        : 0)
    );
  }, 0);
}

export function dissolvedMass(portion: Portion, entity: Entity): number {
  const material = materials[portion.material];
  if (!material?.soluble) return 0;
  if (material.phase === "liquid" || material.solubility === undefined)
    return portion.mass;
  // TODO-REVIEW-GURU: KNO3 uses an approximate temperature curve; other listed salts use their reference solubility.
  const solubility =
    material.id === "kno3"
      ? Math.max(
          10,
          13.3 + 0.35 * entity.temperature + 0.025 * entity.temperature ** 2,
        )
      : material.solubility;
  return Math.min(portion.mass, (solubility * aqueousVolume(entity)) / 100);
}

export function suspendedMass(entity: Entity): number {
  return entity.contents.reduce(
    (sum, portion) =>
      materials[portion.material]?.phase === "solid"
        ? sum + portion.mass - dissolvedMass(portion, entity)
        : sum,
    0,
  );
}

export function separate(
  entity: Entity,
  operation: "filter" | "decant" | "magnet",
): Portion[] {
  // TODO-REVIEW-GURU: decantation assumes complete settling; filtration neglects solvent retained by the filter cake.
  const fractions = entity.contents.map((portion) => {
    const material = materials[portion.material];
    return operation === "magnet"
      ? portion.material === "iron-powder"
        ? 1
        : 0
      : material?.phase === "liquid"
        ? 1
        : portion.mass > 0
          ? dissolvedMass(portion, entity) / portion.mass
          : 0;
  });
  const moved: Portion[] = [];
  entity.contents.forEach((portion, index) => {
    const fraction = fractions[index];
    if (fraction <= 0) return;
    moved.push({
      ...portion,
      mass: portion.mass * fraction,
      moles: portion.moles * fraction,
      volume: portion.volume * fraction,
    });
    portion.mass *= 1 - fraction;
    portion.moles *= 1 - fraction;
    portion.volume *= 1 - fraction;
  });
  return moved;
}

export function solventBoilingPoint(portion: Portion): number | undefined {
  const material = materials[portion.material];
  if (!material || portion.volume <= 0 || portion.mass <= 1e-10 || (!material.concentration && !["water", "tap-water", "ethanol"].includes(material.id))) return undefined;
  const soluteMass = material.concentration ? portion.moles * (material.molarMass || 0) : 0;
  if (portion.mass - soluteMass <= 1e-10) return undefined;
  return material.id === "ethanol" ? 78.37 : 100;
}

export const latentHeat = (material: string) => material === "ethanol" ? 846 : 2257;

export function vaporize(entity: Entity, energyBudget?: number): Portion[] {
  const vapor: Portion[] = [];
  let energy = energyBudget === undefined ? Infinity : Math.max(0, energyBudget);
  // TODO-REVIEW-GURU: pure-solvent boiling points and latent heats approximate mixtures; manual operations process one 20% fraction.
  for (const portion of [...entity.contents].sort((a, b) => (solventBoilingPoint(a) ?? Infinity) - (solventBoilingPoint(b) ?? Infinity))) {
    const material = materials[portion.material];
    const aqueous = !!material?.concentration;
    const boilingPoint = solventBoilingPoint(portion);
    if (boilingPoint === undefined) continue;
    if (entity.temperature < boilingPoint) continue;
    const soluteMass = aqueous ? portion.moles * (material.molarMass || 0) : 0;
    const available = Math.max(0, portion.mass - soluteMass);
    const mass = Math.min(
      available,
      energyBudget === undefined ? portion.volume * 0.2 * (material.density || 1) : energy / latentHeat(material.id),
    );
    if (mass <= 0) continue;
    const volume = mass / (material.density || 1);
    const fraction = mass / Math.max(portion.mass, 1e-12);
    portion.mass -= mass;
    energy -= mass * latentHeat(material.id);
    portion.volume = Math.max(0, portion.volume - volume);
    if (!aqueous) portion.moles *= 1 - fraction;
    const id = material.id === "ethanol" ? "ethanol" : "water";
    vapor.push({
      material: id,
      mass,
      volume,
      moles: mass / materials[id].molarMass!,
    });
  }
  return vapor;
}

export function developChromatogram(
  paper: Entity,
  solvent: Entity | undefined,
  dt: number,
): void {
  const liquid = solvent?.contents.some(
    (portion) =>
      ["water", "tap-water", "ethanol"].includes(portion.material) &&
      portion.volume > 0,
  );
  const sample = paper.contents.some(
    (portion) => portion.material === "dye" && portion.mass > 0,
  );
  if (!liquid) {
    paper.status = "Belum ada pelarut tersambung";
    return;
  }
  if (paper.active)
    paper.params.developmentTime = (paper.params.developmentTime || 0) + dt;
  // TODO-REVIEW-GURU: capillary coefficient and adjustable Rf values illustrate the method, not a specific commercial ink/solvent pair.
  const length = Math.max(1, paper.params.paperLength || 80);
  const front = Math.min(
    length,
    2 * Math.sqrt(paper.params.developmentTime || 0),
  );
  paper.measurements["Front pelarut model (mm)"] = front;
  for (let i = 1; i <= 3; i++) {
    const distanceKey = `Jarak pigmen ${i} model (mm)`;
    const ratioKey = `Rf pigmen ${i} model`;
    if (!sample || front <= 0) {
      delete paper.measurements[distanceKey];
      delete paper.measurements[ratioKey];
      continue;
    }
    const rf = Math.max(0, Math.min(1, paper.params[`rf${i}`] ?? i * 0.25));
    paper.measurements[distanceKey] = front * rf;
    paper.measurements[ratioKey] = paper.measurements[distanceKey] / front;
  }
  paper.status =
    front >= length
      ? "Front mencapai ujung kertas"
      : sample
        ? "Pita pigmen model terpisah"
        : "Belum ada sampel tinta pada kertas";
}
