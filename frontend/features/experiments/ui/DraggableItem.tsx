"use client";

import type { Item } from "@/features/experiments/domain/definitions";
import { Icon } from "@/features/experiments/ui/EquipmentIcon";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

export function DraggableItem({
  item,
  selected,
  onSelect,
  needed,
}: {
  item: Item;
  selected: boolean;
  onSelect: () => void;
  needed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.id });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      aria-label={`${item.name}${needed ? ", untuk langkah ini" : ""}. Pilih atau geser ke meja.`}
      aria-pressed={selected}
      className={`inventory-item ${selected ? "selected" : ""} ${needed ? "needed" : ""} ${isDragging ? "dragging" : ""}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
      }}
    >
      <span className="inventory-item-status">
        {needed ? "Pakai sekarang" : <GripVertical size={15} />}
      </span>
      <Icon name={item.icon} size={30} />
      <span>{item.name}</span>
    </button>
  );
}
