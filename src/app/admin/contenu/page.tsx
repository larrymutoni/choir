import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContentForm } from "@/components/admin/ContentForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { contentArrayToMap } from "@/lib/content";
import { requirePermission } from "@/lib/auth";

const contentFields = [
  {
    key: "home_hero_title",
    label: "Accueil — grand titre",
    type: "textarea" as const,
  },
  {
    key: "home_hero_description",
    label: "Accueil — texte d’introduction",
    type: "textarea" as const,
  },
  {
    key: "home_about_title",
    label: "Accueil — titre Qui sommes-nous",
    type: "textarea" as const,
  },
  {
    key: "home_about_text",
    label: "Accueil — texte Qui sommes-nous",
    type: "textarea" as const,
  },
  {
    key: "home_repertoire_text",
    label: "Accueil — répertoire",
    type: "textarea" as const,
  },
  {
    key: "home_rehearsal_text",
    label: "Accueil — répétitions",
    type: "textarea" as const,
  },
  {
    key: "home_address_text",
    label: "Accueil — adresse",
    type: "textarea" as const,
  },
  {
    key: "home_join_title",
    label: "Accueil — titre Rejoindre",
    type: "textarea" as const,
  },
  {
    key: "home_join_text",
    label: "Accueil — texte Rejoindre",
    type: "textarea" as const,
  },
  {
    key: "home_quote",
    label: "Accueil — slogan / phrase courte",
    type: "textarea" as const,
  },
  {
    key: "about_page_title",
    label: "La chorale — titre principal",
    type: "textarea" as const,
  },
  {
    key: "about_intro",
    label: "La chorale — introduction",
    type: "textarea" as const,
  },
  {
    key: "about_story_title",
    label: "La chorale — titre histoire",
    type: "textarea" as const,
  },
  {
    key: "about_story_text",
    label: "La chorale — texte histoire",
    type: "textarea" as const,
  },
  {
    key: "about_values_title",
    label: "La chorale — titre valeurs",
    type: "textarea" as const,
  },
  {
    key: "about_quote",
    label: "La chorale — citation",
    type: "textarea" as const,
  },
  {
    key: "activities_intro",
    label: "Activités — introduction",
    type: "textarea" as const,
  },
  {
    key: "contact_intro",
    label: "Contact — introduction",
    type: "textarea" as const,
  },
];

export default async function AdminContentPage() {
  const admin = await requirePermission("content");
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
        description="Modifier les textes importants du site public."
        email={admin.email}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <ContentForm items={items} />

        <aside className="rounded-[1.7rem] border border-[#e6e1d6] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#1f1f1a]">Conseil</h2>

          <p className="mt-4 text-sm leading-7 text-[#6d6b63]">
            Garde les textes courts sur l’accueil. La page “La chorale” peut
            contenir une histoire plus complète.
          </p>

          <div className="mt-6 rounded-2xl bg-[#f3f0e8] p-4">
            <p className="text-sm font-bold text-[#687a5e]">Important</p>
            <p className="mt-2 text-sm leading-6 text-[#6d6b63]">
              Après enregistrement, vérifie le rendu sur mobile et desktop.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
