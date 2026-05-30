import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type ContactPersonRow = {
  id: string;
  name: string;
  role_label: string | null;
  phone: string | null;
  is_visible: boolean;
};

export default async function AdminSettingsPage() {
  await requirePermission("settings");

  const supabase = createAdminClient();

  const [{ data: settings, error }, { data: people, error: peopleError }] =
    await Promise.all([
      supabase
        .from("contact_settings")
        .select(
          "email, phone, address, google_form_url, admin_address, rehearsal_address, accessibility_note, show_map, map_query",
        )
        .limit(1)
        .single(),
      supabase
        .from("contact_people")
        .select("id, name, role_label, phone, is_visible")
        .order("position", { ascending: true }),
    ]);

  if (error) {
    throw new Error(error.message);
  }

  if (peopleError) {
    throw new Error(peopleError.message);
  }

  return (
    <main>
      <AdminHeader
        title="Paramètres"
        description="Modifier les informations pratiques du site."
      />

      <SettingsForm
        initialValues={{
          email: settings?.email ?? "rayondesoleillyon6@gmail.com",
          phone: settings?.phone ?? "",
          address: settings?.address ?? "",
          google_form_url: settings?.google_form_url ?? "",
          admin_address: settings?.admin_address ?? "",
          rehearsal_address: settings?.rehearsal_address ?? "",
          accessibility_note: settings?.accessibility_note ?? "",
          show_map: settings?.show_map ?? true,
          map_query: settings?.map_query ?? "",
          contact_people: ((people ?? []) as ContactPersonRow[]).map(
            (person) => ({
              id: person.id,
              name: person.name,
              role_label: person.role_label ?? "",
              phone: person.phone ?? "",
              is_visible: person.is_visible,
            }),
          ),
        }}
      />
    </main>
  );
}
