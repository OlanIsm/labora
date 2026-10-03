"use client";
import { useEffect, useState } from "react";
import type { ProgressSummary } from "@contracts/laboratory";
import { useAccount } from "@/shared/accountContext";
import { apiFetch } from "@/shared/infrastructure/api";
export function useProgressSummary() {
  const user = useAccount();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setSummary(null);
    setError("");
    if (user.mode === "account")
      apiFetch<ProgressSummary>("/progress/summary")
        .then((value) => {
          if (active) setSummary(value);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [user.id, user.mode]);
  return { summary, error };
}
