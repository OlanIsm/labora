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
import { apiFetch } from "@/shared/infrastructure/api";
import type { NotificationDTO } from "@contracts/laboratory";

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
  const [remoteNotifications, setRemoteNotifications] = useState<
      NotificationDTO[]
    >([]),
    [notificationError, setNotificationError] = useState("");
  const readKey = `labora-notifications-read:${user?.email || "guest"}`;
  useEffect(() => {
    if (user?.mode === "account") {
      setReadIds([]);
      return;
    }
    const stored = browserStorage.read<unknown>(readKey, []);
    setReadIds(
      Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === "string")
        : [],
    );
  }, [readKey, user?.mode]);
  useEffect(() => {
    if (user?.mode !== "account") {
      setRemoteNotifications([]);
      return;
    }
    let active = true;
    setRemoteNotifications([]);
    setNotificationError("");
    apiFetch<NotificationDTO[]>("/notifications")
      .then((data) => {
        if (active) {
          setRemoteNotifications(data);
          setReadIds(data.filter((n) => n.readAt).map((n) => n.id));
        }
      })
      .catch((e) => {
        if (active) setNotificationError(e.message);
      });
    return () => {
      active = false;
    };
  }, [user?.id, user?.mode, panel, assignments, records]);
  const notifications =
    user?.mode === "account"
      ? remoteNotifications
      : buildNotifications(user, assignments, records);
  const unread = notifications.filter(
    (notification) => !readIds.includes(notification.id),
  ).length;
  async function markRead(ids: string[]) {
    if (user?.mode === "account") {
      try {
        await apiFetch("/notifications", {
          method: "PATCH",
          body: JSON.stringify({ ids }),
        });
      } catch (e) {
        setNotificationError(
          e instanceof Error ? e.message : "Status baca belum tersimpan.",
        );
        return;
      }
    }
    const updated = [...new Set([...readIds, ...ids])];
    setReadIds(updated);
    if (user?.mode !== "account") browserStorage.write(readKey, updated);
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
          error={notificationError}
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
