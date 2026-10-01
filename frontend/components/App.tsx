"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Discipline } from "@/lib/sandbox/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Beaker,
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Droplets,
  FlaskConical,
  GraduationCap,
  GripVertical,
  Home,
  Leaf,
  Lightbulb,
  LogOut,
  Microscope,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Target,
  Waves,
  X,
  Zap,
} from "lucide-react";
import {
  Experiment,
  experiments,
  getExperiment,
  Item,
  Subject,
} from "@/lib/data";
import { act, answer, initialRuntime, Runtime, score } from "@/lib/engine";
import { storage, Assignment, RecordEntry, User } from "@/lib/storage";
import {
  dilution,
  ohmsLaw,
  pendulumPeriod,
  projectileRange,
} from "@/lib/science";
import { supabase } from "@/lib/supabase";
import { loadCloud, saveCloudAssignment, saveCloudResult } from "@/lib/cloud";
const Sandbox = dynamic(() => import("./sandbox/Sandbox"), {
  ssr: false,
  loading: () => <p role="status">Memuat meja eksperimen...</p>,
});

const subjects = [
  {
    id: "chemistry" as Subject,
    name: "Kimia",
    description: "Larutan, warna, dan reaksi",
    question: "Kenapa larutan bisa berubah warna?",
    icon: Beaker,
  },
  {
    id: "physics" as Subject,
    name: "Fisika",
    description: "Gerak, energi, dan listrik",
    question: "Apa yang membuat lampu menyala?",
    icon: Atom,
  },
  {
    id: "biology" as Subject,
    name: "Biologi",
    description: "Sel, tumbuhan, dan kehidupan",
    question: "Ada apa di balik sehelai daun?",
    icon: Leaf,
  },
];
const path = (id: string) => `/experiments/${id}`;
const labPath = (id: string) => `/challenges/run/${id}`;
const resultPath = (id: string) => `/results/${id}`;
const date = (value: string) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const actionLabel = (action: string, exp: Experiment) =>
  action === "place"
    ? "Letakkan"
    : action === "pour"
      ? "Tuangkan"
      : action === "add"
        ? "Tambahkan"
        : exp.visual === "projectile"
          ? "Luncurkan"
          : exp.visual === "pendulum"
            ? "Lepaskan"
            : "Amati dengan";

function Icon({ name, size = 26 }: { name: string; size?: number }) {
  const Component =
    (
      {
        beaker: Beaker,
        dropper: Droplets,
        bottle: FlaskConical,
        drop: Droplets,
        battery: Zap,
        resistor: SlidersHorizontal,
        wire: Waves,
        lamp: Lightbulb,
        meter: Target,
        slide: BookOpen,
        leaf: Leaf,
        microscope: Microscope,
        cylinder: FlaskConical,
        launcher: Target,
        ball: Atom,
        stand: Target,
        bag: BookOpen,
      } as Record<string, typeof Beaker>
    )[name] || Beaker;
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Labora, beranda">
      <span className="logo-mark">
        <FlaskConical size={24} />
      </span>
      labora<span className="logo-dot">.</span>
    </Link>
  );
}

