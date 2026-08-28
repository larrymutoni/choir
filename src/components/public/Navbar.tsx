"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { PUBLIC_NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e6e1d6]/80 bg-[#f7f5ef]/92 backdrop-blur-xl">
      <div className="page-shell flex h-24 items-center justify-between">
        <Link
          href="/"
          className="flex items-center"
          onClick={() => setIsOpen(false)}
        >
          <img
            src="/images/logo-chorale.png"
            alt="Chorale Rayon de Soleil Lyon 6"
            className="h-auto w-[118px] object-contain sm:w-[136px]"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#4f4d47] transition hover:text-[#1f1f1a]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href="/connexion" variant="secondary">
            Accès membres
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dcd6ca] bg-white text-[#1f1f1a] lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-[#e6e1d6] bg-[#f7f5ef] px-5 py-5 lg:hidden">
          <nav className="flex flex-col gap-2">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-2xl px-4 py-3 text-base font-semibold text-[#1f1f1a] hover:bg-white"
              >
                {item.label}
              </Link>
            ))}

            <Button
              href="/connexion"
              variant="secondary"
              className="mt-3 w-full"
            >
              Accès membres
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
