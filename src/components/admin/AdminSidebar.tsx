import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  ImageIcon,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Type,
} from "lucide-react";
import type { AdminIconKey, AdminNavigationItem } from "@/lib/admin-navigation";

type AdminSidebarProps = {
  links: AdminNavigationItem[];
};

export function AdminIcon({ iconKey }: { iconKey: AdminIconKey }) {
  if (iconKey === "dashboard") return <LayoutDashboard size={18} />;
  if (iconKey === "content") return <Type size={18} />;
  if (iconKey === "image") return <ImageIcon size={18} />;
  if (iconKey === "calendar") return <CalendarDays size={18} />;
  if (iconKey === "settings") return <Settings size={18} />;
  if (iconKey === "admins") return <ShieldCheck size={18} />;

  return <LayoutDashboard size={18} />;
}

export function AdminSidebar({ links }: AdminSidebarProps) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-[#e6e1d6] bg-[#f7f5ef] p-5 lg:block">
      <Link href="/admin" className="mb-9 block">
        <Image
          src="/images/logo-chorale.png"
          alt="Chorale Rayon de Soleil Lyon 6"
          width={135}
          height={54}
          style={{ height: "auto" }}
          className="w-[135px] object-contain"
        />
      </Link>

      <nav className="grid gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#5d5a52] transition hover:bg-white hover:text-[#1f1f1a] hover:shadow-sm"
          >
            <span className="text-[#687a5e]">
              <AdminIcon iconKey={link.iconKey} />
            </span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm font-black text-[#1f1f1a]">Site public</p>
        <p className="mt-2 text-sm leading-6 text-[#6d6b63]">
          Voir le rendu côté visiteur.
        </p>

        <Link
          href="/"
          className="mt-4 inline-flex rounded-full bg-[#687a5e] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#56664d]"
        >
          Ouvrir le site
        </Link>
      </div>
    </aside>
  );
}
