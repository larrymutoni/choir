"use client";

import { CheckCircle2, Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ContactMessageActionsProps = {
  id: string;
  email: string;
  subject: string | null;
  isRead: boolean;
};

export function ContactMessageActions({
  id,
  email,
  subject,
  isRead,
}: ContactMessageActionsProps) {
  const router = useRouter();

  async function markAsRead() {
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, is_read: true }),
    });

    router.refresh();
  }

  async function deleteMessage() {
    const confirmed = window.confirm("Supprimer ce message ?");
    if (!confirmed) return;

    await fetch("/api/admin/messages", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    router.refresh();
  }

  const replySubject = subject || "Réponse à votre message";
  const replyHref = `mailto:${email}?subject=${encodeURIComponent(replySubject)}`;

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <a
        href={replyHref}
        className="inline-flex items-center gap-2 rounded-full bg-[#687a5e] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#56664d]"
      >
        <Mail size={16} />
        Répondre
      </a>

      {!isRead && (
        <button
          type="button"
          onClick={markAsRead}
          className="inline-flex items-center gap-2 rounded-full bg-[#f3f0e8] px-4 py-2 text-sm font-bold text-[#687a5e]"
        >
          <CheckCircle2 size={16} />
          Marquer comme lu
        </button>
      )}

      <button
        type="button"
        onClick={deleteMessage}
        className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
      >
        <Trash2 size={16} />
        Supprimer
      </button>
    </div>
  );
}
