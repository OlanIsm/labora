"use client";

import type { User } from "@/features/auth/model";
import {
  ChevronDown,
  GraduationCap,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export function AccountMenu({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    container.current
      ?.querySelector<HTMLAnchorElement>(".header-account-menu a")
      ?.focus();
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function logout() {
    setBusy(true);
    setError("");
    try {
      await onLogout();
    } catch {
      setError("Belum bisa keluar. Coba lagi sebentar.");
      setBusy(false);
    }
  }

  return (
    <div className="header-account" ref={container}>
      <button
        ref={trigger}
        className="header-account-trigger"
        aria-label={`Menu akun ${user?.name || "Tamu"}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
      >
        <span className="header-profile-picture">
          <Image
            src={user?.avatarUrl || "/mascot/biology_cat.png"}
            unoptimized
            alt=""
            width={64}
            height={64}
          />
        </span>
        <span className="header-account-name">
          <strong>{user?.name || "Tamu"}</strong>
          <small>
            {user?.role === "teacher"
              ? "Guru"
              : user
                ? "Siswa"
                : "Jelajahi Labora"}
          </small>
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="header-account-menu"
          id={menuId}
          aria-label="Pilihan akun"
        >
          <div className="header-account-summary">
            <strong>{user?.name || "Selamat datang!"}</strong>
            <small>{user?.email || "Mulai dengan rasa penasaranmu."}</small>
          </div>
          <Link href="/settings" onClick={() => setOpen(false)}>
            <Settings size={19} />
            Settings
          </Link>
          {user?.role === "teacher" && (
            <Link href="/teacher" onClick={() => setOpen(false)}>
              <GraduationCap size={19} />
              Ruang guru
            </Link>
          )}
          {user ? (
            <button className="header-signout" onClick={logout} disabled={busy}>
              <LogOut size={19} />
              {busy ? "Sedang keluar…" : "Keluar akun"}
            </button>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>
              <UserRound size={19} />
              Masuk / daftar
            </Link>
          )}
          {error && (
            <p className="header-account-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
