import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSettingsPage() {
  await requirePermission("settings");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("contact_settings")
    .select(
      "email, phone, address, google_form_url, admin_address, rehearsal_address, accessibility_note, monique_phone, francois_phone, show_map, map_query",
    )
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main>
      <AdminHeader
        title="Paramètres"
        description="Modifier les informations pratiques et les contacts affichés sur le site."
      />

      <SettingsForm
        initialValues={{
          email: data?.email ?? "",
          phone: data?.phone ?? "",
          address: data?.address ?? "",
          google_form_url: data?.google_form_url ?? "",
          admin_address: data?.admin_address ?? "",
          rehearsal_address: data?.rehearsal_address ?? "",
          accessibility_note: data?.accessibility_note ?? "",
          monique_phone: data?.monique_phone ?? "",
          francois_phone: data?.francois_phone ?? "",
          show_map: data?.show_map ?? true,
          map_query: data?.map_query ?? "",
        }}
      />
    </main>
  );
}
