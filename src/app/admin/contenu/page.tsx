import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContentForm } from "@/components/admin/ContentForm";
import { contentArrayToMap } from "@/lib/content";
import { getSupabaseImageUrl } from "@/lib/images";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccess, requirePermission } from "@/lib/auth";
import { listSiteContent } from "@/server/content/repository";

const pageContentDefaults: Record<string, string> = {
  home_spirit_eyebrow: "L’esprit du groupe",
  home_spirit_title: "Chanter, écouter, partager.",
  home_spirit_text:
    "Une chorale, c’est plus qu’une répétition : c’est un rendez-vous régulier, une énergie collective et le plaisir d’entendre les voix se construire ensemble.",
  home_spirit_group_text: "Un groupe accueillant",
  home_spirit_repertoire_text: "Un répertoire vivant",

  about_value_conviviality_title: "Convivialité",
  about_value_conviviality_text:
    "Un groupe où l’on vient chanter, mais aussi se retrouver.",
  about_value_music_title: "Plaisir musical",
  about_value_music_text:
    "Un répertoire varié, travaillé avec régularité et envie.",
  about_value_progress_title: "Progression",
  about_value_progress_text:
    "Chaque voix compte et avance au rythme du collectif.",
  about_value_openness_title: "Ouverture",
  about_value_openness_text:
    "Une chorale accueillante pour celles et ceux qui aiment chanter.",

  activities_title: "Chanter, répéter, partager.",
  activities_rehearsals_title: "Répétitions",
  activities_rehearsals_text:
    "Chaque semaine, le groupe travaille le répertoire, l’écoute et la cohésion vocale.",
  activities_repertoire_title: "Répertoire",
  activities_repertoire_text:
    "Variétés françaises et étrangères, chants connus et morceaux choisis selon les projets.",
  activities_group_title: "Vie de groupe",
  activities_group_text:
    "Des moments simples, humains et musicaux autour du plaisir de chanter ensemble.",
};

