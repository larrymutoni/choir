import {
  requireUser,
} from "@/server/auth/guard";

export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return children;
}
