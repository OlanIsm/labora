"use client";
import { Wrench, Leaf, Zap } from "lucide-react";
import { Entity, LabState } from "@/lib/sandbox/types";
import { materials } from "@/lib/sandbox/catalog";
import { totalVolume } from "@/lib/sandbox/measurements";
import EquipmentDrawing, { hasEquipmentDrawing } from "./EquipmentDrawing";
import { renderChemistryShape } from "@/features/chemistry/Shape";
import { renderPhysicsShape } from "@/features/physics/Shape";
import { renderBiologyShape } from "@/features/biology/Shape";

export function Shape({ entity: e, state, magnified = false }: { entity: Entity; state: LabState; magnified?: boolean }) {
  const m = materials[e.material];
  const model = m.model;
  const liquids = e.contents.filter((p) => materials[p.material]?.phase === "liquid" && p.volume > 0);
  const baseLiquid = [...liquids].filter((p) => e.status !== "Dua lapisan" || p.material !== "oil").sort((a, b) => b.volume - a.volume)[0];
  const liquidColor = e.color === "#bde8f4" ? materials[baseLiquid?.material]?.color || e.color : e.color;
  const oilVolume = liquids.filter((p) => p.material === "oil").reduce((n, p) => n + p.volume, 0);
  if (hasEquipmentDrawing(m) && !(e.material === "microscope" && magnified) &&
    !(m.discipline === "physics" && ["pendulum", "spring", "fall", "projectile"].includes(model || ""))) {
    return <EquipmentDrawing material={m}
      fill={m.kind === "container" ? totalVolume(e) / (m.capacity || 250) : e.active ? 1 : 0}
      color={liquidColor} sealed={e.sealed} sediment={!!e.precipitate} gas={e.gas > 0}
      layered={e.status === "Dua lapisan"} layerFraction={oilVolume / Math.max(1e-8, totalVolume(e))}
      layerColor={materials.oil.color} hot={e.temperature > 70}
      value={e.material === "ph-meter" ? e.measurements.pH : e.material === "balance" ? e.measurements["Massa isi (g)"] : e.material === "voltmeter" ? e.measurements["Tegangan (V)"] : e.material === "ammeter" ? e.measurements["Arus (A)"] : undefined}
    />;
  }
  const subjectShape = renderChemistryShape({ entity: e }) || renderPhysicsShape({ entity: e }) || renderBiologyShape({ entity: e, state });
  if (subjectShape) return subjectShape;
  const C = m.discipline === "physics" ? Zap : m.discipline === "biology" ? Leaf : Wrench;
  return <C size={42} strokeWidth={1.6} className={e.status.includes("putus") || e.status.includes("Korsleting") ? "sandbox-damaged" : e.active ? "sandbox-active" : ""} />;
}
