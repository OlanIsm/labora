"use client";
import { initialLab } from "@/features/laboratory/domain/engine";
import { workbenchHistoryReducer } from "@/features/laboratory/domain/rack";
import type { Discipline } from "@/features/laboratory/domain/types";
import {
  loadBench,
  saveBench,
  isLabState,
} from "@/features/laboratory/infrastructure/labRepository";
import { useEffect, useReducer, useRef, useState } from "react";
import { useCloudSnapshot } from "@/shared/infrastructure/useCloudSnapshot";

export function useSandbox(discipline: Discipline) {
  const [history, dispatch] = useReducer(workbenchHistoryReducer, {
    past: [],
    present: initialLab(discipline),
    future: [],
  });
  const [ready, setReady] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [persistent, setPersistent] = useState(true);
  const cloud = useCloudSnapshot({
    subject: discipline,
    simulationKey: "bench",
    value: history.present,
    restore: (state) => dispatch({ type: "load", state }),
    validate: isLabState,
  });
  useEffect(() => {
    if (cloud.account) return;
    const state = loadBench(discipline);
    if (discipline === "chemistry")
      state.entities.forEach((entity) => {
        if (entity.material === "burner" && entity.label === "Pembakar virtual")
          entity.label = "Pembakar";
      });
    dispatch({ type: "load", state });
    setReady(true);
  }, [discipline, cloud.account]);
  const latest = useRef(history.present);
  latest.current = history.present;
  const effectiveReady = cloud.account ? cloud.ready : ready;
  useEffect(() => {
    if (!ready || cloud.account) return;
    const save = () => setPersistent(saveBench(latest.current));
    const timer = setInterval(save, 1500);
    window.addEventListener("pagehide", save);
    return () => {
      save();
      clearInterval(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [ready, cloud.account]);
  useEffect(() => {
    if (!effectiveReady || speed === 0) return;
    const timer = setInterval(
      () => dispatch({ type: "tick", dt: 0.2 * speed }),
      200,
    );
    return () => clearInterval(timer);
  }, [effectiveReady, speed]);
  return {
    history,
    state: history.present,
    dispatch,
    speed,
    setSpeed,
    ready: effectiveReady,
    persistent,
    cloud,
  };
}
