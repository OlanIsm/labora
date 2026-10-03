"use client";

import type { Assignment } from "@/features/assignments/model";
import type { User } from "@/features/auth/model";
import type { RecordEntry } from "@/features/progress/model";
import { browserStorage } from "@/shared/infrastructure/browserStorage";
import { Logo } from "@/shared/ui/Logo";
import { Bell, CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { AccountMenu } from "./AccountMenu";
import { HelpPanel } from "./HelpPanel";
import { buildNotifications } from "./notifications";
import { NotificationsPanel } from "./NotificationsPanel";

export function AppHeader({
  user,
  pathname,
  assignments,
  records,
  onLogout,
}: {
  user: User | null;
  pathname: string;
  assignments: Assignment[];
  records: RecordEntry[];
  onLogout: () => Promise<void>;
}) {
  const [panel, setPanel] = useState<"help" | "notifications" | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const readKey = `labora-notifications-read:${user?.email || "guest"}`;
  useEffect(() => {
    const stored = browserStorage.read<unknown>(readKey, []);
    setReadIds(
      Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === "string")
        : [],
    );
  }, [readKey]);
  const notifications = buildNotifications(user, assignments, records);
  const unread = notifications.filter(
    (notification) => !readIds.includes(notification.id),
  ).length;
  function markRead(ids: string[]) {
    const updated = [...new Set([...readIds, ...ids])];
    setReadIds(updated);
    browserStorage.write(readKey, updated);
  }

  return (
    <header className="app-topbar app-header">
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
      <div className="header-controls">
        <button
          className={`header-tool-button ${panel === "help" ? "is-active" : ""}`}
          aria-label="Bantuan"
          title="Bantuan & tutorial"
          aria-haspopup="dialog"
          aria-expanded={panel === "help"}
          onClick={() => setPanel("help")}
        >
          <CircleHelp size={21} />
        </button>
        <button
          className={`header-tool-button ${panel === "notifications" ? "is-active" : ""}`}
          aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ""}`}
          title="Notifikasi"
          aria-haspopup="dialog"
          aria-expanded={panel === "notifications"}
          onClick={() => setPanel("notifications")}
        >
          <Bell size={21} />
          {unread > 0 && (
            <span className="header-notification-count" aria-hidden="true">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
        <span className="header-controls-divider" aria-hidden="true" />
        <AccountMenu user={user} onLogout={onLogout} />
      </div>
      {panel === "help" && (
        <HelpPanel
          teacher={user?.role === "teacher"}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "notifications" && (
        <NotificationsPanel
          notifications={notifications}
          readIds={readIds}
          guest={!user}
          onRead={(id) => markRead([id])}
          onReadAll={() =>
            markRead(notifications.map((notification) => notification.id))
          }
          onClose={() => setPanel(null)}
        />
      )}
    </header>
  );
}
