"use client";
import { useDroppable } from "@dnd-kit/core";
import { useRef } from "react";
import {
  CIRCUIT_CELL,
  CIRCUIT_COLUMNS,
  CIRCUIT_HEIGHT,
  CIRCUIT_MARGIN,
  CIRCUIT_ROWS,
  CIRCUIT_WIDTH,
  COMPONENT_NAMES,
  samePoint,
  snapPoint,
} from "../../domain/circuit/editor";
import type { ComponentKind } from "../../domain/circuit/engine";
import type { GridPoint, PlacedComponent } from "../../domain/circuit/presets";

export type CircuitRenderState = {
  components: PlacedComponent[];
  currents: Record<string, number>;
  brightness: Record<string, number>;
  overloadedId: string | null;
  reducedMotion: boolean;
};

export function CircuitSymbol({
  kind,
  closed = true,
  broken = false,
  brightness = 0,
}: {
  kind: ComponentKind;
  closed?: boolean;
  broken?: boolean;
  brightness?: number;
}) {
  if (kind === "lamp")
    return (
      <>
        <circle
          r="20"
          fill={
            broken
              ? "#dde5f0"
              : brightness > 0
                ? `rgba(255, 216, 77, ${0.25 + brightness * 0.75})`
                : "#fff9db"
          }
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M-12-12 12 12 M-12 12 12-12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        {brightness > 0 && !broken && (
          <g stroke="#806500" strokeWidth="2" opacity={0.4 + brightness * 0.6}>
            <path d="M0-26v-7 M0 26v7 M-26 0h-7 M26 0h7" />
          </g>
        )}
      </>
    );
  if (kind === "battery")
    return (
      <>
        <rect x="-22" y="-24" width="44" height="48" rx="8" fill="#eaf9ff" />
        <path d="M-7-21v42 M7-12v24" stroke="currentColor" strokeWidth="4" />
      </>
    );
  if (kind === "resistor")
    return (
      <>
        <rect
          x="-24"
          y="-12"
          width="48"
          height="24"
          rx="4"
          fill="#fff9db"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M-14-12v24 M-3-12v24 M10-12v24"
          stroke="#a66c23"
          strokeWidth="4"
        />
      </>
    );
  if (kind === "switch")
    return (
      <>
        <rect x="-28" y="-25" width="56" height="50" fill="#f8fbff" />
        <path
          d={closed ? "M-20 0H20" : "M-20 0 15-20"}
          stroke="currentColor"
          strokeWidth="3"
        />
        <circle cx="-20" r="4" fill="currentColor" />
        <circle cx="20" r="4" fill="currentColor" />
      </>
    );
  if (kind === "fuse")
    return (
      <>
        <rect
          x="-22"
          y="-10"
          width="44"
          height="20"
          rx="6"
          fill={broken ? "#ffedef" : "#f1fceb"}
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d={broken ? "M-16 0h9 M7 0h9" : "M-16 0H16"}
          stroke={broken ? "#9a303b" : "currentColor"}
          strokeWidth="3"
        />
      </>
    );
  return <path d="M-25 0H25" stroke="currentColor" strokeWidth="4" />;
}

const screen = (p: GridPoint) => ({
  x: CIRCUIT_MARGIN + p.col * CIRCUIT_CELL,
  y: CIRCUIT_MARGIN + p.row * CIRCUIT_CELL,
});

