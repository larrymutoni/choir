"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { PUBLIC_NAV_ITEMS, SITE_LOCATION, SITE_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8ded2] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9552f] text-xl font-black text-white shadow-sm">
            ☀
          </div>

          <div className="leading-tight">
            <p className="text-base font-black text-[#141414] sm:text-lg">
              {SITE_NAME}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#675e56]">
              {SITE_LOCATION}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-[#675e56] transition hover:text-[#e9552f]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href="/contact">Nous rejoindre</Button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e8ded2] bg-white text-[#141414] lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Ouvrir le menu"
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-[#e8ded2] bg-white px-5 py-5 lg:hidden">
          <nav className="flex flex-col gap-4">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-2xl px-4 py-3 text-base font-semibold text-[#141414] hover:bg-[#fff1df]"
              >
                {item.label}
              </Link>
            ))}

            <Button href="/contact" className="mt-2 w-full">
              Nous rejoindre
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
