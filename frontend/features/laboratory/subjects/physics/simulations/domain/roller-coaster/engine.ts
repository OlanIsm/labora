// Pure physics for the roller coaster energy simulation. No DOM access.
// The track is defined by control points, smoothed into a Catmull-Rom
// spline, then sampled into a dense polyline for arc-length parameterized
// motion (so the car moves along the curve, not just by x).
import { add, length, scale, sub, vec2 } from "../shared/vector2";
import type { Vector2 } from "../shared/vector2";

export type ControlPoint = Vector2;

const SAMPLES_PER_SEGMENT = 24;

function catmullRom(
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  t: number,
): Vector2 {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return vec2(x, y);
}

// Build a dense polyline from control points using Catmull-Rom
// interpolation. Needs at least 4 control points; fewer than that returns
// the control points unchanged (degenerate but safe).
export function buildTrackPolyline(controlPoints: ControlPoint[]): Vector2[] {
  if (controlPoints.length < 4) return controlPoints.slice();
  const points: Vector2[] = [];
  for (let i = 0; i < controlPoints.length - 3; i++) {
    const p0 = controlPoints[i];
    const p1 = controlPoints[i + 1];
    const p2 = controlPoints[i + 2];
    const p3 = controlPoints[i + 3];
    for (let s = 0; s < SAMPLES_PER_SEGMENT; s++) {
      points.push(catmullRom(p0, p1, p2, p3, s / SAMPLES_PER_SEGMENT));
    }
  }
  points.push(controlPoints[controlPoints.length - 2]);
  return points;
}

export type TrackSample = {
  position: Vector2;
  tangent: Vector2; // unit vector, direction of increasing arc length
  curvature: number; // 1/radius, signed; positive = curving "up/left" per cross product sign
  cumulativeLength: number;
};

// Precompute arc length, unit tangent, and curvature (via circumscribed
// circle of three consecutive samples) at every polyline vertex. This table
// is what the car's arc-length parameterization walks along.
export function buildTrackTable(polyline: Vector2[]): TrackSample[] {
  const table: TrackSample[] = [];
  let cumulative = 0;
  for (let i = 0; i < polyline.length; i++) {
    const prev = polyline[Math.max(0, i - 1)];
    const next = polyline[Math.min(polyline.length - 1, i + 1)];
    const tangent =
      length(sub(next, prev)) > 1e-9
        ? scaleToUnit(sub(next, prev))
        : vec2(1, 0);
    if (i > 0) cumulative += length(sub(polyline[i], polyline[i - 1]));
    const curvature = estimateCurvature(
      polyline[Math.max(0, i - 2)],
      polyline[i],
      polyline[Math.min(polyline.length - 1, i + 2)],
    );
    table.push({
      position: polyline[i],
      tangent,
      curvature,
      cumulativeLength: cumulative,
    });
  }
  return table;
}

function scaleToUnit(v: Vector2): Vector2 {
  const len = length(v);
  return len > 1e-9 ? scale(v, 1 / len) : vec2(0, 0);
}

// Menger curvature from three points: k = 4*Area / (|AB|*|BC|*|CA|).
// Signed via the cross product so loops register a consistent sign.
function estimateCurvature(a: Vector2, b: Vector2, c: Vector2): number {
  const ab = sub(b, a);
  const bc = sub(c, b);
  const ca = sub(a, c);
  const cross = ab.x * bc.y - ab.y * bc.x;
  const area = Math.abs(cross) / 2;
  const sides = length(ab) * length(bc) * length(ca);
  if (sides < 1e-9) return 0;
  const magnitude = (4 * area) / sides;
  return cross < 0 ? magnitude : -magnitude;
}

export function totalTrackLength(table: TrackSample[]): number {
  return table.length ? table[table.length - 1].cumulativeLength : 0;
}

// Linear interpolation of position/tangent/curvature at a given arc length.
export function sampleAt(table: TrackSample[], arcLength: number): TrackSample {
  if (!table.length)
    return {
      position: vec2(0, 0),
      tangent: vec2(1, 0),
      curvature: 0,
      cumulativeLength: 0,
    };
  const clamped = Math.max(
    0,
    Math.min(arcLength, table[table.length - 1].cumulativeLength),
  );
  let lo = 0;
  let hi = table.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (table[mid].cumulativeLength < clamped) lo = mid + 1;
    else hi = mid;
  }
  const index = Math.max(1, lo);
  const prev = table[index - 1];
  const curr = table[index];
  const span = curr.cumulativeLength - prev.cumulativeLength;
  const t = span > 1e-9 ? (clamped - prev.cumulativeLength) / span : 0;
  return {
    position: add(prev.position, scale(sub(curr.position, prev.position), t)),
    tangent: scaleToUnit(
      add(prev.tangent, scale(sub(curr.tangent, prev.tangent), t)),
    ),
    curvature: prev.curvature + (curr.curvature - prev.curvature) * t,
    cumulativeLength: clamped,
  };
}

