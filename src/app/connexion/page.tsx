"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type UserRole = "member" | "admin" | "super_admin";

type LoginResponse = {
  message?: string;
  user?: {
    role: UserRole;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(result.message ?? "Email ou mot de passe incorrect.");
        return;
      }

      if (!result.user) {
        setError("Impossible de charger votre compte.");
        return;
      }

      setSuccess("Connexion réussie.");

      if (result.user.role === "admin" || result.user.role === "super_admin") {
        router.replace("/admin");
      } else {
        router.replace("/membre");
      }

      router.refresh();
    } catch {
      setError("Connexion impossible.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Retour à l'accueil">
            <Image
              src="/images/logo-chorale.png"
              alt="Chorale Rayon de Soleil Lyon 6"
              width={155}
              height={62}
              style={{ height: "auto" }}
              className="w-[155px] object-contain"
              priority
            />
          </Link>
        </div>

        <div className="rounded-[2rem] border border-[#e6e1d6] bg-white p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#687a5e]">
            Accès membres
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#1f1f1a]">
            Connexion
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6d6b63]">
            Connectez-vous à votre espace de la Chorale Rayon de Soleil.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-semibold text-[#1f1f1a]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none transition focus:border-[#687a5e]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-[#1f1f1a]"
                >
                  Mot de passe
                </label>

                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs font-semibold text-[#687a5e] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none transition focus:border-[#687a5e]"
              />
            </div>

            {success && (
              <p className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                <CheckCircle2 size={18} />
                {success}
              </p>
            )}

            {error && (
              <p className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <XCircle size={18} />
                {error}
              </p>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 border-t border-[#e6e1d6] pt-5">
            <p className="text-center text-sm text-[#6d6b63]">
              Vous n’avez pas encore de compte ?{" "}
              <Link
                href="/inscription"
                className="font-bold text-[#687a5e] hover:underline"
              >
                S’inscrire
              </Link>
            </p>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-xs font-semibold text-[#6d6b63] hover:underline"
              >
                Retour au site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
