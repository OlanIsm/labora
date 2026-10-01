// Pure physics for the laser/lens optics sandbox. No DOM access.
// 2D ray tracing: reflection off flat mirrors, refraction through lenses
// and prisms via Snell's law, and thin-lens image formation.
import { Vector2, vec2, add, scale, sub, length, normalize, dot } from "../shared/vector2";

export type Ray = {
  origin: Vector2;
  direction: Vector2; // unit vector
  wavelengthNm: number; // visible spectrum, used for dispersion
  intensity: number; // 0..1, for tracking energy loss at partial reflections (not modeled yet, kept at 1)
};

export type Segment = { a: Vector2; b: Vector2 };

export function segmentNormal(segment: Segment): Vector2 {
  const dir = normalize(sub(segment.b, segment.a));
  return vec2(-dir.y, dir.x);
}

// Ray-segment intersection via parametric line equations. Returns the
// intersection point and the ray parameter t (distance along ray direction,
// since direction is a unit vector) if one exists ahead of the ray origin,
// otherwise null.
export function intersectRaySegment(ray: Ray, segment: Segment): { point: Vector2; t: number } | null {
  const segDir = sub(segment.b, segment.a);
  const denom = ray.direction.x * segDir.y - ray.direction.y * segDir.x;
  if (Math.abs(denom) < 1e-9) return null; // parallel
  const diff = sub(segment.a, ray.origin);
  const t = (diff.x * segDir.y - diff.y * segDir.x) / denom;
  const u = (diff.x * ray.direction.y - diff.y * ray.direction.x) / denom;
  if (t < 1e-6 || u < 0 || u > 1) return null;
  return { point: add(ray.origin, scale(ray.direction, t)), t };
}

// Reflect a direction vector off a surface with the given unit normal.
// angle of incidence = angle of reflection, both measured from the normal.
export function reflect(direction: Vector2, normal: Vector2): Vector2 {
  const d = dot(direction, normal);
  return sub(direction, scale(normal, 2 * d));
}

export type RefractionResult =
  | { type: "refracted"; direction: Vector2 }
  | { type: "totalInternalReflection"; direction: Vector2 };

// Snell's law: n1*sin(theta1) = n2*sin(theta2). Returns the refracted
// direction, or signals total internal reflection when sin(theta2) would
// exceed 1 (no real solution), in which case the ray reflects instead.
export function refract(direction: Vector2, normal: Vector2, n1: number, n2: number): RefractionResult {
  let normalFacing = normal;
  let cosI = -dot(direction, normalFacing);
  if (cosI < 0) {
    // Normal points away from the incoming ray; flip it to face the ray,
    // and swap the refractive indices since the ray is now considered to
    // be exiting the denser medium into the other.
    normalFacing = scale(normal, -1);
    cosI = -dot(direction, normalFacing);
    [n1, n2] = [n2, n1];
  }
  const eta = n1 / n2;
  const sinT2Squared = eta * eta * (1 - cosI * cosI);
  if (sinT2Squared > 1) {
    return { type: "totalInternalReflection", direction: reflect(direction, normalFacing) };
  }
  const cosT = Math.sqrt(1 - sinT2Squared);
  const refracted = add(scale(direction, eta), scale(normalFacing, eta * cosI - cosT));
  return { type: "refracted", direction: normalize(refracted) };
}

// Cauchy's dispersion equation (simplified, two-term): n(lambda) = A + B/lambda^2.
// Coefficients tuned so visible-spectrum violet (~400nm) refracts noticeably
// more than red (~700nm) in common glass, enough to visibly fan out in a
// prism without being physically precise for a specific real glass.
const CAUCHY_A = 1.5;
const CAUCHY_B = 0.004; // lambda in micrometers in the formula below

export function glassRefractiveIndex(wavelengthNm: number): number {
  const lambdaMicrometers = wavelengthNm / 1000;
  return CAUCHY_A + CAUCHY_B / (lambdaMicrometers * lambdaMicrometers);
}

// The seven visible-spectrum colors (mejikuhibiniu / ROYGBIV), each with a
// representative wavelength in nanometers, used to split a white ray in a
// prism into its component colors.
export const SPECTRUM_COLORS: { name: string; wavelengthNm: number; hex: string }[] = [
  { name: "Merah", wavelengthNm: 700, hex: "#ff0000" },
  { name: "Jingga", wavelengthNm: 620, hex: "#ff7f00" },
  { name: "Kuning", wavelengthNm: 580, hex: "#ffff00" },
  { name: "Hijau", wavelengthNm: 530, hex: "#00ff00" },
  { name: "Biru", wavelengthNm: 470, hex: "#0000ff" },
  { name: "Nila", wavelengthNm: 440, hex: "#4b0082" },
  { name: "Ungu", wavelengthNm: 400, hex: "#8b00ff" },
];

export type ThinLensResult = {
  imageDistance: number; // s', signed: positive = real image (same side as light exits), negative = virtual
  magnification: number; // M = -s'/s
  isReal: boolean;
  isUpright: boolean;
  isEnlarged: boolean;
};

// Thin lens equation: 1/f = 1/s + 1/s'  =>  s' = (f*s)/(s-f).
// Convention: s (object distance) is positive for a real object in front of
// the lens. f positive = converging (convex) lens, f negative = diverging
// (concave) lens. s' positive = real image on the opposite side; s'
// negative = virtual image on the same side as the object.
export function thinLensImage(objectDistance: number, focalLength: number): ThinLensResult {
  const s = objectDistance;
  const f = focalLength;
  if (Math.abs(s - f) < 1e-6) {
    // Object at the focal point: image forms at infinity, treat as an
    // edge case with no finite image.
    return { imageDistance: Infinity, magnification: -Infinity, isReal: true, isUpright: false, isEnlarged: true };
  }
  const sPrime = (f * s) / (s - f);
  const magnification = -sPrime / s;
  return {
    imageDistance: sPrime,
    magnification,
    isReal: sPrime > 0,
    isUpright: magnification > 0,
    isEnlarged: Math.abs(magnification) > 1,
  };
}

export const MAX_RAY_BOUNCES = 20;
