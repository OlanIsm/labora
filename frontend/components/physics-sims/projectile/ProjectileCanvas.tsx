"use client";
import { useEffect, useRef } from "react";
import { ProjectileLevel } from "../../../lib/physics-sims/projectile/levels";
import { Vector2 } from "../../../lib/physics-sims/shared/vector2";

// World space: meters, origin at the cannon, y-up. Canvas space: pixels,
// origin top-left, y-down. `metersToPixels` handles the flip and scale.
const PIXELS_PER_METER = 7;
const GROUND_MARGIN_PX = 40;

function worldToScreen(point: Vector2, canvasHeight: number): { x: number; y: number } {
  return {
    x: point.x * PIXELS_PER_METER + 20,
    y: canvasHeight - GROUND_MARGIN_PX - point.y * PIXELS_PER_METER,
  };
}

export type ProjectileRenderState = {
  trajectory: Vector2[]; // actual (possibly drag-affected) path so far
  comparisonTrajectory: Vector2[]; // full no-drag path, drawn dashed
  currentPosition: Vector2;
  currentVelocity: Vector2;
  isAtApex: boolean;
  hasLaunched: boolean;
  level: ProjectileLevel;
  targetHit: boolean;
  reducedMotion: boolean;
};

export default function ProjectileCanvas({ state }: { state: ProjectileRenderState }) {
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
      const height = 360;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
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

      ctx.fillStyle = "#eaf6ec";
      ctx.fillRect(0, 0, width, height - GROUND_MARGIN_PX);
      ctx.fillStyle = "#8fae6b";
      ctx.fillRect(0, height - GROUND_MARGIN_PX, width, GROUND_MARGIN_PX);

      for (const obstacle of current.level.obstacles) {
        const topLeft = worldToScreen({ x: obstacle.x, y: obstacle.y + obstacle.height }, height);
        ctx.fillStyle = "#6b7a8c";
        ctx.fillRect(topLeft.x, topLeft.y, obstacle.width * PIXELS_PER_METER, obstacle.height * PIXELS_PER_METER);
      }

      const target = worldToScreen({ x: current.level.target.x, y: current.level.target.y }, height);
      ctx.beginPath();
      ctx.fillStyle = current.targetHit ? "#9a9a9a" : "#d9534f";
      ctx.arc(target.x, target.y, current.level.target.radius * PIXELS_PER_METER, 0, Math.PI * 2);
      ctx.fill();

      if (current.comparisonTrajectory.length > 1) {
        ctx.strokeStyle = "#9aa5b1";
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        current.comparisonTrajectory.forEach((point, index) => {
          const screenPoint = worldToScreen(point, height);
          if (index === 0) ctx.moveTo(screenPoint.x, screenPoint.y);
          else ctx.lineTo(screenPoint.x, screenPoint.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (current.trajectory.length > 1) {
        ctx.strokeStyle = "#2f6fed";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        current.trajectory.forEach((point, index) => {
          const screenPoint = worldToScreen(point, height);
          if (index === 0) ctx.moveTo(screenPoint.x, screenPoint.y);
          else ctx.lineTo(screenPoint.x, screenPoint.y);
        });
        ctx.stroke();
      }

      const cannonBase = worldToScreen({ x: 0, y: 0 }, height);
      ctx.fillStyle = "#4b5563";
      ctx.fillRect(cannonBase.x - 10, cannonBase.y - 6, 20, 10);

      if (current.hasLaunched) {
        const projectileScreen = worldToScreen(current.currentPosition, height);
        ctx.beginPath();
        ctx.fillStyle = "#1f2937";
        ctx.arc(projectileScreen.x, projectileScreen.y, 6, 0, Math.PI * 2);
        ctx.fill();

        if (!current.reducedMotion) {
          drawArrow(ctx!, projectileScreen, current.currentVelocity.x, 0, "#e67e22", "vx");
          drawArrow(ctx!, projectileScreen, 0, -current.currentVelocity.y, "#27ae60", "vy");
          drawArrow(
            ctx!,
            projectileScreen,
            current.currentVelocity.x,
            -current.currentVelocity.y,
            "#8e44ad",
            "v",
          );
        }

        if (current.isAtApex) {
          ctx.fillStyle = "#27ae60";
          ctx.font = "bold 13px 'Nunito Sans', sans-serif";
          ctx.fillText("vy = 0 (titik tertinggi)", projectileScreen.x + 12, projectileScreen.y - 40);
        }
      }

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
      <canvas ref={canvasRef} role="img" aria-label="Simulasi gerak parabola proyektil" />
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  dx: number,
  dy: number,
  color: string,
  label: string,
) {
  const scale = 0.5;
  const endX = origin.x + dx * scale;
  const endY = origin.y + dy * scale;
  if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  const angle = Math.atan2(endY - origin.y, endX - origin.x);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - 8 * Math.cos(angle - Math.PI / 6), endY - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(endX - 8 * Math.cos(angle + Math.PI / 6), endY - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.font = "12px 'Nunito Sans', sans-serif";
  ctx.fillText(label, endX + 4, endY - 4);
}
