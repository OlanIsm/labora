"use client";
import { GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Ray } from "../../domain/optics/engine";
import type { SceneObject } from "../../domain/optics/scene";
import type { Vector2 } from "../../domain/shared/vector2";

const PIXELS_PER_METER = 18;
const CANVAS_HEIGHT = 420;

function worldToScreen(
  point: Vector2,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: width / 2 + point.x * PIXELS_PER_METER,
    y: height / 2 - point.y * PIXELS_PER_METER,
  };
}

function screenToWorld(
  x: number,
  y: number,
  width: number,
  height: number,
): Vector2 {
  return {
    x: (x - width / 2) / PIXELS_PER_METER,
    y: (height / 2 - y) / PIXELS_PER_METER,
  };
}

export function wavelengthToColor(wavelengthNm: number): string {
  if (wavelengthNm >= 650) return "#ff3b30";
  if (wavelengthNm >= 590) return "#ff9500";
  if (wavelengthNm >= 560) return "#ffe600";
  if (wavelengthNm >= 490) return "#34c759";
  if (wavelengthNm >= 450) return "#0a84ff";
  if (wavelengthNm >= 420) return "#5e5ce6";
  return "#af52de";
}

export type OpticsRenderState = {
  objects: SceneObject[];
  traces: { ray: Ray; endPoint: Vector2 }[][];
  selectedId: string | null;
};

export default function OpticsCanvas({
  state,
  onSelect,
  onDragObject,
}: {
  state: OpticsRenderState;
  onSelect: (id: string | null) => void;
  onDragObject: (id: string, position: Vector2) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [draggingId, setDraggingId] = useState<string | null>(null);

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

    let frameId: number;
    function draw() {
      const current = stateRef.current;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.fillStyle = "#0b1120";
      ctx.fillRect(0, 0, width, height);

      for (const trace of current.traces) {
        for (const segment of trace) {
          const start = worldToScreen(segment.ray.origin, width, height);
          const end = worldToScreen(segment.endPoint, width, height);
          ctx.strokeStyle = wavelengthToColor(segment.ray.wavelengthNm);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }
      }

      for (const object of current.objects) {
        drawObject(
          ctx,
          object,
          width,
          height,
          object.id === current.selectedId,
        );
      }

      frameId = requestAnimationFrame(draw);
    }
    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  function pointerPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function findNearestObject(
    x: number,
    y: number,
    width: number,
    height: number,
  ): string | null {
    let closest: string | null = null;
    let closestDist = 24;
    for (const object of state.objects) {
      const screenPoint = worldToScreen(object.position, width, height);
      const dist = Math.hypot(screenPoint.x - x, screenPoint.y - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = object.id;
      }
    }
    return closest;
  }

  return (
    <div ref={containerRef} className="sim-canvas-container">
      {state.objects.length > 0 && (
        <span className="sim-draggable-badge">
          <GripVertical size={12} /> Seret objek untuk memindahkannya
        </span>
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Papan sandbox laser dan lensa"
        style={{ cursor: draggingId ? "grabbing" : "grab" }}
        onPointerDown={(event) => {
          const pos = pointerPos(event);
          const width = canvasRef.current!.clientWidth;
          const height = canvasRef.current!.clientHeight;
          const id = findNearestObject(pos.x, pos.y, width, height);
          onSelect(id);
          if (id) {
            setDraggingId(id);
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onPointerMove={(event) => {
          if (!draggingId) return;
          const pos = pointerPos(event);
          const width = canvasRef.current!.clientWidth;
          const height = canvasRef.current!.clientHeight;
          onDragObject(draggingId, screenToWorld(pos.x, pos.y, width, height));
        }}
        onPointerUp={() => setDraggingId(null)}
        onPointerCancel={() => setDraggingId(null)}
      />
      <div
        className="sim-object-selector"
        role="group"
        aria-label="Pilih objek optik"
      >
        {state.objects.map((object) => (
          <button
            className="sim-chip"
            key={object.id}
            aria-pressed={state.selectedId === object.id}
            onClick={() => onSelect(object.id)}
          >
            {
              {
                mirror: "Cermin",
                convexLens: "Lensa cembung",
                concaveLens: "Lensa cekung",
                prism: "Prisma",
                screen: "Layar",
              }[object.kind]
            }
          </button>
        ))}
      </div>
    </div>
  );
}

function drawObject(
  ctx: CanvasRenderingContext2D,
  object: SceneObject,
  width: number,
  height: number,
  selected: boolean,
) {
  const center = worldToScreen(object.position, width, height);
  const halfPx = (object.size / 2) * PIXELS_PER_METER;

  // Draggable-handle ring around every object, visible before the student
  // even clicks, so it is obvious these can be picked up and moved.
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = selected ? "#facc15" : "rgba(226, 232, 240, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.arc(center.x, center.y, halfPx + 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.fillStyle = selected ? "#facc15" : "#e2e8f0";
  ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(-object.rotationRad);
  ctx.strokeStyle = selected ? "#facc15" : "#e5e7eb";
  ctx.lineWidth = selected ? 3 : 2;

  if (object.kind === "mirror") {
    ctx.beginPath();
    ctx.moveTo(-halfPx, 0);
    ctx.lineTo(halfPx, 0);
    ctx.stroke();
  } else if (object.kind === "convexLens" || object.kind === "concaveLens") {
    ctx.fillStyle = "rgba(96, 165, 250, 0.25)";
    const bulge = object.kind === "convexLens" ? 10 : -10;
    ctx.beginPath();
    ctx.moveTo(0, -halfPx);
    ctx.quadraticCurveTo(bulge, 0, 0, halfPx);
    ctx.quadraticCurveTo(-bulge, 0, 0, -halfPx);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (object.kind === "prism") {
    const r = (object.size / 2) * PIXELS_PER_METER;
    ctx.fillStyle = "rgba(167, 139, 250, 0.2)";
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const px = Math.cos(angle) * r;
      const py = -Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (object.kind === "screen") {
    ctx.fillStyle = "rgba(229, 231, 235, 0.15)";
    ctx.fillRect(-6, -halfPx, 12, object.size * PIXELS_PER_METER);
    ctx.strokeRect(-6, -halfPx, 12, object.size * PIXELS_PER_METER);
  }
  ctx.restore();
}
