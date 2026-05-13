import Link from "next/link";
import Image from "next/image";
import { LockKeyhole, Mail, MapPin, Phone } from "lucide-react";
import { PUBLIC_NAV_ITEMS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function Footer() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contact_settings")
    .select("email, phone, address")
    .limit(1)
    .single();

  const email = data?.email || "contact@chorale-soleil.fr";
  const address = data?.address || "33 rue Bossuet, 69006 Lyon";
  const phone = data?.phone || "";

  return (
    <footer className="mt-14 bg-[#1f1f1a] text-white">
      <div className="page-shell grid gap-10 py-10 md:grid-cols-[1.1fr_0.8fr_1.1fr]">
        <div>
          <Image
            src="/images/logo-chorale.png"
            alt="Chorale Rayon de Soleil Lyon 6"
            width={135}
            height={54}
            style={{ height: "auto" }}
            className="w-[135px] object-contain brightness-110"
          />

          <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
            Une chorale conviviale à Lyon 6, autour du plaisir de chanter
            ensemble et de partager un répertoire varié.
          </p>

          <Link
            href="/admin/login"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-medium text-white/75 transition hover:bg-white hover:text-[#1f1f1a]"
          >
            <LockKeyhole size={15} />
            Accès administrateur
          </Link>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white/42">
            Navigation
          </h3>

          <div className="mt-4 grid gap-2">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-white/70 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white/42">
            Infos pratiques
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-white/70">
            <p className="flex gap-3">
              <MapPin size={17} className="mt-0.5 text-[#d8bf7a]" />
              {address}
            </p>

            <p className="flex gap-3">
              <Mail size={17} className="mt-0.5 text-[#d8bf7a]" />
              {email}
            </p>

            {phone && (
              <p className="flex gap-3">
                <Phone size={17} className="mt-0.5 text-[#d8bf7a]" />
                {phone}
              </p>
            )}

            <p className="text-white/55">
              Cours collectifs hebdomadaires le mardi.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-3 py-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Chorale Rayon de Soleil Lyon 6.</p>

          <a
            href="mailto:larrycarnot@gmail.com"
            className="inline-flex w-fit rounded-full border border-white/10 px-3 py-1.5 text-white/70 transition hover:bg-white hover:!text-[#1f1f1a]"
          >
            Site développé par Larry Mutoni
          </a>
        </div>
      </div>
    </footer>
  );
}
