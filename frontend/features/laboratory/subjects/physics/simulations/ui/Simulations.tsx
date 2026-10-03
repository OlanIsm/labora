"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

const loading = () => <p role="status">Memuat simulasi...</p>;

export const physicsSimulations = [
  {
    id: "meriam-target",
    title: "Meriam & Target",
    description: "Gerak parabola dengan hambatan udara dan pilihan planet.",
    component: dynamic(() => import("./projectile/ProjectilePage"), {
      ssr: false,
      loading,
    }),
  },
  {
    id: "roller-coaster",
    title: "Roller Coaster Maker",
    description: "Gambar lintasanmu sendiri dan amati kekekalan energi.",
    component: dynamic(() => import("./roller-coaster/RollerCoasterPage"), {
      ssr: false,
      loading,
    }),
  },
  {
    id: "kapal-selam",
    title: "Lab Kapal Selam",
    description: "Hukum Archimedes dan tekanan hidrostatik.",
    component: dynamic(() => import("./submarine/SubmarinePage"), {
      ssr: false,
      loading,
    }),
  },
  {
    id: "laser-lensa",
    title: "Sandbox Laser & Lensa",
    description: "Pemantulan, pembiasan, dan pembentukan bayangan.",
    component: dynamic(() => import("./optics/OpticsPage"), {
      ssr: false,
      loading,
    }),
  },
  {
    id: "korsleting-listrik",
    title: "Rangkaian Seri & Paralel",
    description:
      "Susun komponen dan kabelmu sendiri. Bandingkan arus dan terang lampu.",
    component: dynamic(() => import("./circuit/CircuitPage"), {
      ssr: false,
      loading,
    }),
  },
];

export function PhysicsSimulationList() {
  return (
    <>
      <div className="page-heading">
        <h1>Simulasi Fisika Interaktif</h1>
        <p>
          Lima simulasi untuk mengamati gerak, energi, dan listrik secara
          langsung.
        </p>
      </div>
      <div className="sim-fisika-list">
        {physicsSimulations.map((sim) => (
          <Link
            key={sim.id}
            href={`/fisika/${sim.id}`}
            className="sim-fisika-card"
          >
            <div className="sim-fisika-preview">
              <Image
                className="sim-fisika-thumbnail"
                src={`/physics-previews/${sim.id}.webp`}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 650px) 100vw, (max-width: 1150px) 50vw, 33vw"
              />
            </div>
            <div className="sim-fisika-card-body">
              <h3>{sim.title}</h3>
              <p>{sim.description}</p>
              <span className="sim-fisika-card-action">Buka simulasi</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