export type CarState = {
  arcLength: number; // m along the track
  speed: number; // m/s, signed along tangent direction
  heatGenerated: number; // J, cumulative friction loss
  derailed: boolean;
  finished: boolean;
};

export type CarParams = {
  gravity: number;
  mass: number;
  frictionCoefficient: number; // dimensionless, 0 = frictionless
};

export function initialCarState(): CarState {
  return {
    arcLength: 0,
    speed: 0.5,
    heatGenerated: 0,
    derailed: false,
    finished: false,
  };
}

// Curvature above this (radius below ~6m) only occurs at an intentional
// loop apex in the preset tracks; a hill crest built from gently-spaced
// control points never gets this tight. This is a track-authoring
// constraint, not a universal physical constant: any loop in a preset or
// user-drawn track must have an apex radius under this value for the
// derailment check to recognize it as a loop.
const LOOP_CURVATURE_THRESHOLD = 1 / 6;

// Semi-implicit Euler integration of the car along the track's arc length.
// Tangential acceleration comes from gravity's component along the track
// plus friction opposing motion. At points of significant curvature
// (loops), we additionally check whether the required centripetal force
// exceeds what gravity + track normal force can supply; if the car is too
// slow at the top of a loop, it derails.
export function stepCar(
  state: CarState,
  table: TrackSample[],
  params: CarParams,
  trackLength: number,
  dt: number,
): CarState {
  if (state.derailed || state.finished) return state;
  const sample = sampleAt(table, state.arcLength);

  // Tangential gravity component: g projected onto the tangent direction.
  // Tangent.y > 0 means track rises in the direction of travel.
  const gravityAlongTrack = -params.gravity * sample.tangent.y;

  // Friction opposes velocity, magnitude proportional to normal force.
  // Approximate normal force as mg*cos(slope) for a mild simplification
  // (ignores curvature's effect on normal force except at loops below).
  const slopeCos = Math.max(0.2, Math.abs(sample.tangent.x));
  const frictionDecel =
    params.frictionCoefficient *
    params.gravity *
    slopeCos *
    Math.sign(state.speed || 1);

  const acceleration = gravityAlongTrack - frictionDecel;
  const nextSpeed = state.speed + acceleration * dt;

  // Loop safety check only, not generic crest handling: a real coaster
  // track is a channel that constrains the car on both sides, so an
  // ordinary hill crest never derails it, no matter how tight. The only
  // place a car can actually lose contact is inside a loop, where the car
  // rides the *inside* of the track and gravity alone must supply the
  // centripetal force at the top: v_min = sqrt(g * r). This is physically
  // distinct from crest curvature even though both have the same sign in
  // this 2D path-curvature model, so the check is restricted to curvature
  // tight enough to only occur on an intentional loop (see LOOP_CURVATURE_THRESHOLD),
  // never on a hill's gentle crest.
  let derailed = false;
  if (sample.curvature > LOOP_CURVATURE_THRESHOLD) {
    const radius = 1 / sample.curvature;
    const minSpeedSquared = params.gravity * radius;
    if (nextSpeed * nextSpeed < minSpeedSquared) derailed = true;
  }

  const distanceTravelled = Math.abs(nextSpeed) * dt;
  const frictionWork =
    params.frictionCoefficient *
    params.gravity *
    slopeCos *
    params.mass *
    distanceTravelled;
  const rawNextArcLength = state.arcLength + nextSpeed * dt;
  const finished = rawNextArcLength >= trackLength;

  // The track start/end are dead ends, not walls to bounce off: if the car
  // would roll past either boundary, stop it there instead of letting
  // velocity integrate unbounded against a position that never moves (which
  // silently breaks energy conservation at the boundary).
  const hitStart = rawNextArcLength <= 0;
  const clampedArcLength = Math.max(0, Math.min(trackLength, rawNextArcLength));

  return {
    arcLength: clampedArcLength,
    // Only the start is a dead end that stops the car (hitStart). Reaching
    // the finish line is not a wall: the car keeps whatever speed it
    // arrived with, which the UI reports as the "landing speed" against
    // LANDING_SPEED_LIMIT.
    speed: hitStart ? 0 : nextSpeed,
    heatGenerated: state.heatGenerated + frictionWork,
    derailed,
    finished: finished && !derailed,
  };
}

export type EnergyBreakdown = {
  potential: number;
  kinetic: number;
  heat: number;
  total: number;
};

export function computeEnergy(
  state: CarState,
  table: TrackSample[],
  params: CarParams,
  referenceHeight: number,
): EnergyBreakdown {
  const sample = sampleAt(table, state.arcLength);
  const height = Math.max(0, sample.position.y - referenceHeight);
  const potential = params.mass * params.gravity * height;
  const kinetic = 0.5 * params.mass * state.speed * state.speed;
  return {
    potential,
    kinetic,
    heat: state.heatGenerated,
    total: potential + kinetic + state.heatGenerated,
  };
}

export const LANDING_SPEED_LIMIT = 25; // m/s, above this the arrival is "too fast"
