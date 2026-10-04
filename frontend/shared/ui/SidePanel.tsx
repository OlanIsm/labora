"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export function SidePanel({
  title,
  description,
  tone,
  controls,
  children,
  onClose,
}: {
  title: string;
  description: string;
  tone: "help" | "notifications";
  controls?: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`header-panel ${tone}-panel`}
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.close();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          dialog.current?.close();
      }}
    >
      <div className="header-panel-heading">
        <div className="header-panel-title">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            aria-label={`Tutup ${tone === "help" ? "bantuan" : "notifikasi"}`}
            onClick={() => dialog.current?.close()}
          >
            <X size={21} />
          </button>
        </div>
        <p>{description}</p>
        {controls}
      </div>
      <div className="header-panel-content">{children}</div>
    </dialog>
  );
}
