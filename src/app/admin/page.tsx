import Link from "next/link";
import { CalendarDays, ImageIcon, Type, Users } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const supabase = createAdminClient();

  const [
    { count: eventsCount },
    { count: galleryCount },
    { count: contentCount },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("is_visible", true),
    supabase
      .from("gallery_images")
      .select("id", { count: "exact", head: true }),
    supabase.from("site_content").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    {
      title: "Événements actifs",
      value: eventsCount ?? 0,
      href: "/admin/evenements",
      icon: CalendarDays,
    },
    {
      title: "Images galerie",
      value: galleryCount ?? 0,
      href: "/admin/galerie",
      icon: ImageIcon,
    },
    {
      title: "Textes éditables",
      value: contentCount ?? 0,
      href: "/admin/contenu",
      icon: Type,
    },
    {
      title: "Admin actif",
      value: 1,
      href: "/admin/settings",
      icon: Users,
    },
  ];

  return (
    <main>
      <AdminHeader
        title="Dashboard"
        description="Vue d’ensemble du contenu administrable du site."
        email={session.email}
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-[2rem] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1df] text-[#e9552f]">
                <Icon size={24} />
              </div>

              <p className="mt-6 text-4xl font-black text-[#141414]">
                {card.value}
              </p>

              <p className="mt-2 text-sm font-bold text-[#675e56]">
                {card.title}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[#141414]">
            Actions rapides
          </h2>

          <div className="mt-6 grid gap-4">
            <Link
              href="/admin/contenu"
              className="rounded-2xl border border-[#e8ded2] p-5 transition hover:bg-[#fff8ec]"
            >
              <p className="font-black text-[#141414]">
                Modifier les textes du site
              </p>
              <p className="mt-1 text-sm text-[#675e56]">
                Accueil, à propos, activités, contact.
              </p>
            </Link>

            <Link
              href="/admin/images"
              className="rounded-2xl border border-[#e8ded2] p-5 transition hover:bg-[#fff8ec]"
            >
              <p className="font-black text-[#141414]">
                Remplacer les images principales
              </p>
              <p className="mt-1 text-sm text-[#675e56]">
                Hero, à propos, activités, contact.
              </p>
            </Link>

            <Link
              href="/admin/evenements"
              className="rounded-2xl border border-[#e8ded2] p-5 transition hover:bg-[#fff8ec]"
            >
              <p className="font-black text-[#141414]">
                Gérer les concerts et événements
              </p>
              <p className="mt-1 text-sm text-[#675e56]">
                Ajouter, modifier ou masquer une date.
              </p>
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-[#202020] p-6 text-white shadow-sm">
          <h2 className="text-2xl font-black">Prochaine étape</h2>

          <p className="mt-4 leading-7 text-white/70">
            Nous allons maintenant créer les pages admin pour modifier le
            contenu, puis gérer les événements, puis les images.
          </p>

          <Link
            href="/admin/contenu"
            className="mt-6 inline-flex rounded-full bg-[#e9552f] px-5 py-3 text-sm font-bold text-white"
          >
            Commencer par le contenu
          </Link>
        </div>
      </section>
    </main>
  );
}
