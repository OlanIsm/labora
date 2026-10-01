import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import LitmusControls from "../LitmusControls";
import { initialLab, reduceLab } from "../../../lib/sandbox/engine";
import { Shape } from "../../../components/sandbox/Shape";
import { dipLitmusDrop, pourDrop } from "../drop";

let state = reduceLab(initialLab(), { type: "add", material: "beaker" });
const vessel = state.entities[0].id;
state = pourDrop(state, vessel, { material: "naoh01" })!.state;
const tested = dipLitmusDrop(state, vessel, { material: "litmus-red" })!;
const paper = tested.state.entities.find((e) => e.id === tested.paperId)!;
const noop = () => {};
const controls = renderToStaticMarkup(<LitmusControls entity={paper} state={tested.state} target={vessel} setTarget={noop} send={noop} />);
assert.ok(controls.includes("Angkat kertas"));
assert.ok(renderToStaticMarkup(<Shape entity={paper} state={tested.state} />).includes('fill="#37699c"'));
console.log("Chemistry UI module checks passed.");
