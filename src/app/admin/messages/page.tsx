import { Mail, Phone } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContactMessageActions } from "@/components/admin/ContactMessageActions";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function AdminMessagesPage() {
  const admin = await requirePermission("messages");
  const supabase = createAdminClient();

  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, is_read, created_at")
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (messages ?? []) as ContactMessageRow[];
  const unreadCount = rows.filter((message) => !message.is_read).length;

  return (
    <main>
      <AdminHeader
        title="Messages"
        description={
          unreadCount > 0
            ? `${unreadCount} message${unreadCount > 1 ? "s" : ""} non lu${unreadCount > 1 ? "s" : ""}`
            : "Aucun message non lu"
        }
        email={admin.email}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#687a5e]">
            Non lus
          </p>
          <p className="mt-2 text-3xl font-black text-[#1f1f1a]">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#687a5e]">
            Total affiché
          </p>
          <p className="mt-2 text-3xl font-black text-[#1f1f1a]">
            {rows.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-[#6d6b63] shadow-sm">
          Les nouveaux messages apparaissent en premier. Le bouton “Répondre”
          ouvre votre messagerie.
        </div>
      </div>

      {rows.length === 0 && (
        <section className="rounded-[1.8rem] border border-[#e6e1d6] bg-white p-6 text-sm leading-7 text-[#6d6b63] shadow-sm">
          Aucun message reçu.
        </section>
      )}

      <section className="grid gap-4">
        {rows.map((message) => (
          <article
            key={message.id}
            className={
              message.is_read
                ? "rounded-[1.8rem] border border-[#e6e1d6] bg-white p-5 shadow-sm sm:p-6"
                : "rounded-[1.8rem] border-2 border-[#687a5e] bg-white p-5 shadow-sm sm:p-6"
            }
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {!message.is_read ? (
                    <span className="rounded-full bg-[#687a5e] px-3 py-1 text-xs font-bold text-white">
                      Nouveau
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#f3f0e8] px-3 py-1 text-xs font-bold text-[#687a5e]">
                      Lu
                    </span>
                  )}

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#687a5e]">
                    {formatDate(message.created_at)}
                  </p>
                </div>

                <h2 className="mt-3 text-xl font-black text-[#1f1f1a]">
                  {message.subject || "Sans sujet"}
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#5d5a52]">
                  {message.name}
                </p>
              </div>

              <div className="grid gap-2 text-sm text-[#6d6b63] lg:text-right">
                <a
                  href={`mailto:${message.email}`}
                  className="inline-flex items-center gap-2 hover:text-[#1f1f1a]"
                >
                  <Mail size={16} />
                  {message.email}
                </a>

                {message.phone && (
                  <p className="inline-flex items-center gap-2 lg:justify-end">
                    <Phone size={16} />
                    {message.phone}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-5 whitespace-pre-line rounded-2xl bg-[#f7f5ef] p-4 text-sm leading-7 text-[#4f4d47]">
              {message.message}
            </p>

            <ContactMessageActions
              id={message.id}
              email={message.email}
              subject={message.subject}
              isRead={message.is_read}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
