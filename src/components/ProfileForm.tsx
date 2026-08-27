"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
};

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [firstname, setFirstname] = useState(profile.firstname);
  const [lastname, setLastname] = useState(profile.lastname);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname,
          lastname,
          phone: phone || null,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setError(result.message ?? "Modification impossible.");
        return;
      }

      setMessage("Profil mis à jour.");
      router.refresh();
    } catch {
      setError("Modification impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="firstname" className="mb-1 block font-medium">
          Prénom
        </label>

        <input
          id="firstname"
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
          value={profile.email}
          disabled
          className="w-full rounded-md border px-3 py-2 opacity-60"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block font-medium">
          Téléphone
        </label>

        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
