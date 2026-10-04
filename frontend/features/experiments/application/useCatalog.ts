"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/infrastructure/api";
import { experiments as bundled } from "../domain/definitions";
import type { Experiment } from "../model";
export function useCatalog(account: boolean) {
  const [experiments, setExperiments] = useState(bundled),
    [error, setError] = useState("");
  useEffect(() => {
    if (!account) {
      setExperiments(bundled);
      return;
    }
    let active = true;
    apiFetch<{ id: string }[]>("/experiments")
      .then(async (rows) => {
        const versions = await Promise.all(
          rows.map((r) =>
            apiFetch<{ definition: Experiment }>(`/experiments/${r.id}`),
          ),
        );
        if (active) {
          setExperiments(versions.map((v) => v.definition));
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [account]);
  return {
    experiments,
    getExperiment: (id: string) => experiments.find((e) => e.id === id),
    error,
  };
}
