"use client";

import type { User } from "@/features/auth/model";
import type { Assignment } from "@/features/assignments/model";
import type { RecordEntry } from "@/features/progress/model";
import { AppHeader } from "./AppHeader";
import { Logo } from "@/shared/ui/Logo";
import {
  Beaker,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Home,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Shell({
  children,
  user,
  assignments,
  records,
  onLogout,
  wide = false,
}: {
  children: React.ReactNode;
  user: User | null;
  assignments: Assignment[];
  records: RecordEntry[];
  onLogout: () => Promise<void>;
  wide?: boolean;
}) {
  const pathname = usePathname() || "/";
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    // Restore the selected sidebar after a full page reload.
    try {
      const selected =
        sessionStorage.getItem("labora-sidebar-pinned") === "true";
      setPinned(selected);
      setExpanded(selected);
    } catch {}
  }, []);
  function keepSidebarOpen() {
    setExpanded(true);
    setPinned(true);
    try {
      sessionStorage.setItem("labora-sidebar-pinned", "true");
    } catch {}
  }
  function closeSidebar() {
    setExpanded(false);
    setPinned(false);
    try {
      sessionStorage.removeItem("labora-sidebar-pinned");
    } catch {}
  }
  const marketing = ["/", "/login", "/register", "/forgot-password"].includes(
    pathname,
  );
  const nav = [
    { href: "/dashboard", label: "Beranda", icon: Home },
    { href: "/laboratories", label: "Eksperimen", icon: FlaskConical },
    { href: "/challenges", label: "Tantangan", icon: Beaker },
    { href: "/assignments", label: "Tugas", icon: BookOpen },
    { href: "/progress", label: "Progres", icon: Target },
    ...(user?.role === "teacher"
      ? [{ href: "/teacher", label: "Ruang guru", icon: GraduationCap }]
      : []),
  ];
  const active = (href: string) =>
    pathname === href ||
    (href === "/challenges" && pathname.startsWith("/challenges/")) ||
    (href === "/laboratories" &&
      (pathname === "/kimia" ||
        pathname === "/sandbox/chemistry" ||
        pathname === "/fisika" ||
        pathname.startsWith("/fisika/") ||
        ["/laboratories/", "/experiments/", "/lab/", "/results/"].some(
          (prefix) => pathname.startsWith(prefix),
        ))) ||
    (href === "/teacher" && pathname.startsWith("/teacher/"));
  if (marketing)
    return (
      <div className="marketing-shell">
        <a className="skip-link" href="#main">
          Langsung ke isi
        </a>
        <header className="site-header">
          <div className="header-inner">
            <Logo />
            <nav aria-label="Navigasi utama">
              <Link href="/#labs">Pilihan lab</Link>
              <Link href="/#learning">Cara belajar</Link>
            </nav>
            <div className="header-actions">
              {user ? (
                <Link href="/dashboard" className="button primary">
                  Buka beranda
                </Link>
              ) : (
                <>
                  <Link href="/login" className="login-link">
                    Masuk
                  </Link>
                  <Link href="/dashboard" className="button primary">
                    Coba Labora
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main id="main" className="marketing-page">
          {children}
        </main>
        <footer className="footer">
          <Logo />
          <p>Belajar sains dengan mencoba.</p>
          <span>Untuk rasa ingin tahu yang nggak berhenti di buku.</span>
        </footer>
      </div>
    );
  return (
    <div className={`app-shell ${expanded ? "" : "sidebar-collapsed"}`}>
      <a className="skip-link" href="#main">
        Langsung ke isi
      </a>
      <aside
        className="app-sidebar"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => {
          if (!pinned) setExpanded(false);
        }}
        onFocusCapture={() => setExpanded(true)}
        onBlurCapture={(event) => {
          if (!pinned && !event.currentTarget.contains(event.relatedTarget))
            setExpanded(false);
        }}
      >
        <div className="sidebar-brand">
          <Logo href="/dashboard" />
        </div>
        <nav id="app-navigation" aria-label="Navigasi aplikasi">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              prefetch={true}
              aria-current={active(n.href) ? "page" : undefined}
              className={active(n.href) ? "active" : ""}
              aria-label={n.label}
              title={!expanded ? n.label : undefined}
              onClick={keepSidebarOpen}
            >
              <n.icon size={21} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-frame" onClickCapture={closeSidebar}>
        <AppHeader
          user={user}
          pathname={pathname}
          assignments={assignments}
          records={records}
          onLogout={onLogout}
        />
        <main id="main" className={`page ${wide ? "wide" : ""}`}>
          {children}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Navigasi ponsel">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            prefetch={true}
            aria-current={active(n.href) ? "page" : undefined}
            className={active(n.href) ? "active" : ""}
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
