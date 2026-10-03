import { materials } from "../../domain/catalog";
import { reduceLab } from "../../domain/engine";
import { totalMass, totalVolume } from "../../domain/measurements";
import type { Action, LabState } from "../../domain/types";
import { canDipLitmus, isLitmus } from "./litmus";

export function dipLitmusDrop(
  state: LabState,
  targetId: string,
  source: { material: string } | { entity: string },
) {
  const target = state.entities.find((e) => e.id === targetId);
  if (!target || !canDipLitmus(target)) return null;
  let prepared = state;
  let paperId: string;
  if ("material" in source) {
    if (!isLitmus(source.material)) return null;
    paperId = `e${state.nextId}`;
    prepared = reduceLab(state, {
      type: "add",
      material: source.material,
      x: Math.max(0, target.x - 12),
      y: target.y,
    });
  } else paperId = source.entity;
  const paper = prepared.entities.find((e) => e.id === paperId);
  if (!paper || !isLitmus(paper.material)) return null;
  if (paper.connections.includes(targetId)) return { state: prepared, paperId };
  return {
    state: reduceLab(prepared, {
      type: "connect",
      source: paperId,
      target: targetId,
    }),
    paperId,
  };
}

export function pourDrop(
  state: LabState,
  targetId: string,
  source: { material: string } | { entity: string },
): {
  before: LabState;
  state: LabState;
  action: Extract<Action, { type: "pour" }>;
} | null {
  const target = state.entities.find((e) => e.id === targetId);
  if (
    !target ||
    target.sealed ||
    materials[target.material]?.kind !== "container"
  )
    return null;
  let prepared = state;
  let sourceId: string;
  if ("material" in source) {
    const material = materials[source.material];
    if (
      !material ||
      material.kind !== "material" ||
      material.phase === "gas" ||
      isLitmus(material.id)
    )
      return null;
    prepared = reduceLab(state, { type: "add", material: source.material });
    const added = prepared.entities.find(
      (e) => !state.entities.some((old) => old.id === e.id),
    );
    if (!added) return null;
    sourceId = added.id;
  } else sourceId = source.entity;
  const item = prepared.entities.find((e) => e.id === sourceId);
  if (
    !item ||
    item.sealed ||
    isLitmus(item.material) ||
    sourceId === targetId ||
    totalMass(item) <= 1e-8
  )
    return null;
  const action: Extract<Action, { type: "pour" }> = {
    type: "pour",
    source: sourceId,
    target: targetId,
    amount:
      materials[item.material]?.phase === "solid"
        ? totalMass(item)
        : totalVolume(item),
  };
  if (action.amount <= 0) return null;
  let next = reduceLab(prepared, action);
  const remaining = next.entities.find((e) => e.id === sourceId);
  if (
    remaining &&
    totalMass(remaining) <= 1e-8 &&
    materials[remaining.material]?.kind === "material"
  )
    next = reduceLab(next, { type: "remove", id: sourceId });
  return { before: prepared, state: next, action };
}