export default function CircuitCanvas({
  state,
  onSelect,
  selectedId,
  wireMode,
  wireStart,
  onTerminal,
  onMove,
  onRemove,
}: {
  state: CircuitRenderState;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  wireMode: boolean;
  wireStart: GridPoint | null;
  onTerminal: (point: GridPoint) => void;
  onMove: (id: string, dc: number, dr: number) => void;
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "circuit-board" });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; point: GridPoint } | null>(null);
  const terminals = new Map<string, GridPoint>();
  for (const c of state.components)
    for (const point of [c.from, c.to])
      terminals.set(`${point.col},${point.row}`, point);
  function pointerPoint(event: React.PointerEvent | React.MouseEvent) {
    const rect = svgRef.current!.getBoundingClientRect();
    return snapPoint(
      (((event.clientX - rect.left) / rect.width) * CIRCUIT_WIDTH -
        CIRCUIT_MARGIN) /
        CIRCUIT_CELL,
      (((event.clientY - rect.top) / rect.height) * CIRCUIT_HEIGHT -
        CIRCUIT_MARGIN) /
        CIRCUIT_CELL,
    );
  }
  return (
    <>
      <div
        ref={setNodeRef}
        className={`circuit-board-scroll ${isOver ? "is-over" : ""}`}
      >
        <svg
          ref={svgRef}
          className={`circuit-board ${wireMode ? "wiring" : ""}`}
          viewBox={`0 0 ${CIRCUIT_WIDTH} ${CIRCUIT_HEIGHT}`}
          role="group"
          aria-label="Meja rangkaian listrik"
          onClick={(event) => {
            if (wireMode) onTerminal(pointerPoint(event));
            else onSelect(null);
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            const point = pointerPoint(event);
            onMove(
              drag.current.id,
              point.col - drag.current.point.col,
              point.row - drag.current.point.row,
            );
            drag.current.point = point;
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <rect width={CIRCUIT_WIDTH} height={CIRCUIT_HEIGHT} fill="#f8fbff" />
          <g fill="#bdc9d8" aria-hidden="true">
            {Array.from(
              { length: (CIRCUIT_COLUMNS + 1) * (CIRCUIT_ROWS + 1) },
              (_, index) => {
                const p = screen({
                  col: index % (CIRCUIT_COLUMNS + 1),
                  row: Math.floor(index / (CIRCUIT_COLUMNS + 1)),
                });
                return <circle key={index} cx={p.x} cy={p.y} r="2" />;
              },
            )}
          </g>
          {!state.components.length && (
            <g className="circuit-empty" pointerEvents="none">
              <text x={CIRCUIT_WIDTH / 2} y="175" textAnchor="middle">
                Rangkaianmu dimulai di sini.
              </text>
              <text x={CIRCUIT_WIDTH / 2} y="208" textAnchor="middle">
                Seret baterai dan lampu dari rak, lalu sambungkan kabel.
              </text>
            </g>
          )}
          {state.components.map((c) => {
            const a = screen(c.from),
              b = screen(c.to);
            const x = (a.x + b.x) / 2,
              y = (a.y + b.y) / 2;
            const selected = selectedId === c.id;
            const current = state.currents[c.id] || 0;
            return (
              <g
                key={c.id}
                className={`circuit-part ${selected ? "selected" : ""}`}
                data-component={c.id}
                tabIndex={0}
                role="button"
                aria-label={`${COMPONENT_NAMES[c.kind]} ${c.id}, gunakan tombol panah untuk memindahkan`}
                aria-pressed={selected}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(c.id);
                }}
                onPointerDown={(event) => {
                  if (event.button !== 0 || wireMode) return;
                  event.stopPropagation();
                  onSelect(c.id);
                  drag.current = { id: c.id, point: pointerPoint(event) };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onKeyDown={(event) => {
                  const moves: Record<string, [number, number]> = {
                    ArrowLeft: [-1, 0],
                    ArrowRight: [1, 0],
                    ArrowUp: [0, -1],
                    ArrowDown: [0, 1],
                  };
                  if (moves[event.key]) {
                    event.preventDefault();
                    onSelect(c.id);
                    onMove(c.id, ...moves[event.key]);
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(c.id);
                  }
                  if (event.key === "Delete" || event.key === "Backspace") {
                    event.preventDefault();
                    onRemove(c.id);
                  }
                }}
              >
                <title>
                  {COMPONENT_NAMES[c.kind]} {c.id}
                </title>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="transparent"
                  strokeWidth="26"
                />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={selected ? "#155c7b" : "#4c546a"}
                  strokeWidth={selected ? 5 : 3}
                />
                {Math.abs(current) > 1e-6 && (
                  <line
                    className={`circuit-flow ${state.reducedMotion ? "still" : ""}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#155c7b"
                    strokeWidth="5"
                    strokeDasharray="1 20"
                    strokeLinecap="round"
                    style={{
                      animationDirection: current < 0 ? "reverse" : "normal",
                    }}
                  />
                )}
                {c.kind !== "wire" && (
                  <g
                    transform={`translate(${x} ${y}) rotate(${c.kind === "lamp" ? 0 : (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI})`}
                  >
                    <CircuitSymbol
                      kind={c.kind}
                      closed={c.closed}
                      broken={c.blown || c.burnedOut}
                      brightness={state.brightness[c.id]}
                    />
                  </g>
                )}
                {c.kind !== "wire" && (
                  <text
                    x={x}
                    y={y + 47}
                    textAnchor="middle"
                    className="circuit-part-label"
                  >
                    {c.kind === "battery"
                      ? `${c.voltage} V`
                      : c.kind === "lamp" || c.kind === "resistor"
                        ? `${c.resistance} Ω`
                        : c.kind === "switch"
                          ? c.closed
                            ? "Tertutup"
                            : "Terbuka"
                          : c.blown
                            ? "Putus"
                            : `${c.fuseRatingAmps} A`}
                  </text>
                )}
                {c.kind === "battery" && (
                  <g className="circuit-polarity">
                    <text x={a.x - 20} y={a.y - 12}>
                      +
                    </text>
                    <text x={b.x - 20} y={b.y + 24}>
                      −
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {[...terminals].map(([key, point]) => {
            const p = screen(point),
              active = wireStart && samePoint(wireStart, point);
            return (
              <g
                key={key}
                role="button"
                tabIndex={0}
                aria-label={`Terminal kolom ${point.col + 1}, baris ${point.row + 1}`}
                aria-pressed={!!active}
                className={`circuit-terminal ${active ? "active" : ""}`}
                data-terminal={key}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onTerminal(point);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTerminal(point);
                  }
                }}
              >
                <circle cx={p.x} cy={p.y} r="26" fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={active ? 10 : 6}
                  fill={active ? "#ffd84d" : "#fff"}
                  stroke="#155c7b"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}
          {wireStart && !terminals.has(`${wireStart.col},${wireStart.row}`) && (
            <circle
              cx={screen(wireStart).x}
              cy={screen(wireStart).y}
              r="10"
              fill="#ffd84d"
              stroke="#155c7b"
              strokeWidth="2.5"
            />
          )}
        </svg>
      </div>
      <div
        className="sim-object-selector"
        role="group"
        aria-label="Pilih komponen rangkaian"
      >
        {state.components.map((c) => (
          <button
            className="sim-chip"
            key={c.id}
            aria-pressed={selectedId === c.id}
            onClick={() => onSelect(c.id)}
          >
            {COMPONENT_NAMES[c.kind]} ({c.id})
          </button>
        ))}
      </div>
    </>
  );
}
