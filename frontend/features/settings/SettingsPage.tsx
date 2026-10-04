"use client";

import type { User } from "@/features/auth/model";
import { CheckCircle2, LogOut, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { isDemoUser } from "@/shared/identity";
import { EnrollmentSettings } from "@/features/auth/ui";
import { apiFetch } from "@/shared/infrastructure/api";

export default function SettingsPage({
  user,
  onSave,
  onLogout,
  onRefresh,
}: {
  user: User | null;
  onSave: (user: User) => Promise<void>;
  onLogout: () => Promise<void>;
  onRefresh?: (user: User) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [className, setClassName] = useState(user?.className || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Isi namamu sebelum menyimpan.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await onSave({ ...user, name: trimmedName, className: className.trim() });
      setName(trimmedName);
      setMessage("Pengaturan akun tersimpan.");
    } catch {
      setError(
        "Pengaturan belum tersimpan. Periksa koneksimu, lalu coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await onLogout();
    } catch {
      setError("Belum bisa keluar akun. Coba lagi.");
      setBusy(false);
    }
  }

  return (
    <div className="settings-page">
      <div className="page-heading">
        <h1>Settings</h1>
        <p>Atur profil dan akun Labora kamu.</p>
      </div>
      {error && (
        <p className="settings-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="settings-success" role="status">
          <CheckCircle2 size={18} />
          {message}
        </p>
      )}
      {user ? (
        <>
          <section className="settings-section">
            <div className="settings-section-heading">
              <span className="settings-icon">
                <UserRound size={23} />
              </span>
              <div>
                <h2>Profil kamu</h2>
                <p>Nama ini tampil di ruang eksplorasimu.</p>
              </div>
            </div>
            <form onSubmit={save} className="settings-form">
              <label htmlFor="profile-name">
                Nama
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={64}
                  required
                  autoComplete="name"
                />
              </label>
              <label htmlFor="profile-class">
                Kelas atau kelompok
                <input
                  id="profile-class"
                  value={className}
                  readOnly={!isDemoUser(user)}
                  onChange={(e) => setClassName(e.target.value)}
                  maxLength={80}
                  placeholder="Contoh: Kelas XI IPA"
                />
              </label>
              <div className="settings-account-info">
                <div>
                  <span>Email</span>
                  <strong>{user.email}</strong>
                </div>
                <div>
                  <span>Peran</span>
                  <strong>{user.role === "teacher" ? "Guru" : "Siswa"}</strong>
                </div>
              </div>
              <button className="button primary" type="submit" disabled={busy}>
                <Save size={18} />
                {busy ? "Menyimpan…" : "Simpan pengaturan"}
              </button>
            </form>
          </section>
          {user.mode === "account" && onRefresh && (
            <EnrollmentSettings user={user} onRefresh={onRefresh} />
          )}
          {user.mode === "account" && <PasswordSettings />}
          {user.mode === "account" && onRefresh && (
            <AvatarSettings onRefresh={onRefresh} />
          )}
          <section className="settings-section settings-session">
            <div>
              <h2>Sesi akun</h2>
              <p>
                Keluar dari akun di perangkat ini. Catatan eksperimen tetap
                tersimpan.
              </p>
            </div>
            <button
              className="button settings-logout"
              onClick={logout}
              disabled={busy}
            >
              <LogOut size={18} />
              Keluar akun
            </button>
          </section>
        </>
      ) : (
        <section className="settings-section">
          <h2>Kamu sedang menjelajah sebagai tamu.</h2>
          <p>Masuk untuk mengatur profil dan menyimpan progres ke akunmu.</p>
          <Link href="/login" className="button primary">
            Masuk ke akun
          </Link>
        </section>
      )}
    </div>
  );
}

function PasswordSettings() {
  const [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <section className="settings-section">
      <h2>Kata sandi</h2>
      <form
        className="settings-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            await apiFetch("/auth/password", {
              method: "POST",
              body: JSON.stringify({ password }),
            });
            setPassword("");
            setMessage("Kata sandi berhasil diubah.");
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Kata sandi belum berubah.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Kata sandi baru
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {message && <p role="status">{message}</p>}
        <button className="button primary" disabled={busy}>
          Ubah kata sandi
        </button>
      </form>
    </section>
  );
}

function AvatarSettings({ onRefresh }: { onRefresh: (user: User) => void }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <section className="settings-section">
      <h2>Foto profil</h2>
      <p>PNG, JPEG, atau WebP. Maksimal 2 MB.</p>
      <label>
        Unggah foto
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2097152) {
              setMessage("Ukuran foto maksimal 2 MB.");
              return;
            }
            setBusy(true);
            try {
              const form = new FormData();
              form.set("avatar", file);
              const user = await apiFetch<User>("/me/avatar", {
                method: "POST",
                body: form,
              });
              onRefresh(user);
              setMessage("Foto profil tersimpan.");
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Foto belum dapat diunggah.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
