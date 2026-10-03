"use client";
import { materials } from "@/features/laboratory/domain/catalog";
import { totalVolume } from "@/features/laboratory/domain/measurements";
import type { Entity, LabState } from "@/features/laboratory/domain/types";
import { renderBiologyShape } from "@/features/laboratory/subjects/biology/Shape";
import ElectrolysisShape from "@/features/laboratory/subjects/chemistry/ElectrolysisShape";
import { renderChemistryShape } from "@/features/laboratory/subjects/chemistry/Shape";
import { chemistryVisualEffects } from "@/features/laboratory/subjects/chemistry/visualEffects";
import { renderPhysicsShape } from "@/features/laboratory/subjects/physics/Shape";
import { Leaf, Wrench, Zap } from "lucide-react";
import EquipmentDrawing, { hasEquipmentDrawing } from "./EquipmentDrawing";

export function Shape({
  entity: e,
  state,
  magnified = false,
}: {
  entity: Entity;
  state: LabState;
  magnified?: boolean;
}) {
  const m = materials[e.material];
  const model = m.model;
  const effects =
    state.discipline === "chemistry"
      ? chemistryVisualEffects(e, state)
      : undefined;
  if (state.discipline === "chemistry" && e.material === "electrolysis")
    return <ElectrolysisShape entity={e} state={state} />;
  const liquids = e.contents.filter(
    (p) => materials[p.material]?.phase === "liquid" && p.volume > 0,
  );
  const baseLiquid = [...liquids]
    .filter((p) => e.status !== "Dua lapisan" || p.material !== "oil")
    .sort((a, b) => b.volume - a.volume)[0];
  const liquidColor =
    e.color === "#bde8f4"
      ? materials[baseLiquid?.material]?.color || e.color
      : e.color;
  const oilVolume = liquids
    .filter((p) => p.material === "oil")
    .reduce((n, p) => n + p.volume, 0);
  if (
    hasEquipmentDrawing(m) &&
    !(e.material === "microscope" && magnified) &&
    !(
      m.discipline === "physics" &&
      ["pendulum", "spring", "fall", "projectile"].includes(model || "")
    )
  ) {
    return (
      <EquipmentDrawing
        material={m}
        fill={
          m.kind === "container"
            ? totalVolume(e) / (m.capacity || 250)
            : e.active
              ? 1
              : 0
        }
        color={liquidColor}
        sealed={e.sealed}
        sediment={!!e.precipitate}
        gas={effects ? effects.bubbles : e.gas > 0}
        layered={e.status === "Dua lapisan"}
        layerFraction={oilVolume / Math.max(1e-8, totalVolume(e))}
        layerColor={materials.oil.color}
        hot={effects ? effects.steam : e.temperature > 70}
        animated={state.discipline === "chemistry"}
        value={
          state.discipline === "chemistry" && e.material === "stopwatch"
            ? e.measurements["Waktu (s)"]
            : e.material === "ph-meter"
              ? e.measurements.pH
              : e.material === "balance"
                ? e.measurements["Massa isi (g)"]
                : e.material === "voltmeter"
                  ? e.measurements["Tegangan (V)"]
                  : e.material === "ammeter"
                    ? e.measurements["Arus (A)"]
                    : undefined
        }
      />
    );
  }
  const subjectShape =
    renderChemistryShape({ entity: e }) ||
    renderPhysicsShape({ entity: e }) ||
    renderBiologyShape({ entity: e, state });
  if (subjectShape) return subjectShape;
  const C =
    m.discipline === "physics"
      ? Zap
      : m.discipline === "biology"
        ? Leaf
        : Wrench;
  return (
    <C
      size={42}
      strokeWidth={1.6}
      className={
        e.status.includes("putus") || e.status.includes("Korsleting")
          ? "sandbox-damaged"
          : e.active
            ? "sandbox-active"
            : ""
      }
    />
  );
}
