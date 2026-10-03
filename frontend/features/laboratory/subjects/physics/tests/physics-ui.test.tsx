import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { initialLab, reduceLab } from "../../../domain/engine";
import { Shape } from "../../../ui/workbench/Shape";
import ApparatusControls from "../../../ui/workbench/ApparatusControls";

const state = reduceLab(initialLab("physics"), {
  type: "add",
  material: "pendulum",
});
const entity = state.entities[0];
assert.ok(
  renderToStaticMarkup(<Shape entity={entity} state={state} />).includes(
    "sandbox-pendulum",
  ),
);
const noop = () => {};
const controls = renderToStaticMarkup(
  <ApparatusControls
    entity={entity}
    state={state}
    target=""
    setTarget={noop}
    dispatch={noop}
    onAction={noop}
  />,
);
assert.ok(controls.includes("Panjang tali (m)"));
assert.ok(!controls.includes("Fokus kasar / halus"));
console.log("Physics UI module checks passed.");
