"use client";
import { useEffect, useRef } from "react";

const PIXELS_PER_METER = 10;
const CANVAS_HEIGHT = 400;
const SURFACE_Y_PX = 60;

function depthToScreenY(depthBelowSurface: number): number {
  return SURFACE_Y_PX + depthBelowSurface * PIXELS_PER_METER;
}

export type SubmarineRenderState = {
  depthBelowSurface: number;
  hullHeightPx: number;
  weightForce: number;
  buoyancyForce: number;
  status: "sinking" | "floating" | "neutral";
  fluidColor: string;
  reducedMotion: boolean;
  challengeTargetDepth: number | null;
  challengeTolerance: number;
};

export default function SubmarineCanvas({
  state,
}: {
  state: SubmarineRenderState;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

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
      const centerX = width / 2;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(0, 0, width, SURFACE_Y_PX);
      ctx.fillStyle = current.fluidColor;
      ctx.fillRect(0, SURFACE_Y_PX, width, height - SURFACE_Y_PX);
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, SURFACE_Y_PX);
      ctx.lineTo(width, SURFACE_Y_PX);
      ctx.stroke();

      if (current.challengeTargetDepth !== null) {
        const targetY = depthToScreenY(current.challengeTargetDepth);
        const toleranceYTop = depthToScreenY(
          current.challengeTargetDepth - current.challengeTolerance,
        );
        const toleranceYBottom = depthToScreenY(
          current.challengeTargetDepth + current.challengeTolerance,
        );
        ctx.fillStyle = "rgba(39, 174, 96, 0.18)";
        ctx.fillRect(0, toleranceYTop, width, toleranceYBottom - toleranceYTop);
        ctx.strokeStyle = "#27ae60";
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, targetY);
        ctx.lineTo(width, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const subY = depthToScreenY(current.depthBelowSurface);
      const hullWidth = current.hullHeightPx * 2;
      ctx.fillStyle = "#4b5563";
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        subY,
        hullWidth / 2,
        current.hullHeightPx / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (!current.reducedMotion) {
        const maxForce = Math.max(
          current.weightForce,
          current.buoyancyForce,
          1,
        );
        const weightLength = (current.weightForce / maxForce) * 70;
        const buoyancyLength = (current.buoyancyForce / maxForce) * 70;
        drawArrow(
          ctx,
          centerX - 30,
          subY,
          0,
          weightLength,
          "#d9534f",
          `W=${(current.weightForce / 1000).toFixed(1)}kN`,
        );
        drawArrow(
          ctx,
          centerX + 30,
          subY,
          0,
          -buoyancyLength,
          "#2f6fed",
          `Fa=${(current.buoyancyForce / 1000).toFixed(1)}kN`,
        );
      }

      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 13px 'Nunito Sans', sans-serif";
      const statusLabel =
        current.status === "sinking"
          ? "Tenggelam"
          : current.status === "floating"
            ? "Terapung"
            : "Melayang";
      ctx.fillText(
        statusLabel,
        centerX - 30,
        subY - current.hullHeightPx / 2 - 12,
      );

      frameId = requestAnimationFrame(draw);
    }
    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="sim-canvas-container">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Simulasi kapal selam dalam tangki cairan"
      />
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  label: string,
) {
  if (Math.abs(dy) < 1) return;
  const endX = x + dx;
  const endY = y + dy;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - 8 * Math.cos(angle - Math.PI / 6),
    endY - 8 * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    endX - 8 * Math.cos(angle + Math.PI / 6),
    endY - 8 * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
  ctx.font = "11px 'Nunito Sans', sans-serif";
  ctx.fillText(label, endX + 6, endY + (dy < 0 ? -4 : 12));
}
