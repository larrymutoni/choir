import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  Images,
  Music2,
} from "lucide-react";

import {
  DashboardHeader,
} from "@/components/dashboard/DashboardHeader";

import {
  getRoleLabel,
} from "@/lib/dashboard-navigation";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  requireUser,
} from "@/server/auth/guard";

const quickLinks = [
  {
    title: "Calendrier",
    description:
      "Répétitions, concerts et événements.",
    href:
      "/membre/calendrier",
    icon:
      CalendarDays,
    permission:
      "calendar" as const,
  },
  {
    title: "Répertoire",
    description:
      "Morceaux, partitions et fichiers audio.",
    href:
      "/membre/ressources",
    icon:
      Music2,
    permission:
      "resources" as const,
  },
  {
    title: "Galerie",
    description:
      "Photos de la chorale.",
    href:
      "/membre/galerie",
    icon:
      Images,
    permission:
      "gallery" as const,
  },
];

export default async function MemberPage() {
  const user =
    await requireUser();

  const visibleQuickLinks =
    quickLinks.filter(
      (item) =>
        hasRolePermission(
          user,
          item.permission,
        ),
    );

  return (
    <main>
      <DashboardHeader
        eyebrow={
          getRoleLabel(
            user.role,
            user.custom_role_name,
          )
        }
        title={`Bonjour ${user.firstname}`}
      />

      {visibleQuickLinks.length >
        0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Accès rapides
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleQuickLinks.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                      <Icon
                        size={18}
                      />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-slate-950">
                      {
                        item.title
                      }
                    </h3>

                    <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
                      {
                        item.description
                      }
                    </p>

                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                      Ouvrir

                      <ArrowRight
                        size={14}
                        className="transition group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        </section>
      )}
    </main>
  );
}
