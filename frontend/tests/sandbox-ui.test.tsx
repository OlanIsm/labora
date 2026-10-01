import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { initialLab, reduceLab } from "../lib/sandbox/engine";
import { materials } from "../lib/sandbox/catalog";
import EquipmentDrawing, { hasEquipmentDrawing } from "../components/sandbox/EquipmentDrawing";
import { catalog } from "../lib/sandbox/catalog";
import Inventory from "../components/sandbox/Inventory";
import Workbench, { Shape } from "../components/sandbox/Workbench";
import ApparatusControls from "../components/sandbox/ApparatusControls";
import ActionFeedback from "../components/sandbox/ActionFeedback";
import { actionFeedback, selectionFeedback, failedDropFeedback } from "../lib/sandbox/feedback";
import Observations from "../components/sandbox/Observations";
import { pourDrop, dipLitmusDrop } from "../lib/sandbox/drop";
import { placeTubeInRack, releaseTubeFromRack, RACK_SLOTS } from "../lib/sandbox/rack";
import EquipmentExplanation from "../components/sandbox/EquipmentExplanation";
import DragPreview from "../components/sandbox/DragPreview";
import { equipmentGuides } from "../lib/sandbox/equipmentGuides";

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
const redLitmusDrawing = renderToStaticMarkup(<EquipmentDrawing material={materials["litmus-red"]} />);
const blueLitmusDrawing = renderToStaticMarkup(<EquipmentDrawing material={materials["litmus-blue"]} />);
assert.ok(redLitmusDrawing.includes('fill="#b54458"'));
assert.ok(blueLitmusDrawing.includes('fill="#37699c"'));
assert.ok(redLitmusDrawing.includes('width="24" height="76"'));
assert.ok(!redLitmusDrawing.includes("M29 10H51V25L60 32V82H20V32L29 25Z"));
assert.notEqual(redLitmusDrawing, blueLitmusDrawing);
let paperViewState = reduceLab(initialLab(), { type: "add", material: "beaker" });
const paperVesselId = paperViewState.entities[0].id;
paperViewState = pourDrop(paperViewState, paperVesselId, { material: "hcl01" })!.state;
const paperViewTest = dipLitmusDrop(paperViewState, paperVesselId, { material: "litmus-blue" })!;
const testedPaper = paperViewTest.state.entities.find((e) => e.id === paperViewTest.paperId)!;
const testedPaperShape = renderToStaticMarkup(<Shape entity={testedPaper} state={paperViewTest.state} />);
assert.ok(testedPaperShape.includes('fill="#b54458"'));
const testedPaperExplanation = renderToStaticMarkup(<EquipmentExplanation entity={testedPaper} compact />);
assert.ok(testedPaperExplanation.includes("Kertas berubah dari biru menjadi merah."));
assert.ok(testedPaperExplanation.includes("larutan bersifat asam"));
assert.ok(testedPaperExplanation.includes("Cairannya tidak ikut diwarnai"));
const paperObservation = renderToStaticMarkup(<Observations entity={testedPaper} state={paperViewTest.state} compact />);
assert.ok(paperObservation.includes("sandbox-observations-compact"));
assert.ok(paperObservation.includes("sandbox-observation-paper"));
assert.ok(paperObservation.includes("Kertas berubah dari biru menjadi merah."));
assert.ok(paperObservation.includes("larutan bersifat asam"));
assert.ok(!paperObservation.includes("<h2>Pengamatan</h2>"));
assert.ok(!paperObservation.includes("<dt>Suhu (°C)</dt>"));
assert.ok(!paperObservation.includes("<dl>"));
assert.ok(paperObservation.includes("Riwayat meja"));
const freshPaperObservation = renderToStaticMarkup(<Observations entity={{ ...testedPaper, params: { ...testedPaper.params, litmusTested: 0 } }} state={initialLab()} compact />);
assert.ok(freshPaperObservation.includes("Kertas belum diuji."));
assert.ok(!freshPaperObservation.includes("larutan bersifat asam"));
const emptyObservation = renderToStaticMarkup(<Observations state={initialLab()} compact />);
assert.ok(emptyObservation.includes("Pilih alat atau wadah di meja"));
assert.ok(emptyObservation.includes("Belum ada kejadian."));
const selectedPaperBanner = renderToStaticMarkup(<ActionFeedback feedback={selectionFeedback(testedPaper)} compact onNext={noop} />);
assert.ok(selectedPaperBanner.includes("Lakmus biru dipilih."));
assert.ok(selectedPaperBanner.includes("Kertas berubah dari biru menjadi merah."));
assert.ok(selectedPaperBanner.includes("larutan bersifat asam"));
assert.ok(selectedPaperBanner.includes("Cairannya tidak ikut diwarnai"));
assert.ok(!selectedPaperBanner.includes("Kamu bisa memilih tindakan atau mengambil benda lain"));
const basePaperVessel = reduceLab(initialLab(), { type: "add", material: "beaker" });
const basePaperState = pourDrop(basePaperVessel, basePaperVessel.entities[0].id, { material: "naoh01" })!.state;
const redPaperTest = dipLitmusDrop(basePaperState, basePaperVessel.entities[0].id, { material: "litmus-red" })!;
const selectedRedPaperBanner = renderToStaticMarkup(<ActionFeedback feedback={selectionFeedback(redPaperTest.state.entities.find((e) => e.id === redPaperTest.paperId)!)} compact onNext={noop} />);
assert.ok(selectedRedPaperBanner.includes("Lakmus merah dipilih."));
assert.ok(selectedRedPaperBanner.includes("Kertas berubah dari merah menjadi biru."));
assert.ok(selectedRedPaperBanner.includes("larutan bersifat basa"));
assert.ok(!testedPaperExplanation.includes("Cara pakai di sini:"));
const neutralPaperVessel = reduceLab(initialLab(), { type: "add", material: "beaker" });
const neutralPaperState = pourDrop(neutralPaperVessel, neutralPaperVessel.entities[0].id, { material: "water" })!.state;
const neutralPaperResult = dipLitmusDrop(neutralPaperState, neutralPaperVessel.entities[0].id, { material: "litmus-red" })!;
const neutralPaperExplanation = renderToStaticMarkup(<EquipmentExplanation entity={neutralPaperResult.state.entities.find((e) => e.id === neutralPaperResult.paperId)} compact />);
assert.ok(neutralPaperExplanation.includes("Kertas tetap berwarna merah."));
assert.ok(neutralPaperExplanation.includes("belum cukup untuk memastikan sifat larutan"));
assert.ok(!neutralPaperExplanation.includes("larutan bersifat asam"));
const testedPaperDrag = renderToStaticMarkup(<DragPreview material={materials["litmus-blue"]} entity={testedPaper} state={paperViewTest.state} />);
assert.ok(testedPaperDrag.includes('fill="#b54458"'));
assert.ok(!testedPaperDrag.includes('fill="#37699c"'));
const freshPaperDrag = renderToStaticMarkup(<DragPreview material={materials["litmus-blue"]} state={paperViewTest.state} />);
assert.ok(freshPaperDrag.includes('fill="#37699c"'));
assert.equal(renderToStaticMarkup(<DragPreview state={paperViewTest.state} />), "");
const paperControls = renderToStaticMarkup(<ApparatusControls entity={testedPaper} state={paperViewTest.state} dispatch={noop} target="" setTarget={noop} onAction={noop} />);
assert.ok(paperControls.includes("Celupkan kertas"));
assert.ok(paperControls.includes("Angkat kertas"));
assert.ok(!paperControls.includes("Tuang / campur"));
assert.ok(!paperControls.includes("Jumlah bahan"));
const chemistryTools = catalog.filter((m) => m.discipline === "chemistry" && m.kind !== "material");
for (const tool of chemistryTools) {
  assert.ok(equipmentGuides[tool.id]?.purpose, `Missing equipment purpose: ${tool.id}`);
  assert.ok(equipmentGuides[tool.id]?.usage, `Missing equipment instructions: ${tool.id}`);
  assert.ok(hasEquipmentDrawing(tool), `Missing chemistry drawing: ${tool.id}`);
  assert.ok(renderToStaticMarkup(<EquipmentDrawing material={tool} />).includes("<svg"), `Empty chemistry drawing: ${tool.id}`);
}
assert.equal(renderToStaticMarkup(<EquipmentExplanation />), "");
const balloonState = reduceLab(initialLab(), { type: "add", material: "balloon" });
const balloonExplanation = renderToStaticMarkup(<EquipmentExplanation entity={balloonState.entities[0]} />);
assert.ok(balloonExplanation.includes("Cara pakai di sini:"));
assert.ok(balloonExplanation.includes("Batas simulasi:"));
assert.ok(balloonExplanation.includes("belum menampung gas secara fisik"));
assert.ok(!balloonExplanation.includes("<details"));
const beakerExplanation = renderToStaticMarkup(<EquipmentExplanation entity={reduceLab(initialLab(), { type: "add", material: "beaker" }).entities[0]} />);
assert.ok(beakerExplanation.includes("Gelas kimia"));
assert.ok(!beakerExplanation.includes("belum menampung gas secara fisik"));
assert.equal(renderToStaticMarkup(<EquipmentExplanation entity={reduceLab(initialLab(), { type: "add", material: "water" }).entities[0]} />), "");
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
const movedState = reduceLab(previewState, { type: "move", id: previewState.entities[0].id, x: 40, y: 20 });
const moveFeedback = actionFeedback({ type: "move", id: previewState.entities[0].id, x: 40, y: 20 }, previewState, movedState);
const moveAnnouncement = renderToStaticMarkup(<ActionFeedback feedback={moveFeedback} compact onNext={noop} />);
assert.ok(moveAnnouncement.includes("sandbox-feedback-compact"));
assert.ok(moveAnnouncement.includes('aria-live="polite"'));
assert.ok(moveAnnouncement.includes("dipindahkan."));
assert.ok(moveAnnouncement.includes("<details"));
const dismissibleFeedback = renderToStaticMarkup(<ActionFeedback feedback={moveFeedback} compact onNext={noop} onDismiss={noop} />);
assert.ok(dismissibleFeedback.includes('aria-label="Tutup feedback"'));
for (const kind of ["litmus", "pour", "rack", "outside"] as const) {
  const failedDrop = failedDropFeedback(kind);
  const failureBanner = renderToStaticMarkup(<ActionFeedback feedback={failedDrop} compact onNext={noop} />);
  assert.ok(failureBanner.includes(failedDrop.title));
  assert.ok(failedDrop.detail.length > 0 && failedDrop.hint.length > 0);
  assert.ok(failureBanner.includes('role="status"'));
}
assert.ok(renderToStaticMarkup(<ActionFeedback feedback={moveFeedback} onNext={noop} />).includes("sandbox-feedback"));
assert.ok(renderToStaticMarkup(<ActionFeedback feedback={moveFeedback} message="Penyimpanan gagal." compact onNext={noop} />).includes("Penyimpanan gagal."));
const rack = renderToStaticMarkup(
  <Inventory discipline="chemistry" onAdd={noop} />,
);
assert.ok((rack.match(/class="sandbox-rack-item/g) || []).length > 6);
assert.ok(rack.includes("Ambil Minyak goreng"));
assert.ok(rack.includes("Ambil HCl"));
assert.ok(!rack.includes("Semua alat &amp; bahan"));
assert.ok(rack.indexOf("Ambil Gelas kimia") < rack.indexOf("Ambil Air suling"));
assert.ok(rack.includes('aria-label="Pilihan rak"'));
assert.ok(rack.includes('aria-pressed="true">Alat <span'));
assert.ok(rack.includes('aria-pressed="false">Bahan <span'));
const [toolsGroup, materialsGroup] = rack.split('aria-label="Bahan"');
assert.ok(materialsGroup.includes('hidden=""'));
assert.ok(toolsGroup.includes("Ambil Gelas kimia"));
assert.ok(!toolsGroup.includes("Ambil Air suling"));
assert.ok(materialsGroup.includes("Ambil Air suling"));
assert.ok(materialsGroup.includes("Ambil Minyak goreng"));
assert.ok(!materialsGroup.includes("Ambil Gelas kimia"));
assert.equal((toolsGroup.match(/class="sandbox-rack-item/g) || []).length,
  catalog.filter((m) => (m.discipline === "chemistry" || m.kind === "container") && m.kind !== "material").length);
assert.ok((materialsGroup.match(/class="sandbox-rack-item/g) || []).length > 1);
const sandboxCss = readFileSync(resolve("features/chemistry/chemistry.css"), "utf8");
const horizontalRackRule = sandboxCss.match(/\.canvas-shell \.sandbox\.chemistry \.sandbox-rack-group \.sandbox-rack-list\s*\{([^}]+)\}/)?.[1];
assert.ok(horizontalRackRule?.includes("flex-direction: row"), "Horizontal rack must override the legacy column direction");
assert.ok(horizontalRackRule?.includes("flex-wrap: nowrap"));
assert.ok(rack.includes('tabindex="0" aria-label="Daftar alat, gulir ke samping"'));
const compactFeedback = renderToStaticMarkup(
  <ActionFeedback feedback={previewFeedback} onNext={noop} compact />,
);
assert.ok(compactFeedback.includes("<summary>Penjelasan</summary>"));
assert.ok(!compactFeedback.includes("<details open"));
assert.ok(compactFeedback.includes("masih kosong"));
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

const vessel = reduceLab(initialLab(), { type: "add", material: "beaker" });
const oil = pourDrop(vessel, vessel.entities[0].id, { material: "oil" })!;
const oilShape = renderToStaticMarkup(<Shape entity={oil.state.entities[0]} state={oil.state} />);
assert.ok(oilShape.includes(`fill="${materials.oil.color}"`));
const oilWater = pourDrop(oil.state, vessel.entities[0].id, { material: "water" })!;
const layeredShape = renderToStaticMarkup(<Shape entity={oilWater.state.entities[0]} state={oilWater.state} />);
assert.ok(layeredShape.includes(`fill="${materials.oil.color}"`));
assert.ok(layeredShape.includes(`fill="${materials.water.color}"`));
assert.ok(layeredShape.includes('height="26"'));
const filledBench = renderToStaticMarkup(<Workbench state={oil.state} selected="" onSelect={noop} dispatch={noop} onPlaceTube={noop} />);
assert.ok(filledBench.includes("Minyak goreng"));
const emptyRackState = reduceLab(initialLab(), { type: "add", material: "rack" });
const rackId = emptyRackState.entities[0].id;
const emptyRackView = renderToStaticMarkup(<Workbench state={emptyRackState} selected="" onSelect={noop} dispatch={noop} onPlaceTube={noop} />);
assert.equal((emptyRackView.match(/class="sandbox-slot-placeholder"/g) || []).length, RACK_SLOTS);
const rackWithTube = placeTubeInRack(emptyRackState, rackId, 1, { material: "test-tube" })!;
const mountedTubeId = rackWithTube.entities.at(-1)!.id;
const filledRackState = pourDrop(rackWithTube, mountedTubeId, { material: "oil" })!.state;
const occupiedRackView = renderToStaticMarkup(<Workbench state={filledRackState} selected="" onSelect={noop} dispatch={noop} onPlaceTube={noop} />);
assert.equal((occupiedRackView.match(/class="sandbox-slot-placeholder"/g) || []).length, RACK_SLOTS - 1);
assert.equal((occupiedRackView.match(/class="sandbox-object rack-tube/g) || []).length, 1);
assert.ok(occupiedRackView.includes(`fill="${materials.oil.color}"`));
const releasedRackView = renderToStaticMarkup(<Workbench state={releaseTubeFromRack(filledRackState, mountedTubeId)!} selected="" onSelect={noop} dispatch={noop} onPlaceTube={noop} />);
assert.equal((releasedRackView.match(/class="sandbox-slot-placeholder"/g) || []).length, RACK_SLOTS);
assert.ok(!releasedRackView.includes("sandbox-object rack-tube"));

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
            onPlaceTube={noop}
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
