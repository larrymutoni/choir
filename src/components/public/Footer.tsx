import Link from "next/link";
import { Mail, MapPin, Music } from "lucide-react";
import { PUBLIC_NAV_ITEMS, SITE_LOCATION, SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function Footer() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contact_settings")
    .select("email, phone, address")
    .limit(1)
    .single();

  const email = data?.email || "contact@chorale-soleil.fr";
  const address = data?.address || "Lyon 6e arrondissement";
  const phone = data?.phone || "";

  return (
    <footer className="bg-[#202020] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9552f] text-xl font-black text-white">
              ☀
            </div>

            <div>
              <p className="text-lg font-black">{SITE_NAME}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                {SITE_LOCATION}
              </p>
            </div>
          </Link>

          <p className="mt-6 max-w-md text-base leading-8 text-white/70">
            Une chorale chaleureuse pour chanter, partager et faire vivre la
            musique à Lyon.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white/50">
            Navigation
          </h3>

          <div className="mt-5 grid gap-3">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-white/75 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white/50">
            Contact
          </h3>

          <div className="mt-5 grid gap-4 text-sm text-white/75">
            <p className="flex gap-3">
              <MapPin size={18} className="mt-0.5 text-[#f4b321]" />
              {address}
            </p>

            <p className="flex gap-3">
              <Mail size={18} className="mt-0.5 text-[#f4b321]" />
              {email}
            </p>

            {phone && (
              <p className="flex gap-3">
                <Music size={18} className="mt-0.5 text-[#f4b321]" />
                {phone}
              </p>
            )}

            <p className="flex gap-3">
              <Music size={18} className="mt-0.5 text-[#f4b321]" />
              Répétitions et concerts selon calendrier
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-white/50 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 {SITE_NAME}. Tous droits réservés.</p>
          <Link href="/admin/login" className="hover:text-white">
            Administration
          </Link>
        </div>
      </div>
    </footer>
  );
}
