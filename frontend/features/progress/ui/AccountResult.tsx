"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/infrastructure/api";
import type { ResultDTO } from "@contracts/laboratory";
import { getExperiment } from "@/features/experiments";
import { Result } from "./ExperimentResult";
export function AccountResult({ id }: { id: string }) {
  const [record, setRecord] = useState<ResultDTO | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setRecord(null);
    setError("");
    apiFetch<ResultDTO>(`/results/${id}`)
      .then((r) => {
        if (active) setRecord(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <p role="alert" className="form-error">
        {error}
      </p>
    );
  if (!record) return <p role="status">Memuat hasil eksperimen…</p>;
  const exp = getExperiment(record.experimentId);
  return exp ? (
    <Result exp={exp} record={record} />
  ) : (
    <p>Eksperimen ini sudah diarsipkan.</p>
  );
}
