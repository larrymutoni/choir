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
  LayoutDashboard,
  LogOut,
  Menu,
  PanelsTopLeft,
  Settings,
  Type,
  UserRound,
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

function NavigationIcon({
  iconKey,
}: {
  iconKey: DashboardIconKey;
}) {
  if (iconKey === "dashboard") {
    return <LayoutDashboard size={18} />;
  }

  if (iconKey === "calendar") {
    return <CalendarRange size={18} />;
  }

  if (iconKey === "directory") {
    return <BookOpen size={18} />;
  }

  if (iconKey === "resources") {
    return <FolderOpen size={18} />;
  }

  if (iconKey === "events") {
    return <CalendarDays size={18} />;
  }

  if (iconKey === "content") {
    return <Type size={18} />;
  }

  if (
    iconKey === "images" ||
    iconKey === "siteGallery"
  ) {
    return <ImageIcon size={18} />;
  }

  if (iconKey === "settings") {
    return <Settings size={18} />;
  }

  if (iconKey === "profile") {
    return <UserRound size={18} />;
  }

  return <LayoutDashboard size={18} />;
}

function isActive(
  pathname: string,
  href: string,
) {
  if (href === "/membre") {
    return pathname === "/membre";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

export function DashboardShell({
  children,
  links,
  user,
}: DashboardShellProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const mainLinks =
    links.filter(
      (link) =>
        link.group ===
        "main",
    );

  const managementLinks =
    links.filter(
      (link) =>
        link.group ===
        "management",
    );

  const accountLinks =
    links.filter(
      (link) =>
        link.group ===
        "account",
    );

  const managementActive =
    managementLinks.some(
      (link) =>
        isActive(
          pathname,
          link.href,
        ),
    );

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    managementOpen,
    setManagementOpen,
  ] = useState(
    managementActive,
  );

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(
      true,
    );

    try {
      await fetch(
        "/api/auth/logout",
        {
          method:
            "POST",
        },
      );
    } finally {
      router.replace(
        "/connexion",
      );

      router.refresh();
    }
  }

  function NavLink({
    link,
    mobile = false,
    compact = false,
  }: {
    link:
      DashboardNavigationItem;
    mobile?: boolean;
    compact?: boolean;
  }) {
    const active =
      isActive(
        pathname,
        link.href,
      );

    return (
      <Link
        href={link.href}
        onClick={() => {
          if (mobile) {
            setMobileOpen(
              false,
            );
          }
        }}
        className={[
          "group flex items-center gap-3 rounded-xl transition",
          compact
            ? "min-h-9 px-3 py-1.5 text-[13px]"
            : "min-h-10 px-3 py-2 text-sm",
          active
            ? "bg-[#e7ece3] font-bold text-[#1f1f1a]"
            : "font-semibold text-[#68665f] hover:bg-white hover:text-[#1f1f1a]",
        ].join(" ")}
      >
        <span
          className={[
            "shrink-0 transition",
            active
              ? "text-[#687a5e]"
              : "text-[#9a9991] group-hover:text-[#687a5e]",
          ].join(" ")}
        >
          <NavigationIcon
            iconKey={
              link.iconKey
            }
          />
        </span>

        <span className="min-w-0 flex-1 truncate">
          {link.label}
        </span>
      </Link>
    );
  }

  function Navigation({
    mobile = false,
  }: {
    mobile?: boolean;
  }) {
    return (
      <div className="flex min-h-full flex-col">
        <nav className="space-y-1">
          {mainLinks.map(
            (link) => (
              <NavLink
                key={
                  link.href
                }
                link={link}
                mobile={
                  mobile
                }
              />
            ),
          )}

          {managementLinks.length >
            0 && (
            <div className="pt-3">
              <button
                type="button"
                onClick={() =>
                  setManagementOpen(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
                className={[
                  "group flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                  managementActive
                    ? "bg-[#f0f2ed] font-bold text-[#1f1f1a]"
                    : "font-semibold text-[#68665f] hover:bg-white hover:text-[#1f1f1a]",
                ].join(
                  " ",
                )}
              >
                <span
                  className={
                    managementActive
                      ? "text-[#687a5e]"
                      : "text-[#9a9991]"
                  }
                >
                  <PanelsTopLeft
                    size={
                      18
                    }
                  />
                </span>

                <span className="min-w-0 flex-1 truncate">
                  Gestion du site
                </span>

                <ChevronDown
                  size={15}
                  className={[
                    "shrink-0 text-[#99968e] transition-transform duration-200",
                    managementOpen
                      ? "rotate-180"
                      : "",
                  ].join(
                    " ",
                  )}
                />
              </button>

              {managementOpen && (
                <div className="ml-[21px] mt-1 space-y-0.5 border-l border-[#dedbd2] pl-3">
                  {managementLinks.map(
                    (
                      link,
                    ) => (
                      <NavLink
                        key={
                          link.href
                        }
                        link={
                          link
                        }
                        mobile={
                          mobile
                        }
                        compact
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="mt-auto space-y-1 pt-6">
          {accountLinks.map(
            (link) => (
              <NavLink
                key={
                  link.href
                }
                link={link}
                mobile={
                  mobile
                }
              />
            ),
          )}

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#817e75] transition hover:bg-white hover:text-[#1f1f1a]"
          >
            <ExternalLink
              size={17}
            />
            Voir le site public
          </a>
        </div>
      </div>
    );
  }

  const initials =
    `${user.firstname.charAt(
      0,
    )}${user.lastname.charAt(
      0,
    )}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f5ef] lg:flex lg:h-screen lg:overflow-hidden">
      <aside className="hidden w-[228px] shrink-0 border-r border-[#e6e1d6] bg-[#f7f5ef] lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-[104px] shrink-0 items-center px-5">
          <Link href="/membre">
            <img
              src="/images/logo-chorale.png"
              alt="Chorale Rayon de Soleil Lyon 6"
              className="max-h-[68px] w-[108px] object-contain object-left"
            />
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <Navigation />
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
        <header className="hidden h-16 shrink-0 items-center justify-end border-b border-[#e6e1d6] bg-[#f7f5ef] px-8 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6ebe2] text-xs font-black text-[#687a5e]">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="max-w-44 truncate text-sm font-bold text-[#1f1f1a]">
                {
                  user.firstname
                }{" "}
                {
                  user.lastname
                }
              </p>

              <p className="text-[10px] font-semibold text-[#8a877f]">
                {getRoleLabel(
                  user.role,
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void logout()
              }
              disabled={
                loggingOut
              }
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl text-[#8c8981] transition hover:bg-white hover:text-[#1f1f1a]"
              aria-label="Se déconnecter"
            >
              <LogOut
                size={17}
              />
            </button>
          </div>
        </header>

        <header className="sticky top-0 z-40 border-b border-[#e6e1d6] bg-[#f7f5ef]/95 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link
              href="/membre"
              onClick={() =>
                setMobileOpen(
                  false,
                )
              }
            >
              <img
                src="/images/logo-chorale.png"
                alt="Chorale Rayon de Soleil Lyon 6"
                className="max-h-11 w-[88px] object-contain object-left"
              />
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  true,
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1f1f1a] hover:bg-white"
              aria-label="Ouvrir le menu"
            >
              <Menu
                size={20}
              />
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false,
                )
              }
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
              aria-label="Fermer le menu"
            />

            <aside className="absolute right-0 top-0 flex h-full w-[min(86vw,320px)] flex-col bg-[#f7f5ef] shadow-2xl">
              <div className="flex h-16 items-center justify-between border-b border-[#e6e1d6] px-4">
                <img
                  src="/images/logo-chorale.png"
                  alt="Chorale Rayon de Soleil Lyon 6"
                  className="max-h-11 w-[88px] object-contain object-left"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMobileOpen(
                      false,
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white"
                  aria-label="Fermer le menu"
                >
                  <X
                    size={19}
                  />
                </button>
              </div>

              <div className="border-b border-[#e6e1d6] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6ebe2] text-xs font-black text-[#687a5e]">
                    {
                      initials
                    }
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1f1f1a]">
                      {
                        user.firstname
                      }{" "}
                      {
                        user.lastname
                      }
                    </p>

                    <p className="text-[10px] font-semibold text-[#8a877f]">
                      {getRoleLabel(
                        user.role,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                <Navigation
                  mobile
                />
              </div>

              <div className="border-t border-[#e6e1d6] p-3">
                <button
                  type="button"
                  onClick={() =>
                    void logout()
                  }
                  disabled={
                    loggingOut
                  }
                  className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#77746d] hover:bg-white"
                >
                  <LogOut
                    size={17}
                  />

                  {loggingOut
                    ? "Déconnexion..."
                    : "Se déconnecter"}
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
