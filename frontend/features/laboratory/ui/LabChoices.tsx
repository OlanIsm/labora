"use client";

import { microscopeSlides } from "@/features/laboratory/subjects/biology/microscope";
import { physicsSimulations } from "@/features/laboratory/subjects/physics/simulations/ui/Simulations";
import { subjects } from "@/shared/subjects";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { laboratoryPath } from "../routes";

export function LabChoices({ enterApp = false }: { enterApp?: boolean }) {
  return (
    <div className="lab-choice-grid">
      {subjects.map((s) => (
        <Link
          key={s.id}
          href={enterApp ? "/dashboard" : laboratoryPath(s.id)}
          className={`lab-choice ${s.id}`}
        >
          <div className="lab-choice-head">
            <Image
              className="lab-choice-mascot"
              src={s.mascot}
              alt={`Mascot lab ${s.name}`}
              width={160}
              height={160}
            />
            <span>
              {s.id === "physics"
                ? `${physicsSimulations.length} simulasi`
                : s.id === "biology"
                  ? `${microscopeSlides.length} preparat`
                  : "Percobaan bebas"}
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
