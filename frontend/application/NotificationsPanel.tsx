"use client";

import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCheck,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { SidePanel } from "@/shared/ui/SidePanel";
import { date } from "@/shared/date";
import type { AppNotification } from "./notifications";

export function NotificationsPanel({
  notifications,
  readIds,
  guest,
  onRead,
  onReadAll,
  onClose,
}: {
  notifications: AppNotification[];
  readIds: string[];
  guest: boolean;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClose: () => void;
}) {
  const unread = notifications.filter(
    (notification) => !readIds.includes(notification.id),
  ).length;
  return (
    <SidePanel
      title="Notifikasi"
      description={
        unread
          ? `${unread} pembaruan belum dibaca.`
          : "Tugas dan hasil belajarmu, di satu tempat."
      }
      tone="notifications"
      onClose={onClose}
      controls={
        notifications.length > 0 && (
          <button
            className="header-read-all"
            disabled={!unread}
            onClick={onReadAll}
          >
            <CheckCheck size={18} />
            {unread ? "Tandai semua dibaca" : "Semua sudah dibaca"}
          </button>
        )
      }
    >
      {notifications.length ? (
        <div className="header-notifications">
          {notifications.map((notification) => {
            const read = readIds.includes(notification.id);
            const Icon =
              notification.kind === "assignment" ? BookOpen : CheckCircle2;
            return (
              <Link
                key={notification.id}
                href={notification.href}
                className={`header-notification ${read ? "is-read" : "is-unread"}`}
                onClick={() => {
                  onRead(notification.id);
                  onClose();
                }}
              >
                <span
                  className={`header-notification-icon ${notification.kind}`}
                >
                  <Icon size={22} />
                </span>
                <span className="header-notification-copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.description}</span>
                  <time dateTime={notification.createdAt}>
                    {date(notification.createdAt)}
                  </time>
                </span>
                {!read && (
                  <span
                    className="header-unread-dot"
                    role="img"
                    aria-label="Belum dibaca"
                  />
                )}
                <ArrowRight
                  className="header-notification-arrow"
                  size={16}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="header-panel-empty">
          <span className="header-empty-bell">
            <Bell size={30} />
          </span>
          <h3>Belum ada notifikasi</h3>
          <p>
            {guest
              ? "Masuk untuk melihat tugas kelas dan hasil belajarmu."
              : "Tugas kelas dan hasil eksperimen akan muncul di sini saat tersedia."}
          </p>
          {guest && (
            <Link
              href="/login"
              className="button primary small"
              onClick={onClose}
            >
              Masuk ke Labora
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}
    </SidePanel>
  );
}
