"use client";

import Image from "next/image";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
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

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok) {
      setIsLoading(false);
      setError(result.message ?? "Email ou mot de passe incorrect.");
      return;
    }

    setSuccess("Connexion réussie. Redirection...");
    setTimeout(() => {
      router.push("/admin");
      router.refresh();
    }, 500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo-chorale.png"
            alt="Chorale Rayon de Soleil Lyon 6"
            width={155}
            height={62}
            style={{ height: "auto" }}
            className="w-[155px] object-contain"
          />
        </div>

        <div className="rounded-[2rem] border border-[#e6e1d6] bg-white p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#687a5e]">
            Administration
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#1f1f1a]">
            Connexion
          </h1>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
            <div>
              <label className="text-sm font-semibold text-[#1f1f1a]">
                Email
              </label>
              <input
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#1f1f1a]">
                Mot de passe
              </label>
              <input
                type="password"
                required
                className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
        </div>
      </div>
    </main>
  );
}
