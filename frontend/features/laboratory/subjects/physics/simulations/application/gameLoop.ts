"use client";
import { useEffect, useRef } from "react";
import { MAX_SUBSTEPS_PER_FRAME } from "../domain/shared/config";

// Fixed-timestep accumulator loop, decoupled from requestAnimationFrame's
// variable frame rate. `onStep` advances the pure physics state by exactly
// `dt` seconds each call; `onRender` paints the current state once per
// animation frame. Call `pause()`/`resume()` from UI controls.
export function useFixedTimestepLoop(
  dt: number,
  onStep: (dt: number) => void,
  onRender: () => void,
  paused: boolean,
) {
  const accumulator = useRef(0);
  const lastTime = useRef<number | null>(null);
  const frameId = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const callbacks = useRef({ onStep, onRender });
  callbacks.current = { onStep, onRender };

  useEffect(() => {
    function tick(now: number) {
      if (lastTime.current === null) lastTime.current = now;
      const elapsed = (now - lastTime.current) / 1000;
      lastTime.current = now;
      if (!pausedRef.current) {
        accumulator.current += Math.min(elapsed, dt * MAX_SUBSTEPS_PER_FRAME);
        let steps = 0;
        while (accumulator.current >= dt && steps < MAX_SUBSTEPS_PER_FRAME) {
          callbacks.current.onStep(dt);
          accumulator.current -= dt;
          steps += 1;
        }
      } else {
        accumulator.current = 0;
      }
      callbacks.current.onRender();
      frameId.current = requestAnimationFrame(tick);
    }
    frameId.current = requestAnimationFrame(tick);
    return () => {
      if (frameId.current !== null) cancelAnimationFrame(frameId.current);
      lastTime.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dt]);
}
