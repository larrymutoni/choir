import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  ImageIcon,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  Type,
} from "lucide-react";
import type { AdminIconKey, AdminNavigationItem } from "@/lib/admin-navigation";

type AdminSidebarProps = {
  links: AdminNavigationItem[];
  unreadMessagesCount: number;
};

function AdminIcon({ iconKey }: { iconKey: AdminIconKey }) {
  if (iconKey === "dashboard") return <LayoutDashboard size={18} />;
  if (iconKey === "content") return <Type size={18} />;
  if (iconKey === "image") return <ImageIcon size={18} />;
  if (iconKey === "calendar") return <CalendarDays size={18} />;
  if (iconKey === "messages") return <Mail size={18} />;
  if (iconKey === "settings") return <Settings size={18} />;
  if (iconKey === "admins") return <ShieldCheck size={18} />;

  return <LayoutDashboard size={18} />;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AdminSidebar({
  links,
  unreadMessagesCount,
}: AdminSidebarProps) {
  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-[#e6e1d6] bg-[#f7f5ef] p-5 lg:sticky lg:top-0 lg:flex lg:flex-col lg:overflow-y-auto">
      <div>
        <Link href="/admin" className="mb-9 block">
          <img
            src="/images/logo-chorale.png"
            alt="Chorale Rayon de Soleil Lyon 6"
            className="h-auto w-[135px] object-contain"
          />
        </Link>

        <nav className="grid gap-2">
          {links.map((link) => {
            const isMessages = link.iconKey === "messages";

            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#5d5a52] transition hover:bg-white hover:text-[#1f1f1a] hover:shadow-sm"
              >
                <span className="text-[#687a5e]">
                  <AdminIcon iconKey={link.iconKey} />
                </span>

                {link.label}

                {isMessages && <Badge count={unreadMessagesCount} />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-6">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#1f1f1a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#34342d]"
        >
          Visiter le site
          <ExternalLink size={16} />
        </a>
      </div>
    </aside>
  );
}
