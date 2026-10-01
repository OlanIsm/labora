import React from "react";
import { strict as assert } from "node:assert";
import { renderToStaticMarkup } from "react-dom/server";
import ProjectilePage from "../components/physics-sims/projectile/ProjectilePage";
import RollerCoasterPage from "../components/physics-sims/roller-coaster/RollerCoasterPage";
import SubmarinePage from "../components/physics-sims/submarine/SubmarinePage";
import OpticsPage from "../components/physics-sims/optics/OpticsPage";
import CircuitPage from "../components/physics-sims/circuit/CircuitPage";

for (const Page of [ProjectilePage, RollerCoasterPage, SubmarinePage, OpticsPage, CircuitPage]) {
  const markup = renderToStaticMarkup(<Page />);
  assert.ok(markup.includes("Misi percobaan:"), `${Page.name}: missing experiment purpose`);
  assert.ok(markup.includes("Ellie, teman eksperimenmu"), `${Page.name}: missing guide`);
  assert.ok(markup.includes('aria-live="polite"'), `${Page.name}: guidance is not announced`);
  assert.ok(markup.includes("Apa yang terjadi?"), `${Page.name}: missing explanation`);
  assert.ok(markup.includes("Rumus &amp; Penjelasan"), `${Page.name}: missing formula panel`);
  assert.equal((markup.match(/class="sim-quiz-question"/g) || []).length, 3, `${Page.name}: expected three quiz questions`);
}

const circuit = renderToStaticMarkup(<CircuitPage />);
assert.ok(circuit.includes('aria-label="Pilih komponen rangkaian"'));
const optics = renderToStaticMarkup(<OpticsPage />);
assert.ok(optics.includes('aria-label="Pilih objek optik"'));
console.log("Physics guidance render checks passed for all five simulations.");
