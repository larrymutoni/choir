export const SITE_NAME = "Chorale Rayon de Soleil";
export const SITE_LOCATION = "Lyon 6";

export const PUBLIC_NAV_ITEMS = [
  { label: "Accueil", href: "/" },
  { label: "La chorale", href: "/a-propos" },
  { label: "Activités", href: "/activites" },
  { label: "Galerie", href: "/galerie" },
  { label: "Contact", href: "/contact" },
] as const;

export const IMAGE_SLOTS = [
  {
    key: "home_hero",
    label: "Image principale accueil",
    path: "site/home_hero.webp",
  },
  {
    key: "about_main",
    label: "Image page à propos",
    path: "site/about_main.webp",
  },
  {
    key: "choir_director",
    label: "Photo chef de chœur",
    path: "site/choir_director.webp",
  },
  {
    key: "activities_main",
    label: "Image page activités",
    path: "site/activities_main.webp",
  },
  {
    key: "contact_banner",
    label: "Image page contact",
    path: "site/contact_banner.webp",
  },
  {
    key: "members_board",
    label: "Trombinoscope membres",
    path: "site/members_board.webp",
  },
] as const;

export const SUPABASE_IMAGE_BUCKET = "chorale-images";
