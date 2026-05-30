"use client";

import Link from "next/link";
import {
  CalendarDays,
  ImageIcon,
  LayoutDashboard,
  Mail,
  Menu,
  Settings,
  ShieldCheck,
  Type,
  X,
} from "lucide-react";
import { useState } from "react";
import type { AdminIconKey, AdminNavigationItem } from "@/lib/admin-navigation";

type AdminMobileNavProps = {
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

export function AdminMobileNav({
  links,
  unreadMessagesCount,
}: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-50 border-b border-[#e6e1d6] bg-[#f7f5ef]/95 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-5">
          <Link href="/admin">
            <img
              src="/images/logo-chorale.png"
              alt="Chorale Rayon de Soleil Lyon 6"
              className="h-auto w-[112px] object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dcd6ca] bg-white text-[#1f1f1a]"
            aria-label="Ouvrir le menu admin"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}

            {unreadMessagesCount > 0 && (
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-red-600 ring-2 ring-[#f7f5ef]" />
            )}
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="border-b border-[#e6e1d6] bg-[#f7f5ef] px-5 py-4">
          <nav className="grid gap-2">
            {links.map((link) => {
              const isMessages = link.iconKey === "messages";

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#5d5a52] shadow-sm"
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
      )}
    </div>
  );
}
