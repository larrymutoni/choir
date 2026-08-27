import Link from "next/link";
import {
  CalendarDays,
  ImageIcon,
  ListChecks,
  MailCheck,
  Settings,
  Type,
  Users,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";

const actions = [
  {
    title: "Textes",
    text: "Modifier les textes importants du site.",
    href: "/admin/contenu",
    icon: Type,
  },
  {
    title: "Images",
    text: "Changer les visuels des pages publiques.",
    href: "/admin/images",
    icon: ImageIcon,
  },
  {
    title: "Galerie",
    text: "Gérer les photos de la chorale.",
    href: "/admin/galerie",
    icon: ImageIcon,
  },
  {
    title: "Événements",
    text: "Gérer les événements de la chorale.",
    href: "/admin/evenements",
    icon: CalendarDays,
  },
  {
    title: "Utilisateurs",
    text: "Accepter, refuser et gérer les membres.",
    href: "/admin/utilisateurs",
    icon: Users,
  },
  {
    title: "Emails autorisés",
    text: "Gérer les adresses autorisées à s'inscrire.",
    href: "/admin/emails",
    icon: MailCheck,
  },
  {
    title: "Paramètres",
    text: "Modifier les informations pratiques du site.",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <main>
      <AdminHeader
        title="Dashboard"
        description="Gérer le site de la chorale."
        email={admin.email}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-[1.7rem] border border-[#e6e1d6] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f0e8] text-[#687a5e]">
                <Icon size={21} />
              </div>

              <h2 className="mt-5 text-lg font-black text-[#1f1f1a]">
                {action.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6d6b63]">
                {action.text}
              </p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
