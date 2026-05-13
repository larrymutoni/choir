"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PERMISSION_LABELS, type AdminPermissions } from "@/lib/permissions";

const defaultPermissions: AdminPermissions = {
  content: true,
  images: true,
  gallery: true,
  events: false,
  settings: false,
  admins: false,
};

export function AdminUserForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [permissions, setPermissions] =
    useState<AdminPermissions>(defaultPermissions);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function togglePermission(key: keyof AdminPermissions) {
    setPermissions((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/admin/admins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        role,
        permissions,
      }),
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    setIsSaving(false);

    if (!response.ok) {
      setError(result.message ?? "Erreur pendant la création.");
      return;
    }

    setEmail("");
    setPassword("");
    setRole("admin");
    setPermissions(defaultPermissions);
    setMessage("Administrateur créé.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.8rem] border border-[#e6e1d6] bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-black text-[#1f1f1a]">Nouvel admin</h2>

      <div className="mt-5 grid gap-5">
        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">
            Mot de passe temporaire
          </label>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">Rôle</label>
          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "admin" | "super_admin")
            }
            className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
          >
            <option value="admin">Admin limité</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>

        {role === "admin" && (
          <div>
            <p className="text-sm font-semibold text-[#1f1f1a]">Permissions</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                Object.keys(PERMISSION_LABELS) as (keyof AdminPermissions)[]
              ).map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#f7f5ef] px-4 py-3 text-sm font-semibold text-[#5d5a52]"
                >
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={() => togglePermission(key)}
                  />
                  {PERMISSION_LABELS[key]}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {message && (
        <p className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Création..." : "Créer l’admin"}
        </Button>
      </div>
    </form>
  );
}
