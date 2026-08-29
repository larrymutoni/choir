"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ExternalLink,
  FolderOpen,
  ImageIcon,
  Images,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Menu,
  Settings,
  Type,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  getRoleLabel,
  type DashboardIconKey,
  type DashboardNavigationItem,
  type DashboardRole,
} from "@/lib/dashboard-navigation";

type DashboardUser = {
  firstname: string;
  lastname: string;
  email: string;
  role: DashboardRole;
};

type DashboardShellProps = {
  children: React.ReactNode;
  links: DashboardNavigationItem[];
  user: DashboardUser;
};

type AccountMenuProps = {
  user: DashboardUser;
  compact?: boolean;
  loggingOut: boolean;
  onLogout: () => void;
};

function NavigationIcon({ iconKey }: { iconKey: DashboardIconKey }) {
  if (iconKey === "dashboard") return <LayoutDashboard size={17} />;
  if (iconKey === "calendar") return <CalendarRange size={17} />;
  if (iconKey === "directory") return <BookOpen size={17} />;
  if (iconKey === "resources") return <FolderOpen size={17} />;
  if (iconKey === "memberGallery") return <Images size={17} />;
  if (iconKey === "profile") return <UserRound size={17} />;
  if (iconKey === "events") return <CalendarDays size={17} />;
  if (iconKey === "content") return <Type size={17} />;

  if (iconKey === "images" || iconKey === "siteGallery") {
    return <ImageIcon size={17} />;
  }

  if (iconKey === "users") return <Users size={17} />;
  if (iconKey === "emails") return <MailCheck size={17} />;
  if (iconKey === "settings") return <Settings size={17} />;

  return <LayoutDashboard size={17} />;
}

function isActive(pathname: string, href: string) {
  if (href === "/membre") {
    return pathname === "/membre";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function AccountMenu({
  user,
  compact = false,
  loggingOut,
  onLogout,
}: AccountMenuProps) {
  const initials =
    `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase();

  return (
    <details className="group relative">
      <summary
        className={[
          "flex cursor-pointer list-none items-center rounded-xl transition hover:bg-[#f3f0e8] [&::-webkit-details-marker]:hidden",
          compact ? "h-10 w-10 justify-center" : "gap-3 px-2.5 py-1.5",
        ].join(" ")}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6ebe2] text-xs font-black text-[#687a5e]">
          {initials}
        </span>

        {!compact && (
          <>
            <span className="min-w-0 text-left">
              <span className="block max-w-40 truncate text-sm font-bold text-[#1f1f1a]">
                {user.firstname} {user.lastname}
              </span>

              <span className="block text-[10px] font-semibold text-[#8a877f]">
                {getRoleLabel(user.role)}
              </span>
            </span>

            <ChevronDown
              size={15}
              className="text-[#908d85] transition group-open:rotate-180"
            />
          </>
        )}
      </summary>

      <div className="absolute right-0 top-full z-[70] mt-2 w-64 overflow-hidden rounded-2xl border border-[#e6e1d6] bg-white shadow-[0_18px_45px_rgba(31,31,26,0.12)]">
        <div className="border-b border-[#eeeae1] px-4 py-3.5">
          <p className="truncate text-sm font-bold text-[#1f1f1a]">
            {user.firstname} {user.lastname}
          </p>

          <p className="mt-0.5 truncate text-xs text-[#817e75]">{user.email}</p>

          {compact && (
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#687a5e]">
              {getRoleLabel(user.role)}
            </p>
          )}
        </div>

        <div className="p-2">
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#5d5a52] transition hover:bg-[#f7f5ef] hover:text-[#1f1f1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={16} />

            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      </div>
    </details>
  );
}

export function DashboardShell({ children, links, user }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/connexion");
      router.refresh();
    }
  }

  function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
    return (
      <nav className="space-y-1">
        {links.map((link) => {
          const active = isActive(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                if (mobile) {
                  setMobileOpen(false);
                }
              }}
              className={[
                "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "bg-[#e9ede5] font-bold text-[#1f1f1a]"
                  : "font-semibold text-[#66645d] hover:bg-white hover:text-[#1f1f1a]",
              ].join(" ")}
            >
              <span
                className={[
                  "shrink-0 transition",
                  active
                    ? "text-[#687a5e]"
                    : "text-[#98978f] group-hover:text-[#687a5e]",
                ].join(" ")}
              >
                <NavigationIcon iconKey={link.iconKey} />
              </span>

              <span className="min-w-0 flex-1 truncate">{link.label}</span>

              {link.comingSoon && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8bf7a]"
                  title="Bientôt disponible"
                />
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5ef] lg:flex lg:h-screen lg:overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-[248px] shrink-0 border-r border-[#e6e1d6] bg-[#f7f5ef] lg:flex lg:h-screen lg:flex-col">
        <div className="px-5 pb-5 pt-6">
          <Link href="/membre" className="inline-block">
            <img
              src="/images/logo-chorale.png"
              alt="Chorale Rayon de Soleil Lyon 6"
              className="h-auto w-[120px] object-contain"
            />
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <NavigationLinks />
        </div>

        <div className="border-t border-[#e6e1d6] p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[#817e75] transition hover:bg-white hover:text-[#1f1f1a]"
          >
            <ExternalLink size={14} />
            Voir le site public
          </a>
        </div>
      </aside>

      {/* Main area */}
      <div className="min-w-0 flex-1 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
        {/* Desktop top bar */}
        <header className="hidden h-16 shrink-0 items-center justify-end border-b border-[#e6e1d6] bg-[#f7f5ef]/95 px-6 backdrop-blur-xl lg:flex lg:px-8 xl:px-10">
          <AccountMenu user={user} loggingOut={loggingOut} onLogout={logout} />
        </header>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 border-b border-[#e6e1d6] bg-[#f7f5ef]/95 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Link href="/membre" onClick={() => setMobileOpen(false)}>
              <img
                src="/images/logo-chorale.png"
                alt="Chorale Rayon de Soleil Lyon 6"
                className="h-auto w-[96px]"
              />
            </Link>

            <div className="flex items-center gap-1.5">
              <AccountMenu
                user={user}
                compact
                loggingOut={loggingOut}
                onLogout={logout}
              />

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1f1f1a] transition hover:bg-white"
                aria-label="Ouvrir le menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile navigation drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />

            <aside className="absolute right-0 top-0 flex h-full w-[min(88vw,340px)] flex-col bg-[#f7f5ef] shadow-2xl">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#e6e1d6] px-5">
                <img
                  src="/images/logo-chorale.png"
                  alt="Chorale Rayon de Soleil Lyon 6"
                  className="h-auto w-[96px]"
                />

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1f1f1a] transition hover:bg-white"
                  aria-label="Fermer le menu"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                <NavigationLinks mobile />
              </div>

              <div className="border-t border-[#e6e1d6] p-3">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#69665f] transition hover:bg-white"
                >
                  <ExternalLink size={15} />
                  Voir le site public
                </a>
              </div>
            </aside>
          </div>
        )}

        {/* Page content */}
        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
