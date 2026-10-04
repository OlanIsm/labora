// Pure physics for the projectile cannon simulation. No DOM access, so this
// module is directly unit-testable against the analytic formulas.
import { PHYSICS_DT } from "../shared/config";
import { add, length, normalize, scale, vec2 } from "../shared/vector2";
import type { Vector2 } from "../shared/vector2";

export type ProjectileState = {
  position: Vector2; // m
  velocity: Vector2; // m/s
  time: number; // s since launch
  landed: boolean;
};

export type ProjectileParams = {
  gravity: number; // m/s^2, positive magnitude; applied downward
  mass: number; // kg
  dragEnabled: boolean;
  dragCoefficient: number; // Cd, dimensionless
  airDensity: number; // kg/m^3
  crossSectionArea: number; // m^2
};

export function launchProjectile(
  angleDeg: number,
  speed: number,
): ProjectileState {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    position: vec2(0, 0),
    velocity: vec2(speed * Math.cos(angleRad), speed * Math.sin(angleRad)),
    time: 0,
    landed: false,
  };
}

// Semi-implicit (symplectic) Euler: update velocity first, then position
// using the *new* velocity. Far more stable than explicit Euler for
// projectile/orbital motion over many steps.
export function stepProjectile(
  state: ProjectileState,
  params: ProjectileParams,
  dt: number = PHYSICS_DT,
): ProjectileState {
  if (state.landed) return state;
  const gravityAccel = vec2(0, -params.gravity);
  let dragAccel = vec2(0, 0);
  if (params.dragEnabled && params.airDensity > 0) {
    const speed = length(state.velocity);
    if (speed > 1e-6) {
      const dragForceMag =
        0.5 *
        params.airDensity *
        params.dragCoefficient *
        params.crossSectionArea *
        speed *
        speed;
      const dragAccelMag = dragForceMag / params.mass;
      dragAccel = scale(normalize(state.velocity), -dragAccelMag);
    }
  }
  const acceleration = add(gravityAccel, dragAccel);
  const nextVelocity = add(state.velocity, scale(acceleration, dt));
  const nextPosition = add(state.position, scale(nextVelocity, dt));
  const landed = nextPosition.y <= 0 && state.position.y > 0;
  return {
    position: landed ? vec2(nextPosition.x, 0) : nextPosition,
    velocity: nextVelocity,
    time: state.time + dt,
    landed: landed || nextPosition.y < 0,
  };
}

// Analytic (no-drag) formulas, used both for the comparison trail and for tests.
export function analyticRange(
  angleDeg: number,
  speed: number,
  gravity: number,
): number {
  const angleRad = (angleDeg * Math.PI) / 180;
  return (speed * speed * Math.sin(2 * angleRad)) / gravity;
}

export function analyticMaxHeight(
  angleDeg: number,
  speed: number,
  gravity: number,
): number {
  const angleRad = (angleDeg * Math.PI) / 180;
  const vy = speed * Math.sin(angleRad);
  return (vy * vy) / (2 * gravity);
}

export function analyticFlightTime(
  angleDeg: number,
  speed: number,
  gravity: number,
): number {
  const angleRad = (angleDeg * Math.PI) / 180;
  return (2 * speed * Math.sin(angleRad)) / gravity;
}

// Simulate until landing (or a safety cutoff) and return the full trajectory
// plus derived metrics, for both the drag-enabled run and the drag-free
// comparison trail.
export function simulateTrajectory(
  angleDeg: number,
  speed: number,
  params: ProjectileParams,
  maxTime = 60,
): { path: Vector2[]; maxHeight: number; range: number; duration: number } {
  let state = launchProjectile(angleDeg, speed);
  const path: Vector2[] = [state.position];
  let maxHeight = 0;
  while (!state.landed && state.time < maxTime) {
    state = stepProjectile(state, params);
    path.push(state.position);
    if (state.position.y > maxHeight) maxHeight = state.position.y;
  }
  return { path, maxHeight, range: state.position.x, duration: state.time };
}

export type Obstacle = { x: number; y: number; width: number; height: number };

export function hitsObstacle(point: Vector2, obstacle: Obstacle): boolean {
  return (
    point.x >= obstacle.x &&
    point.x <= obstacle.x + obstacle.width &&
    point.y >= obstacle.y &&
    point.y <= obstacle.y + obstacle.height
  );
}

export type Target = { x: number; y: number; radius: number };

export function hitsTarget(point: Vector2, target: Target): boolean {
  const dx = point.x - target.x;
  const dy = point.y - target.y;
  return dx * dx + dy * dy <= target.radius * target.radius;
}
