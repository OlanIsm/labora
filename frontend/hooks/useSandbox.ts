"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { initialLab } from "@/lib/sandbox/engine";
import { workbenchHistoryReducer } from "@/lib/sandbox/rack";
import { Discipline } from "@/lib/sandbox/types";
import { loadBench, saveBench } from "@/services/labRepository";

export function useSandbox(discipline: Discipline) {
  const [history, dispatch] = useReducer(workbenchHistoryReducer, {
    past: [],
    present: initialLab(discipline),
    future: [],
  });
  const [ready, setReady] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [persistent, setPersistent] = useState(true);
  useEffect(() => {
    dispatch({ type: "load", state: loadBench(discipline) });
    setReady(true);
  }, [discipline]);
  const latest = useRef(history.present);
  latest.current = history.present;
  useEffect(() => {
    if (!ready) return;
    const save = () => setPersistent(saveBench(latest.current));
    const timer = setInterval(save, 1500);
    window.addEventListener("pagehide", save);
    return () => {
      save();
      clearInterval(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [ready]);
  useEffect(() => {
    if (!ready || speed === 0) return;
    const timer = setInterval(
      () => dispatch({ type: "tick", dt: 0.2 * speed }),
      200,
    );
    return () => clearInterval(timer);
  }, [ready, speed]);
  return {
    history,
    state: history.present,
    dispatch,
    speed,
    setSpeed,
    ready,
    persistent,
  };
}
