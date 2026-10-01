import { Entity, LabState, Material } from "@/lib/sandbox/types";
import EquipmentDrawing from "./EquipmentDrawing";
import { Shape } from "./Workbench";

export default function DragPreview({ material, entity, state }: { material?: Material; entity?: Entity; state: LabState }) {
  if (!material) return null;
  return (
    <div className="sandbox-drag-preview">
      {entity ? <Shape entity={entity} state={state} /> : <EquipmentDrawing material={material} />}
      <span>{entity?.label || material.name}</span>
    </div>
  );
}
