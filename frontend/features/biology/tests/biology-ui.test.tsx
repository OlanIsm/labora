import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { initialLab, reduceLab } from "../../../lib/sandbox/engine";
import { Shape } from "../../../components/sandbox/Shape";
import ApparatusControls from "../../../components/sandbox/ApparatusControls";
import MicroscopeLab from "../MicroscopeLab";
import MicroscopeField from "../MicroscopeField";
import { INITIAL_MICROSCOPE, OBJECTIVES, insertSlide, microscopeFieldWidth, microscopeSlides } from "../microscope";
import { specimens } from "../catalog";
import { existsSync } from "node:fs";

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

const microscope = renderToStaticMarkup(<MicroscopeLab />);
assert.ok(microscope.includes("Pandangan mikroskop"));
assert.ok(microscope.includes("Rak preparat"));
assert.ok(microscope.includes("Belum ada preparat"));
assert.ok(microscope.includes("Ellie, teman eksperimenmu"));
assert.ok(microscope.includes("Mulai dengan preparat darah"));
assert.equal((microscope.match(/class="microscope-aperture/g) || []).length, 1, "Biology must have one fixed viewing field");
assert.ok(!microscope.includes('aria-label="Ambil Mikroskop"'), "The microscope must not be a draggable rack item");
assert.equal(microscopeSlides.length, Object.keys(specimens).length);
for (const slide of microscopeSlides) {
  assert.ok(microscope.includes(`aria-label="Amati ${slide.name}"`));
  const inserted = insertSlide(slide.id);
  assert.equal(inserted.slideId, slide.id);
  assert.equal(inserted.focus, 0);
  assert.equal(inserted.objective, 4);
  assert.ok(existsSync(`public/microscopy/${slide.id}.webp`), `Missing real micrograph for ${slide.id}`);
  for (const objective of OBJECTIVES) {
    const field = renderToStaticMarkup(<MicroscopeField slide={slide} objective={objective} focus={0} light={80} />);
    assert.ok(field.includes(`data-specimen="${slide.id}"`));
    assert.ok(field.includes(`perbesaran total ${objective * 10} kali`));
    assert.ok(field.includes(`/microscopy/${slide.id}.webp`));
    assert.ok(!field.includes("NaN"));
  }
}
assert.deepEqual(insertSlide("not-a-slide"), INITIAL_MICROSCOPE);
assert.ok(microscopeFieldWidth(40) < microscopeFieldWidth(10), "Higher zoom must crop the same photograph, not swap the specimen");
console.log("Biology UI module checks passed.");
