"use client";

import type { Assignment } from "@/features/assignments/model";
import type { User } from "@/features/auth/model";
import type { Experiment, Runtime } from "@/features/experiments/model";
import { createRecord } from "@/features/progress/index";
import type { RecordEntry } from "@/features/progress/model";
import { useEffect, useState } from "react";
import type { ApplicationServices } from "./services";

export function useApplicationState(services: ApplicationServices) {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    let active = true;
    async function initialize() {
      let current = services.auth.localUser();
      try {
        current = await services.auth.restore();
      } catch {
        if (active)
          setSyncError(
            "Akun sekolah belum bisa dimuat. Kamu tetap bisa memakai profil lokal.",
          );
      }
      if (!active) return;
      setUser(current);
      setRecords(services.progress.listLocal());
      setAssignments(services.assignments.listLocal());
      setReady(true);
      if (!current) return;
      try {
        const [remoteAssignments, remoteRecords] = await Promise.all([
          services.assignments.loadRemote(current),
          services.progress.loadRemote(current),
        ]);
        if (!active) return;
        if (remoteAssignments) setAssignments(remoteAssignments);
        if (remoteRecords) setRecords(remoteRecords);
      } catch {
        if (active)
          setSyncError(
            "Data sekolah belum tersinkron. Periksa koneksi; hasil lokal tetap tersedia.",
          );
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, [services]);

  function auth(current: User) {
    services.auth.saveLocal(current);
    setUser(current);
    Promise.all([
      services.assignments.loadRemote(current),
      services.progress.loadRemote(current),
    ])
      .then(([remoteAssignments, remoteRecords]) => {
        if (remoteAssignments) setAssignments(remoteAssignments);
        if (remoteRecords) setRecords(remoteRecords);
      })
      .catch(() =>
        setSyncError("Data sekolah belum tersinkron. Periksa koneksimu."),
      );
  }

  async function logout() {
    await services.auth.signOut();
    window.location.assign("/");
  }

  async function saveProfile(updated: User) {
    await services.auth.updateProfile(updated);
    setUser(updated);
  }

  async function saveAssignment(assignment: Assignment) {
    await services.assignments.save(assignment, user);
    setAssignments(services.assignments.listLocal());
  }

  async function complete(experiment: Experiment, runtime: Runtime) {
    const record = createRecord(experiment, runtime, user);
    services.progress.saveLocal(record);
    services.runtimes.clear(experiment.id);
    setRecords(services.progress.listLocal());
    try {
      await services.progress.saveRemote(record, user);
    } catch {
      setSyncError(
        "Hasil tersimpan di browser, tetapi belum tersinkron ke sekolah. Periksa koneksimu.",
      );
    }
  }

  return {
    user,
    records,
    assignments,
    ready,
    syncError,
    dismissSyncError: () => setSyncError(""),
    auth,
    logout,
    saveProfile,
    saveAssignment,
    complete,
  };
}
