import Link from "next/link";
import {
  CalendarDays,
  ImageIcon,
  Settings,
  ShieldCheck,
  Type,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccess, requireAdmin } from "@/lib/auth";

const allActions = [
  {
    title: "Textes",
    text: "Modifier les textes importants du site.",
    href: "/admin/contenu",
    icon: Type,
    permission: "content" as const,
  },
  {
    title: "Images",
    text: "Changer les visuels des pages publiques.",
    href: "/admin/images",
    icon: ImageIcon,
    permission: "images" as const,
  },
  {
    title: "Galerie",
    text: "Ajouter ou masquer les photos.",
    href: "/admin/galerie",
    icon: ImageIcon,
    permission: "gallery" as const,
  },
  {
    title: "Événements",
    text: "Gérer les concerts et dates importantes.",
    href: "/admin/evenements",
    icon: CalendarDays,
    permission: "events" as const,
  },
  {
    title: "Paramètres",
    text: "Email, téléphone, adresse et formulaire.",
    href: "/admin/settings",
    icon: Settings,
    permission: "settings" as const,
  },
  {
    title: "Admins",
    text: "Créer des comptes et gérer les accès.",
    href: "/admin/admins",
    icon: ShieldCheck,
    permission: "admins" as const,
  },
];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const actions = allActions.filter((action) =>
    canAccess(admin, action.permission),
  );

  return (
    <main>
      <AdminHeader
        title="Dashboard"
        description="Gérer le site de la chorale simplement."
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

      <section className="mt-5 rounded-[1.7rem] border border-[#e6e1d6] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-[#1f1f1a]">Site public</h2>
            <p className="mt-1 text-sm leading-6 text-[#6d6b63]">
              Vérifier le rendu après modification.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex justify-center rounded-full bg-[#687a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#56664d]"
          >
            Voir le site
          </Link>
        </div>
      </section>
    </main>
  );
}
