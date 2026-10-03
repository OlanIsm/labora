"use client";

import type { Experiment } from "@/features/experiments/domain/definitions";
import type { Runtime } from "@/features/experiments/domain/engine";
import { Icon } from "@/features/experiments/ui/EquipmentIcon";
import { Visual } from "@/features/experiments/ui/ExperimentVisual";
import { SubjectBadge } from "@/shared/ui/SubjectBadge";
import { useDroppable } from "@dnd-kit/core";
import { CheckCircle2 } from "lucide-react";

export function Workspace({
  exp,
  state,
  dragging,
  dropError,
  interaction,
}: {
  exp: Experiment;
  state: Runtime;
  dragging: string | null;
  dropError: boolean;
  interaction: number;
}) {
  const current = exp.steps[state.step];
  const { setNodeRef, isOver } = useDroppable({
    id: "workspace",
    disabled: exp.subject === "chemistry" && current?.action !== "place",
  });
  return (
    <div
      ref={setNodeRef}
      className={`workspace ${exp.subject} ${isOver ? "drop-over" : ""} ${dropError ? "drop-rejected" : ""}`}
    >
      <div className="workspace-heading">
        <span>Meja eksperimen</span>
        <SubjectBadge subject={exp.subject} />
      </div>
      <div
        key={interaction}
        className={`workspace-scene ${interaction ? (dropError ? "scene-retry" : "scene-action") : ""}`}
      >
        <Visual exp={exp} state={state} dragging={dragging} />
        {interaction > 0 &&
          !dropError &&
          state.step > 0 &&
          !exp.steps[state.step - 1]?.question && (
            <span
              className={`lab-tool-motion action-${exp.steps[state.step - 1]?.action}`}
              aria-hidden="true"
            >
              <Icon
                name={
                  exp.items.find(
                    (item) => item.id === exp.steps[state.step - 1]?.item,
                  )?.icon || "beaker"
                }
                size={36}
              />
              {exp.subject === "chemistry" &&
                exp.steps[state.step - 1]?.action !== "place" && (
                  <span className="pour-drops">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
            </span>
          )}
        {interaction > 0 && state.step === exp.steps.length && (
          <span className="lab-finish-mark" aria-hidden="true">
            <CheckCircle2 size={32} />
          </span>
        )}
      </div>
      {dragging && (
        <div className="drop-invite">
          {exp.subject === "chemistry" && current?.action !== "place"
            ? "Geser ke dalam gelas"
            : "Lepaskan di meja ini"}
        </div>
      )}
    </div>
  );
}
