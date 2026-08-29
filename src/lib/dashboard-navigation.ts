export type DashboardRole = "member" | "admin" | "super_admin";

export type DashboardIconKey =
  | "dashboard"
  | "calendar"
  | "directory"
  | "resources"
  | "memberGallery"
  | "profile"
  | "content"
  | "images"
  | "siteGallery"
  | "events"
  | "users"
  | "emails"
  | "settings";

export type DashboardNavigationItem = {
  label: string;
  href: string;
  iconKey: DashboardIconKey;
  roles: DashboardRole[];
  comingSoon?: boolean;
};

const ALL_ROLES: DashboardRole[] = ["member", "admin", "super_admin"];

const MANAGEMENT_ROLES: DashboardRole[] = ["admin", "super_admin"];

export const dashboardNavigationItems: DashboardNavigationItem[] = [
  {
    label: "Tableau de bord",
    href: "/membre",
    iconKey: "dashboard",
    roles: ALL_ROLES,
  },
  {
    label: "Calendrier",
    href: "/membre/calendrier",
    iconKey: "calendar",
    roles: ALL_ROLES,
    comingSoon: true,
  },
  {
    label: "Répertoire",
    href: "/membre/repertoire",
    iconKey: "directory",
    roles: ALL_ROLES,
    comingSoon: true,
  },
  {
    label: "Ressources",
    href: "/membre/ressources",
    iconKey: "resources",
    roles: ALL_ROLES,
    comingSoon: true,
  },
  {
    label: "Galerie membres",
    href: "/membre/galerie",
    iconKey: "memberGallery",
    roles: ALL_ROLES,
    comingSoon: true,
  },
  {
    label: "Mon profil",
    href: "/membre/profil",
    iconKey: "profile",
    roles: ALL_ROLES,
  },
  {
    label: "Événements",
    href: "/admin/evenements",
    iconKey: "events",
    roles: MANAGEMENT_ROLES,
  },
  {
    label: "Contenu",
    href: "/admin/contenu",
    iconKey: "content",
    roles: MANAGEMENT_ROLES,
  },
  {
    label: "Images site",
    href: "/admin/images",
    iconKey: "images",
    roles: MANAGEMENT_ROLES,
  },
  {
    label: "Galerie du site",
    href: "/admin/galerie",
    iconKey: "siteGallery",
    roles: MANAGEMENT_ROLES,
  },
  {
    label: "Utilisateurs",
    href: "/admin/utilisateurs",
    iconKey: "users",
    roles: MANAGEMENT_ROLES,
  },
  {
    label: "Emails autorisés",
    href: "/admin/emails",
    iconKey: "emails",
    roles: MANAGEMENT_ROLES,
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    iconKey: "settings",
    roles: MANAGEMENT_ROLES,
  },
];

export function getDashboardNavigation(role: DashboardRole) {
  return dashboardNavigationItems.filter((item) => item.roles.includes(role));
}

export function getRoleLabel(role: DashboardRole) {
  if (role === "super_admin") {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return "Membre";
}
