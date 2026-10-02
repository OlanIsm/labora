import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { chemistryMaterials } from "../catalog";
import { chemistryMaterialForm } from "../MaterialDrawing";
import EquipmentDrawing from "../../../components/sandbox/EquipmentDrawing";
import DragPreview from "../../../components/sandbox/DragPreview";
import { Shape } from "../../../components/sandbox/Shape";
import { initialLab, reduceLab } from "../../../lib/sandbox/engine";

const bottle = "M29 10H51V25L60 32V82H20V32L29 25Z";
for (const material of chemistryMaterials) {
  const form = chemistryMaterialForm(material);
  const drawing = renderToStaticMarkup(<EquipmentDrawing material={material} />);
  if (material.phase === "solid" || ["yeast", "cabbage"].includes(material.id)) {
    assert.ok(!drawing.includes(bottle), `${material.name} must not look like liquid in a bottle`);
    if (!material.id.startsWith("litmus-")) {
      assert.ok(form && drawing.includes(`data-material-form="${form}"`));
      const state = reduceLab(initialLab(), { type: "add", material: material.id });
      const entity = state.entities[0];
      assert.ok(renderToStaticMarkup(<Shape entity={entity} state={state} />).includes(`data-material-form="${form}"`));
      assert.ok(renderToStaticMarkup(<DragPreview material={material} entity={entity} state={state} />).includes(`data-material-form="${form}"`));
    }
  } else {
    assert.ok(!form && drawing.includes(bottle), `${material.name} keeps its liquid bottle`);
  }
}
const material = (id: string) => chemistryMaterials.find(m => m.id === id)!;
for (const [id, form] of [["mg", "ribbon"], ["zn", "plate"], ["cu", "wire"], ["fe", "nail"], ["al", "foil"], ["zn-powder", "powder"], ["sand", "grains"], ["caco3", "pieces"], ["cabbage", "cabbage"], ["yeast", "yeast"]]) {
  assert.equal(chemistryMaterialForm(material(id)), form);
}
assert.equal(chemistryMaterialForm({ ...material("nacl"), discipline: "physics" }), undefined);
console.log("Chemistry material-drawing checks passed: all non-liquid samples avoid bottles; material-specific silhouettes match across rack, bench and drag; liquid and other-subject drawings preserved.");
