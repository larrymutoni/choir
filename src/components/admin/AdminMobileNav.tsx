"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { AdminIconKey, AdminNavigationItem } from "@/lib/admin-navigation";
import { AdminIcon } from "@/components/admin/AdminSidebar";

type AdminMobileNavProps = {
  links: AdminNavigationItem[];
};

export function AdminMobileNav({ links }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-50 border-b border-[#e6e1d6] bg-[#f7f5ef]/95 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-5">
          <Link href="/admin">
            <Image
              src="/images/logo-chorale.png"
              alt="Chorale Rayon de Soleil Lyon 6"
              width={112}
              height={45}
              style={{ height: "auto" }}
              className="w-[112px] object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dcd6ca] bg-white text-[#1f1f1a]"
            aria-label="Ouvrir le menu admin"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="border-b border-[#e6e1d6] bg-[#f7f5ef] px-5 py-4">
          <nav className="grid gap-2">
            {links.map((link) => (
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
              </Link>
            ))}

            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="mt-2 rounded-2xl bg-[#687a5e] px-4 py-3 text-center text-sm font-bold text-white"
            >
              Voir le site public
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
