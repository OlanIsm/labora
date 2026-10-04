"use client";

import { LabChoices } from "@/features/laboratory/ui/LabChoices";
import type { ReactNode } from "react";

export function LaboratorySelection({
  recommendation,
}: {
  recommendation: ReactNode;
}) {
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
        {recommendation}
      </section>
    </>
  );
}
