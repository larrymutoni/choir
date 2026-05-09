import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chorale Rayon de Soleil",
  description: "Site officiel de la Chorale Rayon de Soleil à Lyon 6.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
