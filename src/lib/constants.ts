export const SITE_NAME = "Chorale Rayon de Soleil";
export const SITE_LOCATION = "Lyon 6";
export const SUPABASE_IMAGE_BUCKET = "chorale-images";

export const PUBLIC_NAV_ITEMS = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/a-propos" },
  { label: "Activités", href: "/activites" },
  { label: "Concerts", href: "/concerts" },
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
    key: "activities_main",
    label: "Image page activités",
    path: "site/activities_main.webp",
  },
  {
    key: "contact_banner",
    label: "Image page contact",
    path: "site/contact_banner.webp",
  },
] as const;
