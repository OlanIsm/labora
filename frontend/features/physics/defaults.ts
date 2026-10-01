import { Material } from "../../lib/sandbox/types";

export const physicsDefaults = (material: Material) => ({
  mass: 1, voltage: 6, resistance: 100, angle: 30, speed: 10, length: 1,
  spring: 100, friction: 0.2, force: 5, restitution: 1, mass2: 1, speed2: 0,
  fluidDensity: 1000,
  density: material.id === "wood" ? 600 : material.id === "cork" ? 240
    : material.id === "ice" ? 917 : material.id === "plastic" ? 1050
    : material.id === "aluminium" ? 2700 : material.id === "copper" ? 8960 : 7800,
  depth: 0.5, power: 100, n1: 1, n2: 1.5,
  focal: material.id === "concave-lens" || material.id === "convex-mirror" ? -0.2 : 0.2,
  distance: 0.4, frequency: 5, wavelength: 1, capacitance: 0.001,
  turns: 100, motion: 0, polarity: 1, topology: 0, amplitude: 10,
});
