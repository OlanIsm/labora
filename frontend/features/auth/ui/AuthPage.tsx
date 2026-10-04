"use client";

import type { User } from "@/features/auth/model";
import { experiments, initialRuntime } from "@/features/experiments/index";
import { Visual } from "@/features/experiments/ui";
import { FlaskConical, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthGateway } from "../model";
import { ApiError } from "@/shared/infrastructure/api";
import { apiFetch } from "@/shared/infrastructure/api";

export function Auth({
  onAuth,
  gateway,
}: {
  onAuth: (user: User) => void;
  gateway: AuthGateway;
}) {
  const router = useRouter();
  const authPath = usePathname();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const mode =
    authPath === "/register"
      ? "register"
      : authPath === "/forgot-password"
        ? "recover"
        : "login";
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      if (mode === "recover") {
        const result = await apiFetch<{ message: string }>("/auth/recover", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setMessage(result.message);
        return;
      }
      const profile: User = {
        name: name.trim() || email.split("@")[0],
        email,
        role,
        className: className.trim(),
      };
      const user = await gateway.authenticate({ mode, profile, password });
      if (!user) {
        setMessage(
          "Cek emailmu untuk mengonfirmasi akun. Setelah itu, masuk di sini.",
        );
        return;
      }
      onAuth(user);
      router.push("/dashboard");
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? Object.values(error.fieldErrors || {})
              .flat()
              .join(" ") || error.message
          : "Belum bisa masuk. Periksa email dan kata sandi, lalu coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function demo(r: "student" | "teacher") {
    setBusy(true);
    setMessage("");
    const profile: User = {
      name: r === "teacher" ? "Guru Demo" : "Siswa Demo",
      email: `demo-${r}@labora.local`,
      role: r,
      className: "Kelas Demo",
      mode: "demo",
    };
    try {
      onAuth(gateway.enterDemo ? await gateway.enterDemo(profile) : profile);
      router.push("/dashboard");
    } catch {
      setMessage("Mode demo belum bisa dibuka. Coba lagi sebentar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <h2>
          Rasa penasaran?
          <br />
          Bawa ke lab.
        </h2>
        <p>
          Kamu nggak harus tahu semuanya sebelum mulai. Panduannya ada di setiap
          langkah.
        </p>
        <Visual exp={experiments[0]} state={initialRuntime()} preview />
      </section>
      <section className="auth-form">
        <h1>
          {mode === "register"
            ? "Buat akun Labora"
            : mode === "recover"
              ? "Lupa password?"
              : "Masuk ke Labora"}
        </h1>
        <p>
          {mode === "register"
            ? "Siapkan ruang untuk eksperimenmu."
            : mode === "recover"
              ? "Masukkan email akunmu untuk menerima tautan pemulihan."
              : "Lanjutkan eksperimen dan lihat progresmu."}
        </p>
        <div className="demo-login" hidden={mode === "recover"}>
          <strong>Mau mencoba dulu?</strong>
          <p>
            Mode demo tidak perlu akun. Data demo tersimpan hanya di browser
            ini.
          </p>
          <div>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => demo("student")}
            >
              <FlaskConical size={19} />
              Coba sebagai siswa
            </button>
            <button
              className="button ghost"
              disabled={busy}
              onClick={() => demo("teacher")}
            >
              <GraduationCap size={19} />
              Coba sebagai guru
            </button>
          </div>
        </div>
        {mode !== "recover" && (
          <div className="auth-divider">
            {gateway.configured
              ? "atau gunakan akunmu"
              : "atau buat profil lokal di browser ini"}
          </div>
        )}
        {!gateway.configured && (
          <p className="local-note">
            Login sekolah belum terhubung. Formulir ini hanya membuat profil
            lokal, bukan akun online.
          </p>
        )}
        {mode === "register" && !gateway.configured && (
          <div className="role-toggle">
            <button
              aria-pressed={role === "student"}
              className={role === "student" ? "active" : ""}
              onClick={() => setRole("student")}
            >
              Saya siswa
            </button>
            <button
              aria-pressed={role === "teacher"}
              className={role === "teacher" ? "active" : ""}
              onClick={() => setRole("teacher")}
            >
              Saya guru
            </button>
          </div>
        )}
        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Nama
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kamu"
                />
              </label>
              {!gateway.configured && (
                <label>
                  Kelas atau kelompok
                  <input
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Contoh: VIII A"
                  />
                </label>
              )}
            </>
          )}
          <label>
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email kamu"
            />
          </label>
          {mode !== "recover" && (
            <label>
              Kata sandi
              <input
                required
                type="password"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                minLength={gateway.configured ? 8 : 6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  gateway.configured
                    ? "Minimal 8 karakter"
                    : "Minimal 6 karakter"
                }
              />
            </label>
          )}
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          <button
            className="button primary full"
            disabled={busy || (mode === "recover" && !gateway.configured)}
          >
            {busy
              ? "Sedang memproses..."
              : mode === "recover"
                ? "Kirim tautan pemulihan"
                : !gateway.configured
                  ? "Buka profil lokal"
                  : mode === "register"
                    ? "Buat akun"
                    : "Masuk"}
          </button>
        </form>
        {mode === "recover" ? (
          <p className="auth-switch">
            <Link href="/login">Kembali ke login</Link>
          </p>
        ) : (
          <div className="auth-switch">
            <span>
              {mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
              <Link href={mode === "register" ? "/login" : "/register"}>
                {mode === "register" ? "Masuk" : "Daftar di sini"}
              </Link>
            </span>
            {gateway.configured && mode === "login" && (
              <span className="auth-switch-recovery">
                <span className="auth-switch-divider" aria-hidden="true" />
                <Link href="/forgot-password">Lupa password</Link>
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
