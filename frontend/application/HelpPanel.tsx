"use client";

import {
  ArrowRight,
  BookOpen,
  Compass,
  FlaskConical,
  GraduationCap,
  Microscope,
  Search,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SidePanel } from "@/shared/ui/SidePanel";
import { helpGuides, teacherGuides } from "./helpGuides";

const icons = {
  start: Compass,
  bench: FlaskConical,
  microscope: Microscope,
  challenge: BookOpen,
  progress: Target,
  teacher: GraduationCap,
};

export function HelpPanel({
  teacher,
  onClose,
}: {
  teacher: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const guides = teacher ? [...helpGuides, ...teacherGuides] : helpGuides;
  const matching = guides.filter((guide) =>
    [guide.title, guide.description, ...guide.steps]
      .join(" ")
      .toLocaleLowerCase("id")
      .includes(query.trim().toLocaleLowerCase("id")),
  );
  return (
    <SidePanel
      title="Butuh bantuan?"
      description="Dari langkah pertama sampai penemuan berikutnya."
      tone="help"
      onClose={onClose}
      controls={
        <label className="header-help-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Cari tutorial"
            placeholder="Cari tutorial…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      }
    >
      <div className="header-help-guides">
        {matching.map((guide) => {
          const Icon = icons[guide.id as keyof typeof icons];
          return (
            <details className="header-help-guide" key={guide.id}>
              <summary>
                <span className="header-guide-icon">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <span>
                  <strong>{guide.title}</strong>
                  <small>{guide.description}</small>
                </span>
                <ArrowRight
                  className="header-guide-arrow"
                  size={17}
                  aria-hidden="true"
                />
              </summary>
              <div className="header-guide-steps">
                <ol>
                  {guide.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <Link href={guide.href} className="card-link" onClick={onClose}>
                  {guide.action}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </details>
          );
        })}
        {!matching.length && (
          <div className="header-panel-empty">
            <Search size={32} />
            <h3>Tutorial belum ditemukan</h3>
            <p>Coba kata seperti “alat”, “mikroskop”, atau “tugas”.</p>
            <button className="button ghost small" onClick={() => setQuery("")}>
              Lihat semua tutorial
            </button>
          </div>
        )}
      </div>
    </SidePanel>
  );
}
