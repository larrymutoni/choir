"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Notification = {
  id: string;
  message: string;
  href: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function NotificationBell() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [open, setOpen] = useState(false);

  const [markingAll, setMarkingAll] =
    useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/member/notifications",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as {
        notifications: Notification[];
      };

      setNotifications(result.notifications);
    } catch {
      // Notifications must never break the workspace.
    }
  }, []);

  useEffect(() => {
    void load();

    const interval = window.setInterval(
      () => void load(),
      60_000,
    );

    const handleFocus = () => {
      void load();
    };

    window.addEventListener(
      "focus",
      handleFocus,
    );

    return () => {
      window.clearInterval(interval);

      window.removeEventListener(
        "focus",
        handleFocus,
      );
    };
  }, [load]);

  async function viewNotification(
    notification: Notification,
  ) {
    setNotifications((current) =>
      current.filter(
        (item) => item.id !== notification.id,
      ),
    );

    setOpen(false);

    try {
      await fetch(
        "/api/member/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: notification.id,
          }),
        },
      );
    } catch {
      // Navigation is more important than blocking
      // the member on a read-state failure.
    }

    router.push(notification.href);
  }

  async function markAllAsRead() {
    if (
      markingAll ||
      notifications.length === 0
    ) {
      return;
    }

    const pending = [
      ...notifications,
    ];

    setMarkingAll(true);

    /*
     * Optimistic UI:
     * the badge and the list disappear immediately.
     */
    setNotifications([]);

    try {
      const responses =
        await Promise.all(
          pending.map(
            (notification) =>
              fetch(
                "/api/member/notifications",
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body:
                    JSON.stringify({
                      notificationId:
                        notification.id,
                    }),
                },
              ),
          ),
        );

      if (
        responses.some(
          (response) =>
            !response.ok,
        )
      ) {
        throw new Error(
          "Impossible de marquer toutes les notifications comme lues.",
        );
      }
    } catch {
      /*
       * If one update failed, reload the real
       * unread state from the server.
       */
      await load();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => !current)
        }
        className="relative grid h-9 w-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-white hover:text-zinc-950"
      >
        <Bell size={18} strokeWidth={1.8} />

        {notifications.length > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#f7f5ef]" />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-11 z-50 w-[min(88vw,340px)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-900">
                Notifications
              </p>

              {notifications.length > 0 && (
                <button
                  type="button"
                  disabled={markingAll}
                  onClick={() =>
                    void markAllAsRead()
                  }
                  className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {markingAll
                    ? "Lecture…"
                    : "Tout marquer comme lu"}
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                Rien de nouveau.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto p-1.5">
                {notifications.map(
                  (notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() =>
                        void viewNotification(
                          notification,
                        )
                      }
                      className="w-full rounded-lg px-3 py-3 text-left transition hover:bg-zinc-50"
                    >
                      <p className="text-[13px] leading-5 text-zinc-800">
                        {notification.message}
                      </p>

                      <p className="mt-1.5 text-[11px] text-zinc-400">
                        {formatDate(
                          notification.created_at,
                        )}
                      </p>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
