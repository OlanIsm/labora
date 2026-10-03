import React from "react";
import { strict as assert } from "node:assert";
import { renderToStaticMarkup } from "react-dom/server";
import ProjectilePage from "../features/laboratory/subjects/physics/simulations/ui/projectile/ProjectilePage";
import RollerCoasterPage from "../features/laboratory/subjects/physics/simulations/ui/roller-coaster/RollerCoasterPage";
import SubmarinePage from "../features/laboratory/subjects/physics/simulations/ui/submarine/SubmarinePage";
import OpticsPage from "../features/laboratory/subjects/physics/simulations/ui/optics/OpticsPage";
import CircuitPage from "../features/laboratory/subjects/physics/simulations/ui/circuit/CircuitPage";

for (const Page of [
  ProjectilePage,
  RollerCoasterPage,
  SubmarinePage,
  OpticsPage,
  CircuitPage,
]) {
  const markup = renderToStaticMarkup(<Page />);
  assert.ok(
    markup.includes("Misi percobaan:"),
    `${Page.name}: missing experiment purpose`,
  );
  assert.ok(
    markup.includes("Ellie, teman eksperimenmu"),
    `${Page.name}: missing guide`,
  );
  assert.ok(
    markup.includes('aria-live="polite"'),
    `${Page.name}: guidance is not announced`,
  );
  assert.ok(
    markup.includes("Apa yang terjadi?"),
    `${Page.name}: missing explanation`,
  );
  assert.ok(
    markup.includes("Rumus &amp; Penjelasan"),
    `${Page.name}: missing formula panel`,
  );
  assert.equal(
    (markup.match(/class="sim-quiz-question"/g) || []).length,
    3,
    `${Page.name}: expected three quiz questions`,
  );
}

const circuit = renderToStaticMarkup(<CircuitPage />);
assert.ok(circuit.includes('aria-label="Pilih komponen rangkaian"'));
for (const text of [
  "Simulator Rangkaian Seri &amp; Paralel",
  "Rak komponen",
  "Meja kosong",
  "Rangkaian seri",
  "Rangkaian paralel",
  "Sambungkan kabel",
]) {
  assert.ok(circuit.includes(text), `Circuit editor is missing ${text}`);
}
for (const name of [
  "Baterai",
  "Lampu",
  "Resistor",
  "Saklar",
  "Sekring",
  "Kabel",
])
  assert.ok(circuit.includes(`aria-label="Tambahkan ${name}"`));
const optics = renderToStaticMarkup(<OpticsPage />);
assert.ok(optics.includes('aria-label="Pilih objek optik"'));
console.log("Physics guidance render checks passed for all five simulations.");
