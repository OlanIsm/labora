import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import LitmusControls from "../LitmusControls";
import { initialLab, reduceLab } from "../../../domain/engine";
import { Shape } from "../../../ui/workbench/Shape";
import { dipLitmusDrop, pourDrop } from "../drop";
import ChemistryLabList from "../ChemistryLabList";
import { laboratoryPath } from "../../../routes";
import { resolveRouteContext } from "../../../../../application/routeContext";
import ChemistryConnections, { connectionCurve } from "../Connections";
import ChemistryGuide, { chemistryTip } from "../ChemistryGuide";
import ApparatusControls from "../../../ui/workbench/ApparatusControls";
import ActionFeedback from "../../../ui/workbench/ActionFeedback";
import Observations from "../../../ui/workbench/Observations";

let state = reduceLab(initialLab(), { type: "add", material: "beaker" });
const vessel = state.entities[0].id;
state = pourDrop(state, vessel, { material: "naoh01" })!.state;
const tested = dipLitmusDrop(state, vessel, { material: "litmus-red" })!;
const paper = tested.state.entities.find((e) => e.id === tested.paperId)!;
const noop = () => {};
const controls = renderToStaticMarkup(
  <LitmusControls
    entity={paper}
    state={tested.state}
    target={vessel}
    setTarget={noop}
    send={noop}
  />,
);
assert.ok(controls.includes("Angkat kertas"));
assert.ok(
  renderToStaticMarkup(<Shape entity={paper} state={tested.state} />).includes(
    'fill="#37699c"',
  ),
);
console.log("Chemistry UI module checks passed.");
const list = renderToStaticMarkup(<ChemistryLabList />);
assert.ok(list.includes('href="/sandbox/chemistry"'));
assert.ok(list.includes("Lab Kimia Interaktif"));
assert.ok(list.includes("Tanpa urutan wajib"));
assert.equal(
  laboratoryPath("chemistry"),
  "/sandbox/chemistry",
  "The chemistry card opens the lab directly",
);
assert.equal(resolveRouteContext("/kimia", []).isPublic, true);
assert.equal(resolveRouteContext("/sandbox/chemistry", []).isSandbox, true);
console.log(
  "Chemistry integration checks passed: direct Home entry, public list, sandbox link and regular web shell.",
);
const curve = connectionCurve({ x: 50, y: 50 }, { x: 250, y: 150 });
assert.deepEqual(curve.start, { x: 74, y: 50 });
assert.deepEqual(curve.end, { x: 226, y: 150 });
assert.ok(
  curve.path.includes(" C "),
  "Connections use a smooth curve rather than a stretched line",
);
const movedCurve = connectionCurve({ x: 50, y: 50 }, { x: 290, y: 170 });
assert.equal(movedCurve.end.x - curve.end.x, 40);
assert.equal(movedCurve.end.y - curve.end.y, 20);
const connectors = renderToStaticMarkup(
  <ChemistryConnections state={tested.state} dispatch={noop} />,
);
assert.ok(connectors.includes('class="chemistry-link-hit"'));
assert.ok(connectors.includes('class="chemistry-link-cut"'));
assert.ok(connectors.includes('aria-label="Lepas sambungan'));
assert.equal(
  (connectors.match(/data-chemistry-port=/g) || []).length,
  tested.state.entities.length * 2,
);
const guide = renderToStaticMarkup(
  <ChemistryGuide
    open
    state={tested.state}
    onOpen={noop}
    onClose={noop}
    onNavigate={noop}
  />,
);
assert.ok(guide.includes("Leo, teman eksperimenmu"));
assert.ok(guide.includes("Lewati"));
assert.ok(guide.includes("Berikutnya"));
assert.ok(guide.includes("tanpa urutan wajib"));
assert.ok(guide.includes('class="chemistry-guide-card sim-mascot"'));
assert.ok(guide.includes('class="chemistry-guide-content sim-speech"'));
assert.ok(guide.includes("Sembunyikan panduan"));
let heating = reduceLab(initialLab(), { type: "add", material: "burner" });
const burnerId = heating.entities[0].id;
const burner = () => heating.entities.find((e) => e.id === burnerId)!;
assert.ok(chemistryTip(heating, burner()).includes("Tarik titik pembakar"));
heating = reduceLab(heating, { type: "add", material: "beaker" });
const heatingVessel = heating.entities.at(-1)!.id;
heating = reduceLab(heating, {
  type: "connect",
  source: burnerId,
  target: heatingVessel,
});
assert.ok(chemistryTip(heating, burner()).includes("masih kosong"));
heating = pourDrop(heating, heatingVessel, { material: "water" })!.state;
assert.ok(chemistryTip(heating, burner()).includes("Nyalakan / jalankan"));
heating = reduceLab(heating, { type: "toggle", id: burnerId, key: "active" });
assert.ok(chemistryTip(heating, burner()).includes("waktu dijeda"));
assert.ok(chemistryTip(heating, burner(), true).includes("Pemanasan berjalan"));
const previousTemperature = heating.entities.find(
  (e) => e.id === heatingVessel,
)!.temperature;
heating = reduceLab(heating, { type: "tick", dt: 2 });
assert.ok(
  heating.entities.find((e) => e.id === heatingVessel)!.temperature >
    previousTemperature,
);
heating = reduceLab(heating, { type: "add", material: "tripod" });
const tripod = heating.entities.at(-1)!;
assert.ok(chemistryTip(heating, tripod).includes("hanya ilustrasi"));
const tripodControls = renderToStaticMarkup(
  <ApparatusControls
    entity={tripod}
    state={heating}
    dispatch={noop}
    target=""
    setTarget={noop}
    onAction={noop}
  />,
);
assert.ok(tripodControls.includes("Alat ilustratif"));
assert.ok(!tripodControls.includes("Sambungkan"));
assert.ok(!tripodControls.includes("Nyalakan"));
const heatedView = renderToStaticMarkup(
  <Observations
    entity={heating.entities.find((e) => e.id === heatingVessel)}
    state={heating}
  />,
);
assert.ok(heatedView.includes("<dt>Suhu (°C)</dt>"));
const tripodView = renderToStaticMarkup(
  <Observations entity={tripod} state={heating} />,
);
assert.ok(!tripodView.includes("<dt>Suhu (°C)</dt>"));
const banner = renderToStaticMarkup(
  <ActionFeedback
    condensed
    feedback={{
      title: "Alat dipilih.",
      detail: "Hasil percobaan.",
      hint: "Saran opsional.",
    }}
    onNext={noop}
  />,
);
assert.ok(banner.includes("<strong>Alat dipilih.</strong> Hasil percobaan."));
assert.ok(banner.includes("<summary><span>Saran</span>"));
assert.ok(banner.includes('class="chemistry-advice-text"'));
console.log(
  "Chemistry clarity checks passed: compact feedback, contextual heating instructions, real warming and explicit illustrative tools.",
);
