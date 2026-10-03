"use client";

import { Shell } from "@/application/Shell";
import {
  AssignmentResults,
  Assignments,
  Builder,
  Teacher,
} from "@/features/assignments/ui";
import { Auth } from "@/features/auth/ui";
import { Dashboard } from "@/features/dashboard/ui";
import { experiments, getExperiment } from "@/features/experiments/index";
import { Detail, ExperimentCard, Lab } from "@/features/experiments/ui";
import type { Discipline } from "@/features/laboratory/model";
import {
  ChemistryLabList,
  LaboratorySelection,
  PhysicsSimulationList,
  physicsSimulations,
  Sandbox,
} from "@/features/laboratory/ui";
import { Landing } from "@/features/marketing/ui";
import { Progress, Result } from "@/features/progress/ui";
import { SettingsPage } from "@/features/settings/ui";
import { resultPath } from "@/shared/routes";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FlaskConical, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { resolveRouteContext } from "./routeContext";
import { applicationServices } from "./services";
import { useApplicationState } from "./useApplicationState";

export default function App() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const search = useSearchParams();
  const {
    user,
    records,
    assignments,
    ready,
    syncError,
    dismissSyncError,
    auth,
    logout,
    saveProfile,
    saveAssignment,
    complete,
  } = useApplicationState(applicationServices);
  const { segments, isSandbox, isPublic, physicsSimulationId, experimentId } =
    resolveRouteContext(
      pathname,
      physicsSimulations.map((sim) => sim.id),
    );
  const physicsSimulation = physicsSimulations.find(
    (sim) => sim.id === physicsSimulationId,
  );
  useEffect(() => {
    if (ready && !user && !isPublic) router.replace("/login");
  }, [ready, user, isPublic, router]);
  const exp = getExperiment(experimentId);
  const assignment = assignments.find((a) => a.id === search.get("assignment"));
  let content: React.ReactNode;
  if (pathname === "/") content = <Landing />;
  else if (pathname === "/kimia") content = <ChemistryLabList />;
  else if (pathname === "/login" || pathname === "/register")
    content = <Auth gateway={applicationServices.auth} onAuth={auth} />;
  else if (pathname === "/dashboard")
    content = (
      <Dashboard
        user={user}
        records={records}
        assignments={assignments}
        runtimes={applicationServices.runtimes}
      />
    );
  else if (pathname === "/settings")
    content = (
      <SettingsPage user={user} onSave={saveProfile} onLogout={logout} />
    );
  else if (
    isSandbox &&
    ["chemistry", "physics", "biology", "free"].includes(segments[1])
  )
    content = (
      <Sandbox key={segments[1]} discipline={segments[1] as Discipline} />
    );
  else if (pathname === "/fisika") content = <PhysicsSimulationList />;
  else if (physicsSimulation) {
    const Simulation = physicsSimulation.component;
    content = <Simulation key={physicsSimulation.id} />;
  } else if (pathname === "/challenges")
    content = (
      <>
        <div className="page-heading">
          <h1>Tantangan</h1>
          <p>
            Aktivitas lama dan tugas kelas tetap tersedia di sini, termasuk
            hasil dan skor lama. Eksperimen bebas tidak memerlukan langkah atau
            kuis.
          </p>
          <Link href="/sandbox/chemistry" className="button primary">
            Kembali ke eksperimen bebas
          </Link>
        </div>
        <div className="experiment-grid">
          {experiments.map((e) => (
            <ExperimentCard
              key={e.id}
              exp={e}
              record={records.find((r) => r.experimentId === e.id)}
            />
          ))}
        </div>
      </>
    );
  else if (pathname === "/laboratories" || pathname === "/experiments")
    content = (
      <LaboratorySelection
        recommendation={
          <ExperimentCard
            exp={experiments[0]}
            record={records.find(
              (record) => record.experimentId === experiments[0].id,
            )}
          />
        }
      />
    );
  else if (segments[0] === "experiments" && exp)
    content = <Detail exp={exp} assignment={assignment} />;
  else if (segments[0] === "lab" && exp)
    content = <Sandbox key={exp.subject} discipline={exp.subject} />;
  else if (segments[0] === "challenges" && segments[1] === "run" && exp)
    content = (
      <Lab
        key={exp.id}
        exp={exp}
        assignment={assignment}
        runtimes={applicationServices.runtimes}
        onComplete={async (runtime) => {
          await complete(exp, runtime);
          router.push(resultPath(exp.id));
        }}
      />
    );
  else if (segments[0] === "results" && exp)
    content = (
      <Result
        exp={exp}
        record={records.find((r) => r.experimentId === exp.id)}
      />
    );
  else if (pathname === "/progress") content = <Progress records={records} />;
  else if (pathname === "/assignments")
    content = <Assignments assignments={assignments} user={user} />;
  else if (segments[0] === "teacher" && user?.role !== "teacher")
    content = (
      <EmptyState
        title="Halaman khusus guru"
        href="/login"
        action="Masuk sebagai guru"
      >
        Gunakan akun guru untuk membuat tugas dan melihat hasil kelas.
      </EmptyState>
    );
  else if (pathname === "/teacher/new")
    content = <Builder onSave={saveAssignment} />;
  else if (segments[0] === "teacher" && segments[1] === "results")
    content = (
      <AssignmentResults
        assignment={assignments.find((a) => a.id === segments[2])}
        records={records}
      />
    );
  else if (pathname === "/teacher")
    content = <Teacher assignments={assignments} records={records} />;
  else
    content = (
      <EmptyState
        title="Halaman ini tidak ditemukan"
        href={user ? "/dashboard" : "/"}
        action="Kembali ke beranda"
      >
        Pilih halaman lain lewat navigasi.
      </EmptyState>
    );
  return (
    <Shell
      user={user}
      assignments={assignments}
      records={records}
      onLogout={logout}
      wide={segments[0] === "lab" || isSandbox || !!physicsSimulation}
    >
      {syncError && (
        <div className="sync-error" role="alert">
          <span>{syncError}</span>
          <button
            onClick={dismissSyncError}
            className="icon-button"
            aria-label="Tutup pesan"
          >
            <X size={20} />
          </button>
        </div>
      )}
      {ready && (user || isPublic) ? (
        content
      ) : (
        <div className="loading-page" role="status">
          <FlaskConical size={34} />
          <h2>Menyiapkan lab kamu...</h2>
          <p>Alat dan eksperimen sedang dimuat.</p>
        </div>
      )}
    </Shell>
  );
}
