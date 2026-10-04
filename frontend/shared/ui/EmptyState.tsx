"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";

export function EmptyState({
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
