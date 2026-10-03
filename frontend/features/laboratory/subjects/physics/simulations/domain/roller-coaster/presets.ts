// Preset track control points for the roller coaster simulation. Positions
// in meters; x increases rightward, y increases upward.
import type { ControlPoint } from "./engine";

export type TrackPreset = {
  id: string;
  label: string;
  controlPoints: ControlPoint[];
};

// Simple hill: start high, dip, rise, settle. Safe for beginners, no loop.
// The first two points sit above and behind the actual start so the spline's
// initial tangent points downhill immediately. Control points are spaced
// gradually (no sharp direction change between consecutive points) so the
// crest radius stays well above the derailment check's threshold; a tight
// crest would otherwise behave like a mini loop and strand a slow car.
const SIMPLE_HILL: ControlPoint[] = [
  { x: -15, y: 18 },
  { x: -8, y: 15 },
  { x: 0, y: 11 },
  { x: 10, y: 7 },
  { x: 20, y: 2 },
  { x: 30, y: 7 },
  { x: 40, y: 4 },
  { x: 50, y: 4 },
  { x: 55, y: 4 },
];

// Hill with a loop in the middle, large enough to clear at reasonable speeds.
const WITH_LOOP: ControlPoint[] = [
  { x: -5, y: 14 },
  { x: 0, y: 14 },
  { x: 8, y: 2 },
  { x: 14, y: 2 },
  { x: 17, y: 10 },
  { x: 20, y: 14 },
  { x: 23, y: 10 },
  { x: 26, y: 2 },
  { x: 34, y: 2 },
  { x: 44, y: 6 },
  { x: 50, y: 3 },
  { x: 55, y: 3 },
];

export const TRACK_PRESETS: TrackPreset[] = [
  { id: "simple-hill", label: "Bukit sederhana", controlPoints: SIMPLE_HILL },
  { id: "with-loop", label: "Dengan loop", controlPoints: WITH_LOOP },
];
