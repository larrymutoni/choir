import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContentForm } from "@/components/admin/ContentForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { contentArrayToMap } from "@/lib/content";

const contentFields = [
  {
    key: "home_hero_title",
    label: "Titre principal de l’accueil",
    type: "textarea" as const,
  },
  {
    key: "home_hero_description",
    label: "Description de l’accueil",
    type: "textarea" as const,
  },
  {
    key: "about_intro",
    label: "Introduction page À propos",
    type: "textarea" as const,
  },
  {
    key: "activities_intro",
    label: "Introduction page Activités",
    type: "textarea" as const,
  },
  {
    key: "contact_intro",
    label: "Introduction page Contact",
    type: "textarea" as const,
  },
];

export default async function AdminContentPage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("site_content")
    .select("key, value")
    .order("key");

  if (error) {
    throw new Error(error.message);
  }

  const content = contentArrayToMap(data);

  const items = contentFields.map((field) => ({
    ...field,
    value: content[field.key] ?? "",
  }));

  return (
    <main>
      <AdminHeader
        title="Contenu"
        description="Modifier les textes principaux du site public."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <ContentForm items={items} />

        <aside className="rounded-[2rem] bg-[#202020] p-6 text-white shadow-sm">
          <h2 className="text-2xl font-black">Conseil</h2>

          <p className="mt-4 leading-7 text-white/70">
            Garde les textes courts et clairs. Pour l’accueil, vise une phrase
            forte, puis une description simple. Les longs textes iront plutôt
            dans les pages À propos ou Activités.
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-bold text-[#f4b321]">
              Après enregistrement
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Retourne sur la page d’accueil pour vérifier le rendu.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
