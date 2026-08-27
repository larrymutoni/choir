"use client";

import { FormEvent, useState } from "react";
import type { AuthorizedEmail } from "@/server/auth/repository";

type Props = {
  initialEmails: AuthorizedEmail[];
};

export default function AuthorizedEmailManagement({
  initialEmails,
}: Props) {
  const [emails, setEmails] = useState(initialEmails);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function addEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/authorized-emails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setError(result.message ?? "Ajout impossible.");
        return;
      }

      const refreshResponse = await fetch(
        "/api/admin/authorized-emails",
      );

      const refreshed = (await refreshResponse.json()) as {
        emails: AuthorizedEmail[];
      };

      setEmails(refreshed.emails);
      setEmail("");
    } catch {
      setError("Ajout impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function removeEmail(id: string) {
    setError("");

    try {
      const response = await fetch(
        "/api/admin/authorized-emails",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        },
      );

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setError(result.message ?? "Suppression impossible.");
        return;
      }

      setEmails((current) =>
        current.filter((item) => item.id !== id),
      );
    } catch {
      setError("Suppression impossible.");
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={addEmail}
        className="flex gap-3"
      >
        <input
          type="email"
          required
          placeholder="membre@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="flex-1 rounded-md border px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {emails.length === 0 ? (
          <p>Aucun email autorisé.</p>
        ) : (
          emails.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b py-3"
            >
              <span>{item.email}</span>

              <button
                type="button"
                onClick={() => removeEmail(item.id)}
                className="rounded-md border px-3 py-1 text-sm"
              >
                Supprimer
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}