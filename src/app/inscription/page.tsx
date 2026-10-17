"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [invitation, setInvitation] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("invitation");
    if (!token) return;
    setInvitation(token);
    try {
      const encoded = token.split(".")[0];
      const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))) as { email?: unknown };
      if (typeof payload.email === "string" && payload.email.length <= 254) {
        setEmail(payload.email);
      }
    } catch { /* The API securely checks the signature. */ }
  }, []);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          password,
          phone: phone || null,
          invitation: invitation || null,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
        status?: "active" | "pending";
      };

      if (!response.ok) {
        setError(result.message ?? "Inscription impossible.");
        return;
      }

      if (result.status === "active") {
        router.push("/membre");
        router.refresh();
        return;
      }

      router.push("/connexion?pending=1");
    } catch {
      setError("Inscription impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full">
        <h1 className="mb-6 text-3xl font-semibold">Inscription</h1>
        {invitation && <p className="mb-4 text-sm text-gray-600">Invitation reçue : renseignez vos informations pour créer votre compte.</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstname" className="mb-1 block font-medium">
              Prénom
            </label>

            <input
              id="firstname"
              type="text"
              autoComplete="given-name"
              required
              value={firstname}
              onChange={(event) => setFirstname(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="lastname" className="mb-1 block font-medium">
              Nom
            </label>

            <input
              id="lastname"
              type="text"
              autoComplete="family-name"
              required
              value={lastname}
              onChange={(event) => setLastname(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              readOnly={Boolean(invitation)}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block font-medium">
              Téléphone
            </label>

            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-medium">
              Mot de passe
            </label>

            <PasswordInput
              id="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
            <p className="mt-1 text-sm text-gray-600">8 caractères minimum.</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
          <p className="text-center text-sm text-gray-700">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-medium underline underline-offset-2 hover:text-black">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
