"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
    setReady(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("Lien de réinitialisation invalide.");
      return;
    }

    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setError(result.message ?? "Impossible de modifier le mot de passe.");
        return;
      }

      router.push("/connexion?reset=success");
    } catch {
      setError("Impossible de modifier le mot de passe.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return null;
  }

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full">
          <h1 className="mb-4 text-3xl font-semibold">Lien invalide</h1>

          <p className="mb-6">Ce lien de réinitialisation est invalide.</p>

          <Link href="/mot-de-passe-oublie" className="underline">
            Demander un nouveau lien
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full">
        <h1 className="mb-6 text-3xl font-semibold">Nouveau mot de passe</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block font-medium">
              Nouveau mot de passe
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="confirmation" className="mb-1 block font-medium">
              Confirmer le mot de passe
            </label>

            <input
              id="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </div>
    </main>
  );
}
