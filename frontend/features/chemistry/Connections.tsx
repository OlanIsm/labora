"use client";
import { useEffect, useRef, useState } from "react";
import { useDndMonitor } from "@dnd-kit/core";
import type { Action, Entity, LabState } from "@/lib/sandbox/types";
import { canDipLitmus, isLitmus } from "./litmus";
import { illustrativeTools } from "./equipmentGuides";

type Point = { x: number; y: number };
type Wire = Point & { source: string; side: number };
export function connectionCurve(a: Point, b: Point, aOffset = 24, bOffset = 24) {
  const direction = b.x >= a.x ? 1 : -1;
  const start = { x: a.x + direction * aOffset, y: a.y };
  const end = { x: b.x - direction * bOffset, y: b.y };
  const bend = Math.max(24, Math.abs(end.x - start.x) * .4);
  return { start, end, path: `M ${start.x} ${start.y} C ${start.x + direction * bend} ${start.y}, ${end.x - direction * bend} ${end.y}, ${end.x} ${end.y}` };
}

export default function ChemistryConnections({ state, dispatch }: { state: LabState; dispatch: (action: Action) => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 1000, height: 480 });
  const [drag, setDrag] = useState({ id: "", x: 0, y: 0 });
  const [wire, setWire] = useState<Wire | null>(null);
  const wireRef = useRef<Wire | null>(null);
  const [notice, setNotice] = useState("");
  function updateWire(value: Wire | null) { wireRef.current = value; setWire(value); }
  useEffect(() => {
    const node = svg.current;
    if (!node) return;
    const update = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => { if (event.key === "Escape") { updateWire(null); setNotice(""); } };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, []);
  useDndMonitor({
    onDragMove: ({ active, delta }) => setDrag({ id: String(active.data.current?.entity || ""), x: delta.x, y: delta.y }),
    onDragEnd: () => setDrag({ id: "", x: 0, y: 0 }),
    onDragCancel: () => setDrag({ id: "", x: 0, y: 0 }),
  });
  const position = (entity: Entity) => {
    const item = svg.current?.parentElement?.querySelector<HTMLElement>(`[id="sandbox-entity-${entity.id}"]`);
    const width = item?.offsetWidth || 90;
    return {
      x: entity.x * size.width / 100 + width / 2 + (drag.id === entity.id ? drag.x : 0),
      y: entity.y * size.height / 100 + (width <= 70 ? 33 : 38) + (drag.id === entity.id ? drag.y : 0),
      offset: width / 2 + 10,
    };
  };
  function connect(sourceId: string, targetId: string) {
    const source = state.entities.find(e => e.id === sourceId), target = state.entities.find(e => e.id === targetId);
    updateWire(null);
    if (!source || !target || source === target) { setNotice("Sambungan dibatalkan. Tarik titik ke benda lain."); return; }
    if (illustrativeTools.includes(source.material) || illustrativeTools.includes(target.material)) { setNotice("Alat ini hanya ilustrasi dan belum bisa disambungkan untuk menjalankan proses."); return; }
    const paper = isLitmus(source.material) ? source : isLitmus(target.material) ? target : undefined;
    if (paper && !canDipLitmus(paper === source ? target : source)) { setNotice("Lakmus membutuhkan wadah terbuka yang berisi larutan."); return; }
    if (source.connections.includes(targetId)) { setNotice("Kedua benda sudah tersambung. Klik garis untuk melepasnya."); return; }
    setNotice("");
    dispatch({ type: "connect", source: sourceId, target: targetId });
  }
  const source = state.entities.find(e => e.id === wire?.source);
  const origin = source && wire ? position(source) : null;
  return <>
    <svg ref={svg} className="sandbox-connections chemistry-connections" aria-label="Sambungan alat">
      {state.entities.flatMap(source => source.connections.filter(id => id > source.id).map(id => {
        const target = state.entities.find(entity => entity.id === id);
        if (!target) return null;
        const a = position(source), b = position(target);
        const curve = connectionCurve(a, b, a.offset, b.offset);
        const cutX = (curve.start.x + curve.end.x) / 2, cutY = (curve.start.y + curve.end.y) / 2;
        const remove = () => { updateWire(null); setNotice(""); dispatch({ type: "connect", source: source.id, target: id }); };
        return <g key={`${source.id}-${id}`} className="chemistry-link" role="button" tabIndex={0}
          aria-label={`Lepas sambungan ${source.label} ke ${target.label}`}
          onClick={remove} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); remove(); } }}>
          <title>Klik untuk melepas sambungan</title>
          <path className="chemistry-link-hit" d={curve.path} />
          <path className="chemistry-link-line" d={curve.path} />
          <g className="chemistry-link-cut" transform={`translate(${cutX} ${cutY})`}>
            <circle r="12" /><path d="M-4-4L4 4M4-4L-4 4" />
          </g>
        </g>;
      }))}
      {wire && origin && <path className="chemistry-wire-preview" d={`M ${origin.x + wire.side * origin.offset} ${origin.y} C ${origin.x + wire.side * (origin.offset + 50)} ${origin.y}, ${wire.x - wire.side * 50} ${wire.y}, ${wire.x} ${wire.y}`} />}
    </svg>
    {state.entities.filter(e => !e.rackPlacement && !["rack", "stopwatch"].includes(e.material) && !illustrativeTools.includes(e.material)).flatMap(entity => [-1, 1].map(side => {
      const point = position(entity);
      return <button key={`${entity.id}-${side}`} type="button" className={`chemistry-port ${wire?.source === entity.id ? "connecting" : ""}`}
        style={{ left: point.x + side * point.offset, top: point.y }}
        data-chemistry-port={entity.id} aria-label={`Titik sambungan ${entity.label}, ${side < 0 ? "kiri" : "kanan"}`}
        title="Tarik ke titik benda lain untuk menyambungkan" aria-pressed={wire?.source === entity.id}
        onPointerDown={event => {
          event.stopPropagation();
          if (event.button !== 0) return;
          setNotice("");
          updateWire({ source: entity.id, side, x: point.x + side * point.offset, y: point.y });
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId) || !wireRef.current) return;
          const rect = svg.current!.getBoundingClientRect();
          updateWire({ ...wireRef.current, x: event.clientX - rect.left, y: event.clientY - rect.top });
        }}
        onPointerUp={event => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const element = document.elementFromPoint(event.clientX, event.clientY);
          const port = element?.closest<HTMLElement>("[data-chemistry-port]");
          const item = element?.closest<HTMLElement>(".sandbox-object");
          const target = port?.dataset.chemistryPort || item?.id.replace("sandbox-entity-", "") || "";
          const source = wireRef.current?.source;
          event.currentTarget.releasePointerCapture(event.pointerId);
          if (source) connect(source, target);
        }}
        onPointerCancel={() => updateWire(null)}
        onClick={event => {
          if (event.detail !== 0) return;
          if (wireRef.current) connect(wireRef.current.source, entity.id);
          else { updateWire({ source: entity.id, side, x: point.x + side * point.offset, y: point.y }); setNotice("Pilih titik benda tujuan, atau tekan Escape untuk membatalkan."); }
        }}><span aria-hidden="true" /></button>;
    }))}
    {notice && <p className="chemistry-connection-notice" role="status">{notice}</p>}
  </>;
}