const pages = [
  {
    id: "home",
    label: "Accueil",
    groups: [
      {
        id: "hero",
        title: "En-tête",
        imageKey: "home_hero",
        imageLabel: "Photo principale",
        fields: [
          {
            key: "home_hero_title",
            label: "Titre principal",
            type: "text" as const,
          },
          {
            key: "home_hero_description",
            label: "Introduction",
            type: "textarea" as const,
            rows: 3,
          },
        ],
      },
      {
        id: "presentation",
        title: "Présentation",
        fields: [
          {
            key: "home_about_title",
            label: "Titre",
            type: "text" as const,
          },
          {
            key: "home_about_text",
            label: "Texte",
            type: "textarea" as const,
            rows: 3,
          },
          {
            key: "home_quote",
            label: "Phrase mise en avant",
            type: "text" as const,
          },
        ],
      },
      {
        id: "spirit",
        title: "L’esprit du groupe",
        fields: [
          {
            key: "home_spirit_eyebrow",
            label: "Nom de la section",
            type: "text" as const,
          },
          {
            key: "home_spirit_title",
            label: "Titre",
            type: "text" as const,
          },
          {
            key: "home_spirit_text",
            label: "Texte",
            type: "textarea" as const,
            rows: 3,
          },
          {
            key: "home_spirit_group_text",
            label: "Bloc — Groupe",
            type: "text" as const,
          },
          {
            key: "home_spirit_repertoire_text",
            label: "Bloc — Répertoire",
            type: "text" as const,
          },
        ],
      },
      {
        id: "join",
        title: "Rejoindre la chorale",
        fields: [
          {
            key: "home_join_title",
            label: "Titre",
            type: "text" as const,
          },
          {
            key: "home_join_text",
            label: "Texte",
            type: "textarea" as const,
            rows: 3,
          },
        ],
      },
    ],
  },

  {
    id: "about",
    label: "La chorale",
    groups: [
      {
        id: "header",
        title: "En-tête",
        imageKey: "about_main",
        imageLabel: "Photo principale",
        fields: [
          {
            key: "about_page_title",
            label: "Titre principal",
            type: "text" as const,
          },
          {
            key: "about_intro",
            label: "Introduction",
            type: "textarea" as const,
            rows: 3,
          },
        ],
      },
      {
        id: "story",
        title: "Notre histoire",
        fields: [
          {
            key: "about_story_title",
            label: "Titre",
            type: "text" as const,
          },
          {
            key: "about_story_text",
            label: "Texte",
            type: "textarea" as const,
            rows: 4,
          },
          {
            key: "about_quote",
            label: "Citation",
            type: "text" as const,
          },
        ],
      },
      {
        id: "director",
        title: "Direction musicale",
        imageKey: "choir_director",
        imageLabel: "Photo du chef de chœur",
        fields: [
          {
            key: "about_choir_director_title",
            label: "Titre",
            type: "text" as const,
          },
          {
            key: "about_choir_director_text",
            label: "Présentation",
            type: "textarea" as const,
            rows: 3,
          },
        ],
      },
      {
        id: "values",
        title: "Valeurs",
        fields: [
          {
            key: "about_values_title",
            label: "Titre de la section",
            type: "text" as const,
          },
          {
            key: "about_value_conviviality_title",
            label: "Convivialité — Titre",
            type: "text" as const,
          },
          {
            key: "about_value_conviviality_text",
            label: "Convivialité — Texte",
            type: "textarea" as const,
            rows: 2,
          },
          {
            key: "about_value_music_title",
            label: "Plaisir musical — Titre",
            type: "text" as const,
          },
          {
            key: "about_value_music_text",
            label: "Plaisir musical — Texte",
            type: "textarea" as const,
            rows: 2,
          },
          {
            key: "about_value_progress_title",
            label: "Progression — Titre",
            type: "text" as const,
          },
          {
            key: "about_value_progress_text",
            label: "Progression — Texte",
            type: "textarea" as const,
            rows: 2,
          },
          {
            key: "about_value_openness_title",
            label: "Ouverture — Titre",
            type: "text" as const,
          },
          {
            key: "about_value_openness_text",
            label: "Ouverture — Texte",
            type: "textarea" as const,
            rows: 2,
          },
        ],
      },
      {
        id: "members",
        title: "Membres",
        imageKey: "members_board",
        imageLabel: "Trombinoscope",
        fields: [
          {
            key: "about_members_title",
            label: "Titre",
            type: "text" as const,
          },
          {
            key: "about_members_text",
            label: "Texte",
            type: "textarea" as const,
            rows: 3,
          },
        ],
      },
    ],
  },

  {
    id: "activities",
    label: "Activités",
    groups: [
      {
        id: "header",
        title: "En-tête",
        imageKey: "activities_main",
        imageLabel: "Photo principale",
        fields: [
          {
            key: "activities_title",
            label: "Titre principal",
            type: "text" as const,
          },
          {
            key: "activities_intro",
            label: "Introduction",
            type: "textarea" as const,
            rows: 3,
          },
        ],
      },
      {
        id: "activity-cards",
        title: "Présentation des activités",
        fields: [
          {
            key: "activities_rehearsals_title",
            label: "Répétitions — Titre",
            type: "text" as const,
          },
          {
            key: "activities_rehearsals_text",
            label: "Répétitions — Texte",
            type: "textarea" as const,
            rows: 2,
          },
          {
            key: "activities_repertoire_title",
            label: "Répertoire — Titre",
            type: "text" as const,
          },
          {
            key: "activities_repertoire_text",
            label: "Répertoire — Texte",
            type: "textarea" as const,
            rows: 2,
          },
          {
            key: "activities_group_title",
            label: "Vie de groupe — Titre",
            type: "text" as const,
          },
          {
            key: "activities_group_text",
            label: "Vie de groupe — Texte",
            type: "textarea" as const,
            rows: 2,
          },
        ],
      },
    ],
  },

  {
    id: "contact",
    label: "Contact",
    groups: [
      {
        id: "header",
        title: "En-tête",
        imageKey: "contact_banner",
        imageLabel: "Photo principale",
        fields: [
          {
            key: "contact_title",
            label: "Titre principal",
            type: "text" as const,
          },
          {
            key: "contact_intro",
            label: "Introduction",
            type: "textarea" as const,
            rows: 3,
          },
        ],
      },
    ],
  },
];

