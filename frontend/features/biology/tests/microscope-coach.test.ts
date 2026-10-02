import assert from "node:assert/strict";
import { INITIAL_MICROSCOPE, OBJECTIVES, insertSlide, microscopeFieldWidth, microscopePhotoViewBox, microscopeSlides, moveMicroscopePan, zoomMicroscope } from "../microscope";
import { microscopeGuide } from "../microscopeCoach";

const intro = microscopeGuide(INITIAL_MICROSCOPE);
assert.equal(intro.slideId, "blood");
const blood = microscopeSlides.find(slide => slide.id === "blood")!;
let view = insertSlide("blood");
for (const objective of OBJECTIVES) {
  assert.equal(view.objective, objective);
  const guide = microscopeGuide(view, blood);
  if (guide.objective) view = { ...view, objective: guide.objective };
  else assert.equal(guide.slideId, "cheek", "Final step must offer a meaningful specimen comparison");
}
assert.ok(microscopeGuide({ ...view, objective: 10 }, blood).line.includes("tidak memiliki inti"));
assert.ok(microscopeGuide({ ...view, objective: 40 }, blood).line.includes("neutrofil"));
assert.ok(microscopeGuide({ ...view, objective: 100 }, blood).line.includes("piksel"));
assert.equal(microscopeGuide({ ...view, focus: 7 }, blood).adjustment, "focus");
assert.equal(microscopeGuide({ ...view, focus: 0, light: 10 }, blood).adjustment, "light");
for (const slide of microscopeSlides) {
  const lines = new Set<string>();
  let previousWidth = Infinity;
  for (const objective of OBJECTIVES) {
    const guide = microscopeGuide({ ...insertSlide(slide.id), objective }, slide);
    lines.add(guide.line);
    const [x, y, width, height] = microscopePhotoViewBox(slide, objective).split(" ").map(Number);
    assert.ok(x >= 0 && y >= 0 && x + width <= 1600 && y + height <= 1600, `${slide.id}: zoom must stay inside the photograph`);
    assert.equal(width, height);
    assert.ok(width < previousWidth, "Higher zoom must narrow the photographed area");
    previousWidth = width;
  }
  assert.equal(lines.size, 4, `${slide.id}: each zoom level must explain a different observation`);
}
let previousWidth = Infinity;
for (let objective = 4; objective <= 100; objective++) {
  const width = microscopeFieldWidth(objective);
  assert.ok(Number.isFinite(width) && width < previousWidth, "Every slider value must produce a smoothly narrowing photo crop");
  const guide = microscopeGuide({ ...insertSlide("blood"), objective }, blood);
  assert.ok(guide.line.length > 0 && guide.actionLabel.length > 0, "Intermediate zoom levels need usable guidance");
  previousWidth = width;
}
assert.deepEqual(moveMicroscopePan({ x: 0, y: 0 }, -10, 1610), { x: 1590, y: 10 });
assert.deepEqual(moveMicroscopePan({ x: 20, y: 30 }, 1600 * 1000, -1600 * 1000), { x: 20, y: 30 });
const panned = { ...insertSlide("blood"), pan: moveMicroscopePan({ x: 0, y: 0 }, -4750, 4900) };
assert.equal(microscopeGuide(panned, blood).adjustment, "position");
const center = (state: typeof INITIAL_MICROSCOPE) => {
  const [x, y, width] = microscopePhotoViewBox(blood, state.objective, state.pan).split(" ").map(Number);
  return [(x + width / 2) % 1600, (y + width / 2) % 1600];
};
const zoomed = zoomMicroscope(panned, blood, 25);
assert.deepEqual(center(zoomed), center(panned), "Zoom must preserve the inspected location after panning");
const refocused = zoomMicroscope(zoomed, blood, 97);
const before = center(zoomed), after = center(refocused);
assert.ok(before.every((value, index) => Math.abs(value - after[index]) < 1e-9));
assert.deepEqual(insertSlide("onion").pan, { x: 0, y: 0 }, "Changing slides must reset panning");
console.log("Microscope checks passed: continuous slider zoom, infinite wrapped panning, preserved inspection point, and contextual guidance.");
