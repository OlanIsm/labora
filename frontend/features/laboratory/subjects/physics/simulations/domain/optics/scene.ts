// Scene model and full ray-tracing walk for the optics sandbox. Builds on
// the pure per-interaction functions in engine.ts (reflect, refract,
// intersectRaySegment) to trace a ray through a whole scene of objects,
// handling reflection, refraction, and dispersion, bounded by MAX_RAY_BOUNCES.
import { add, length, scale, sub } from "../shared/vector2";
import type { Vector2 } from "../shared/vector2";
import {
  glassRefractiveIndex,
  intersectRaySegment,
  MAX_RAY_BOUNCES,
  reflect,
  refract,
  segmentNormal,
} from "./engine";
import type { Ray, Segment } from "./engine";

export type ObjectKind =
  "mirror" | "convexLens" | "concaveLens" | "prism" | "screen";

export type SceneObject = {
  id: string;
  kind: ObjectKind;
  position: Vector2; // center, meters in scene space
  rotationRad: number;
  // Mirror: a flat segment of this length, centered on position.
  // Lens: a thin vertical segment representing the lens plane; focalLength
  // used for the thin-lens deflection model (approximated as a single
  // refraction-like direction change at the lens plane, not full Snell's
  // law through two surfaces, since real lenses are curved and a full
  // surface-by-surface trace is out of scope for a 2D teaching sandbox).
  // Prism: an equilateral triangle of this size, using full Snell's law
  // per edge with wavelength-dependent refractive index for dispersion.
  size: number;
};

export const AIR_REFRACTIVE_INDEX = 1.0;

export type TraceSegment = { ray: Ray; endPoint: Vector2 };

function mirrorSegment(object: SceneObject): Segment {
  const half = object.size / 2;
  const dir = {
    x: Math.cos(object.rotationRad),
    y: Math.sin(object.rotationRad),
  };
  return {
    a: sub(object.position, scale(dir, half)),
    b: add(object.position, scale(dir, half)),
  };
}

function lensSegment(object: SceneObject): Segment {
  const half = object.size / 2;
  const dir = {
    x: -Math.sin(object.rotationRad),
    y: Math.cos(object.rotationRad),
  };
  return {
    a: sub(object.position, scale(dir, half)),
    b: add(object.position, scale(dir, half)),
  };
}

function prismSegments(object: SceneObject): Segment[] {
  const r = object.size / 2;
  const angle0 = object.rotationRad - Math.PI / 2;
  const points = [0, 1, 2].map((i) => {
    const a = angle0 + (i * 2 * Math.PI) / 3;
    return add(object.position, { x: Math.cos(a) * r, y: Math.sin(a) * r });
  });
  return [
    { a: points[0], b: points[1] },
    { a: points[1], b: points[2] },
    { a: points[2], b: points[0] },
  ];
}

function screenSegment(object: SceneObject): Segment {
  const half = object.size / 2;
  const dir = {
    x: -Math.sin(object.rotationRad),
    y: Math.cos(object.rotationRad),
  };
  return {
    a: sub(object.position, scale(dir, half)),
    b: add(object.position, scale(dir, half)),
  };
}

function objectSegments(
  object: SceneObject,
): { segment: Segment; kind: ObjectKind; object: SceneObject }[] {
  if (object.kind === "mirror")
    return [{ segment: mirrorSegment(object), kind: "mirror", object }];
  if (object.kind === "convexLens" || object.kind === "concaveLens")
    return [{ segment: lensSegment(object), kind: object.kind, object }];
  if (object.kind === "prism")
    return prismSegments(object).map((segment) => ({
      segment,
      kind: "prism" as const,
      object,
    }));
  return [{ segment: screenSegment(object), kind: "screen", object }];
}

// Thin-lens deflection: approximate a converging/diverging lens as a single
// plane that bends the ray toward (convex) or away from (concave) the
// optical axis through the lens center, proportional to how far from the
// axis the ray crosses. This is the standard thin-lens teaching
// approximation (not a full two-surface Snell's law trace).
function applyThinLens(
  ray: Ray,
  object: SceneObject,
  hitPoint: Vector2,
  focalLength: number,
): Vector2 {
  const axis = {
    x: Math.cos(object.rotationRad),
    y: Math.sin(object.rotationRad),
  };
  const toHit = sub(hitPoint, object.position);
  const heightAlongLens = toHit.x * -axis.y + toHit.y * axis.x; // signed distance from optical axis
  const bendAngle = -heightAlongLens / focalLength; // small-angle approximation
  const cos = Math.cos(bendAngle);
  const sin = Math.sin(bendAngle);
  return {
    x: ray.direction.x * cos - ray.direction.y * sin,
    y: ray.direction.x * sin + ray.direction.y * cos,
  };
}

export function traceRay(
  initialRay: Ray,
  objects: SceneObject[],
): TraceSegment[] {
  const segments: TraceSegment[] = [];
  let currentRay = initialRay;
  for (let bounce = 0; bounce < MAX_RAY_BOUNCES; bounce++) {
    let closestHit: {
      point: Vector2;
      t: number;
      kind: ObjectKind;
      object: SceneObject;
    } | null = null;
    for (const { segment, kind, object } of objects.flatMap(objectSegments)) {
      const hit = intersectRaySegment(currentRay, segment);
      if (hit && (!closestHit || hit.t < closestHit.t)) {
        closestHit = { ...hit, kind, object };
      }
    }
    if (!closestHit) {
      segments.push({
        ray: currentRay,
        endPoint: add(currentRay.origin, scale(currentRay.direction, 1000)),
      });
      break;
    }
    segments.push({ ray: currentRay, endPoint: closestHit.point });
    if (closestHit.kind === "screen") break;

    if (closestHit.kind === "mirror") {
      const normal = segmentNormal(mirrorSegment(closestHit.object));
      currentRay = {
        ...currentRay,
        origin: closestHit.point,
        direction: reflect(currentRay.direction, normal),
      };
      continue;
    }
    if (closestHit.kind === "convexLens" || closestHit.kind === "concaveLens") {
      const focalLength =
        closestHit.kind === "convexLens"
          ? closestHit.object.size * 0.6
          : -closestHit.object.size * 0.6;
      const newDirection = applyThinLens(
        currentRay,
        closestHit.object,
        closestHit.point,
        focalLength,
      );
      currentRay = {
        ...currentRay,
        origin: closestHit.point,
        direction: newDirection,
      };
      continue;
    }
    if (closestHit.kind === "prism") {
      const glassIndex = glassRefractiveIndex(currentRay.wavelengthNm);
      const segmentsOfPrism = prismSegments(closestHit.object);
      const hitSegment =
        segmentsOfPrism.find(
          (s) => intersectRaySegment(currentRay, s) !== null,
        ) ?? segmentsOfPrism[0];
      const normal = segmentNormal(hitSegment);
      const result = refract(
        currentRay.direction,
        normal,
        AIR_REFRACTIVE_INDEX,
        glassIndex,
      );
      currentRay = {
        ...currentRay,
        origin: closestHit.point,
        direction: result.direction,
      };
      continue;
    }
  }
  return segments;
}

export function distanceAlongAxis(from: Vector2, to: Vector2): number {
  return length(sub(to, from));
}
