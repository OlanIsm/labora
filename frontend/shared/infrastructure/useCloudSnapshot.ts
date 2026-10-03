"use client";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "../accountContext";
import { apiFetch, ApiError } from "./api";
import { browserStorage } from "./browserStorage";
type Saved = {
  id: string;
  revision: number;
  state: unknown;
  status: string;
  mode: string;
};
export function useCloudSnapshot<T>({
  subject,
  simulationKey,
  value,
  restore,
  validate,
}: {
  subject: string;
  simulationKey: string;
  value: T;
  restore: (value: T) => void;
  validate: (value: unknown) => value is T;
}) {
  const user = useAccount(),
    account = user.mode === "account" && !!user.id;
  const [ready, setReady] = useState(!account),
    [status, setStatus] = useState(""),
    [retry, setRetry] = useState(0);
  const session = useRef<Saved | null>(null),
    last = useRef(""),
    latest = useRef(value),
    locked = useRef(false),
    pending = useRef<{ eventId: string; revision: number; state: T } | null>(
      null,
    );
  const callbacks = useRef({ restore, validate });
  callbacks.current = { restore, validate };
  latest.current = value;
  const draftKey = `labora-snapshot-v1:${user.id}:${subject}:${simulationKey}`;
  useEffect(() => {
    if (!account) {
      setReady(true);
      return;
    }
    let active = true;
    setReady(false);
    session.current = null;
    last.current = "";
    pending.current = null;
    async function initialize() {
      try {
        const saved = await apiFetch<Saved[]>(
          `/sessions?mode=sandbox&subject=${subject}&simulationKey=${simulationKey}&limit=100`,
        );
        let current = saved.find((s) => s.status === "active");
        const draft = browserStorage.read<T | null>(draftKey, null);
        if (!current)
          current = await apiFetch<Saved>("/sessions", {
            method: "POST",
            body: JSON.stringify({
              mode: "sandbox",
              subject,
              simulationKey,
              eventId: crypto.randomUUID(),
              state:
                draft && callbacks.current.validate(draft)
                  ? draft
                  : latest.current,
            }),
          });
        if (!active) return;
        if (!callbacks.current.validate(current.state))
          throw new Error(
            "Simpanan lab tidak sesuai versi aplikasi. Simpanan lama tetap dipertahankan.",
          );
        session.current = current;
        last.current = JSON.stringify(current.state);
        if (
          draft &&
          callbacks.current.validate(draft) &&
          JSON.stringify(draft) !== last.current
        )
          browserStorage.write(`${draftKey}:conflict`, draft);
        callbacks.current.restore(current.state);
        setStatus(
          draft && JSON.stringify(draft) !== last.current
            ? "Versi akun dimuat. Draf perangkat sebelumnya tersedia melalui Pulihkan draf."
            : "Tersimpan di akun",
        );
        setReady(true);
      } catch (e) {
        if (active) {
          setStatus(
            e instanceof Error ? e.message : "Simpanan belum dapat dimuat.",
          );
          setReady(true);
        }
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [account, user.id, subject, simulationKey, retry, draftKey]);
  useEffect(() => {
    if (!account || !ready) return;
    let active = true;
    async function save() {
      const snapshot = latest.current,
        json = JSON.stringify(snapshot);
      browserStorage.write(draftKey, snapshot);
      if (!session.current || locked.current || json === last.current) return;
      locked.current = true;
      setStatus("Menyimpan…");
      const event = pending.current || {
        eventId: crypto.randomUUID(),
        revision: session.current.revision,
        state: snapshot,
      };
      pending.current = event;
      try {
        const result = await apiFetch<{ session: Saved }>(
          `/sessions/${session.current.id}/state`,
          { method: "PATCH", body: JSON.stringify(event) },
        );
        if (!active) return;
        session.current = result.session;
        last.current = JSON.stringify(event.state);
        pending.current = null;
        setStatus("Tersimpan di akun");
      } catch (e) {
        if (active) {
          if (e instanceof ApiError && e.code === "REVISION_CONFLICT") {
            browserStorage.write(`${draftKey}:conflict`, latest.current);
            setStatus(
              "Simpanan berubah di perangkat lain. Draf perangkat ini tetap disimpan; muat ulang untuk mengambil versi akun.",
            );
            session.current = null;
          } else
            setStatus(
              "Belum tersinkron. Draf perangkat ini aman; pengiriman dicoba lagi.",
            );
        }
      } finally {
        locked.current = false;
      }
    }
    const timer = setInterval(() => void save(), 5000);
    const preserve = () => browserStorage.write(draftKey, latest.current);
    window.addEventListener("pagehide", preserve);
    return () => {
      active = false;
      clearInterval(timer);
      preserve();
      window.removeEventListener("pagehide", preserve);
    };
  }, [account, ready, draftKey]);
  async function saveNamed(slot: string) {
    const current = await apiFetch<Saved>("/sessions", {
      method: "POST",
      body: JSON.stringify({
        mode: "sandbox",
        subject,
        simulationKey: `${simulationKey}-${slot}`,
        eventId: crypto.randomUUID(),
        state: latest.current,
      }),
    });
    return current;
  }
  async function loadNamed(slot: string) {
    const all = await apiFetch<Saved[]>(
      `/sessions?mode=sandbox&subject=${subject}&simulationKey=${simulationKey}-${slot}`,
    );
    const current = all.find((s) => s.status === "active");
    if (!current || !callbacks.current.validate(current.state))
      throw new Error("Belum ada konfigurasi akun yang sesuai.");
    callbacks.current.restore(current.state);
  }
  function recoverDraft() {
    const draft = browserStorage.read<T | null>(`${draftKey}:conflict`, null);
    if (draft && callbacks.current.validate(draft) && session.current) {
      callbacks.current.restore(draft);
      browserStorage.remove(`${draftKey}:conflict`);
      setStatus("Draf dipulihkan. Perubahan akan disimpan ke akun.");
    } else
      setStatus(
        "Muat simpanan akun terlebih dahulu. Draf konflik tetap tersedia jika ada.",
      );
  }
  return {
    sessionId: session.current?.id,
    ready,
    status,
    reload: () => setRetry((n) => n + 1),
    account,
    saveNamed,
    loadNamed,
    recoverDraft,
  };
}
