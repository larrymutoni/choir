import {
  GalleryView,
} from "@/components/gallery/GalleryView";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  requireUser,
} from "@/server/auth/guard";

import {
  listGallery,
} from "@/server/gallery/repository";

export default async function GalleryPage() {
  const user =
    await requireUser();

  const gallery =
    await listGallery();

  return (
    <GalleryView
      albums={
        gallery.albums
      }
      media={
        gallery.media
      }
      canManage={
        hasRolePermission(
          user,
          "gallery",
        )
      }
    />
  );
}
