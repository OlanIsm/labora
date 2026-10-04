"use client";

import {
  Atom,
  Beaker,
  BookOpen,
  Droplets,
  FlaskConical,
  Leaf,
  Lightbulb,
  Microscope,
  SlidersHorizontal,
  Target,
  Waves,
  Zap,
} from "lucide-react";

export function Icon({ name, size = 26 }: { name: string; size?: number }) {
  const Component =
    (
      {
        beaker: Beaker,
        dropper: Droplets,
        bottle: FlaskConical,
        drop: Droplets,
        battery: Zap,
        resistor: SlidersHorizontal,
        wire: Waves,
        lamp: Lightbulb,
        meter: Target,
        slide: BookOpen,
        leaf: Leaf,
        microscope: Microscope,
        cylinder: FlaskConical,
        launcher: Target,
        ball: Atom,
        stand: Target,
        bag: BookOpen,
      } as Record<string, typeof Beaker>
    )[name] || Beaker;
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" />;
}
