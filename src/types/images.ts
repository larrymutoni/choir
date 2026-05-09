export type SiteImage = {
  id: string;
  key: string;
  label: string;
  path: string;
  alt_text: string;
  updated_at: string;
};

export type GalleryImage = {
  id: string;
  title: string;
  alt_text: string;
  category: string;
  path: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};
