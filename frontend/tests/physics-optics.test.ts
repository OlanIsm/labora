import { strict as assert } from "node:assert";
import {
  glassRefractiveIndex,
  intersectRaySegment,
  reflect,
  refract,
  thinLensImage,
} from "../features/laboratory/subjects/physics/simulations/domain/optics/engine";
import {
  vec2,
  normalize,
  length,
  dot,
} from "../features/laboratory/subjects/physics/simulations/domain/shared/vector2";

// Reflection: angle of incidence equals angle of reflection off a flat
// surface. A ray going straight down onto a horizontal mirror (normal
// pointing up) should bounce straight back up.
{
  const incoming = vec2(0, -1); // straight down
  const normal = vec2(0, 1); // mirror normal pointing up
  const reflected = reflect(incoming, normal);
  assert.ok(
    Math.abs(reflected.x - 0) < 1e-9 && Math.abs(reflected.y - 1) < 1e-9,
  );
}

// A ray hitting a mirror at 45 degrees should reflect at 45 degrees on the
// other side of the normal (angle of incidence = angle of reflection,
// verified by equal angles from the normal).
{
  const incoming = normalize(vec2(1, -1)); // 45 degrees down-right
  const normal = vec2(0, 1); // horizontal mirror, normal up
  const reflected = reflect(incoming, normal);
  const angleIn = Math.acos(dot(vec2(-incoming.x, -incoming.y), normal));
  const angleOut = Math.acos(dot(reflected, normal));
  assert.ok(
    Math.abs(angleIn - angleOut) < 1e-9,
    `incidence ${angleIn} should equal reflection ${angleOut}`,
  );
}

// Snell's law: n1 sin(theta1) = n2 sin(theta2). Light entering a denser
// medium (n2 > n1) bends toward the normal (smaller angle from normal).
{
  const incoming = normalize(
    vec2(Math.sin((45 * Math.PI) / 180), -Math.cos((45 * Math.PI) / 180)),
  );
  const normal = vec2(0, 1);
  const n1 = 1.0; // air
  const n2 = 1.5; // glass
  const result = refract(incoming, normal, n1, n2);
  assert.equal(result.type, "refracted");
  if (result.type === "refracted") {
    const angleOut = Math.acos(dot(result.direction, vec2(0, -1)));
    // Snell's law prediction: sin(theta2) = (n1/n2) * sin(theta1)
    const expectedAngleOut = Math.asin(
      (n1 / n2) * Math.sin((45 * Math.PI) / 180),
    );
    assert.ok(
      Math.abs(angleOut - expectedAngleOut) < 1e-6,
      `refraction angle mismatch: got ${angleOut}, expected ${expectedAngleOut}`,
    );
    assert.ok(
      angleOut < (45 * Math.PI) / 180,
      "ray entering denser medium should bend toward the normal",
    );
  }
}

// Total internal reflection: light inside a denser medium hitting the
// boundary at an angle beyond the critical angle must reflect instead of
// refracting. Critical angle for n1=1.5 -> n2=1.0 is asin(1/1.5) ~= 41.8deg.
{
  const n1 = 1.5; // glass
  const n2 = 1.0; // air
  const criticalAngleRad = Math.asin(n2 / n1);
  const steepAngle = criticalAngleRad + (10 * Math.PI) / 180; // beyond critical angle
  const incoming = normalize(vec2(Math.sin(steepAngle), -Math.cos(steepAngle)));
  const normal = vec2(0, 1);
  const result = refract(incoming, normal, n1, n2);
  assert.equal(
    result.type,
    "totalInternalReflection",
    "beyond critical angle should totally internally reflect",
  );

  const shallowAngle = criticalAngleRad - (10 * Math.PI) / 180; // below critical angle
  const incoming2 = normalize(
    vec2(Math.sin(shallowAngle), -Math.cos(shallowAngle)),
  );
  const result2 = refract(incoming2, normal, n1, n2);
  assert.equal(
    result2.type,
    "refracted",
    "below critical angle should refract normally",
  );
}

// Dispersion: violet light (shorter wavelength) should have a higher
// refractive index than red light (longer wavelength) in the Cauchy model,
// which is what causes a prism to fan white light into a spectrum.
{
  const nRed = glassRefractiveIndex(700);
  const nViolet = glassRefractiveIndex(400);
  assert.ok(
    nViolet > nRed,
    `violet (${nViolet}) should refract more than red (${nRed})`,
  );
}

// Thin lens equation at 2f: an object at twice the focal length produces a
// real, inverted, same-size image at 2f on the other side (M = -1).
{
  const f = 10;
  const result = thinLensImage(2 * f, f);
  assert.ok(
    Math.abs(result.imageDistance - 2 * f) < 1e-6,
    `image should form at 2f, got ${result.imageDistance}`,
  );
  assert.ok(
    Math.abs(result.magnification - -1) < 1e-6,
    `magnification should be -1 at 2f, got ${result.magnification}`,
  );
  assert.ok(result.isReal && !result.isUpright && !result.isEnlarged);
}

// Thin lens: object between f and 2f produces a real, inverted, enlarged
// image farther than 2f.
{
  const f = 10;
  const result = thinLensImage(15, f); // 1f < s < 2f
  assert.ok(result.isReal && !result.isUpright && result.isEnlarged);
}

// Thin lens: object inside the focal length (s < f) of a converging lens
// produces a virtual, upright, enlarged image (like a magnifying glass).
{
  const f = 10;
  const result = thinLensImage(5, f);
  assert.ok(
    !result.isReal && result.isUpright && result.isEnlarged,
    "object inside f should give a virtual magnified upright image",
  );
}

// Ray-segment intersection: a ray going straight right should intersect a
// vertical segment crossing its path, and should not intersect a segment
// entirely behind it.
{
  const ray = {
    origin: vec2(0, 0),
    direction: vec2(1, 0),
    wavelengthNm: 550,
    intensity: 1,
  };
  const ahead = { a: vec2(5, -1), b: vec2(5, 1) };
  const behind = { a: vec2(-5, -1), b: vec2(-5, 1) };
  const hitAhead = intersectRaySegment(ray, ahead);
  const hitBehind = intersectRaySegment(ray, behind);
  assert.ok(hitAhead !== null && Math.abs(hitAhead.point.x - 5) < 1e-9);
  assert.equal(
    hitBehind,
    null,
    "a segment behind the ray origin should not register as a hit",
  );
}

console.log(
  "Optics checks passed: reflection angle equality, Snell's law bending, total internal reflection threshold, dispersion ordering, thin-lens cases (2f, between f and 2f, inside f), ray-segment intersection.",
);
