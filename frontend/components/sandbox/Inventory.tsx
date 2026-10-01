"use client";
import { useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Atom, Leaf, Wrench, Search, X } from "lucide-react";
import { catalog } from "@/lib/sandbox/catalog";
import { Discipline, Material } from "@/lib/sandbox/types";
import EquipmentDrawing, { hasEquipmentDrawing } from "./EquipmentDrawing";
const starters: Record<Discipline, string[]> = {
  chemistry: [
    "beaker",
    "water",
    "oil",
    "nacl",
    "dropper",
    "ph-meter",
  ],
  physics: [
    "pendulum",
    "spring",
    "ball",
    "launcher",
    "battery",
    "resistor",
    "wire",
    "voltmeter",
  ],
  biology: [
    "microscope",
    "onion",
    "cheek",
    "elodea",
    "slide",
    "potato",
    "water",
    "seed",
  ],
  free: [
    "beaker",
    "water",
    "dropper",
    "thermometer",
    "pendulum",
    "battery",
    "microscope",
    "seed",
  ],
};
function Item({
  material,
  onAdd,
}: {
  material: Material;
  onAdd: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `rack:${material.id}`,
      data: { material: material.id },
    });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onAdd(material.id)}
      className={`sandbox-rack-item ${isDragging ? "dragging" : ""}`}
      aria-label={`Ambil ${material.name}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
      }}
    >
      <span className="sandbox-rack-picture">
        {hasEquipmentDrawing(material) ? (
          <EquipmentDrawing material={material} />
        ) : material.discipline === "biology" ? (
          <Leaf size={36} />
        ) : material.discipline === "physics" ? (
          <Atom size={36} />
        ) : (
          <Wrench size={36} />
        )}
      </span>
      <span>{material.name}</span>
    </button>
  );
}
export default function Inventory({
  discipline,
  onAdd,
}: {
  discipline: Discipline;
  onAdd: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [rackTab, setRackTab] = useState("tools");
  const scroller = useRef<HTMLDivElement>(null);
  const list = catalog
    .filter(
      (m) =>
        (discipline === "free" ||
          m.discipline === discipline ||
          m.kind === "container" ||
          [
            "water",
            "dropper",
            "thermometer",
            "balance",
            "stopwatch",
            "h2o2",
            "yeast",
            "glucose",
            "starch",
            "saliva",
            "iodine",
            "benedict",
            "biuret",
            "nahco3",
          ].includes(m.id)) &&
        (kind === "all" || m.kind === kind) &&
        (showAll ||
          discipline === "chemistry" ||
          query.trim() ||
          kind !== "all" ||
          starters[discipline].includes(m.id)) &&
        m.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      discipline === "chemistry" || showAll || query.trim() || kind !== "all"
        ? 0
        : starters[discipline].indexOf(a.id) -
          starters[discipline].indexOf(b.id),
    );
  const tools = list.filter((m) => m.kind !== "material");
  const substances = list.filter((m) => m.kind === "material");
  function chooseTab(value: string) {
    setRackTab(value);
    setQuery("");
    scroller.current?.scrollTo({ left: 0 });
  }
  return (
    <section id="sandbox-rack" className="sandbox-rack">
      <h2>Alat & bahan</h2>
      {discipline === "chemistry" && (
        <div className="sandbox-panel-tabs" role="group" aria-label="Pilihan rak">
          <button aria-pressed={rackTab === "tools"} onClick={() => chooseTab("tools")}>Alat <span className="sandbox-rack-count">{tools.length}</span></button>
          <button aria-pressed={rackTab === "materials"} onClick={() => chooseTab("materials")}>Bahan <span className="sandbox-rack-count">{substances.length}</span></button>
        </div>
      )}
      <p>{discipline === "chemistry" ? "Seret bahan ke gelas untuk menuang." : "Pilih gambarnya untuk meletakkan di meja."}</p>
      <label className="search-box">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari alat atau bahan"
          aria-label="Cari alat atau bahan"
        />
        {query && <button aria-label="Hapus pencarian" onClick={() => setQuery("")}><X size={18} aria-hidden="true" /></button>}
      </label>
      {discipline !== "chemistry" && <details
        className="sandbox-inventory-more"
        onToggle={(event) => {
          setShowAll(event.currentTarget.open);
          if (!event.currentTarget.open) setKind("all");
        }}
      >
        <summary>Semua alat & bahan</summary>
        <label className="sandbox-field">
          Kategori
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">Semua</option>
            <option value="container">Wadah</option>
            <option value="material">Bahan</option>
            <option value="apparatus">Alat</option>
            <option value="instrument">Alat ukur</option>
          </select>
        </label>
      </details>}
      {discipline === "chemistry" ? (
        <div ref={scroller} className="sandbox-rack-groups" tabIndex={0} aria-label={`Daftar ${rackTab === "tools" ? "alat" : "bahan"}, gulir ke samping`}>
          {[
            { name: "Alat", items: tools },
            { name: "Bahan", items: substances },
          ].map((group) => (
            <section key={group.name} aria-label={group.name} className="sandbox-rack-group"
              hidden={(group.name === "Alat") !== (rackTab === "tools")}
            >
              <div className="sandbox-rack-list">
                {group.items.map((m) => <Item key={m.id} material={m} onAdd={onAdd} />)}
                {!group.items.length && <div className="sandbox-rack-empty"><p>Tidak ada {group.name.toLowerCase()} yang cocok.</p>
                  {(group.name === "Alat" ? substances : tools).length > 0 && <button onClick={() => chooseTab(group.name === "Alat" ? "materials" : "tools")}>Lihat {group.name === "Alat" ? "bahan" : "alat"}</button>}
                </div>}
              </div>
            </section>
          ))}
        </div>
      ) : <div className="sandbox-rack-list">
        {list.map((m) => (
          <Item key={m.id} material={m} onAdd={onAdd} />
        ))}
        {!list.length && <p>Tidak ada yang cocok. Coba nama lain.</p>}
      </div>}
    </section>
  );
}
