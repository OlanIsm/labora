"use client";

import type { Assignment } from "@/features/assignments/model";
import type { User } from "@/features/auth/model";
import { getExperiment } from "@/features/experiments/index";
import { path } from "@/shared/routes";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ArrowRight, BookOpen, Plus } from "lucide-react";
import Link from "next/link";

export function Assignments({
  assignments,
  user,
}: {
  assignments: Assignment[];
  user: User | null;
}) {
  const list =
    user?.role === "teacher"
      ? assignments
      : assignments.filter(
          (a) => !user?.className || a.className === user.className,
        );
  return (
    <>
      <div className="page-heading">
        <h1>{user?.role === "teacher" ? "Tugas kelas" : "Tugas dari guru"}</h1>
        <p>
          {user?.role === "teacher"
            ? "Kelola aktivitas yang sudah kamu siapkan."
            : "Pilih tugas, baca arahan guru, lalu mulai eksperimennya."}
        </p>
        {user?.role === "teacher" && (
          <Link href="/teacher/new" className="button primary">
            <Plus size={18} />
            Buat tugas
          </Link>
        )}
      </div>
      {list.length ? (
        list.map((a) => (
          <Link
            href={
              user?.role === "teacher"
                ? `/teacher/results/${a.id}`
                : `${path(a.experimentId)}?assignment=${a.id}`
            }
            className="assignment-row"
            key={a.id}
          >
            <BookOpen size={25} />
            <span>
              <strong>{a.title}</strong>
              <small>
                {getExperiment(a.experimentId)?.title} · {a.className}
              </small>
            </span>
            <span className="row-action">
              {user?.role === "teacher" ? "Lihat hasil" : "Buka tugas"}{" "}
              <ArrowRight size={18} />
            </span>
          </Link>
        ))
      ) : (
        <EmptyState
          title="Belum ada tugas"
          href="/laboratories"
          action="Jelajahi lab"
        >
          Sambil menunggu tugas dari guru, kamu bisa mencoba eksperimen sendiri.
        </EmptyState>
      )}
    </>
  );
}
