import { SitePageTransition } from "@/components/public/SitePageTransition";

export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SitePageTransition>{children}</SitePageTransition>;
}
