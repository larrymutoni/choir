import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("contact_settings")
    .select("email, phone, address, google_form_url")
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main>
      <AdminHeader
        title="Paramètres"
        description="Modifier les informations de contact et le lien du formulaire."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SettingsForm
          email={data?.email ?? "contact@chorale-soleil.fr"}
          phone={data?.phone ?? ""}
          address={data?.address ?? "Lyon 6e arrondissement"}
          googleFormUrl={data?.google_form_url ?? "https://forms.google.com"}
        />

        <aside className="rounded-[2rem] bg-[#202020] p-6 text-white shadow-sm">
          <h2 className="text-2xl font-black">Contact public</h2>

          <p className="mt-4 leading-7 text-white/70">
            Ces informations sont affichées sur la page Contact du site public.
            Le lien Google Forms est utilisé pour le bouton “Ouvrir le
            formulaire”.
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-bold text-[#f4b321]">
              À vérifier avant production
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Remplace l’email temporaire et le lien Google Forms par les vrais
              éléments de la chorale.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
