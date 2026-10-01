import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { initialLab, reduceLab } from "../../../lib/sandbox/engine";
import { Shape } from "../../../components/sandbox/Shape";
import ApparatusControls from "../../../components/sandbox/ApparatusControls";

let state = reduceLab(initialLab("biology"), { type: "add", material: "microscope" });
const scope = state.entities[0].id;
state = reduceLab(state, { type: "add", material: "onion" });
state = reduceLab(state, { type: "connect", source: scope, target: state.entities[1].id });
const entity = state.entities[0];
assert.ok(renderToStaticMarkup(<Shape entity={entity} state={state} magnified />).includes("specimen-plant sample-onion"));
const noop = () => {};
const controls = renderToStaticMarkup(<ApparatusControls entity={entity} state={state} target="" setTarget={noop} dispatch={noop} onAction={noop} />);
assert.ok(controls.includes("Fokus kasar / halus"));
assert.ok(!controls.includes("Panjang tali (m)"));
console.log("Biology UI module checks passed.");
