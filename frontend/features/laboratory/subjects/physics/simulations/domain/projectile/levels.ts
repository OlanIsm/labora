// Progressive level definitions for the projectile cannon simulation.
// Positions in meters, cannon fixed at the origin (0, 0).
import type { Obstacle, Target } from "./engine";

export type ProjectileLevel = {
  id: number;
  label: string;
  obstacles: Obstacle[];
  target: Target;
};

export const PROJECTILE_LEVELS: ProjectileLevel[] = [
  {
    id: 1,
    label: "Target terbuka",
    obstacles: [],
    target: { x: 60, y: 0, radius: 3 },
  },
  {
    id: 2,
    label: "Di balik tembok rendah",
    obstacles: [{ x: 45, y: 0, width: 4, height: 8 }],
    target: { x: 65, y: 0, radius: 3 },
  },
  {
    id: 3,
    label: "Di balik bukit",
    obstacles: [{ x: 40, y: 0, width: 14, height: 16 }],
    target: { x: 75, y: 0, radius: 3 },
  },
];
