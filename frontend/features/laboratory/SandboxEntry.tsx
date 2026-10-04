"use client";

import dynamic from "next/dynamic";

export const Sandbox = dynamic(
  () => import("@/features/laboratory/ui/workbench/Sandbox"),
  {
    ssr: false,
    loading: () => <p role="status">Memuat meja eksperimen...</p>,
  },
);
