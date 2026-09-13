export type DashboardRole =
  | "member"
  | "admin"
  | "super_admin";

export type DashboardIconKey =
  | "dashboard"
  | "calendar"
  | "directory"
  | "resources"
  | "profile"
  | "events"
  | "content"
  | "images"
  | "siteGallery"
  | "settings";

export type DashboardNavigationItem = {
  label: string;
  href: string;
  iconKey: DashboardIconKey;
  roles: DashboardRole[];
  group: "main" | "management" | "account";
};

const ALL_ROLES: DashboardRole[] = [
  "member",
  "admin",
  "super_admin",
];

const MANAGEMENT_ROLES: DashboardRole[] = [
  "admin",
  "super_admin",
];

export const dashboardNavigationItems:
  DashboardNavigationItem[] = [
    {
      label: "Tableau de bord",
      href: "/membre",
      iconKey: "dashboard",
      roles: ALL_ROLES,
      group: "main",
    },
    {
      label: "Calendrier",
      href: "/membre/calendrier",
      iconKey: "calendar",
      roles: ALL_ROLES,
      group: "main",
    },
    {
      label: "Membres",
      href: "/membre/repertoire",
      iconKey: "directory",
      roles: ALL_ROLES,
      group: "main",
    },
    {
      label: "Répertoire",
      href: "/membre/ressources",
      iconKey: "resources",
      roles: ALL_ROLES,
      group: "main",
    },

    {
      label: "Événements",
      href: "/admin/evenements",
      iconKey: "events",
      roles: MANAGEMENT_ROLES,
      group: "management",
    },
    {
      label: "Contenu",
      href: "/admin/contenu",
      iconKey: "content",
      roles: MANAGEMENT_ROLES,
      group: "management",
    },
    {
      label: "Images",
      href: "/admin/images",
      iconKey: "images",
      roles: MANAGEMENT_ROLES,
      group: "management",
    },
    {
      label: "Galerie",
      href: "/admin/galerie",
      iconKey: "siteGallery",
      roles: MANAGEMENT_ROLES,
      group: "management",
    },
    {
      label: "Paramètres",
      href: "/admin/settings",
      iconKey: "settings",
      roles: MANAGEMENT_ROLES,
      group: "management",
    },

    {
      label: "Mon profil",
      href: "/membre/profil",
      iconKey: "profile",
      roles: ALL_ROLES,
      group: "account",
    },
  ];

export function getDashboardNavigation(
  role: DashboardRole,
) {
  return dashboardNavigationItems.filter(
    (item) =>
      item.roles.includes(role),
  );
}

export function getRoleLabel(
  role: DashboardRole,
) {
  if (role === "super_admin") {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return "Membre";
}
