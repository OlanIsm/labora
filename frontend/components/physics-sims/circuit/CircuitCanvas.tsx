"use client";
import { useEffect, useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { GridPoint, PlacedComponent } from "../../../lib/physics-sims/circuit/presets";

const CELL_PX = 70;
const CANVAS_HEIGHT = 360;
const ELECTRON_SPEED_PX_PER_SEC = 60; // visual pace, scaled further by current magnitude

function gridToScreen(point: GridPoint, originX: number, originY: number): { x: number; y: number } {
  return { x: originX + point.col * CELL_PX, y: originY + point.row * CELL_PX };
}

export type CircuitRenderState = {
  components: PlacedComponent[];
  currents: Record<string, number>; // signed amps, from the solver
  brightness: Record<string, number>; // 0..1, lamps only
  overloadedId: string | null; // component that just blew/burned, for the flash effect
  reducedMotion: boolean;
};

export default function CircuitCanvas({
  state,
  onSelect,
  selectedId,
}: {
  state: CircuitRenderState;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const electronPhase = useRef(0);
  const flashUntil = useRef(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (state.overloadedId) flashUntil.current = performance.now() + 400;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.overloadedId]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const containerEl = containerRef.current;
    if (!canvasEl || !containerEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const container: HTMLDivElement = containerEl;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      canvas.width = width * dpr;
      canvas.height = CANVAS_HEIGHT * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${CANVAS_HEIGHT}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let lastTime = performance.now();
    let frameId: number;
    function draw(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const current = stateRef.current;
      if (!current.reducedMotion) electronPhase.current += dt;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, width, height);

      const originX = 60;
      const originY = 60;

      for (const component of current.components) {
        drawComponent(
          ctx,
          component,
          originX,
          originY,
          current.currents[component.id] || 0,
          current.brightness[component.id] || 0,
          component.id === selectedId,
          electronPhase.current,
          current.reducedMotion,
          now < flashUntil.current && component.id === current.overloadedId,
          component.id === hoveredId,
        );
      }

      frameId = requestAnimationFrame(draw);
    }
    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [hoveredId, selectedId]);

  function pointerPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function findNearestComponent(x: number, y: number): string | null {
    const originX = 60;
    const originY = 60;
    let closest: string | null = null;
    let closestDist = 20;
    for (const component of state.components) {
      const a = gridToScreen(component.from, originX, originY);
      const b = gridToScreen(component.to, originX, originY);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const denominator = dx * dx + dy * dy;
      const t = denominator ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / denominator)) : 0;
      const dist = Math.hypot(a.x + t * dx - x, a.y + t * dy - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = component.id;
      }
    }
    return closest;
  }

  return (
    <div ref={containerRef} className="sim-canvas-container">
      <span className="sim-draggable-badge">
        <MousePointer2 size={12} /> Klik komponen untuk melihat dan mengaturnya
      </span>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Rangkaian listrik dinamis dengan animasi arus elektron"
        style={{ cursor: hoveredId ? "pointer" : "default" }}
        onPointerMove={(event) => {
          const pos = pointerPos(event);
          setHoveredId(findNearestComponent(pos.x, pos.y));
        }}
        onPointerLeave={() => setHoveredId(null)}
        onPointerDown={(event) => {
          const pos = pointerPos(event);
          onSelect(findNearestComponent(pos.x, pos.y));
        }}
      />
      <div className="sim-object-selector" role="group" aria-label="Pilih komponen rangkaian">
        {state.components.map((component) => (
          <button className="sim-chip" key={component.id} aria-pressed={selectedId === component.id} onClick={() => onSelect(component.id)}>
            {({ battery: "Baterai", lamp: "Lampu", wire: "Kabel", switch: "Saklar", fuse: "Sekring", resistor: "Resistor" })[component.kind]} ({component.id})
          </button>
        ))}
      </div>
    </div>
  );
}

function drawComponent(
  ctx: CanvasRenderingContext2D,
  component: PlacedComponent,
  originX: number,
  originY: number,
  current: number,
  brightness: number,
  selected: boolean,
  electronPhase: number,
  reducedMotion: boolean,
  flashing: boolean,
  isHovered: boolean,
) {
  const a = gridToScreen(component.from, originX, originY);
  const b = gridToScreen(component.to, originX, originY);
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;

  // Clickable-zone cue: a soft highlight behind every component, before any
  // interaction, so the student can see what is clickable at a glance.
  if (!selected) {
    ctx.save();
    ctx.strokeStyle = isHovered ? "rgba(47, 111, 237, 0.5)" : "rgba(100, 116, 139, 0.18)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = selected ? "#2f6fed" : "#374151";
  ctx.lineWidth = selected ? 3 : 2.5;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  if (component.kind === "lamp") {
    const isOut = component.burnedOut;
    ctx.beginPath();
    ctx.fillStyle = isOut ? "#4b5563" : `rgba(250, 204, 21, ${0.3 + brightness * 0.7})`;
    ctx.arc(midX, midY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isOut ? "#1f2937" : "#b45309";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (flashing) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
      ctx.arc(midX, midY, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (component.kind === "battery") {
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(midX - 10, midY - 16, 20, 32);
    ctx.fillStyle = "#fff";
    ctx.font = "11px 'Nunito Sans', sans-serif";
    ctx.fillText(`${component.voltage}V`, midX + 14, midY + 4);
  } else if (component.kind === "switch") {
    ctx.beginPath();
    ctx.fillStyle = component.closed ? "#16a34a" : "#dc2626";
    ctx.arc(midX, midY, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (component.kind === "fuse") {
    const isBlown = component.blown;
    ctx.beginPath();
    ctx.fillStyle = isBlown ? "#dc2626" : "#f59e0b";
    ctx.rect(midX - 12, midY - 6, 24, 12);
    ctx.fill();
    ctx.strokeStyle = "#92400e";
    ctx.stroke();
    if (flashing) {
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX - 15, midY - 15);
      ctx.lineTo(midX + 15, midY + 15);
      ctx.moveTo(midX + 15, midY - 15);
      ctx.lineTo(midX - 15, midY + 15);
      ctx.stroke();
    }
  } else if (component.kind === "resistor") {
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(midX - 14, midY - 6, 28, 12);
    ctx.strokeStyle = "#92400e";
    ctx.strokeRect(midX - 14, midY - 6, 28, 12);
  }

  // Electron flow: small dots moving along the wire, speed and density
  // scaled by |current|, direction by its sign (conventional current flows
  // A->B when positive; electrons physically move B->A, noted in the info
  // panel rather than reversing the dots here to keep the visual simple).
  if (!reducedMotion && Math.abs(current) > 1e-6 && !component.blown && !component.burnedOut) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const dirX = (b.x - a.x) / length;
    const dirY = (b.y - a.y) / length;
    const speed = Math.min(2, Math.abs(current) * 0.3) * ELECTRON_SPEED_PX_PER_SEC;
    const dotCount = Math.max(2, Math.min(6, Math.round(Math.abs(current))));
    ctx.fillStyle = "#2563eb";
    for (let i = 0; i < dotCount; i++) {
      const offset = ((electronPhase * speed + (i * length) / dotCount) % length) * Math.sign(current || 1);
      const t = ((offset % length) + length) % length;
      const px = a.x + dirX * t;
      const py = a.y + dirY * t;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
