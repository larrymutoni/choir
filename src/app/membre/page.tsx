import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FolderOpen,
  Images,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getRoleLabel } from "@/lib/dashboard-navigation";
import { requireUser } from "@/server/auth/guard";

const quickLinks = [
  {
    title: "Calendrier",
    description: "Répétitions, concerts et événements.",
    href: "/membre/calendrier",
    icon: CalendarDays,
    comingSoon: true,
  },
  {
    title: "Répertoire",
    description: "Retrouvez les morceaux de la chorale.",
    href: "/membre/repertoire",
    icon: BookOpen,
    comingSoon: true,
  },
  {
    title: "Ressources",
    description: "Documents, partitions et fichiers utiles.",
    href: "/membre/ressources",
    icon: FolderOpen,
    comingSoon: true,
  },
  {
    title: "Galerie",
    description: "Photos réservées aux membres.",
    href: "/membre/galerie",
    icon: Images,
    comingSoon: true,
  },
];

export default async function MemberPage() {
  const user = await requireUser();

  return (
    <main>
      <DashboardHeader
        eyebrow={getRoleLabel(user.role)}
        title={`Bonjour ${user.firstname}`}
        description="Bienvenue dans votre espace Chorale Rayon de Soleil."
      />

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-black text-[#1f1f1a]">Accès rapides</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-[#e6e1d6] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#d8d3c8] hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f3ed] text-[#687a5e]">
                    <Icon size={19} />
                  </div>

                  {item.comingSoon && (
                    <span className="text-[10px] font-bold text-[#a39f94]">
                      Bientôt
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-base font-black text-[#1f1f1a]">
                  {item.title}
                </h3>

                <p className="mt-1 min-h-10 text-sm leading-5 text-[#817e75]">
                  {item.description}
                </p>

                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#687a5e]">
                  Ouvrir
                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
