import assert from "node:assert/strict";
import { resolveRouteContext } from "../application/routeContext";
import { laboratoryPath } from "../features/laboratory/routes";

const simulationIds = [
  "meriam-target",
  "roller-coaster",
  "kapal-selam",
  "laser-lensa",
  "korsleting-listrik",
];
for (const route of [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/laboratories",
  "/settings",
  "/kimia",
  "/fisika",
]) {
  assert.equal(resolveRouteContext(route, simulationIds).isPublic, true, route);
}
for (const subject of ["chemistry", "physics", "biology"] as const) {
  assert.equal(
    resolveRouteContext(`/sandbox/${subject}`, simulationIds).isSandbox,
    true,
  );
  assert.equal(
    resolveRouteContext(`/laboratories/${subject}`, simulationIds).isSandbox,
    true,
  );
}
assert.equal(laboratoryPath("chemistry"), "/sandbox/chemistry");
assert.equal(laboratoryPath("physics"), "/fisika");
assert.equal(laboratoryPath("biology"), "/sandbox/biology");
for (const id of simulationIds)
  assert.equal(
    resolveRouteContext(`/fisika/${id}`, simulationIds).physicsSimulationId,
    id,
  );
for (const route of [
  "/sandbox/invalid",
  "/fisika/invalid",
  "/teacher",
  "/teacher/new",
  "/progress",
  "/assignments",
]) {
  assert.equal(
    resolveRouteContext(route, simulationIds).isPublic,
    false,
    route,
  );
}
for (const route of [
  "/experiments/acid-base",
  "/challenges/run/acid-base",
  "/results/acid-base",
]) {
  assert.equal(
    resolveRouteContext(route, simulationIds).experimentId,
    "acid-base",
  );
}
console.log(
  "Routes passed: app entry, subject aliases, known simulations, protected pages, and experiment identity.",
);