type SiteImageRow = {
  key: string;
  path: string;
  alt_text: string | null;
  updated_at: string;
};

export default async function AdminContentPage() {
  const admin = await requirePermission("content");

  const supabase = createAdminClient();

  const [
    contentItems,
    {
      data: siteImages,
      error: imageError,
    },
    {
      data: contactSettings,
      error: contactSettingsError,
    },
    {
      data: contactPeople,
      error: contactPeopleError,
    },
  ] = await Promise.all([
    listSiteContent(),

    supabase
      .from("site_images")
      .select(
        "key, path, alt_text, updated_at",
      ),

    supabase
      .from("contact_settings")
      .select(
        "email, admin_address, rehearsal_address, accessibility_note, show_map, map_query",
      )
      .limit(1)
      .maybeSingle(),

    supabase
      .from("contact_people")
      .select(
        "name, role_label, phone, position, is_visible",
      )
      .order(
        "position",
        { ascending: true },
      ),
  ]);

  if (imageError) {
    throw new Error(
      imageError.message,
    );
  }

  if (contactSettingsError) {
    throw new Error(
      contactSettingsError.message,
    );
  }

  if (contactPeopleError) {
    throw new Error(
      contactPeopleError.message,
    );
  }

  const content =
    contentArrayToMap(
      contentItems,
    );

  const imageMap =
    (
      (siteImages ??
        []) as SiteImageRow[]
    ).reduce<
      Record<
        string,
        SiteImageRow
      >
    >((acc, image) => {
      acc[image.key] =
        image;

      return acc;
    }, {});

  const editorPages =
    pages.map((page) => ({
      id: page.id,
      label: page.label,

      groups:
        page.groups.map(
          (group) => {
            const image =
              group.imageKey
                ? imageMap[
                    group
                      .imageKey
                  ]
                : null;

            return {
              id:
                group.id,

              title:
                group.title,

              image:
                group.imageKey
                  ? {
                      key:
                        group.imageKey,

                      label:
                        group.imageLabel ??
                        "Image",

                      url:
                        image
                          ? getSupabaseImageUrl(
                              image.path,
                              image.updated_at,
                            )
                          : "",

                      alt:
                        image?.alt_text ?? "",

                      canRemove: true,
                    }
                  : undefined,

              fields:
                group.fields.map(
                  (field) => ({
                    key:
                      field.key,

                    label:
                      field.label,

                    type:
                      field.type,

                    rows:
                      field.rows,

                    value:
                      content[
                        field.key
                      ] ??
                      pageContentDefaults[
                        field.key
                      ] ??
                      "",
                  }),
                ),
            };
          },
        ),
    }));

  return (
    <main className="pb-10">
      <AdminHeader
        title="Pages"
      />

      <ContentForm
        pages={editorPages}
        canManageImages={canAccess(
          admin,
          "images",
        )}
        contactData={{
          email:
            contactSettings?.email ??
            "",
          admin_address:
            contactSettings?.admin_address ??
            "",
          rehearsal_address:
            contactSettings?.rehearsal_address ??
            "",
          accessibility_note:
            contactSettings?.accessibility_note ??
            "",
          show_map:
            contactSettings?.show_map ??
            true,
          map_query:
            contactSettings?.map_query ??
            "",
          contact_people:
            (contactPeople ?? []).map(
              (person) => ({
                name:
                  person.name,
                role_label:
                  person.role_label ??
                  "",
                phone:
                  person.phone ??
                  "",
                is_visible:
                  person.is_visible,
              }),
            ),
        }}
      />
    </main>
  );
}
