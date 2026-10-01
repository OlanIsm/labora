import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { initialLab, reduceLab } from "../lib/sandbox/engine";
import { materials } from "../lib/sandbox/catalog";
import EquipmentDrawing from "../components/sandbox/EquipmentDrawing";
import Inventory from "../components/sandbox/Inventory";
import Workbench, { Shape } from "../components/sandbox/Workbench";
import ApparatusControls from "../components/sandbox/ApparatusControls";
import ActionFeedback from "../components/sandbox/ActionFeedback";
import { actionFeedback } from "../lib/sandbox/feedback";
import Observations from "../components/sandbox/Observations";

const noop = () => {};
const drawings = [
  "beaker",
  "test-tube",
  "erlenmeyer",
  "cylinder",
  "dropper",
  "microscope",
  "ph-meter",
].map((id) =>
  renderToStaticMarkup(<EquipmentDrawing material={materials[id]} />),
);
assert.equal(new Set(drawings).size, drawings.length);
assert.equal(
  new Set(drawings.map((markup) => markup.match(/<path d="([^"]+)"/)?.[1]))
    .size,
  drawings.length,
);
assert.ok(drawings.every((d) => d.includes("<svg")));
const empty = initialLab();
const previewState = reduceLab(empty, { type: "add", material: "beaker" });
const previewFeedback = actionFeedback(
  { type: "add", material: "beaker" },
  empty,
  previewState,
);
const feedbackMarkup = renderToStaticMarkup(
  <ActionFeedback feedback={previewFeedback} onNext={noop} />,
);
assert.ok(feedbackMarkup.includes('role="status"'));
assert.ok(feedbackMarkup.includes('aria-live="polite"'));
assert.ok(feedbackMarkup.includes("masih kosong"));
assert.ok(feedbackMarkup.includes("Buka rak"));
const rack = renderToStaticMarkup(
  <Inventory discipline="chemistry" onAdd={noop} />,
);
assert.equal((rack.match(/class="sandbox-rack-item/g) || []).length, 9);
assert.ok(rack.includes("Semua alat &amp; bahan"));
assert.ok(rack.indexOf("Ambil Gelas kimia") < rack.indexOf("Ambil Air suling"));
let state = reduceLab(empty, { type: "add", material: "microscope" });
const microscope = state.entities[0];
assert.ok(
  !renderToStaticMarkup(<Shape entity={microscope} state={state} />).includes(
    "sandbox-microscope",
  ),
);
assert.ok(
  renderToStaticMarkup(
    <Shape entity={microscope} state={state} magnified />,
  ).includes("sandbox-microscope"),
);
state = reduceLab(state, { type: "add", material: "water" });
const water = state.entities.at(-1)!;
const controls = renderToStaticMarkup(
  <ApparatusControls
    entity={water}
    state={state}
    dispatch={noop}
    target=""
    setTarget={noop}
    onAction={noop}
  />,
);
assert.ok(controls.includes("Tuang / campur"));
assert.ok(!controls.includes("Nyalakan / jalankan"));
assert.ok(!controls.includes("Mulai gerakan / ulangi"));
assert.ok(controls.includes("<summary>Pengaturan lebih lanjut</summary>"));
state = reduceLab(state, { type: "add", material: "ph-meter" });
const meterControls = renderToStaticMarkup(
  <ApparatusControls
    entity={state.entities.at(-1)}
    state={state}
    dispatch={noop}
    target=""
    setTarget={noop}
    onAction={noop}
  />,
);
assert.ok(!meterControls.includes("Tuang / campur"));
assert.ok(meterControls.includes("Sambungkan"));
assert.ok(!meterControls.includes("Nyalakan / jalankan"));
const meterView = renderToStaticMarkup(
  <Observations
    entity={{
      ...state.entities.at(-1)!,
      measurements: { pH: 1, "Suhu (°C)": 25, "Volume (mL)": 5 },
    }}
    state={state}
  />,
);
assert.ok(meterView.includes("<dt>pH</dt>"));
assert.ok(!meterView.includes("<dt>Suhu (°C)</dt>"));
assert.ok(!meterView.includes("<dt>Volume (mL)</dt>"));

if (process.env.LABORA_UI_PREVIEW === "1") {
  const output = resolve("../.impeccable/review");
  mkdirSync(output, { recursive: true });
  const css = ["styles.css", "sandbox.css", "specimens.css"]
    .map((file) => readFileSync(resolve("app", file), "utf8"))
    .join("\n");
  const surface = renderToStaticMarkup(
    <main
      style={{ maxWidth: 1200, margin: "auto", padding: 24 }}
      className="sandbox"
    >
      <header className="sandbox-heading">
        <div>
          <h1>Lab Kimia</h1>
          <p>Eksperimen bebas</p>
        </div>
      </header>
      <ActionFeedback feedback={previewFeedback} onNext={noop} />
      <div className="sandbox-layout">
        <div className="sandbox-left">
          <Workbench
            state={previewState}
            selected={previewState.entities[0].id}
            onSelect={noop}
            dispatch={noop}
          />
        </div>
        <aside className="sandbox-right panel-open">
          <Inventory discipline="chemistry" onAdd={noop} />
        </aside>
      </div>
      <p style={{ marginTop: 24 }}>
        Pratinjau render statis: bentuk dan tata letak, bukan pengujian
        interaksi aplikasi.
      </p>
    </main>,
  );
  writeFileSync(
    resolve(output, "sandbox-simple-static.html"),
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Labora: pratinjau statis</title><style>${css}</style></head><body>${surface}</body></html>`,
  );
}
console.log(
  "UI render checks passed: distinct apparatus, small starter rack, contextual actions and advanced disclosure.",
);
