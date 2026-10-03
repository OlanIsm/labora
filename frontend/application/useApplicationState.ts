"use client";

import type { Assignment } from "@/features/assignments/model";
import type { User } from "@/features/auth/model";
import type { Experiment, Runtime } from "@/features/experiments/model";
import { createRecord } from "@/features/progress/index";
import type { RecordEntry } from "@/features/progress/model";
import { useEffect, useRef, useState } from "react";
import type { ApplicationServices } from "./services";
import { isDemoUser } from "@/shared/identity";
import { ApiError } from "@/shared/infrastructure/api";

export function useApplicationState(services: ApplicationServices) {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState("");
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    const run = ++generation.current;
    async function initialize() {
      let current = services.auth.localUser();
      try {
        current = await services.auth.restore();
      } catch {
        if (active && run === generation.current)
          setSyncError(
            "Akun sekolah belum bisa dimuat. Kamu tetap bisa memakai profil lokal.",
          );
      }
      if (!active || run !== generation.current) return;
      setUser(current);
      setRecords(isDemoUser(current) ? services.progress.listLocal() : []);
      setAssignments(
        isDemoUser(current) ? services.assignments.listLocal() : [],
      );
      setReady(true);
      if (!current || isDemoUser(current)) return;
      try {
        const [remoteAssignments, remoteRecords] = await Promise.all([
          services.assignments.loadRemote(current),
          services.progress.loadRemote(current),
        ]);
        if (!active || run !== generation.current) return;
        if (remoteAssignments) setAssignments(remoteAssignments);
        if (remoteRecords) setRecords(remoteRecords);
      } catch {
        if (active && run === generation.current)
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
    const run = ++generation.current;
    services.auth.saveLocal(isDemoUser(current) ? current : null);
    setUser(current);
    setSyncError("");
    setRecords(isDemoUser(current) ? services.progress.listLocal() : []);
    setAssignments(isDemoUser(current) ? services.assignments.listLocal() : []);
    if (isDemoUser(current)) return;
    Promise.all([
      services.assignments.loadRemote(current),
      services.progress.loadRemote(current),
    ])
      .then(([remoteAssignments, remoteRecords]) => {
        if (run !== generation.current) return;
        if (remoteAssignments) setAssignments(remoteAssignments);
        if (remoteRecords) setRecords(remoteRecords);
      })
      .catch(() => {
        if (run === generation.current)
          setSyncError("Data sekolah belum tersinkron. Periksa koneksimu.");
      });
  }

  async function logout() {
    await services.auth.signOut();
    generation.current++;
    setUser(null);
    setAssignments([]);
    setRecords([]);
    window.location.assign("/");
  }

  async function saveProfile(updated: User) {
    await services.auth.updateProfile(updated);
    setUser(updated);
  }

  async function saveAssignment(assignment: Assignment) {
    await services.assignments.save(assignment, user);
    setAssignments(
      isDemoUser(user)
        ? services.assignments.listLocal()
        : (await services.assignments.loadRemote(user!)) || [],
    );
  }

  async function complete(experiment: Experiment, runtime: Runtime) {
    if (!isDemoUser(user))
      throw new ApiError(
        "FORBIDDEN",
        "Gunakan sesi eksperimen akun sekolah untuk menyimpan hasil resmi.",
        403,
      );
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
