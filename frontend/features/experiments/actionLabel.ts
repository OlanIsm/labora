import type { Experiment } from "@/features/experiments/domain/definitions";

export const actionLabel = (action: string, exp: Experiment) =>
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
