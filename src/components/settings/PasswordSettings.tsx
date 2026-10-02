"use client";

import {
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

import {
  PasswordInput,
} from "@/components/ui/PasswordInput";

type ApiResponse = {
  ok?: boolean;
  message?: string;
};

export function PasswordSettings() {
  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  async function changePassword(
    event: FormEvent,
  ) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Les deux nouveaux mots de passe ne correspondent pas.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/member/profile/password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      );

      const result =
        (await response
          .json()
          .catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Impossible de modifier le mot de passe.",
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(
        "Mot de passe modifié.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={changePassword}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">
          Mot de passe
        </h2>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Mot de passe actuel
          </span>
          <PasswordInput
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(
                event.target.value,
              )
            }
            required
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Nouveau mot de passe
          </span>
          <PasswordInput
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(
                event.target.value,
              )
            }
            required
            minLength={8}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Confirmer
          </span>
          <PasswordInput
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value,
              )
            }
            required
            minLength={8}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
        <div>
          {message && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={15} />
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving && (
            <LoaderCircle
              size={15}
              className="animate-spin"
            />
          )}
          Modifier
        </button>
      </div>
    </form>
  );
}
