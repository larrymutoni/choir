"use client";

import Link from "next/link";

import {
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
  UsersRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import NotificationBell from "@/components/dashboard/NotificationBell";
import { ToastViewport } from "@/components/ui/ToastViewport";

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
  avatarKey: string | null;
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
    return (
      <LayoutDashboard
        size={18}
      />
    );
  }

  if (iconKey === "calendar") {
    return (
      <CalendarRange
        size={18}
      />
    );
  }

  if (iconKey === "resources") {
    return (
      <FolderOpen
        size={18}
      />
    );
  }

  if (iconKey === "members") {
    return (
      <UsersRound
        size={18}
      />
    );
  }

  if (iconKey === "content") {
    return (
      <Type
        size={18}
      />
    );
  }

  if (
    iconKey === "images" ||
    iconKey === "siteGallery"
  ) {
    return (
      <ImageIcon
        size={18}
      />
    );
  }

  if (iconKey === "settings") {
    return (
      <Settings
        size={18}
      />
    );
  }

  return (
    <LayoutDashboard
      size={18}
    />
  );
}

function isActive(
  pathname: string,
  href: string,
) {
  if (href === "/membre") {
    return (
      pathname === "/membre"
    );
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
        link.group === "main",
    );

  const managementLinks =
    links.filter(
      (link) =>
        link.group ===
        "management",
    );

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    managementOpen,
    setManagementOpen,
  ] = useState(true);

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    avatarFailed,
    setAvatarFailed,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user.avatarKey]);

  const currentLink =
    [
      ...mainLinks,
      ...managementLinks,
    ].find((link) =>
      isActive(
        pathname,
        link.href,
      ),
    );

  const pageTitle =
    pathname ===
    "/membre/profil"
      ? "Mon profil"
      : currentLink?.label ??
        (pathname.startsWith(
          "/admin",
        )
          ? "Administration"
          : "Espace membre");

  const initials =
    `${user.firstname.charAt(
      0,
    )}${user.lastname.charAt(
      0,
    )}`.toUpperCase();

  const avatarUrl =
    user.avatarKey
      ? `/api/member/profile/avatar?v=${encodeURIComponent(
          user.avatarKey,
        )}`
      : null;

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );
    } finally {
      router.replace(
        "/connexion",
      );

      router.refresh();
    }
  }

  function UserAvatar({
    size = "md",
  }: {
    size?: "sm" | "md";
  }) {
    const sizeClass =
      size === "sm"
        ? "h-9 w-9 text-[11px]"
        : "h-10 w-10 text-xs";

    return (
      <div
        className={[
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 font-bold text-white ring-1 ring-slate-200",
          sizeClass,
        ].join(" ")}
      >
        {avatarUrl &&
        !avatarFailed ? (
          <img
            key={
              user.avatarKey ??
              "avatar"
            }
            src={avatarUrl}
            alt={`${user.firstname} ${user.lastname}`}
            onError={() =>
              setAvatarFailed(
                true,
              )
            }
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
    );
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
          "group flex items-center gap-3 rounded-lg transition-all duration-150",
          compact
            ? "min-h-9 px-3 py-1.5 text-[13px]"
            : "min-h-10 px-3 py-2 text-sm",
          active
            ? "bg-slate-900 font-semibold text-white shadow-sm"
            : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        ].join(" ")}
      >
        <span
          className={[
            "shrink-0 transition",
            active
              ? "text-white"
              : "text-slate-400 group-hover:text-slate-700",
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
        <div>
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
          </nav>
        </div>

        {managementLinks.length >
          0 && (
          <div className="mt-7">
            <button
              type="button"
              onClick={() =>
                setManagementOpen(
                  (current) =>
                    !current,
                )
              }
              className="mb-2 flex w-full items-center gap-2 px-3 text-left"
            >
              <PanelsTopLeft
                size={14}
                className="text-slate-400"
              />

              <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Administration
              </span>

              <ChevronDown
                size={14}
                className={[
                  "text-slate-400 transition-transform",
                  managementOpen
                    ? "rotate-180"
                    : "",
                ].join(" ")}
              />
            </button>

            {managementOpen && (
              <nav className="space-y-1">
                {managementLinks.map(
                  (link) => (
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
              </nav>
            )}
          </div>
        )}

        <div className="mt-auto pt-8">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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

  return (
    <div className="min-h-screen bg-slate-50 lg:flex lg:h-screen lg:overflow-hidden">
      <ToastViewport />

      <aside className="hidden w-[230px] shrink-0 border-r border-slate-200 bg-white lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-[72px] shrink-0 items-center border-b border-slate-100 px-5">
          <Link
            href="/membre"
          >
            <img
              src="/images/logo-chorale.png"
              alt="Chorale Rayon de Soleil Lyon 6"
              className="max-h-[52px] w-[96px] object-contain object-left"
            />
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <Navigation />
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
        <header className="hidden h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-7 lg:flex">
          <h1 className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-950">
            {pageTitle}
          </h1>

          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="h-7 w-px bg-slate-200" />

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (current) =>
                      !current,
                  )
                }
                className={[
                  "flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left transition",
                  profileOpen
                    ? "border-slate-300 bg-slate-100"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                <UserAvatar />

                <div className="min-w-0 pr-1">
                  <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
                    {
                      user.firstname
                    }{" "}
                    {
                      user.lastname
                    }
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {getRoleLabel(
                      user.role,
                    )}
                  </p>
                </div>

                <ChevronDown
                  size={14}
                  className={[
                    "text-slate-400 transition-transform",
                    profileOpen
                      ? "rotate-180"
                      : "",
                  ].join(" ")}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4">
                    <UserAvatar />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {
                          user.firstname
                        }{" "}
                        {
                          user.lastname
                        }
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {user.email}
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-slate-400">
                        {getRoleLabel(
                          user.role,
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setProfileOpen(
                          false,
                        )
                      }
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Fermer"
                    >
                      <X
                        size={
                          15
                        }
                      />
                    </button>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/membre/profil"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      <UserRound
                        size={
                          17
                        }
                      />

                      Mon profil
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        void logout()
                      }
                      disabled={
                        loggingOut
                      }
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-50"
                    >
                      <LogOut
                        size={
                          17
                        }
                      />

                      {loggingOut
                        ? "Déconnexion..."
                        : "Se déconnecter"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {pageTitle}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <NotificationBell />

              <button
                type="button"
                onClick={() =>
                  setMobileOpen(
                    true,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100"
                aria-label="Ouvrir le menu"
              >
                <Menu
                  size={20}
                />
              </button>
            </div>
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
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
              aria-label="Fermer le menu"
            />

            <aside className="absolute right-0 top-0 flex h-full w-[min(86vw,320px)] flex-col bg-white shadow-2xl">
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100"
                  aria-label="Fermer"
                >
                  <X
                    size={19}
                  />
                </button>
              </div>

              <Link
                href="/membre/profil"
                onClick={() =>
                  setMobileOpen(
                    false,
                  )
                }
                className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 transition hover:bg-slate-50"
              >
                <UserAvatar />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {
                      user.firstname
                    }{" "}
                    {
                      user.lastname
                    }
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>

                <UserRound
                  size={17}
                  className="text-slate-400"
                />
              </Link>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
                <Navigation
                  mobile
                />
              </div>

              <div className="border-t border-slate-200 p-3">
                <button
                  type="button"
                  onClick={() =>
                    void logout()
                  }
                  disabled={
                    loggingOut
                  }
                  className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
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

        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 lg:px-7 lg:py-6 xl:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
