import { materials } from "@/features/laboratory/domain/catalog";
import type { Entity, LabState } from "@/features/laboratory/domain/types";
import { Leaf, Microscope } from "lucide-react";
import { specimens } from "./catalog";

export function renderBiologyShape({
  entity: e,
  state,
}: {
  entity: Entity;
  state: LabState;
}) {
  const model = materials[e.material].model;
  if (model === "microscope" || e.material === "microscope") {
    const sample = specimens[e.material]
      ? e
      : state.entities.find(
          (x) => e.connections.includes(x.id) && !!specimens[x.material],
        );
    return (
      <span
        className={`sandbox-microscope ${sample ? `specimen-${specimens[sample.material]?.shape || "plant"} sample-${sample.material}` : ""} ${e.params.magnification >= 100 ? "detail-visible" : ""}`}
        style={{
          filter: `blur(${Math.min(4, Math.abs(e.params.focus) * 0.4)}px)`,
          opacity: Math.max(0.1, Math.min(1, e.params.light / 50)),
        }}
      >
        {sample ? (
          Array.from(
            { length: e.params.magnification >= 400 ? 3 : 7 },
            (_, i) => (
              <i
                key={i}
                className={
                  sample.material === "blood" || sample.material === "cheek"
                    ? "round-cell"
                    : ""
                }
              />
            ),
          )
        ) : (
          <Microscope size={44} />
        )}
      </span>
    );
  }
  if (
    ["photosynthesis", "transpiration", "growth", "soil"].includes(model || "")
  )
    return (
      <span className="sandbox-plant">
        <Leaf
          size={46}
          color={e.status.includes("Pucat") ? "#bcad7b" : "#46753c"}
        />
        {e.measurements["Laju O₂ relatif"] > 0 && e.active && (
          <span className="sandbox-bubbles">
            <i />
            <i />
            <i />
          </span>
        )}
      </span>
    );
  return null;
}
