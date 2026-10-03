import React from "react";
import { strict as assert } from "node:assert";
import { renderToStaticMarkup } from "react-dom/server";
import ProjectilePage from "../features/laboratory/subjects/physics/simulations/ui/projectile/ProjectilePage";
import { existsSync } from "node:fs";
import { laboratoryPath } from "../features/laboratory/routes";
import { resolveRouteContext } from "../application/routeContext";
import {
  physicsSimulations,
  PhysicsSimulationList,
} from "../features/laboratory/subjects/physics/simulations/ui/Simulations";

const markup = renderToStaticMarkup(<ProjectilePage />);
for (const text of [
  "Misi percobaan:",
  "Ellie, teman eksperimenmu",
  'aria-live="polite"',
  "Apa yang terjadi?",
  "Rumus &amp; Penjelasan",
  "Tembak!",
  "Siap",
]) {
  assert.ok(markup.includes(text), `Missing projectile UI: ${text}`);
}
assert.equal((markup.match(/class="sim-quiz-question"/g) || []).length, 3);
assert.equal((markup.match(/type="range"/g) || []).length, 3);
assert.ok(markup.includes('aria-label="Simulasi gerak parabola proyektil"'));

const list = renderToStaticMarkup(<PhysicsSimulationList />);
assert.equal(physicsSimulations.length, 5);
assert.equal(new Set(physicsSimulations.map((sim) => sim.id)).size, 5);
for (const sim of physicsSimulations) {
  assert.ok(list.includes(`href="/fisika/${sim.id}"`));
  assert.ok(list.includes(`/physics-previews/${sim.id}.webp`));
  assert.ok(
    existsSync(`public/physics-previews/${sim.id}.webp`),
    `Missing preview for ${sim.id}`,
  );
}
assert.ok(
  !list.includes('class="sim-badge"'),
  "Simulation cards should not show grade badges",
);
assert.ok(!list.includes('href="/sandbox/physics"'));
assert.equal(laboratoryPath("physics"), "/fisika");
const simulationIds = physicsSimulations.map((simulation) => simulation.id);
assert.equal(
  resolveRouteContext("/fisika/meriam-target", simulationIds).isPublic,
  true,
);
assert.equal(
  resolveRouteContext("/fisika/not-a-simulation", simulationIds).isPublic,
  false,
);
console.log(
  "Physics integration checks passed: faiz projectile UI, five simulation routes, Physics entry point and preserved Chemistry shell.",
);
