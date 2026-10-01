import { Entity, LabState, Material } from "@/lib/sandbox/types";
import EquipmentDrawing from "./EquipmentDrawing";
import { Shape } from "./Workbench";

export default function DragPreview({ material, entity, state }: { material?: Material; entity?: Entity; state: LabState }) {
  if (!material) return null;
  return (
    <div className={`sandbox-drag-preview ${state.discipline === "chemistry" ? "chemistry-drag-preview" : ""}`}>
      {entity ? <Shape entity={entity} state={state} /> : <EquipmentDrawing material={material} />}
      {state.discipline === "chemistry" && entity?.material === "stopwatch" && <output className="chemistry-object-reading" aria-label="Waktu stopwatch">{(entity.measurements["Waktu (s)"] || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s</output>}
      <span>{entity?.label || material.name}</span>
    </div>
  );
}
