export const SITE_NAME = "Chorale Rayon de Soleil";
export const SITE_LOCATION = "Lyon 6";

export const DEFAULT_CONTACT_EMAIL = "contact@chorale-soleil.fr";
export const DEFAULT_CONTACT_ADDRESS = "33 rue Bossuet, 69006 Lyon";
export const DEFAULT_GOOGLE_FORM_URL = "https://forms.google.com";
export const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop";

export const PUBLIC_NAV_ITEMS = [
  { label: "Accueil", href: "/" },
  { label: "La chorale", href: "/a-propos" },
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

export const SUPABASE_IMAGE_BUCKET = "chorale-images";
