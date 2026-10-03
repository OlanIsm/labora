import assert from "node:assert/strict";
import {
  INITIAL_MICROSCOPE,
  OBJECTIVES,
  insertSlide,
  microscopePhotoViewBox,
  microscopeSlides,
} from "../microscope";
import { microscopeGuide } from "../microscopeCoach";

const intro = microscopeGuide(INITIAL_MICROSCOPE);
assert.equal(intro.slideId, "blood");
const blood = microscopeSlides.find((slide) => slide.id === "blood")!;
let view = insertSlide("blood");
for (const objective of OBJECTIVES) {
  assert.equal(view.objective, objective);
  const guide = microscopeGuide(view, blood);
  if (guide.objective) view = { ...view, objective: guide.objective };
  else
    assert.equal(
      guide.slideId,
      "cheek",
      "Final step must offer a meaningful specimen comparison",
    );
}
assert.ok(
  microscopeGuide({ ...view, objective: 10 }, blood).line.includes(
    "tidak memiliki inti",
  ),
);
assert.ok(
  microscopeGuide({ ...view, objective: 40 }, blood).line.includes("neutrofil"),
);
assert.ok(
  microscopeGuide({ ...view, objective: 100 }, blood).line.includes("piksel"),
);
assert.equal(microscopeGuide({ ...view, focus: 7 }, blood).adjustment, "focus");
assert.equal(
  microscopeGuide({ ...view, focus: 0, light: 10 }, blood).adjustment,
  "light",
);
for (const slide of microscopeSlides) {
  const lines = new Set<string>();
  let previousWidth = Infinity;
  for (const objective of OBJECTIVES) {
    const guide = microscopeGuide(
      { ...insertSlide(slide.id), objective },
      slide,
    );
    lines.add(guide.line);
    const [x, y, width, height] = microscopePhotoViewBox(slide, objective)
      .split(" ")
      .map(Number);
    assert.ok(
      x >= 0 && y >= 0 && x + width <= 1600 && y + height <= 1600,
      `${slide.id}: zoom must stay inside the photograph`,
    );
    assert.equal(width, height);
    assert.ok(
      width < previousWidth,
      "Higher zoom must narrow the photographed area",
    );
    previousWidth = width;
  }
  assert.equal(
    lines.size,
    4,
    `${slide.id}: each zoom level must explain a different observation`,
  );
}
console.log(
  "Microscope coaching checks passed: specimen-specific walkthrough, focus/light recovery, meaningful comparisons, and bounded photo crops.",
);
