import Link from "next/link";
import {
  CalendarDays,
  Home,
  ImageIcon,
  LayoutDashboard,
  Music2,
  Settings,
  Type,
} from "lucide-react";

const adminLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Contenu",
    href: "/admin/contenu",
    icon: Type,
  },
  {
    label: "Images site",
    href: "/admin/images",
    icon: ImageIcon,
  },
  {
    label: "Galerie",
    href: "/admin/galerie",
    icon: Home,
  },
  {
    label: "Événements",
    href: "/admin/evenements",
    icon: CalendarDays,
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-[#202020] p-5 text-white lg:block">
      <Link href="/admin" className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9552f]">
          <Music2 size={25} />
        </div>

        <div>
          <p className="text-base font-black">Chorale Admin</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Lyon 6
          </p>
        </div>
      </Link>

      <nav className="grid gap-2">
        {adminLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Icon size={19} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 rounded-3xl bg-white/10 p-5">
        <p className="text-sm font-black">Site public</p>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Voir le rendu côté visiteur.
        </p>

        <Link
          href="/"
          className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#202020]"
        >
          Ouvrir le site
        </Link>
      </div>
    </aside>
  );
}
