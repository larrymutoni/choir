"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      setError(result.message ?? "Connexion impossible.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8ec] px-5 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-[#e8ded2] bg-white p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9552f] text-white">
            <Music2 size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-[#141414]">
              Administration
            </h1>
            <p className="text-sm font-medium text-[#675e56]">
              Chorale Rayon de Soleil
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className="text-sm font-bold text-[#141414]">Email</label>
            <input
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 outline-none focus:border-[#e9552f]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[#141414]">
              Mot de passe
            </label>
            <input
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 outline-none focus:border-[#e9552f]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </main>
  );
}
