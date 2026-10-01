"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const loading = () => <p role="status">Memuat simulasi...</p>;

export const physicsSimulations = [
  { id: "meriam-target", title: "Meriam & Target", description: "Gerak parabola dengan hambatan udara dan pilihan planet.", badge: "SMA Kelas 10", component: dynamic(() => import("./projectile/ProjectilePage"), { ssr: false, loading }) },
  { id: "roller-coaster", title: "Roller Coaster Maker", description: "Gambar lintasanmu sendiri dan amati kekekalan energi.", badge: "SMP 8 · SMA 10", component: dynamic(() => import("./roller-coaster/RollerCoasterPage"), { ssr: false, loading }) },
  { id: "kapal-selam", title: "Lab Kapal Selam", description: "Hukum Archimedes dan tekanan hidrostatik.", badge: "SMP 8 · SMA 11", component: dynamic(() => import("./submarine/SubmarinePage"), { ssr: false, loading }) },
  { id: "laser-lensa", title: "Sandbox Laser & Lensa", description: "Pemantulan, pembiasan, dan pembentukan bayangan.", badge: "SMP 8 · SMA 11", component: dynamic(() => import("./optics/OpticsPage"), { ssr: false, loading }) },
  { id: "korsleting-listrik", title: "Simulator Korsleting Listrik", description: "Rangkaian dinamis dengan deteksi korsleting dan sekring.", badge: "SMP 9 · SMA 12", component: dynamic(() => import("./circuit/CircuitPage"), { ssr: false, loading }) },
];

export function PhysicsSimulationList() {
  return (
    <>
      <div className="page-heading">
        <h1>Simulasi Fisika Interaktif</h1>
        <p>Lima simulasi untuk mengamati gerak, energi, dan listrik secara langsung.</p>
      </div>
      <div className="sim-fisika-list">
        {physicsSimulations.map((sim) => (
          <Link key={sim.id} href={`/fisika/${sim.id}`} className="sim-fisika-card">
            <span className="sim-badge">{sim.badge}</span>
            <h3>{sim.title}</h3>
            <p>{sim.description}</p>
          </Link>
        ))}
      </div>
      <Link href="/sandbox/physics" className="back-link">Buka meja bebas Fisika</Link>
    </>
  );
}
