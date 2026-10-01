"use client";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Wrench, Leaf, Microscope, Zap } from "lucide-react";
import { Action, Entity, LabState } from "@/lib/sandbox/types";
import { materials, specimens } from "@/lib/sandbox/catalog";
import { totalVolume } from "@/lib/sandbox/measurements";
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
  if (
    hasEquipmentDrawing(m) &&
    !(e.material === "microscope" && magnified) &&
    !(
      m.discipline === "physics" &&
      ["pendulum", "spring", "fall", "projectile"].includes(model || "")
    )
  )
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
        color={e.color}
        sealed={e.sealed}
        sediment={!!e.precipitate}
        gas={e.gas > 0}
        layered={e.status === "Dua lapisan"}
        hot={e.temperature > 70}
        value={
          e.material === "ph-meter"
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
  if (model === "chromatography") {
    const length = Math.max(1, e.params.paperLength || 80);
    const front = e.measurements["Front pelarut model (mm)"] || 0;
    return (
      <svg viewBox="0 0 80 85" aria-hidden="true">
        <rect
          x="15"
          y="3"
          width="50"
          height="76"
          fill="#fffef2"
          stroke="#76859a"
        />
        <path d="M18 72H62" stroke="#76859a" strokeDasharray="3 2" />
        <path
          d={`M18 ${72 - (front / length) * 60}H62`}
          stroke="#155c7b"
          strokeDasharray="3 2"
        />
        {["#b13c68", "#66519b", "#35778a"].map((color, index) => {
          const distance =
            e.measurements[`Jarak pigmen ${index + 1} model (mm)`];
          return distance !== undefined ? (
            <ellipse
              key={color}
              cx="40"
              cy={72 - (distance / length) * 60}
              rx="10"
              ry="3"
              fill={color}
            />
          ) : null;
        })}
      </svg>
    );
  }
  if (e.material === "balloon") {
    const volume = e.measurements["Gas terbentuk (mL)"] || 0;
    const radius = Math.min(28, 6 + Math.cbrt(volume) * 2);
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <ellipse
          cx="40"
          cy="34"
          rx={radius}
          ry={radius * 1.1}
          fill="#dba3c3"
          stroke="#8a4d71"
        />
        <path d={`M40 ${34 + radius * 1.1}L40 77`} stroke="#8a4d71" />
      </svg>
    );
  }
  if (model === "incline" || model === "friction") {
    const angle = (Math.max(0, Math.min(80, e.params.angle)) * Math.PI) / 180;
    const x = 8 + 70 * Math.cos(angle),
      y = 70 - 70 * Math.sin(angle);
    const travel = Math.min(
      60,
      Math.max(0, e.measurements["Posisi (m)"] || 0) * 8,
    );
    return (
      <svg viewBox="0 0 100 80" aria-hidden="true">
        <path d={`M8 70L${x} ${y}V70Z`} fill="#f9eebd" stroke="#806500" />
        <g
          transform={`translate(${x - travel * Math.cos(angle)} ${y + travel * Math.sin(angle)}) rotate(${-e.params.angle})`}
        >
          <rect
            x="-22"
            y="-16"
            width="20"
            height="15"
            rx="2"
            fill="#e5c652"
            stroke="#806500"
          />
        </g>
      </svg>
    );
  }
  if (["newton", "collision"].includes(model || "")) {
    const position =
      e.measurements["Posisi (m)"] || e.params.time * e.params.speed;
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <path d="M4 64H96" stroke="#806500" />
        <g transform={`translate(${Math.min(65, Math.abs(position) * 4)},0)`}>
          <rect
            x="4"
            y="40"
            width="26"
            height="20"
            rx="4"
            fill="#e5c652"
            stroke="#806500"
          />
          <circle cx="9" cy="63" r="4" fill="#806500" />
          <circle cx="25" cy="63" r="4" fill="#806500" />
        </g>
      </svg>
    );
  }
  if (model === "fall")
    return (
      <svg viewBox="0 0 100 80" aria-hidden="true">
        <path
          d="M50 8V70M15 70H85"
          stroke="#806500"
          strokeDasharray="3 3"
          fill="none"
        />
        <circle
          cx="50"
          cy={10 + Math.min(53, (e.measurements["Jarak jatuh (m)"] || 0) * 5)}
          r="7"
          fill="#d45a89"
        />
      </svg>
    );
  if (model === "projectile") {
    const y = e.measurements["y (m)"] || 0;
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <path
          d="M5 62H95M12 62Q50 4 90 62"
          fill="none"
          stroke="#806500"
          strokeDasharray="4 3"
        />
        <circle
          cx={10 + Math.min(80, (e.measurements["x (m)"] || 0) * 3)}
          cy={62 - Math.min(50, y * 5)}
          r="7"
          fill="#d45a89"
        />
      </svg>
    );
  }
  if (model === "pendulum")
    return (
      <span
        className="sandbox-pendulum"
        style={{
          transform: `rotate(${e.measurements["Sudut saat ini (°)"] || 0}deg)`,
        }}
      >
        <i />
      </span>
    );
  if (model === "spring")
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <path
          d="M50 2L50 10 35 16 65 23 35 30 65 37 35 44 65 51 50 58V65"
          stroke="#806500"
          strokeWidth="3"
          fill="none"
        />
        <rect x="35" y="60" width="30" height="14" rx="5" fill="#edcf56" />
      </svg>
    );
  if (
    model === "lens" ||
    model === "snell" ||
    model === "reflection" ||
    model === "dispersion"
  )
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <ellipse
          cx="50"
          cy="37"
          rx="9"
          ry="33"
          fill="#badfea"
          stroke="#427c93"
        />
        <path
          d="M2 5L50 37L98 62M2 65L50 37L98 10"
          stroke="#b74c64"
          fill="none"
          strokeWidth="2"
        />
      </svg>
    );
  if (model === "microscope" || e.material === "microscope") {
    const sample = specimens[e.material]
      ? e
      : state.entities.find(
          (x) => e.connections.includes(x.id) && !!specimens[x.material],
        );
    return (
      <span
        className={`sandbox-microscope ${sample ? `specimen-${specimens[sample.material]?.shape || "plant"} sample-${sample.material}` : ""} ${e.params.magnification >= 100 ? "detail-visible" : ""}`}
        style={{
          filter: `blur(${Math.min(4, Math.abs(e.params.focus) * 0.4)}px)`,
          opacity: Math.max(0.1, Math.min(1, e.params.light / 50)),
        }}
      >
        {sample ? (
          Array.from(
            { length: e.params.magnification >= 400 ? 3 : 7 },
            (_, i) => (
              <i
                key={i}
                className={
                  sample.material === "blood" || sample.material === "cheek"
                    ? "round-cell"
                    : ""
                }
              />
            ),
          )
        ) : (
          <Microscope size={44} />
        )}
      </span>
    );
  }
  if (
    ["photosynthesis", "transpiration", "growth", "soil"].includes(model || "")
  )
    return (
      <span className="sandbox-plant">
        <Leaf
          size={46}
          color={e.status.includes("Pucat") ? "#bcad7b" : "#46753c"}
        />
        {e.measurements["Laju O₂ relatif"] > 0 && e.active && (
          <span className="sandbox-bubbles">
            <i />
            <i />
            <i />
          </span>
        )}
      </span>
    );
  if (model === "wave" || model === "sound")
    return (
      <svg viewBox="0 0 100 75" aria-hidden="true">
        <path
          d="M0 38Q12 2 25 38T50 38T75 38T100 38"
          stroke="#806500"
          fill="none"
          strokeWidth="3"
        />
      </svg>
    );
  if (model === "buoyancy")
    return (
      <span className="sandbox-fluid">
        <i
          style={{
            top:
              e.status === "Terapung"
                ? "15%"
                : e.status === "Melayang"
                  ? "42%"
                  : "70%",
          }}
        />
      </span>
    );
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
function BenchItem({
  entity,
  state,
  selected,
  onSelect,
  dispatch,
}: {
  entity: Entity;
  state: LabState;
  selected: boolean;
  onSelect: () => void;
  dispatch: (a: Action) => void;
}) {
  const { setNodeRef, listeners, attributes, transform, isDragging } =
    useDraggable({ id: `entity:${entity.id}`, data: { entity: entity.id } });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      aria-label={`${entity.label}. Pilih untuk mengatur.`}
      aria-pressed={selected}
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
      className={`sandbox-object ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
      style={{
        left: `${entity.x}%`,
        top: `${entity.y}%`,
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
      }}
    >
      <Shape entity={entity} state={state} />
      <span>{entity.label}</span>
      {entity.status && <small>{entity.status}</small>}
    </button>
  );
}
export default function Workbench({
  state,
  selected,
  onSelect,
  dispatch,
}: {
  state: LabState;
  selected: string;
  onSelect: (id: string) => void;
  dispatch: (a: Action) => void;
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
      className={`sandbox-bench ${isOver ? "drop-over" : ""}`}
      aria-label="Meja eksperimen bebas"
    >
      <svg
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
      </svg>
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
      {state.entities.map((e) => (
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
