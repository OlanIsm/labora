import React from "react";
import { strict as assert } from "node:assert";
import { renderToStaticMarkup } from "react-dom/server";
import ProjectilePage from "../components/physics-sims/projectile/ProjectilePage";
import { readFileSync } from "node:fs";
import { physicsSimulations, PhysicsSimulationList } from "../components/physics-sims/Simulations";

const markup = renderToStaticMarkup(<ProjectilePage />);
for (const text of ["Misi percobaan:", "Ellie, teman eksperimenmu", 'aria-live="polite"', "Apa yang terjadi?", "Rumus &amp; Penjelasan", "Tembak!", "Siap"]) {
  assert.ok(markup.includes(text), `Missing projectile UI: ${text}`);
}
assert.equal((markup.match(/class="sim-quiz-question"/g) || []).length, 3);
assert.equal((markup.match(/type="range"/g) || []).length, 3);
assert.ok(markup.includes('aria-label="Simulasi gerak parabola proyektil"'));

const list = renderToStaticMarkup(<PhysicsSimulationList />);
assert.equal(physicsSimulations.length, 5);
assert.equal(new Set(physicsSimulations.map((sim) => sim.id)).size, 5);
for (const sim of physicsSimulations) assert.ok(list.includes(`href="/fisika/${sim.id}"`));
assert.ok(list.includes('href="/sandbox/physics"'));
const app = readFileSync("components/App.tsx", "utf8");
assert.ok(app.includes('s.id === "physics" ? "/fisika"'), "Physics lab choice must open the faiz simulations");
assert.ok(app.includes('pathname === `/fisika/${sim.id}`'), "Only known simulation routes should be public");
assert.ok(app.includes('"canvas-shell"'), "Chemistry canvas shell must remain intact");
console.log("Physics integration checks passed: faiz projectile UI, five simulation routes, Physics entry point and preserved Chemistry shell.");
