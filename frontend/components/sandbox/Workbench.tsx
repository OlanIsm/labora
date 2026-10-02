"use client";
import { useDraggable, useDroppable, useDndContext } from "@dnd-kit/core";
import { Action, Entity, LabState } from "@/lib/sandbox/types";
import { materials } from "@/lib/sandbox/catalog";
import { totalVolume } from "@/lib/sandbox/measurements";
import EquipmentDrawing from "./EquipmentDrawing";
import { Shape } from "./Shape";
export { Shape } from "./Shape";
import { RACK_SLOTS } from "@/lib/sandbox/rack";
import { canDipLitmus, isLitmus } from "@/lib/sandbox/litmus";
import ChemistryConnections from "@/features/chemistry/Connections";
import { X } from "lucide-react";
import HoverReading from "@/features/chemistry/HoverReading";

function ReturnToRack({ entity, dispatch }: { entity: Entity; dispatch: (action: Action) => void }) {
  return <button type="button" className="chemistry-return-object" aria-label={`Kembalikan ${entity.label} ke rak`} title="Kembalikan ke rak"
    onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); dispatch({ type: "remove", id: entity.id }); }}><span><X size={16} aria-hidden="true" /></span></button>;
}

function BenchItem({
  entity,
  state,
  selected,
  onSelect,
  dispatch,
  docked = false,
}: {
  entity: Entity;
  state: LabState;
  selected: boolean;
  onSelect: () => void;
  dispatch: (a: Action) => void;
  docked?: boolean;
}) {
  const { setNodeRef, listeners, attributes, transform, isDragging } =
    useDraggable({ id: `entity:${entity.id}`, data: { entity: entity.id } });
  const { active } = useDndContext();
  const source = state.entities.find((e) => e.id === active?.data.current?.entity);
  const rackMaterial = materials[String(active?.data.current?.material || "")];
  const testingPaper = isLitmus(rackMaterial?.id || source?.material || "");
  const canPour = !!active && !entity.sealed && materials[entity.material]?.kind === "container" &&
    (testingPaper ? canDipLitmus(entity) : (rackMaterial?.kind === "material" && rackMaterial.phase !== "gas" ||
      source?.id !== entity.id && !source?.sealed && !!source?.contents.some((p) => p.mass > 1e-8)));
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `container:${entity.id}`,
    data: { container: entity.id },
    disabled: !canPour,
  });
  const item = (
    <button
      id={`sandbox-entity-${entity.id}`}
      ref={(node) => { setNodeRef(node); setDropRef(node); }}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      aria-label={`${entity.label}. Pilih untuk mengatur.`}
      aria-pressed={selected}
      data-label-edge={state.discipline === "chemistry" && !docked ? entity.x < 15 ? "left" : entity.x > 70 ? "right" : undefined : undefined}
      data-reading-edge={state.discipline === "chemistry" && entity.y > 65 ? "above" : undefined}
      onKeyDown={(event) => {
        const direction: Record<string, [number, number]> = {
          ArrowLeft: [-4, 0],
          ArrowRight: [4, 0],
          ArrowUp: [0, -4],
          ArrowDown: [0, 4],
        };
        if (direction[event.key]) {
          event.preventDefault();
          dispatch({
            type: "move",
            id: entity.id,
            x: entity.x + direction[event.key][0],
            y: entity.y + direction[event.key][1],
          });
        }
      }}
      className={`sandbox-object ${docked ? "rack-tube" : ""} ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""} ${canPour ? "pour-ready" : ""} ${isOver ? "pour-over" : ""}`}
      style={{
        left: state.discipline === "chemistry" || docked ? 0 : `${entity.x}%`,
        top: state.discipline === "chemistry" || docked ? 0 : `${entity.y}%`,
        transform: transform && state.discipline !== "chemistry"
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
      }}
    >
      <Shape entity={entity} state={state} />
      {state.discipline === "chemistry" && <HoverReading entity={entity} state={state} />}
      {state.discipline === "chemistry" && entity.material === "stopwatch" && <output className="chemistry-object-reading" aria-label="Waktu stopwatch">{(entity.measurements["Waktu (s)"] || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s</output>}
      <span>{entity.label}</span>
      {isOver && <small className="sandbox-drop-hint">{testingPaper ? "Lepas untuk mencelupkan" : "Lepas untuk menuang"}</small>}
      {materials[entity.material]?.kind === "container" && entity.contents.some((p) => p.mass > 1e-8) && (
        <small>{entity.contents.filter((p) => p.mass > 1e-8).map((p) => materials[p.material]?.name).join(" + ")}</small>
      )}
      {entity.status && <small>{entity.status}</small>}
    </button>
  );
  if (state.discipline !== "chemistry") return item;
  return <div className={`chemistry-bench-item ${docked ? "chemistry-docked-item" : ""}`} style={{ left: docked ? 0 : `${entity.x}%`, top: docked ? 0 : `${entity.y}%`, transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined }}>
    {item}{selected && !isDragging && <ReturnToRack entity={entity} dispatch={dispatch} />}
  </div>;
}
function RackSlot({ rack, slot, state, selected, dispatch, onSelect, onPlaceTube }: {
  rack: Entity;
  slot: number;
  state: LabState;
  selected: string;
  dispatch: (a: Action) => void;
  onSelect: (id: string) => void;
  onPlaceTube: (rack: string, slot: number, source: { entity: string } | { material: string }) => void;
}) {
  const tube = state.entities.find((e) => e.rackPlacement?.rack === rack.id && e.rackPlacement.slot === slot);
  const { active } = useDndContext();
  const draggedTube = active?.data.current?.material === "test-tube" ||
    state.entities.some((e) => e.id === active?.data.current?.entity && e.material === "test-tube");
  const { setNodeRef, isOver } = useDroppable({
    id: `rack-slot:${rack.id}:${slot}`,
    data: { rack: rack.id, slot },
    disabled: !!tube || !draggedTube,
  });
  return (
    <div ref={setNodeRef} className={`sandbox-rack-slot ${!tube && draggedTube ? "slot-ready" : ""} ${isOver ? "slot-over" : ""}`}>
      {tube ? <BenchItem entity={tube} state={state} selected={selected === tube.id} onSelect={() => onSelect(tube.id)} dispatch={dispatch} docked /> : (
        <button className="sandbox-slot-placeholder" aria-label={`Taruh tabung reaksi di ${rack.label}, slot ${slot + 1}`}
          onClick={() => onPlaceTube(rack.id, slot, state.entities.some((e) => e.id === selected && e.material === "test-tube" && !e.rackPlacement) ? { entity: selected } : { material: "test-tube" })}>
          <svg viewBox="22 0 36 95" aria-hidden="true">
            <path d="M30 9H50V72A10 10 0 0 1 30 72Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M35 43H45M40 38V48" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>{isOver ? "Lepas di sini" : `Slot ${slot + 1}`}</span>
        </button>
      )}
    </div>
  );
}

function TestTubeRack({ rack, state, selected, dispatch, onSelect, onPlaceTube }: {
  rack: Entity;
  state: LabState;
  selected: string;
  dispatch: (a: Action) => void;
  onSelect: (id: string) => void;
  onPlaceTube: (rack: string, slot: number, source: { entity: string } | { material: string }) => void;
}) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id: `entity:${rack.id}`, data: { entity: rack.id } });
  return (
    <div id={`sandbox-entity-${rack.id}`} ref={setNodeRef} className={`sandbox-tube-rack ${isDragging ? "dragging" : ""}`} style={{
      left: `min(${rack.x}%, calc(100% - 216px))`, top: `min(${rack.y}%, calc(100% - 184px))`,
      transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
    }}>
      <svg className="sandbox-rack-frame rack-frame-back" viewBox="0 0 216 140" aria-hidden="true">
        <path d="M6 58H210V68H6ZM12 68V108M204 68V108" fill="#d2e5ec" stroke="#426b7d" strokeWidth="3" />
        {[36, 108, 180].map((x) => <ellipse key={x} cx={x} cy="59" rx="16" ry="5" fill="#fff" stroke="#426b7d" />)}
      </svg>
      <div className="sandbox-rack-slots">
        {Array.from({ length: RACK_SLOTS }, (_, slot) => <RackSlot key={slot} rack={rack} slot={slot} state={state} selected={selected} dispatch={dispatch} onSelect={onSelect} onPlaceTube={onPlaceTube} />)}
      </div>
      <svg className="sandbox-rack-frame rack-frame-front" viewBox="0 0 216 140" aria-hidden="true">
        <path d="M6 87H210V96H6ZM6 108H210V116H6Z" fill="#d2e5ec" stroke="#426b7d" strokeWidth="2" />
      </svg>
      <button {...listeners} {...attributes} className="sandbox-rack-handle" aria-pressed={selected === rack.id}
        onClick={() => onSelect(rack.id)} onKeyDown={(event) => {
          const delta: Record<string, [number, number]> = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] };
          if (!delta[event.key]) return;
          event.preventDefault();
          dispatch({ type: "move", id: rack.id, x: rack.x + delta[event.key][0], y: rack.y + delta[event.key][1] });
        }}>{rack.label}</button>
      {state.discipline === "chemistry" && selected === rack.id && !isDragging && <ReturnToRack entity={rack} dispatch={dispatch} />}
    </div>
  );
}
export default function Workbench({
  state,
  selected,
  onSelect,
  dispatch,
  onPlaceTube,
  expanded = false,
}: {
  state: LabState;
  selected: string;
  onSelect: (id: string) => void;
  dispatch: (a: Action) => void;
  onPlaceTube: (rack: string, slot: number, source: { entity: string } | { material: string }) => void;
  expanded?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "bench" });
  const firstTool =
    state.discipline === "physics"
      ? "pendulum"
      : state.discipline === "biology"
        ? "microscope"
        : "beaker";
  return (
    <div
      ref={setNodeRef}
      id="sandbox-bench"
      className={`sandbox-bench ${isOver ? "drop-over" : ""} ${state.discipline === "chemistry" && expanded ? "chemistry-bench-expanded" : ""}`}
      aria-label="Meja eksperimen bebas"
      onClick={event => {
        if (state.discipline === "chemistry" && event.target === event.currentTarget) onSelect("");
      }}
    >
      {state.discipline === "chemistry" ? <ChemistryConnections state={state} dispatch={dispatch} /> : <svg
        className="sandbox-connections"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label="Sambungan alat"
      >
        {state.entities.flatMap((e) =>
          e.connections
            .filter((id) => id > e.id)
            .map((id) => {
              const target = state.entities.find((x) => x.id === id);
              return target ? (
                <line
                  key={`${e.id}-${id}`}
                  x1={e.x + 5}
                  y1={e.y + 6}
                  x2={target.x + 5}
                  y2={target.y + 6}
                  stroke="#597c8b"
                  strokeWidth=".5"
                />
              ) : null;
            }),
        )}
      </svg>}
      {!state.entities.length && (
        <div className="sandbox-bench-empty">
          <EquipmentDrawing material={materials[firstTool]} />
          <h2>Mulai dari satu alat.</h2>
          <p>Letakkan alat di meja, lalu pilih untuk mencobanya.</p>
          <button
            onClick={() => {
              dispatch({ type: "add", material: firstTool });
              onSelect(`e${state.nextId}`);
            }}
          >
            Ambil {materials[firstTool].name.toLowerCase()}
          </button>
          <small>Atau pilih alat lain di rak. Tidak ada urutan wajib.</small>
        </div>
      )}
      {state.entities.filter((e) => !e.rackPlacement).map((e) => e.material === "rack" ? (
        <TestTubeRack key={e.id} rack={e} state={state} selected={selected} dispatch={dispatch} onSelect={onSelect} onPlaceTube={onPlaceTube} />
      ) : (
        <BenchItem
          key={e.id}
          entity={e}
          state={state}
          selected={e.id === selected}
          onSelect={() => onSelect(e.id)}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
}
