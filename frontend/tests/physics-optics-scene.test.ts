import { strict as assert } from "node:assert";
import { traceRay } from "../features/laboratory/subjects/physics/simulations/domain/optics/scene";
import {
  vec2,
  normalize,
  length,
  sub,
} from "../features/laboratory/subjects/physics/simulations/domain/shared/vector2";

// A horizontal ray hitting a 45-degree mirror should turn 90 degrees and
// hit a screen placed in its new path.
{
  const ray = {
    origin: vec2(0, 0),
    direction: vec2(1, 0),
    wavelengthNm: 550,
    intensity: 1,
  };
  const mirror = {
    id: "m1",
    kind: "mirror" as const,
    position: vec2(5, 0),
    rotationRad: (135 * Math.PI) / 180,
    size: 4,
  };
  const screen = {
    id: "s1",
    kind: "screen" as const,
    position: vec2(5, 5),
    rotationRad: 0,
    size: 4,
  };
  const segments = traceRay(ray, [mirror, screen]);
  assert.ok(
    segments.length === 2,
    `expected 2 segments (incoming + reflected), got ${segments.length}`,
  );
  const reflectedDirection = segments[1].ray.direction;
  // 45-degree mirror should turn a horizontal ray to vertical (upward).
  assert.ok(
    Math.abs(reflectedDirection.x) < 0.05,
    `reflected ray should be nearly vertical, got dir=${JSON.stringify(reflectedDirection)}`,
  );
}

// A ray with no objects in its path should travel in a straight line and
// never register a hit (open scene, ray escapes).
{
  const ray = {
    origin: vec2(0, 0),
    direction: vec2(1, 0),
    wavelengthNm: 550,
    intensity: 1,
  };
  const segments = traceRay(ray, []);
  assert.equal(
    segments.length,
    1,
    "a ray with no objects should produce exactly one unbounded segment",
  );
}

// A white ray entering a prism should fan out into component colors: red
// and violet rays entering the same prism at the same angle must exit with
// measurably different directions (dispersion), with violet bending more.
{
  const prism = {
    id: "p1",
    kind: "prism" as const,
    position: vec2(5, 0),
    rotationRad: 0,
    size: 4,
  };
  const redRay = {
    origin: vec2(0, 0),
    direction: vec2(1, 0),
    wavelengthNm: 700,
    intensity: 1,
  };
  const violetRay = {
    origin: vec2(0, 0),
    direction: vec2(1, 0),
    wavelengthNm: 400,
    intensity: 1,
  };
  const redSegments = traceRay(redRay, [prism]);
  const violetSegments = traceRay(violetRay, [prism]);
  // Both rays should have refracted at least once (more than one segment).
  assert.ok(redSegments.length > 1, "red ray should refract through the prism");
  assert.ok(
    violetSegments.length > 1,
    "violet ray should refract through the prism",
  );
  const redExitDir = redSegments[redSegments.length - 1].ray.direction;
  const violetExitDir = violetSegments[violetSegments.length - 1].ray.direction;
  const angleDiff = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        redExitDir.x * violetExitDir.x + redExitDir.y * violetExitDir.y,
      ),
    ),
  );
  assert.ok(
    angleDiff > 1e-4,
    `red and violet should exit the prism at measurably different angles, diff=${angleDiff}`,
  );
}

// A ray tracing loop must terminate even if it could theoretically bounce
// forever (e.g. between two parallel mirrors facing each other): the
// MAX_RAY_BOUNCES cap must bound the number of segments produced.
{
  const ray = {
    origin: vec2(0, 0),
    direction: vec2(1, 0),
    wavelengthNm: 550,
    intensity: 1,
  };
  const mirrorA = {
    id: "ma",
    kind: "mirror" as const,
    position: vec2(5, 0),
    rotationRad: Math.PI / 2,
    size: 10,
  };
  const mirrorB = {
    id: "mb",
    kind: "mirror" as const,
    position: vec2(-5, 0),
    rotationRad: Math.PI / 2,
    size: 10,
  };
  const segments = traceRay(ray, [mirrorA, mirrorB]);
  assert.ok(
    segments.length <= 21,
    `ray trace must be bounded (<=MAX_RAY_BOUNCES+1 segments), got ${segments.length}`,
  );
}

// A convex lens should bend an off-axis parallel ray toward the optical
// axis (converging behavior): a ray above the axis should bend downward.
{
  const lens = {
    id: "l1",
    kind: "convexLens" as const,
    position: vec2(5, 0),
    rotationRad: 0,
    size: 6,
  };
  const ray = {
    origin: vec2(0, 1),
    direction: vec2(1, 0),
    wavelengthNm: 550,
    intensity: 1,
  };
  const segments = traceRay(ray, [lens]);
  assert.ok(segments.length > 1, "ray should interact with the lens");
  const afterLensDirection = segments[1].ray.direction;
  assert.ok(
    afterLensDirection.y < 0,
    `convex lens should bend an above-axis ray downward (toward axis), got dy=${afterLensDirection.y}`,
  );
}

console.log(
  "Optics scene checks passed: mirror reflection in a scene, open-scene escape, prism dispersion fan-out (red vs violet), bounded bounce count, convex lens converging bend.",
);
