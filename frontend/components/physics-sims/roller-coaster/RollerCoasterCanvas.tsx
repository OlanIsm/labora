"use client";
import { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { Vector2 } from "../../../lib/physics-sims/shared/vector2";
import { ControlPoint, TrackSample } from "../../../lib/physics-sims/roller-coaster/engine";

const PIXELS_PER_METER = 9;
const CANVAS_HEIGHT = 360;

function worldToScreen(point: Vector2): { x: number; y: number } {
  return { x: 60 + point.x * PIXELS_PER_METER, y: CANVAS_HEIGHT - 40 - point.y * PIXELS_PER_METER };
}

function screenToWorld(x: number, y: number): Vector2 {
  return { x: (x - 60) / PIXELS_PER_METER, y: (CANVAS_HEIGHT - 40 - y) / PIXELS_PER_METER };
}

export type RollerCoasterRenderState = {
  controlPoints: ControlPoint[];
  trackSamples: TrackSample[];
  carPosition: Vector2 | null;
  carRunning: boolean;
  reducedMotion: boolean;
};

export default function RollerCoasterCanvas({
  state,
  editable,
  onDragPoint,
}: {
  state: RollerCoasterRenderState;
  editable: boolean;
  onDragPoint: (index: number, point: ControlPoint) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

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
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f4f6f9";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#c9d4e0";
      ctx.fillRect(0, height - 40, width, 40);

      if (current.trackSamples.length > 1) {
        ctx.strokeStyle = "#4b5563";
        ctx.lineWidth = 4;
        ctx.beginPath();
        current.trackSamples.forEach((sample, index) => {
          const screenPoint = worldToScreen(sample.position);
          if (index === 0) ctx.moveTo(screenPoint.x, screenPoint.y);
          else ctx.lineTo(screenPoint.x, screenPoint.y);
        });
        ctx.stroke();
      }

      if (editable) {
        current.controlPoints.forEach((point, index) => {
          const screenPoint = worldToScreen(point);
          const isDragging = index === draggingIndex;
          // Visible drag-handle ring (not just a filled dot) so the point
          // reads as "grab and move this" before the student even hovers.
          ctx.beginPath();
          ctx.strokeStyle = isDragging ? "#2f6fed" : "#8e44ad";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.arc(screenPoint.x, screenPoint.y, 13, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.fillStyle = isDragging ? "#2f6fed" : "#8e44ad";
          ctx.arc(screenPoint.x, screenPoint.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      if (current.carPosition) {
        const screenPoint = worldToScreen(current.carPosition);
        ctx.beginPath();
        ctx.fillStyle = "#d9534f";
        ctx.arc(screenPoint.x, screenPoint.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#7c1f1a";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      frameId = requestAnimationFrame(draw);
    }
    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [editable, draggingIndex]);

  function pointerPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function findNearestPoint(x: number, y: number): number | null {
    let closest: number | null = null;
    let closestDist = 18;
    state.controlPoints.forEach((point, index) => {
      const screenPoint = worldToScreen(point);
      const dist = Math.hypot(screenPoint.x - x, screenPoint.y - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = index;
      }
    });
    return closest;
  }

  return (
    <div ref={containerRef} className="sim-canvas-container">
      {editable && (
        <span className="sim-draggable-badge">
          <GripVertical size={12} /> Seret titik ungu untuk ubah lintasan
        </span>
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Lintasan roller coaster dengan kereta"
        style={{ cursor: editable ? (draggingIndex !== null ? "grabbing" : "grab") : "default" }}
        onPointerDown={(event) => {
          if (!editable) return;
          const pos = pointerPos(event);
          const index = findNearestPoint(pos.x, pos.y);
          if (index !== null) {
            setDraggingIndex(index);
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onPointerMove={(event) => {
          if (draggingIndex === null) return;
          const pos = pointerPos(event);
          onDragPoint(draggingIndex, screenToWorld(pos.x, pos.y));
        }}
        onPointerUp={() => setDraggingIndex(null)}
        onPointerCancel={() => setDraggingIndex(null)}
      />
    </div>
  );
}
