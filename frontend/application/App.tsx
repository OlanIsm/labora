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
import { useCatalog } from "@/features/experiments/index";
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
import { Progress, Result, AccountResult } from "@/features/progress/ui";
import { SettingsPage } from "@/features/settings/ui";
import { subjects } from "@/shared/subjects";
import { resultPath } from "@/shared/routes";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ArrowLeft, FlaskConical, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { resolveRouteContext } from "./routeContext";
import { applicationServices } from "./services";
import { useApplicationState } from "./useApplicationState";
import { AccountContext } from "@/shared/accountContext";

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
  const {
    experiments,
    getExperiment,
    error: catalogError,
  } = useCatalog(user?.mode === "account");
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
  else if (["/login", "/register", "/forgot-password"].includes(pathname))
    content = (
      <Auth key={pathname} gateway={applicationServices.auth} onAuth={auth} />
    );
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
      <SettingsPage
        user={user}
        onSave={saveProfile}
        onLogout={logout}
        onRefresh={auth}
      />
    );
  else if (
    isSandbox &&
    ["chemistry", "physics", "biology", "free"].includes(segments[1])
  )
    content = (
      <Sandbox
        key={`${user?.id || user?.email || "guest"}:${segments[1]}`}
        discipline={segments[1] as Discipline}
      />
    );
  else if (pathname === "/fisika") content = <PhysicsSimulationList />;
  else if (physicsSimulation) {
    const Simulation = physicsSimulation.component;
    content = (
      <Simulation
        key={`${user?.id || user?.email || "guest"}:${physicsSimulation.id}`}
      />
    );
  } else if (pathname === "/challenges")
    content = (
      <div className="challenges-page">
        <section className="challenges-banner chemistry">
          <div className="challenges-banner-copy">
            <h1>Tantangan</h1>
            <p>
              Aktivitas lama dan tugas kelas tetap tersedia di sini, termasuk
              hasil dan skor lama. Eksperimen bebas tidak memerlukan langkah
              atau kuis.
            </p>
            <Link href="/sandbox/chemistry" className="button primary">
              <ArrowLeft size={22} /> Kembali ke eksperimen bebas
            </Link>
          </div>
          <Image
            src="/challenge-flask.svg"
            width={320}
            height={270}
            alt=""
            className="challenges-banner-art"
            priority
          />
        </section>
        {subjects.map((subject) => (
          <section className="challenge-subject" key={subject.id}>
            <div className="section-heading">
              <h2>{subject.name}</h2>
            </div>
            <div className="experiment-grid">
              {experiments
                .filter((e) => e.subject === subject.id)
                .map((e) => (
                  <ExperimentCard
                    key={e.id}
                    exp={e}
                    record={records.find((r) => r.experimentId === e.id)}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
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
    content = (
      <Sandbox
        key={`${user?.id || user?.email || "guest"}:${exp.subject}`}
        discipline={exp.subject}
      />
    );
  else if (segments[0] === "challenges" && segments[1] === "run" && exp)
    content = (
      <Lab
        key={`${user?.id || user?.email || "guest"}:${exp.id}:${assignment?.id || "practice"}`}
        exp={exp}
        assignment={assignment}
        runtimes={applicationServices.runtimes}
        accountId={user?.mode === "account" ? user.id : undefined}
        onComplete={async (runtime, result) => {
          await complete(exp, runtime, result);
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
  else if (pathname === "/progress" && search.get("result"))
    content = (
      <AccountResult
        key={`${user?.id || "guest"}:${search.get("result")}`}
        id={search.get("result")!}
      />
    );
  else if (pathname === "/progress")
    content = (
      <Progress key={user?.id || user?.email || "guest"} records={records} />
    );
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
    content = (
      <Builder onSave={saveAssignment} account={user?.mode === "account"} />
    );
  else if (segments[0] === "teacher" && segments[1] === "results")
    content = (
      <AssignmentResults
        assignment={assignments.find((a) => a.id === segments[2])}
        records={records}
        account={user?.mode === "account"}
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
    <AccountContext.Provider value={user || {}}>
      <Shell
        user={user}
        assignments={assignments}
        records={records}
        onLogout={logout}
        wide={
          segments[0] === "lab" ||
          (segments[0] === "challenges" && segments[1] === "run") ||
          isSandbox ||
          !!physicsSimulation
        }
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
        {catalogError && (
          <p className="sync-error" role="alert">
            Katalog belum tersinkron: {catalogError}
          </p>
        )}
        {pathname === "/dashboard" &&
          search.get("recovery") === "1" &&
          user?.mode === "account" && (
            <p role="status" className="sync-error">
              Email pemulihan terverifikasi.{" "}
              <Link href="/settings">Atur kata sandi baru di Settings</Link>.
            </p>
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
    </AccountContext.Provider>
  );
}
