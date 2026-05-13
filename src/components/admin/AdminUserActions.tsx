"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PERMISSION_LABELS, type AdminPermissions } from "@/lib/permissions";

type AdminUserActionsProps = {
  id: string;
  currentUserId: string;
  role: string;
  permissions: AdminPermissions;
};

export function AdminUserActions({
  id,
  currentUserId,
  role,
  permissions,
}: AdminUserActionsProps) {
  const router = useRouter();

  const [localRole, setLocalRole] = useState<"admin" | "super_admin">(
    role === "super_admin" ? "super_admin" : "admin",
  );
  const [localPermissions, setLocalPermissions] =
    useState<AdminPermissions>(permissions);

  const [isSaving, setIsSaving] = useState(false);

  function togglePermission(key: keyof AdminPermissions) {
    setLocalPermissions((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function saveChanges() {
    setIsSaving(true);

    const response = await fetch("/api/admin/admins", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        role: localRole,
        permissions: localPermissions,
      }),
    });

    setIsSaving(false);

    if (!response.ok) return;

    router.refresh();
  }

  async function deleteAdmin() {
    const confirmed = window.confirm(
      "Supprimer cet administrateur ? Cette action est définitive.",
    );

    if (!confirmed) return;

    setIsSaving(true);

    const response = await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    setIsSaving(false);

    if (!response.ok) return;

    router.refresh();
  }

  return (
    <div className="mt-5 border-t border-[#e6e1d6] pt-5">
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">Rôle</label>
          <select
            value={localRole}
            disabled={id === currentUserId}
            onChange={(event) =>
              setLocalRole(event.target.value as "admin" | "super_admin")
            }
            className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e] disabled:opacity-60"
          >
            <option value="admin">Admin limité</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>

        {localRole === "admin" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(PERMISSION_LABELS) as (keyof AdminPermissions)[]).map(
              (key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#f7f5ef] px-4 py-3 text-sm font-semibold text-[#5d5a52]"
                >
                  <input
                    type="checkbox"
                    checked={localPermissions[key]}
                    onChange={() => togglePermission(key)}
                  />
                  {PERMISSION_LABELS[key]}
                </label>
              ),
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={saveChanges}
          className="rounded-full bg-[#687a5e] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          Enregistrer
        </button>

        {id !== currentUserId && (
          <button
            type="button"
            disabled={isSaving}
            onClick={deleteAdmin}
            className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-60"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
