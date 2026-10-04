"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/infrastructure/api";

type Member = { student_id: string; profiles: { display_name: string } | null };

export function RecipientSelector({
  classId,
  studentIds,
  onChange,
}: {
  classId: string;
  studentIds: string[] | undefined;
  onChange: (ids: string[] | undefined) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const selected = studentIds !== undefined;
  useEffect(() => {
    if (!classId || !selected) return;
    let active = true;
    setMembers([]);
    setLoading(true);
    setError("");
    apiFetch<Member[]>(`/classes/${classId}/members`)
      .then((data) => {
        if (active) setMembers(data);
      })
      .catch(() => {
        if (active) setError("Daftar siswa belum dapat dimuat. Coba lagi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [classId, selected, retry]);
  if (!classId) return null;
  return (
    <fieldset className="assignment-recipients">
      <legend>Penerima tugas</legend>
      <label>
        <input
          type="radio"
          name="audience"
          checked={!selected}
          onChange={() => onChange(undefined)}
        />{" "}
        Seluruh kelas
      </label>
      <label>
        <input
          type="radio"
          name="audience"
          checked={selected}
          onChange={() => onChange([])}
        />{" "}
        Siswa tertentu
      </label>
      {selected && (
        <>
          <p>
            {studentIds.length} siswa dipilih. Hanya siswa yang dipilih menerima
            tugas ini.
          </p>
          {loading ? (
            <p role="status">Memuat siswa…</p>
          ) : error ? (
            <p role="alert">
              {error}{" "}
              <button
                type="button"
                className="button ghost"
                onClick={() => setRetry((v) => v + 1)}
              >
                Coba lagi
              </button>
            </p>
          ) : !members.length ? (
            <p>
              Belum ada siswa dalam kelas ini. Undang siswa melalui pengaturan.
            </p>
          ) : (
            <div className="assignment-member-list">
              {members.map((member) => (
                <label key={member.student_id}>
                  <input
                    type="checkbox"
                    checked={studentIds.includes(member.student_id)}
                    onChange={(event) =>
                      onChange(
                        event.target.checked
                          ? [...studentIds, member.student_id]
                          : studentIds.filter((id) => id !== member.student_id),
                      )
                    }
                  />
                  {member.profiles?.display_name || "Siswa"}
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </fieldset>
  );
}
