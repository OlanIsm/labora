"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/infrastructure/api";
import type { User } from "../model";
import type { ClassRoom } from "@contracts/laboratory";
type Membership = {
  school_id: string;
  role: string;
  schools: { name: string };
};
export function EnrollmentSettings({
  user,
  onRefresh,
}: {
  user: User;
  onRefresh: (user: User) => void;
}) {
  const [members, setMembers] = useState<Membership[]>([]),
    [classes, setClasses] = useState<ClassRoom[]>([]);
  const [school, setSchool] = useState(user.schoolId || ""),
    [name, setName] = useState(""),
    [className, setClassName] = useState(""),
    [token, setToken] = useState("");
  const [link, setLink] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Membership[]>("/memberships"),
      apiFetch<ClassRoom[]>("/classes"),
    ])
      .then(([m, c]) => {
        if (active) {
          setMembers(m);
          setClasses(c);
          setSchool(user.schoolId || m[0]?.school_id || "");
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [user.id, user.schoolId]);
  async function perform(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await work();
      const [profile, m, c] = await Promise.all([
        apiFetch<User>("/me"),
        apiFetch<Membership[]>("/memberships"),
        apiFetch<ClassRoom[]>("/classes"),
      ]);
      setMembers(m);
      setClasses(c);
      setSchool(profile.schoolId || "");
      onRefresh(profile);
      setMessage(success);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Belum tersimpan. Coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="settings-section">
      <h2>Sekolah & kelas</h2>
      <p>
        Bergabung dengan kode dari guru, atau buat ruang sekolah untuk mengajar.
      </p>
      {message && <p role="status">{message}</p>}
      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          void perform(
            () =>
              apiFetch("/invitations/accept", {
                method: "POST",
                body: JSON.stringify({ token }),
              }),
            "Kamu berhasil bergabung.",
          );
        }}
      >
        <label>
          Kode undangan
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            maxLength={100}
            autoComplete="off"
          />
        </label>
        <button className="button primary" disabled={busy}>
          Gabung kelas
        </button>
      </form>
      <details>
        <summary>Buat ruang sekolah untuk mengajar</summary>
        <form
          className="settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            void perform(
              () =>
                apiFetch("/schools", {
                  method: "POST",
                  body: JSON.stringify({ name }),
                }),
              "Ruang sekolah berhasil dibuat.",
            );
          }}
        >
          <label>
            Nama sekolah / ruang guru
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </label>
          <button className="button ghost" disabled={busy}>
            Buat ruang sekolah
          </button>
        </form>
      </details>
      {members.length > 0 && (
        <ul>
          {members.map((m) => (
            <li key={m.school_id}>
              {m.schools.name} · {m.role === "teacher" ? "Guru" : "Siswa"}
            </li>
          ))}
        </ul>
      )}
      {user.role === "teacher" && (
        <>
          <form
            className="settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              void perform(
                () =>
                  apiFetch("/classes", {
                    method: "POST",
                    body: JSON.stringify({ schoolId: school, name: className }),
                  }),
                "Kelas berhasil dibuat.",
              );
            }}
          >
            <label>
              Sekolah
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                required
              >
                {members
                  .filter((m) => m.role === "teacher")
                  .map((m) => (
                    <option value={m.school_id} key={m.school_id}>
                      {m.schools.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Nama kelas
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                maxLength={80}
              />
            </label>
            <button className="button primary" disabled={busy}>
              Buat kelas
            </button>
          </form>
          {classes
            .filter((c) => c.teacherId === user.id)
            .map((c) => (
              <div className="assignment-row" key={c.id}>
                <span>
                  <strong>{c.name}</strong>
                </span>
                <button
                  className="button ghost small"
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      const i = await apiFetch<{ token: string }>(
                        "/invitations",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            schoolId: c.schoolId,
                            classId: c.id,
                            maxUses: 100,
                          }),
                        },
                      );
                      setLink(i.token);
                    }, "Kode berlaku 7 hari. Bagikan hanya kepada siswa kelas ini.")
                  }
                >
                  Buat kode undangan
                </button>
              </div>
            ))}
          {link && (
            <label>
              Kode undangan siswa
              <input
                value={link}
                readOnly
                onFocus={(e) => e.target.select()}
                aria-label="Kode undangan siswa"
              />
            </label>
          )}
        </>
      )}
    </section>
  );
}