function Shell({
  children,
  user,
  onLogout,
  wide = false,
}: {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  wide?: boolean;
}) {
  const pathname = usePathname() || "/";
  const marketing = ["/", "/login", "/register"].includes(pathname);
  const nav = [
    { href: "/dashboard", label: "Beranda", icon: Home },
    { href: "/laboratories", label: "Eksperimen bebas", icon: FlaskConical },
    { href: "/challenges", label: "Tantangan", icon: Beaker },
    { href: "/assignments", label: "Tugas", icon: BookOpen },
    { href: "/progress", label: "Progres", icon: Target },
    ...(user?.role === "teacher"
      ? [{ href: "/teacher", label: "Ruang guru", icon: GraduationCap }]
      : []),
  ];
  const active = (href: string) =>
    pathname === href ||
    (href === "/laboratories" &&
      ["/laboratories/", "/experiments/", "/lab/", "/results/"].some((prefix) =>
        pathname.startsWith(prefix),
      )) ||
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
                  <Link href="/login" className="button primary">
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
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Langsung ke isi
      </a>
      <aside className="app-sidebar">
        <Logo href="/dashboard" />
        <nav aria-label="Navigasi aplikasi">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className={active(n.href) ? "active" : ""}
            >
              <n.icon size={21} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <FlaskConical size={28} />
          <strong>Mulai dari satu pertanyaan.</strong>
          <p>Coba, amati, lalu cari tahu jawabannya.</p>
        </div>
        <div className="sidebar-profile">
          <span className="avatar">
            {(user?.name || "T").charAt(0).toUpperCase()}
          </span>
          <span>
            <strong>{user?.name || "Tamu"}</strong>
            <small>{user?.role === "teacher" ? "Guru" : "Siswa"}</small>
          </span>
          <button
            onClick={onLogout}
            className="icon-button"
            aria-label="Keluar akun"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>
      <div className="app-frame">
        <header className="app-topbar">
          <div className="mobile-logo">
            <Logo href="/dashboard" />
          </div>
          <span className="topbar-context">
            {pathname.startsWith("/lab/")
              ? "Laboratorium virtual"
              : pathname.startsWith("/teacher")
                ? "Ruang guru"
                : "Ruang eksplorasi kamu"}
          </span>
          <div className="topbar-profile">
            <span>
              {user?.role === "teacher" ? "Guru" : "Siswa"} ·{" "}
              {user?.name || "Tamu"}
            </span>
            <button
              className="icon-button mobile-logout"
              onClick={onLogout}
              aria-label="Keluar akun"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main id="main" className={`page ${wide ? "wide" : ""}`}>
          {children}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Navigasi ponsel">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
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

function SubjectBadge({ subject }: { subject: Subject }) {
  const s = subjects.find((x) => x.id === subject)!;
  return (
    <span className={`subject-badge ${subject}`}>
      <s.icon size={15} aria-hidden="true" />
      {s.name}
    </span>
  );
}

function EmptyState({
  title,
  children,
  href,
  action,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <BookOpen size={28} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{children}</p>
      {href && (
        <Link href={href} className="button primary">
          {action}
        </Link>
      )}
    </div>
  );
}

function ExperimentCard({
  exp,
  record,
}: {
  exp: Experiment;
  record?: RecordEntry;
}) {
  return (
    <Link href={path(exp.id)} className={`experiment-card ${exp.subject}`}>
      <div className={`experiment-art ${exp.subject}`}>
        <Visual exp={exp} state={initialRuntime()} preview />
        <span className="preview-label">Pratinjau simulasi</span>
      </div>
      <div className="experiment-card-copy">
        <div className="experiment-card-meta">
          <SubjectBadge subject={exp.subject} />
          <span>
            <Clock3 size={15} />
            {exp.duration} menit
          </span>
        </div>
        <h3>{exp.title}</h3>
        <p>{exp.subtitle}</p>
        <span className="card-link">
          {record ? (
            <>
              <CheckCircle2 size={17} /> Selesai · Coba lagi
            </>
          ) : (
            <>
              Lihat eksperimen <ArrowRight size={17} />
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

function LabChoices() {
  return (
    <div className="lab-choice-grid">
      {subjects.map((s) => (
        <Link
          key={s.id}
          href={`/sandbox/${s.id}`}
          className={`lab-choice ${s.id}`}
        >
          <div className="lab-choice-head">
            <s.icon size={40} strokeWidth={1.7} />
            <span>
              {experiments.filter((e) => e.subject === s.id).length} eksperimen
            </span>
          </div>
          <h3>{s.name}</h3>
          <p>{s.question}</p>
          <span className="card-link">
            Jelajahi {s.name.toLowerCase()} <ArrowRight size={18} />
          </span>
        </Link>
      ))}
    </div>
  );
}

function Landing() {
  const [indicator, setIndicator] = useState(false);
  const preview = {
    ...initialRuntime(),
    placed: ["beaker"],
    step: indicator ? 3 : 2,
  };
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Sains lebih seru
            <br />
            kalau kamu <span>coba.</span>
          </h1>
          <p>
            Campur larutan, nyalakan rangkaian, atau intip sel lewat mikroskop.
            Di Labora, kamu bisa mencoba eksperimen langsung dari layar.
          </p>
          <Link href="/sandbox/chemistry" className="button primary large">
            Mulai eksperimen <ArrowRight size={20} />
          </Link>
          <p className="hero-footnote">
            Untuk SMA/MA kelas X–XII. Eksperimen bebas tanpa akun.
          </p>
          <div className="hero-subjects">
            <span>
              <Beaker size={18} />
              Kimia
            </span>
            <span>
              <Atom size={18} />
              Fisika
            </span>
            <span>
              <Leaf size={18} />
              Biologi
            </span>
          </div>
        </div>
        <div className="hero-experiment">
          <div className="demo-heading">
            <span>
              <Beaker size={19} /> Coba dulu di sini
            </span>
            <span>Simulasi pH</span>
          </div>
          <Visual exp={experiments[0]} state={preview} />
          <div className="demo-observation" aria-live="polite">
            <strong>
              {indicator
                ? "Warnanya berubah. Larutan ini asam!"
                : "Larutan ini asam atau basa?"}
            </strong>
            <p>
              {indicator
                ? "Indikator berwarna merah menunjukkan pH sekitar 3."
                : "Tambahkan indikator pH untuk mencari tahu."}
            </p>
          </div>
          <button
            className={`button ${indicator ? "ghost" : "demo-action"}`}
            onClick={() => setIndicator(!indicator)}
          >
            {indicator ? <RotateCcw size={18} /> : <Droplets size={18} />}
            {indicator ? "Ulangi percobaan" : "Tambahkan indikator"}
          </button>
        </div>
      </section>
      <section id="labs" className="landing-labs">
        <div className="section-heading">
          <div>
            <h2>Rasa penasaranmu mau ke mana?</h2>
            <p>Pilih bidang sains, lalu temukan eksperimen pertamamu.</p>
          </div>
        </div>
        <LabChoices />
      </section>
      <section id="learning" className="learning-section">
        <div>
          <h2>Nggak harus langsung tahu jawabannya.</h2>
          <p>
            Setiap eksperimen punya panduan. Kamu boleh mencoba, salah, dan
            mengulang sampai paham.
          </p>
          <Link href="/login" className="text-link">
            Coba dengan akun demo <ArrowRight size={18} />
          </Link>
        </div>
        <dl className="learning-list">
          <div>
            <dt>
              <GripVertical size={22} />
              Pakai alatnya
            </dt>
            <dd>Geser alat ke meja, atau pilih lalu tekan tombol tindakan.</dd>
          </div>
          <div>
            <dt>
              <Lightbulb size={22} />
              Buntu? Buka petunjuk
            </dt>
            <dd>
              Ada bantuan di setiap langkah, tanpa langsung memberi jawaban.
            </dd>
          </div>
          <div>
            <dt>
              <CircleHelp size={22} />
              Pahami hasilnya
            </dt>
            <dd>
              Jawab pertanyaan singkat dan baca penjelasan dari pengamatanmu.
            </dd>
          </div>
          <div>
            <dt>
              <GraduationCap size={22} />
              Belajar bareng kelas
            </dt>
            <dd>Guru bisa menyiapkan tugas dari eksperimen yang tersedia.</dd>
          </div>
        </dl>
      </section>
      <section className="landing-close">
        <div>
          <h2>Pertanyaan berikutnya, kamu yang tentukan.</h2>
          <p>Mulai dari eksperimen sederhana. Lihat apa yang berubah.</p>
        </div>
        <Link href="/login" className="button primary large">
          Pilih eksperimenmu
        </Link>
      </section>
    </>
  );
}

function Dashboard({
  user,
  records,
  assignments,
}: {
  user: User | null;
  records: RecordEntry[];
  assignments: Assignment[];
}) {
  const [resume, setResume] = useState<Experiment | null>(null);
  useEffect(() => {
    setResume(
      experiments.find((e) => {
        const runtime = storage.runtime(e.id);
        return runtime && runtime.step > 0 && runtime.step < e.steps.length;
      }) || null,
    );
  }, []);
  const recommended =
    resume ||
    experiments.find((e) => !records.some((r) => r.experimentId === e.id)) ||
    experiments[0];
  const recent = records.slice(0, 3);
  const tasks =
    user?.role === "teacher"
      ? assignments
      : assignments.filter(
          (a) => !user?.className || a.className === user.className,
        );
  return (
    <>
      <div className="page-heading">
        <h1>
          Hai{user ? `, ${user.name.split(" ")[0]}` : ""}! Mau coba apa hari
          ini?
        </h1>
        <p>
          Mulai dengan satu eksperimen. Ikuti langkahnya, lalu amati hasilnya.
        </p>
      </div>
      <section className={`next-experiment ${recommended.subject}`}>
        <div className="next-copy">
          <h2>{recommended.title}</h2>
          <p>{recommended.subtitle}</p>
          <div className="inline-meta">
            <span>
              <Clock3 size={16} />
              {recommended.duration} menit
            </span>
            <span>{recommended.steps.length} langkah berpandu</span>
          </div>
          <Link
            href={resume ? labPath(recommended.id) : path(recommended.id)}
            className="button primary"
          >
            {resume ? "Lanjutkan eksperimen" : "Coba eksperimen ini"}{" "}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="next-preview">
          <Visual exp={recommended} state={initialRuntime()} preview />
          <span className="preview-label">Pratinjau simulasi</span>
        </div>
      </section>
      <div className="progress-summary">
        <span>
          <CheckCircle2 size={20} />
          <strong>
            {records.length} dari {experiments.length}
          </strong>{" "}
          eksperimen selesai
        </span>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Eksperimen selesai"
          aria-valuenow={records.length}
          aria-valuemin={0}
          aria-valuemax={experiments.length}
        >
          <span
            style={{ width: `${(records.length / experiments.length) * 100}%` }}
          />
        </div>
        <Link href="/progress" className="text-link">
          Lihat progres
        </Link>
      </div>
      <section className="home-section">
        <div className="section-heading">
          <div>
            <h2>Jelajahi lab</h2>
            <p>Pilih pertanyaan yang bikin kamu penasaran.</p>
          </div>
        </div>
        <LabChoices />
      </section>
      <div className="dashboard-lower">
        <section>
          <div className="section-heading">
            <h2>
              {user?.role === "teacher" ? "Tugas kelasmu" : "Tugas dari guru"}
            </h2>
            <Link href="/assignments" className="text-link">
              Semua tugas
            </Link>
          </div>
          {tasks.length ? (
            tasks.slice(0, 3).map((a) => (
              <Link
                href={
                  user?.role === "teacher"
                    ? `/teacher/results/${a.id}`
                    : `${path(a.experimentId)}?assignment=${a.id}`
                }
                className="list-row"
                key={a.id}
              >
                <BookOpen size={22} />
                <span>
                  <strong>{a.title}</strong>
                  <small>{a.className}</small>
                </span>
                <ArrowRight size={18} />
              </Link>
            ))
          ) : (
            <EmptyState title="Belum ada tugas">
              Tugas kelas akan muncul di sini. Kamu tetap bisa mencoba lab
              sendiri.
            </EmptyState>
          )}
        </section>
        <section>
          <div className="section-heading">
            <h2>Terakhir kamu selesaikan</h2>
          </div>
          {recent.length ? (
            recent.map((r) => (
              <Link
                href={resultPath(r.experimentId)}
                className="list-row"
                key={r.experimentId}
              >
                <CheckCircle2 size={22} />
                <span>
                  <strong>{getExperiment(r.experimentId)?.title}</strong>
                  <small>
                    {date(r.completedAt)} · Nilai {r.score}%
                  </small>
                </span>
                <ArrowRight size={18} />
              </Link>
            ))
          ) : (
            <EmptyState title="Mulai catatan penemuanmu">
              Selesaikan eksperimen pertama untuk melihat hasilnya di sini.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}

function LaboratorySelection() {
  return (
    <>
      <div className="page-heading">
        <h1>Pilih lab, ikuti rasa penasaranmu.</h1>
        <p>Nggak perlu alat sungguhan. Semua eksperimen dilakukan di layar.</p>
      </div>
      <LabChoices />
      <section className="home-section">
        <div className="section-heading">
          <div>
            <h2>Baru mulai? Coba yang ini.</h2>
            <p>Kenali larutan lewat perubahan warna.</p>
          </div>
        </div>
        <ExperimentCard exp={experiments[0]} />
      </section>
    </>
  );
}

function Library({
  subject,
  records,
}: {
  subject: Subject;
  records: RecordEntry[];
}) {
  const [query, setQuery] = useState("");
  const s = subjects.find((x) => x.id === subject)!;
  const list = experiments.filter(
    (e) =>
      e.subject === subject &&
      `${e.title} ${e.subtitle}`
        .toLocaleLowerCase("id")
        .includes(query.trim().toLocaleLowerCase("id")),
  );
  return (
    <>
      <Link href="/laboratories" className="back-link">
        <ArrowLeft size={18} />
        Semua lab
      </Link>
      <div className={`laboratory-heading ${subject}`}>
        <div>
          <h1>Lab {s.name}</h1>
          <p>{s.description}. Coba sendiri dan lihat apa yang terjadi.</p>
        </div>
        <s.icon size={70} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className="section-heading library-heading">
        <div>
          <h2>Pilih eksperimenmu</h2>
          <p>
            {experiments.filter((e) => e.subject === subject).length} eksperimen
            dengan panduan langkah demi langkah.
          </p>
        </div>
        <label className="search-box">
          <Search size={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari eksperimen..."
            aria-label="Cari eksperimen"
          />
          {query && (
            <button
              className="icon-button"
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian"
            >
              <X size={17} />
            </button>
          )}
        </label>
      </div>
      <div className="experiment-grid">
        {list.map((exp) => (
          <ExperimentCard
            exp={exp}
            key={exp.id}
            record={records.find((r) => r.experimentId === exp.id)}
          />
        ))}
      </div>
      {!list.length && (
        <EmptyState title="Eksperimennya belum ketemu">
          Coba kata lain, atau{" "}
          <button className="inline-button" onClick={() => setQuery("")}>
            hapus pencarian
          </button>{" "}
          untuk melihat semuanya.
        </EmptyState>
      )}
    </>
  );
}

function Assignments({
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

function Detail({
  exp,
  assignment,
}: {
  exp: Experiment;
  assignment?: Assignment;
}) {
  return (
    <>
      <Link href={`/laboratories/${exp.subject}`} className="back-link">
        <ArrowLeft size={18} />
        Kembali ke lab
      </Link>
      <section className="detail-hero">
        <div>
          <SubjectBadge subject={exp.subject} />
          <h1>{exp.title}</h1>
          <p className="detail-subtitle">{exp.subtitle}</p>
          <p>{exp.objective}</p>
          <div className="inline-meta">
            <span>
              <Clock3 size={17} />
              Sekitar {exp.duration} menit
            </span>
            <span>
              <BookOpen size={17} />
              {exp.steps.length} langkah
            </span>
          </div>
          <Link
            href={`${labPath(exp.id)}${assignment ? `?assignment=${assignment.id}` : ""}`}
            className="button primary large"
          >
            {assignment ? "Mulai tugas" : "Masuk dan coba"}{" "}
            <ArrowRight size={19} />
          </Link>
          <small className="detail-reassurance">
            Alat sudah tersedia. Kamu bisa mengulang kapan saja.
          </small>
        </div>
        <div className={`detail-visual ${exp.subject}`}>
          <Visual exp={exp} state={initialRuntime()} preview />
          <span className="preview-label">Pratinjau hasil simulasi</span>
        </div>
      </section>
      {assignment && (
        <div className="assignment-note">
          <GraduationCap size={24} />
          <div>
            <strong>{assignment.title}</strong>
            <p>{assignment.instructions}</p>
          </div>
        </div>
      )}
      <div className="detail-sections">
        <section>
          <h2>Apa yang akan kamu pelajari?</h2>
          <p>{exp.objective}</p>
          <h3>Sains di baliknya</h3>
          <p>{exp.theory}</p>
        </section>
        <section>
          <h2>Alat dan bahan</h2>
          <div className="materials-list">
            <div>
              <h3>Alat</h3>
              {exp.equipment.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            <div>
              <h3>Bahan</h3>
              {exp.materials.length ? (
                exp.materials.map((x) => <span key={x}>{x}</span>)
              ) : (
                <span>Tidak perlu bahan tambahan</span>
              )}
            </div>
          </div>
        </section>
      </div>
      <details className="step-preview">
        <summary>
          Intip langkah eksperimennya <span>{exp.steps.length} langkah</span>
        </summary>
        <ol>
          {exp.steps.map((s, i) => (
            <li key={i}>{s.instruction}</li>
          ))}
        </ol>
      </details>
    </>
  );
}

function DraggableItem({
  item,
  selected,
  onSelect,
  needed,
}: {
  item: Item;
  selected: boolean;
  onSelect: () => void;
  needed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.id });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      aria-label={`${item.name}${needed ? ", untuk langkah ini" : ""}. Pilih atau geser ke meja.`}
      aria-pressed={selected}
      className={`inventory-item ${selected ? "selected" : ""} ${needed ? "needed" : ""} ${isDragging ? "dragging" : ""}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
      }}
    >
      <span className="inventory-item-status">
        {needed ? "Pakai sekarang" : <GripVertical size={15} />}
      </span>
      <Icon name={item.icon} size={30} />
      <span>{item.name}</span>
    </button>
  );
}

function ChemistryVisual({
  exp,
  state,
  preview = false,
  dragging,
}: {
  exp: Experiment;
  state: Runtime;
  preview?: boolean;
  dragging?: string | null;
}) {
  const current = exp.steps[state.step];
  const active = !preview && ["pour", "add"].includes(current?.action || "");
  const { setNodeRef, isOver } = useDroppable({
    id: "vessel",
    disabled: !active,
  });
  const ready = preview || state.step >= 3;
  const filled = preview || state.step >= 2;
  const visible =
    preview ||
    state.placed.includes(exp.visual === "dilution" ? "cylinder" : "beaker");
  const observation =
    exp.visual === "ph"
      ? ready
        ? "pH 3 · Asam"
        : "pH belum diketahui"
      : exp.visual === "mixture"
        ? ready
          ? "Endapan terbentuk"
          : "Belum ada endapan"
        : ready
          ? "0,5 M"
          : filled
            ? "1,0 M"
            : "Belum diisi";
  return (
    <div
      className={`visual chemistry-visual ${exp.visual} ${preview ? "preview" : ""}`}
    >
      <div
        ref={setNodeRef}
        className={`vessel-target ${visible ? "visible" : ""} ${active && dragging ? "drop-ready" : ""} ${isOver ? "drop-over" : ""}`}
      >
        <div
          className={`science-beaker ${filled ? "filled" : ""} ${ready ? "reacted" : ""}`}
        >
          <div className="beaker-liquid" />
          <span className="beaker-mark one" />
          <span className="beaker-mark two" />
          <span className="beaker-mark three" />
          {exp.visual === "mixture" && ready && (
            <div className="precipitate">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
        {!visible && !preview && (
          <span className="vessel-placeholder">Tempat gelasmu</span>
        )}
      </div>
      <div className="science-readout" aria-live="polite">
        <strong>{observation}</strong>
        <span>
          {exp.visual === "ph"
            ? ready
              ? "Merah setelah diberi indikator"
              : filled
                ? "Larutan A · belum diberi indikator"
                : visible
                  ? "Gelas siap · tuangkan Larutan A"
                  : "Letakkan gelas beker untuk mulai"
            : exp.visual === "mixture"
              ? ready
                ? "Larutan berubah keruh"
                : filled
                  ? "Larutan A masih jernih"
                  : visible
                    ? "Gelas siap · tuangkan Larutan A"
                    : "Letakkan gelas beker untuk mulai"
              : ready
                ? "Volume bertambah, konsentrasi turun"
                : "Amati konsentrasi larutan"}
        </span>
      </div>
    </div>
  );
}

function Visual({
  exp,
  state,
  preview = false,
  dragging,
}: {
  exp: Experiment;
  state: Runtime;
  preview?: boolean;
  dragging?: string | null;
}) {
  if (["ph", "mixture", "dilution"].includes(exp.visual))
    return (
      <ChemistryVisual
        exp={exp}
        state={state}
        preview={preview}
        dragging={dragging}
      />
    );
  const has = (id: string) => state.placed.includes(id) || preview;
  if (exp.visual === "circuit") {
    const complete = ["battery", "resistor", "lamp", "wire"].every(has);
    return (
      <div className="visual circuit-visual">
        <svg
          viewBox="0 0 520 260"
          role="img"
          aria-label={
            complete
              ? "Rangkaian tertutup dengan lampu menyala"
              : "Rangkaian listrik belum lengkap"
          }
        >
          <path
            d="M90 60 H420 V200 H90 Z"
            fill="none"
            stroke={complete ? "#806500" : "#8793a7"}
            strokeWidth="4"
            strokeDasharray={complete ? undefined : "8 8"}
          />
          {complete && !preview && (
            <path
              className="current-flow"
              d="M90 60 H420 V200 H90 Z"
              fill="none"
              stroke="#e0ad00"
              strokeWidth="5"
              strokeDasharray="12 30"
            />
          )}
          <rect
            x="66"
            y="100"
            width="48"
            height="56"
            rx="8"
            fill={has("battery") ? "#ffdf70" : "#e9eef5"}
            stroke="#806500"
            strokeWidth="2"
          />
          <text x="90" y="136" textAnchor="middle" fontSize="24" fill="#1f2430">
            +
          </text>
          <rect
            x="205"
            y="44"
            width="90"
            height="32"
            rx="7"
            fill={has("resistor") ? "#ffeeb2" : "#e9eef5"}
            stroke="#806500"
            strokeWidth="2"
          />
          <path
            d="M217 60 l8 -8 10 16 10 -16 10 16 10 -16 8 8"
            fill="none"
            stroke="#806500"
            strokeWidth="2"
          />
          <circle
            cx="420"
            cy="130"
            r="33"
            fill={complete ? "#ffd84d" : "#e9eef5"}
            stroke="#806500"
            strokeWidth="3"
          />
          <path
            d="M407 117 L433 143 M433 117 L407 143"
            stroke="#806500"
            strokeWidth="3"
          />
          <text x="90" y="235" textAnchor="middle">
            Baterai
          </text>
          <text x="250" y="105" textAnchor="middle">
            Resistor
          </text>
          <text x="420" y="190" textAnchor="middle">
            Lampu
          </text>
        </svg>
        <div className="science-readout">
          <strong>
            {complete
              ? ohmsLaw(state.voltage, state.resistance).toFixed(2)
              : "0,00"}{" "}
            A
          </strong>
          <span>
            {complete
              ? "Rangkaian tertutup · arus mengalir"
              : "Pasang komponen dan sambungkan kabel"}
          </span>
        </div>
      </div>
    );
  }
  if (exp.visual === "cell" || exp.visual === "blood") {
    const ready = state.observed || preview;
    return (
      <div className="visual biology-visual">
        <div className={`microscope-field ${ready ? "focused" : ""}`}>
          <div
            className="cell-pattern"
            style={{
              transform: `scale(${state.zoom === 400 ? 2.2 : state.zoom === 100 ? 1.4 : 1})`,
            }}
          >
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={exp.visual === "blood" ? "blood-cell" : "plant-cell"}
              >
                <span />
              </div>
            ))}
          </div>
          {!ready && (
            <span className="microscope-wait">
              {has("microscope")
                ? "Fokuskan mikroskop untuk mengamati"
                : "Siapkan preparat terlebih dahulu"}
            </span>
          )}
        </div>
        <div className="science-readout">
          <strong>{state.zoom}×</strong>
          <span>
            {ready
              ? exp.visual === "blood"
                ? "Sampel sel darah"
                : "Sampel sel tumbuhan"
              : "Menunggu pengamatan"}
          </span>
        </div>
      </div>
    );
  }
  if (exp.visual === "projectile") {
    const range = projectileRange(state.speed, state.angle);
    return (
      <div className="visual projectile-visual">
        <svg
          viewBox="0 0 580 290"
          role="img"
          aria-label="Lintasan gerak parabola"
        >
          <path d="M30 245 H550" stroke="#8793a7" strokeWidth="2" />
          <path
            d={`M40 245 Q ${Math.min(270, range * 8)} ${state.launched || preview ? 20 : 245} ${Math.min(520, range * 14 + 40)} 245`}
            fill="none"
            stroke="#806500"
            strokeWidth="4"
            strokeDasharray="8 6"
          />
          <circle cx="40" cy="245" r="14" fill="#806500" />
          <circle
            cx={state.launched || preview ? Math.min(520, range * 14 + 40) : 40}
            cy="245"
            r="10"
            fill="#d45689"
          />
        </svg>
        <div className="science-readout">
          <strong>
            {state.launched || preview ? range.toFixed(1) : "Belum diluncurkan"}
            {state.launched || preview ? " m" : ""}
          </strong>
          <span>Jangkauan ideal, tanpa hambatan udara</span>
        </div>
      </div>
    );
  }
  if (exp.visual === "pendulum")
    return (
      <div className="visual pendulum-visual">
        <div className="pendulum-frame">
          <div
            className={state.step >= 3 && !preview ? "pendulum-swing" : ""}
            style={{ animationDuration: `${pendulumPeriod(state.length)}s` }}
          >
            <div className="pendulum-string" />
            <div className="pendulum-ball" />
          </div>
        </div>
        <div className="science-readout">
          <strong>
            {has("bob")
              ? `${pendulumPeriod(state.length).toFixed(2)} s`
              : "Belum dipasang"}
          </strong>
          <span>Periode: waktu untuk satu ayunan penuh</span>
        </div>
      </div>
    );
  return (
    <div className="visual plant-visual">
      <div className="plant-specimen">
        <Leaf size={120} strokeWidth={1.3} />
        {has("bag") && (
          <div className="plant-bag">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
      <div className="science-readout">
        <strong>
          {has("bag") ? "Tetes air terlihat" : "Siapkan tumbuhan"}
        </strong>
        <span>Amati uap air dari daun</span>
      </div>
    </div>
  );
}

function Workspace({
  exp,
  state,
  dragging,
  dropError,
  interaction,
}: {
  exp: Experiment;
  state: Runtime;
  dragging: string | null;
  dropError: boolean;
  interaction: number;
}) {
  const current = exp.steps[state.step];
  const { setNodeRef, isOver } = useDroppable({
    id: "workspace",
    disabled: exp.subject === "chemistry" && current?.action !== "place",
  });
  return (
    <div
      ref={setNodeRef}
      className={`workspace ${exp.subject} ${isOver ? "drop-over" : ""} ${dropError ? "drop-rejected" : ""}`}
    >
      <div className="workspace-heading">
        <span>Meja eksperimen</span>
        <SubjectBadge subject={exp.subject} />
      </div>
      <div
        key={interaction}
        className={`workspace-scene ${interaction ? (dropError ? "scene-retry" : "scene-action") : ""}`}
      >
        <Visual exp={exp} state={state} dragging={dragging} />
        {interaction > 0 &&
          !dropError &&
          state.step > 0 &&
          !exp.steps[state.step - 1]?.question && (
            <span
              className={`lab-tool-motion action-${exp.steps[state.step - 1]?.action}`}
              aria-hidden="true"
            >
              <Icon
                name={
                  exp.items.find(
                    (item) => item.id === exp.steps[state.step - 1]?.item,
                  )?.icon || "beaker"
                }
                size={36}
              />
              {exp.subject === "chemistry" &&
                exp.steps[state.step - 1]?.action !== "place" && (
                  <span className="pour-drops">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
            </span>
          )}
        {interaction > 0 && state.step === exp.steps.length && (
          <span className="lab-finish-mark" aria-hidden="true">
            <CheckCircle2 size={32} />
          </span>
        )}
      </div>
      {dragging && (
        <div className="drop-invite">
          {exp.subject === "chemistry" && current?.action !== "place"
            ? "Geser ke dalam gelas"
            : "Lepaskan di meja ini"}
        </div>
      )}
    </div>
  );
}

function Lab({
  exp,
  assignment,
  onComplete,
}: {
  exp: Experiment;
  assignment?: Assignment;
  onComplete: (runtime: Runtime) => Promise<void>;
}) {
  const [state, setState] = useState<Runtime>(initialRuntime);
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interaction, setInteraction] = useState(0);
  const [feedbackError, setFeedbackError] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  useEffect(() => {
    setState(storage.runtime(exp.id) || initialRuntime());
    setHydrated(true);
  }, [exp.id]);
  useEffect(() => {
    if (hydrated) storage.saveRuntime(exp.id, state);
  }, [state, exp.id, hydrated]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => {
      if (drawerRef.current?.matches(":modal")) drawerRef.current.close();
      setMobile(media.matches);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const base = exp.steps[state.step];
  const stage = assignment?.stages[state.step];
  const current =
    base?.question && stage
      ? {
          ...base,
          question: {
            ...base.question,
            prompt: stage.question || base.question.prompt,
            options: stage.options,
            answer: stage.answer,
          },
        }
      : base;
  const needed = exp.items.find((i) => i.id === current?.item);
  const selectedItem = exp.items.find((i) => i.id === selected);
  const progress = Math.round((state.step / exp.steps.length) * 100);
  function flagError() {
    setFeedbackError(true);
  }
  function doAction(action: string, item: string) {
    setInteraction((n) => n + 1);
    if (current && (current.action !== action || current.item !== item))
      flagError();
    else setFeedbackError(false);
    setState((s) => {
      const prepared =
        exp.subject !== "chemistry" &&
        action !== "place" &&
        current?.item === item &&
        !s.placed.includes(item)
          ? act(exp, s, "place", item)
          : s;
      return act(exp, prepared, action, item);
    });
    setHint(false);
    setSelected(null);
  }
  function doAnswer(choice: number) {
    setInteraction((n) => n + 1);
    setFeedbackError(choice !== current?.question?.answer);
    setState((s) =>
      answer(
        {
          ...exp,
          steps: exp.steps.map((step, i) =>
            i === s.step && current ? current : step,
          ),
        },
        s,
        choice,
      ),
    );
    setHint(false);
  }
  function reset() {
    if (
      state.step &&
      !window.confirm("Mulai dari awal? Langkah eksperimen ini akan dihapus.")
    )
      return;
    setState(initialRuntime());
    setSelected(null);
    setHint(false);
    storage.clearRuntime(exp.id);
    setFeedbackError(false);
    setInteraction(0);
  }
  function drop(e: DragEndEvent) {
    setDragging(null);
    const item = String(e.active.id);
    if (exp.subject !== "chemistry") {
      if (e.over?.id === "workspace") doAction("place", item);
      return;
    }
    const target = current?.action === "place" ? "workspace" : "vessel";
    if (current?.item === item && e.over?.id === target)
      doAction(current.action, item);
    else {
      setState((s) => ({
        ...s,
        feedback:
          current?.item === item
            ? `Geser ${needed?.name.toLowerCase()} ${target === "workspace" ? "ke meja" : "ke dalam gelas"}. Kamu juga bisa memakai tombol tindakan.`
            : `Belum cocok. ${current?.instruction || "Eksperimen sudah selesai."}`,
      }));
      setInteraction((n) => n + 1);
      flagError();
    }
  }
  function select(id: string) {
    setSelected(id);
    setFeedbackError(false);
    const item = exp.items.find((item) => item.id === id);
    setState((s) => ({
      ...s,
      feedback:
        id === needed?.id
          ? `${item?.name} dipilih. Tekan tombol tindakan untuk memakainya.`
          : `${item?.name} dipilih. Langkah ini membutuhkan ${needed?.name.toLowerCase() || "jawaban dari pengamatanmu"}.`,
    }));
    if (mobile) drawerRef.current?.close();
  }
  const inventory = (
    <>
      <div className="inventory-heading">
        <h2>Alat & bahan</h2>
        {mobile && (
          <button
            className="icon-button"
            onClick={() => drawerRef.current?.close()}
            aria-label="Tutup alat dan bahan"
          >
            <X size={22} />
          </button>
        )}
      </div>
      <p className="inventory-help">
        Pilih yang berlabel “Pakai sekarang”, lalu tekan tombol tindakan. Kamu
        juga bisa menggesernya ke meja.
      </p>
      {(["tool", "material"] as const).map((kind) => (
        <div className="inventory-group" key={kind}>
          <h3>{kind === "tool" ? "Alat" : "Bahan"}</h3>
          <div className="inventory-grid">
            {exp.items
              .filter((i) => i.kind === kind)
              .map((item) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  needed={item.id === needed?.id}
                  selected={item.id === selected}
                  onSelect={() => select(item.id)}
                />
              ))}
          </div>
        </div>
      ))}
    </>
  );
  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDragging(String(e.active.id))}
      onDragCancel={() => setDragging(null)}
      onDragEnd={drop}
    >
      <div className="lab-shell">
        <div className="lab-bar">
          <Link
            href={path(exp.id)}
            className="back-link"
            aria-label="Tentang eksperimen"
          >
            <ArrowLeft size={19} />
            <span>Tentang eksperimen</span>
          </Link>
          <strong>{exp.title}</strong>
          <button onClick={reset} className="button ghost small">
            <RotateCcw size={17} />
            Ulangi
          </button>
        </div>
        <div className="lab-layout">
          <div className="lab-primary">
            <div className="lab-progress">
              <span>
                {current
                  ? `Langkah ${state.step + 1} dari ${exp.steps.length}`
                  : "Semua langkah selesai"}
              </span>
              <span>{progress}%</span>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Progres eksperimen"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            <section className="step-panel">
              <div className="step-panel-heading">
                {current && (
                  <button
                    className="hint-button"
                    aria-expanded={hint}
                    onClick={() => setHint(!hint)}
                  >
                    <Lightbulb size={18} />
                    {hint ? "Tutup petunjuk" : "Butuh petunjuk?"}
                  </button>
                )}
              </div>
              {current ? (
                <>
                  <h2>{stage?.instruction || current.instruction}</h2>
                  {assignment?.instructions && state.step === 0 && (
                    <p>{assignment.instructions}</p>
                  )}
                  {hint && (
                    <div className="hint-box">
                      <Lightbulb size={20} />
                      <span>{stage?.hint || current.hint}</span>
                    </div>
                  )}
                  {current.question ? (
                    <div className="question-block">
                      <h3>{current.question.prompt}</h3>
                      <div className="answer-grid">
                        {current.question.options.map((option, i) => (
                          <button key={i} onClick={() => doAnswer(i)}>
                            <span>{String.fromCharCode(65 + i)}</span>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="step-actions">
                      {needed && (
                        <button
                          className="button primary"
                          onClick={() => doAction(current.action, needed.id)}
                        >
                          <Icon name={needed.icon} size={19} />
                          {actionLabel(current.action, exp)}{" "}
                          {needed.name.toLowerCase()}
                        </button>
                      )}
                      <button
                        className="button ghost mobile-tools"
                        onClick={() => drawerRef.current?.showModal()}
                      >
                        Pilih alat lain
                      </button>
                      {selectedItem && selectedItem.id !== needed?.id && (
                        <button
                          className="button ghost"
                          onClick={() => doAction("place", selectedItem.id)}
                        >
                          Letakkan {selectedItem.name.toLowerCase()}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2>Pengamatanmu sudah lengkap!</h2>
                  <p>Baca penjelasannya dan lihat hasil pemahamanmu.</p>
                  <button
                    className="button primary"
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await onComplete(state);
                      } catch {
                        setState((s) => ({
                          ...s,
                          feedback:
                            "Hasil belum bisa disimpan. Coba tekan Lihat hasil lagi.",
                        }));
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? "Menyimpan hasil..." : "Lihat hasil eksperimen"}{" "}
                    <ArrowRight size={18} />
                  </button>
                </>
              )}
              <div
                className={`feedback-line ${feedbackError || state.answers[state.step - 1]?.correct === false ? "feedback-error" : ""}`}
                role="status"
              >
                {feedbackError ||
                state.answers[state.step - 1]?.correct === false ? (
                  <CircleHelp size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                )}
                <span>{state.feedback}</span>
              </div>
            </section>
            <Workspace
              exp={exp}
              state={state}
              dragging={dragging}
              dropError={feedbackError}
              interaction={interaction}
            />
            {[
              "circuit",
              "projectile",
              "pendulum",
              "cell",
              "blood",
              "dilution",
            ].includes(exp.visual) && (
              <div className="lab-controls">
                {exp.visual === "circuit" ? (
                  <>
                    <label>
                      Tegangan <strong>{state.voltage} V</strong>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={state.voltage}
                        onChange={(e) =>
                          setState((s) => ({ ...s, voltage: +e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Hambatan <strong>{state.resistance} Ω</strong>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={state.resistance}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            resistance: +e.target.value,
                          }))
                        }
                      />
                    </label>
                    <span className="formula">I = V / R</span>
                  </>
                ) : exp.visual === "cell" || exp.visual === "blood" ? (
                  <div className="zoom-control">
                    <span>Perbesaran</span>
                    {[40, 100, 400].map((z) => (
                      <button
                        key={z}
                        className={state.zoom === z ? "active" : ""}
                        aria-pressed={state.zoom === z}
                        onClick={() => setState((s) => ({ ...s, zoom: z }))}
                      >
                        {z}×
                      </button>
                    ))}
                  </div>
                ) : exp.visual === "projectile" ? (
                  <>
                    <label>
                      Sudut peluncuran <strong>{state.angle}°</strong>
                      <input
                        type="range"
                        min="15"
                        max="75"
                        value={state.angle}
                        onChange={(e) =>
                          setState((s) => ({ ...s, angle: +e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Kecepatan <strong>{state.speed} m/s</strong>
                      <input
                        type="range"
                        min="5"
                        max="20"
                        value={state.speed}
                        onChange={(e) =>
                          setState((s) => ({ ...s, speed: +e.target.value }))
                        }
                      />
                    </label>
                  </>
                ) : exp.visual === "pendulum" ? (
                  <label>
                    Panjang tali <strong>{state.length.toFixed(1)} m</strong>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={state.length}
                      onChange={(e) =>
                        setState((s) => ({ ...s, length: +e.target.value }))
                      }
                    />
                  </label>
                ) : (
                  <span>
                    Konsentrasi awal: 1,0 M · Setelah air ditambahkan:{" "}
                    {dilution(1, 10, 20).toFixed(1)} M
                  </span>
                )}
              </div>
            )}
            <details className="lab-checklist">
              <summary>
                Semua langkah eksperimen{" "}
                <span>
                  {state.step}/{exp.steps.length}
                </span>
              </summary>
              <ol>
                {exp.steps.map((step, i) => (
                  <li
                    key={i}
                    className={
                      i < state.step
                        ? "done"
                        : i === state.step
                          ? "current"
                          : ""
                    }
                  >
                    {i < state.step ? (
                      <Check size={17} />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                    {assignment?.stages[i]?.instruction || step.instruction}
                  </li>
                ))}
              </ol>
            </details>
          </div>
          <dialog
            ref={drawerRef}
            className="inventory"
            open={!mobile}
            aria-label="Alat dan bahan eksperimen"
          >
            {inventory}
          </dialog>
        </div>
      </div>
    </DndContext>
  );
}

function Result({ exp, record }: { exp: Experiment; record?: RecordEntry }) {
  if (!record)
    return (
      <EmptyState
        title="Belum ada hasil"
        href={labPath(exp.id)}
        action="Mulai eksperimen"
      >
        Selesaikan eksperimen untuk melihat pengamatan dan nilaimu.
      </EmptyState>
    );
  const s = score(exp, record.runtime);
  return (
    <>
      <section className={`result-hero ${exp.subject}`}>
        <div className="result-heading">
          <CheckCircle2 size={42} />
          <div>
            <h1>Kamu sudah mencobanya!</h1>
            <p>{exp.title}</p>
          </div>
        </div>
        <div className="result-score">
          <strong>{s.total}%</strong>
          <span>Nilai pemahamanmu</span>
        </div>
        <p className="result-concept">{exp.concept}</p>
        <div className="result-actions">
          <Link className="button primary" href="/laboratories">
            Coba eksperimen lain <ArrowRight size={18} />
          </Link>
          <Link className="button ghost" href={labPath(exp.id)}>
            <RotateCcw size={17} />
            Ulangi eksperimen
          </Link>
        </div>
      </section>
      <div className="result-grid">
        <section>
          <h2>Catatan eksperimenmu</h2>
          <div className="metric-row">
            <span>Langkah selesai</span>
            <strong>
              {record.runtime.done.length}/{exp.steps.length}
            </strong>
          </div>
          <div className="metric-row">
            <span>Ketepatan langkah</span>
            <strong>{s.accuracy}%</strong>
          </div>
          <div className="metric-row">
            <span>Jawaban kuis benar</span>
            <strong>{s.quiz}%</strong>
          </div>
        </section>
        <section>
          <h2>Yang kamu pelajari</h2>
          <p>{exp.concept}</p>
          <p>{exp.theory}</p>
        </section>
      </div>
      <section className="review-section">
        <h2>Kenapa jawabannya begitu?</h2>
        {Object.values(record.runtime.answers).map((a, i) => (
          <div className="review-answer" key={i}>
            <span className={a.correct ? "correct" : "incorrect"}>
              {a.correct ? (
                <CheckCircle2 size={21} />
              ) : (
                <CircleHelp size={21} />
              )}
              {a.correct ? "Benar" : "Pelajari lagi"}
            </span>
            <div>
              <h3>{a.prompt}</h3>
              <p>
                Jawaban: <strong>{a.expected}</strong>
              </p>
              <p>{a.explanation}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function Progress({ records }: { records: RecordEntry[] }) {
  return (
    <>
      <div className="page-heading">
        <h1>Ini hasil eksplorasimu.</h1>
        <p>
          Lihat eksperimen yang sudah kamu selesaikan. Kamu bisa membuka
          hasilnya atau mencoba lagi.
        </p>
      </div>
      <div className="progress-overview">
        <div>
          <strong>
            {records.length}
            <small>/{experiments.length}</small>
          </strong>
          <span>Eksperimen selesai</span>
        </div>
        <div>
          <strong>
            {records.length
              ? `${Math.round(records.reduce((a, b) => a + b.score, 0) / records.length)}%`
              : "Belum ada"}
          </strong>
          <span>Rata-rata nilai</span>
        </div>
        <div>
          <strong>
            {
              new Set(
                records.map((r) => getExperiment(r.experimentId)?.subject),
              ).size
            }
            <small>/{subjects.length}</small>
          </strong>
          <span>Lab yang dicoba</span>
        </div>
      </div>
      <div className="section-heading">
        <h2>Riwayat eksperimen</h2>
        <Link href="/laboratories" className="text-link">
          Cari eksperimen
        </Link>
      </div>
      {records.length ? (
        <div className="history-list">
          {records.map((r) => {
            const exp = getExperiment(r.experimentId);
            return exp ? (
              <Link
                href={resultPath(exp.id)}
                key={r.experimentId}
                className="history-row"
              >
                <SubjectBadge subject={exp.subject} />
                <span>
                  <strong>{exp.title}</strong>
                  <small>{date(r.completedAt)}</small>
                </span>
                <b>{r.score}%</b>
                <ArrowRight size={18} />
              </Link>
            ) : null;
          })}
        </div>
      ) : (
        <EmptyState
          title="Eksperimen pertamamu menunggu"
          href="/laboratories"
          action="Pilih eksperimen"
        >
          Selesaikan satu eksperimen. Hasilnya akan tersimpan di sini.
        </EmptyState>
      )}
    </>
  );
}

function Auth({ onAuth }: { onAuth: (user: User) => void }) {
  const router = useRouter();
  const authPath = usePathname();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const mode = authPath === "/register" ? "register" : "login";
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
      let user: User = {
        name: name.trim() || email.split("@")[0],
        email,
        role,
        className: className.trim(),
      };
      if (supabase) {
        const res =
          mode === "register"
            ? await supabase.auth.signUp({
                email,
                password,
                options: { data: user },
              })
            : await supabase.auth.signInWithPassword({ email, password });
        if (res.error) throw res.error;
        if (mode === "register" && !res.data.session) {
          setMessage(
            "Cek emailmu untuk mengonfirmasi akun. Setelah itu, masuk di sini.",
          );
          return;
        }
        const meta = res.data.user?.user_metadata || {};
        user = {
          name: meta.name || user.name,
          email,
          role: meta.role || role,
          className: meta.className || className,
        };
      }
      onAuth(user);
      router.push(user.role === "teacher" ? "/teacher" : "/sandbox/chemistry");
    } catch {
      setMessage(
        "Belum bisa masuk. Periksa email dan kata sandi, lalu coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }
  function demo(r: "student" | "teacher") {
    onAuth({
      name: r === "teacher" ? "Guru Demo" : "Siswa Demo",
      email: `demo-${r}@labora.local`,
      role: r,
      className: "Kelas Demo",
    });
    router.push(r === "teacher" ? "/teacher" : "/sandbox/chemistry");
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
        <h1>{mode === "register" ? "Buat akun Labora" : "Masuk ke Labora"}</h1>
        <p>
          {mode === "register"
            ? "Siapkan ruang untuk eksperimenmu."
            : "Lanjutkan eksperimen dan lihat progresmu."}
        </p>
        <div className="demo-login">
          <strong>Mau mencoba dulu?</strong>
          <p>
            Mode demo tidak perlu akun. Data demo tersimpan hanya di browser
            ini.
          </p>
          <div>
            <button className="button primary" onClick={() => demo("student")}>
              <FlaskConical size={19} />
              Coba sebagai siswa
            </button>
            <button className="button ghost" onClick={() => demo("teacher")}>
              <GraduationCap size={19} />
              Coba sebagai guru
            </button>
          </div>
        </div>
        <div className="auth-divider">
          {supabase
            ? "atau gunakan akunmu"
            : "atau buat profil lokal di browser ini"}
        </div>
        {!supabase && (
          <p className="local-note">
            Login sekolah belum terhubung. Formulir ini hanya membuat profil
            lokal, bukan akun online.
          </p>
        )}
        {mode === "register" && (
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
              <label>
                Kelas atau kelompok
                <input
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: VIII A"
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email kamu"
            />
          </label>
          <label>
            Kata sandi
            <input
              required
              type="password"
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </label>
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          <button className="button primary full" disabled={busy}>
            {busy
              ? "Sedang memproses..."
              : !supabase
                ? "Buka profil lokal"
                : mode === "register"
                  ? "Buat akun"
                  : "Masuk"}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <Link href={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Masuk" : "Daftar di sini"}
          </Link>
        </p>
      </section>
    </div>
  );
}

function Teacher({
  assignments,
  records,
}: {
  assignments: Assignment[];
  records: RecordEntry[];
}) {
  return (
    <>
      <div className="page-heading">
        <h1>Siapkan eksperimen untuk kelasmu.</h1>
        <p>
          Pilih eksperimen, sesuaikan arahan, lalu lihat hasil belajar siswa.
        </p>
        <Link href="/teacher/new" className="button primary">
          <Plus size={18} />
          Buat tugas baru
        </Link>
      </div>
      <div className="teacher-summary">
        <span>
          <BookOpen size={24} />
          <strong>{assignments.length}</strong> tugas dibuat
        </span>
        <span>
          <CheckCircle2 size={24} />
          <strong>{records.length}</strong> hasil tercatat di perangkat ini
        </span>
      </div>
      <div className="section-heading">
        <h2>Tugas yang kamu buat</h2>
      </div>
      {assignments.length ? (
        assignments.map((a) => (
          <Link
            href={`/teacher/results/${a.id}`}
            className="assignment-row"
            key={a.id}
          >
            <BookOpen size={24} />
            <span>
              <strong>{a.title}</strong>
              <small>
                {getExperiment(a.experimentId)?.title} · {a.className}
              </small>
            </span>
            <span className="row-action">
              Lihat hasil <ArrowRight size={18} />
            </span>
          </Link>
        ))
      ) : (
        <EmptyState
          title="Belum ada tugas kelas"
          href="/teacher/new"
          action="Buat tugas pertama"
        >
          Mulai dengan satu eksperimen dan sesuaikan petunjuknya untuk kelasmu.
        </EmptyState>
      )}
    </>
  );
}

function Builder({ onSave }: { onSave: (a: Assignment) => Promise<void> }) {
  const router = useRouter();
  const [experimentId, setExperimentId] = useState("acid-base");
  const [title, setTitle] = useState("Penyelidikan Asam dan Basa");
  const [instructions, setInstructions] = useState(
    "Amati perubahan warna dan jelaskan apa yang ditunjukkan indikator tentang larutan A.",
  );
  const [className, setClassName] = useState("");
  const [stages, setStages] = useState<Assignment["stages"]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const exp = getExperiment(experimentId)!;
  useEffect(() => {
    setStages(
      exp.steps.map((s) => ({
        instruction: s.instruction,
        hint: s.hint,
        question: s.question?.prompt || "",
        options: s.question?.options || [],
        answer: s.question?.answer || 0,
      })),
    );
  }, [exp]);
  function update(i: number, key: "instruction" | "hint", value: string) {
    setStages((s) => s.map((x, j) => (j === i ? { ...x, [key]: value } : x)));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const a: Assignment = {
        id: `assignment-${Date.now()}`,
        experimentId,
        title: title.trim(),
        instructions: instructions.trim(),
        className: className.trim(),
        stages,
        createdAt: new Date().toISOString(),
      };
      await onSave(a);
      router.push(`/teacher/results/${a.id}`);
    } catch {
      setError("Tugas belum tersimpan. Periksa koneksi, lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" href="/teacher">
        <ArrowLeft size={18} />
        Ruang guru
      </Link>
      <div className="page-heading">
        <h1>Buat tugas eksperimen</h1>
        <p>
          Tentukan kelas dan arahan. Simulasi serta jawaban ilmiahnya tetap
          tersedia.
        </p>
      </div>
      <form className="builder-layout" onSubmit={save}>
        <div>
          <section className="builder-section">
            <h2>Detail tugas</h2>
            <div className="field-grid">
              <label>
                Eksperimen
                <select
                  value={experimentId}
                  onChange={(e) => setExperimentId(e.target.value)}
                >
                  {experiments.map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Kelas atau kelompok
                <input
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: VIII A"
                />
              </label>
            </div>
            <label>
              Judul tugas
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Arahan untuk siswa
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </label>
          </section>
          <section className="builder-section">
            <h2>Panduan tiap langkah</h2>
            <p>
              Ubah instruksi dan petunjuk. Tindakan dan kuis tetap mengikuti
              simulasi.
            </p>
            {stages.map((s, i) => (
              <div className="builder-stage" key={i}>
                <span className="builder-stage-num">{i + 1}</span>
                <div>
                  <h3>Langkah {i + 1}</h3>
                  <label>
                    Instruksi
                    <input
                      value={s.instruction}
                      onChange={(e) => update(i, "instruction", e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Petunjuk
                    <input
                      value={s.hint}
                      onChange={(e) => update(i, "hint", e.target.value)}
                    />
                  </label>
                  {exp.steps[i]?.question && (
                    <div className="stage-question">
                      <strong>{exp.steps[i].question?.prompt}</strong>
                      <p>
                        Jawaban:{" "}
                        {
                          exp.steps[i].question?.options[
                            exp.steps[i].question?.answer
                          ]
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
        <aside className="builder-aside">
          <SubjectBadge subject={exp.subject} />
          <h2>{exp.title}</h2>
          <p>{exp.objective}</p>
          <div className="inline-meta">
            <span>{exp.steps.length} langkah</span>
            <span>{exp.duration} menit</span>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full" type="submit" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan tugas"}
          </button>
        </aside>
      </form>
    </>
  );
}

function AssignmentResults({
  assignment,
  records,
}: {
  assignment?: Assignment;
  records: RecordEntry[];
}) {
  if (!assignment)
    return (
      <EmptyState
        title="Tugas tidak ditemukan"
        href="/teacher"
        action="Kembali ke ruang guru"
      >
        Tugas ini belum tersedia. Periksa daftar tugasmu.
      </EmptyState>
    );
  const exp = getExperiment(assignment.experimentId)!;
  const matching = records.filter((r) => r.experimentId === exp.id);
  const incorrect = matching.flatMap((r) =>
    Object.values(r.runtime.answers).filter((a) => !a.correct),
  );
  return (
    <>
      <Link href="/teacher" className="back-link">
        <ArrowLeft size={18} />
        Ruang guru
      </Link>
      <div className="page-heading">
        <h1>{assignment.title}</h1>
        <p>
          {exp.title} · {assignment.className}
        </p>
        <Link
          className="button primary"
          href={`${path(exp.id)}?assignment=${assignment.id}`}
        >
          Buka aktivitas <ArrowRight size={18} />
        </Link>
      </div>
      <div className="result-grid">
        <section>
          <h2>Arahan tugas</h2>
          <p>{assignment.instructions}</p>
          <div className="metric-row">
            <span>Langkah</span>
            <strong>{assignment.stages.length}</strong>
          </div>
          <div className="metric-row">
            <span>Dibuat</span>
            <strong>{date(assignment.createdAt)}</strong>
          </div>
        </section>
        <section>
          <h2>Hasil yang tersedia</h2>
          <p>
            <strong>{matching.length}</strong> hasil eksperimen tercatat.
          </p>
          <p className="local-note">
            Hasil dikelompokkan berdasarkan eksperimen, bukan ID tugas. Mode
            demo hanya menampilkan data browser ini.
          </p>
        </section>
      </div>
      <section className="review-section">
        <h2>Hasil siswa</h2>
        {matching.length ? (
          matching.map((r) => (
            <Link
              href={resultPath(exp.id)}
              className="assignment-row"
              key={r.completedAt}
            >
              <CheckCircle2 size={24} />
              <span>
                <strong>{r.userName || "Siswa"}</strong>
                <small>{date(r.completedAt)}</small>
              </span>
              <b>{r.score}%</b>
              <ArrowRight size={18} />
            </Link>
          ))
        ) : (
          <EmptyState title="Belum ada hasil siswa">
            Hasil muncul setelah eksperimen diselesaikan.
          </EmptyState>
        )}
      </section>
      {incorrect.length > 0 && (
        <section className="review-section">
          <h2>Pemahaman yang perlu dibahas</h2>
          {incorrect.map((a, i) => (
            <div className="review-answer" key={i}>
              <CircleHelp size={22} />
              <div>
                <h3>{a.prompt}</h3>
                <p>{a.explanation}</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

export default function App() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const search = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState("");
  useEffect(() => {
    let active = true;
    async function init() {
      let current = storage.user();
      if (supabase) {
        try {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            const m = data.user.user_metadata || {};
            current = {
              name: m.name || data.user.email?.split("@")[0] || "Siswa",
              email: data.user.email || "",
              role: m.role || "student",
              className: m.className || "",
            };
            storage.setUser(current);
          }
        } catch {
          if (active)
            setSyncError(
              "Akun sekolah belum bisa dimuat. Kamu tetap bisa memakai profil lokal.",
            );
        }
      }
      if (!active) return;
      setUser(current);
      setRecords(storage.records());
      setAssignments(storage.assignments());
      setReady(true);
      if (current && supabase && !current.email.startsWith("demo-")) {
        try {
          const cloud = await loadCloud(current);
          if (active && cloud) {
            setAssignments(cloud.assignments);
            setRecords(cloud.records);
          }
        } catch {
          if (active)
            setSyncError(
              "Data sekolah belum tersinkron. Periksa koneksi; hasil lokal tetap tersedia.",
            );
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);
  function auth(u: User) {
    storage.setUser(u);
    setUser(u);
    if (supabase && !u.email.startsWith("demo-"))
      loadCloud(u)
        .then((c) => {
          if (c) {
            setAssignments(c.assignments);
            setRecords(c.records);
          }
        })
        .catch(() =>
          setSyncError("Data sekolah belum tersinkron. Periksa koneksimu."),
        );
  }
  async function logout() {
    if (supabase) await supabase.auth.signOut();
    storage.setUser(null);
    window.location.assign("/");
  }
  async function saveAssignment(a: Assignment) {
    if (supabase && user && !user.email.startsWith("demo-"))
      await saveCloudAssignment(a);
    storage.saveAssignment(a);
    setAssignments(storage.assignments());
  }
  async function complete(exp: Experiment, runtime: Runtime) {
    const r = {
      experimentId: exp.id,
      completedAt: new Date().toISOString(),
      score: score(exp, runtime).total,
      runtime,
      userName: user?.name,
      className: user?.className,
    };
    storage.saveRecord(r);
    storage.clearRuntime(exp.id);
    setRecords(storage.records());
    if (supabase && user && !user.email.startsWith("demo-")) {
      try {
        await saveCloudResult(r, user);
      } catch {
        setSyncError(
          "Hasil tersimpan di browser, tetapi belum tersinkron ke sekolah. Periksa koneksimu.",
        );
      }
    }
    router.push(resultPath(exp.id));
  }
  const isSandbox =
    pathname.startsWith("/sandbox/") ||
    (pathname.startsWith("/laboratories/") &&
      subjects.some((s) => pathname.endsWith(s.id)));
  const isPublic =
    ["/", "/login", "/register", "/laboratories"].includes(pathname) ||
    isSandbox;
  useEffect(() => {
    if (ready && !user && !isPublic) router.replace("/login");
  }, [ready, user, isPublic, router]);
  const segments = pathname.split("/").filter(Boolean);
  const exp = getExperiment(
    (segments[0] === "challenges" && segments[1] === "run"
      ? segments[2]
      : segments[1]) || "",
  );
  const assignment = assignments.find((a) => a.id === search.get("assignment"));
  let content: React.ReactNode;
  if (pathname === "/") content = <Landing />;
  else if (pathname === "/login" || pathname === "/register")
    content = <Auth onAuth={auth} />;
  else if (pathname === "/dashboard")
    content = (
      <Dashboard user={user} records={records} assignments={assignments} />
    );
  else if (
    isSandbox &&
    ["chemistry", "physics", "biology", "free"].includes(segments[1])
  )
    content = (
      <Sandbox key={segments[1]} discipline={segments[1] as Discipline} />
    );
  else if (pathname === "/challenges")
    content = (
      <>
        <div className="page-heading">
          <h1>Tantangan · opsional</h1>
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
    content = <LaboratorySelection />;
  else if (
    segments[0] === "laboratories" &&
    subjects.some((s) => s.id === segments[1])
  )
    content = (
      <Library
        key={segments[1]}
        subject={segments[1] as Subject}
        records={records}
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
        onComplete={(s) => complete(exp, s)}
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
      onLogout={logout}
      wide={segments[0] === "lab" || isSandbox}
    >
      {syncError && (
        <div className="sync-error" role="alert">
          <span>{syncError}</span>
          <button
            onClick={() => setSyncError("")}
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
