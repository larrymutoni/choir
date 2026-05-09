"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type SettingsFormProps = {
  email: string;
  phone: string;
  address: string;
  googleFormUrl: string;
};

export function SettingsForm({
  email,
  phone,
  address,
  googleFormUrl,
}: SettingsFormProps) {
  const router = useRouter();

  const [formEmail, setFormEmail] = useState(email);
  const [formPhone, setFormPhone] = useState(phone);
  const [formAddress, setFormAddress] = useState(address);
  const [formUrl, setFormUrl] = useState(googleFormUrl);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formEmail,
        phone: formPhone,
        address: formAddress,
        google_form_url: formUrl,
      }),
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    setIsSaving(false);

    if (!response.ok) {
      setError(result.message ?? "Erreur pendant l’enregistrement.");
      return;
    }

    setMessage("Paramètres enregistrés.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] bg-white p-6 shadow-sm"
    >
      <div className="grid gap-6">
        <div>
          <label className="text-sm font-black text-[#141414]">
            Email de contact
          </label>
          <input
            required
            type="email"
            value={formEmail}
            onChange={(event) => setFormEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          />
        </div>

        <div>
          <label className="text-sm font-black text-[#141414]">
            Téléphone
          </label>
          <input
            value={formPhone}
            onChange={(event) => setFormPhone(event.target.value)}
            placeholder="Optionnel"
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          />
        </div>

        <div>
          <label className="text-sm font-black text-[#141414]">Adresse</label>
          <input
            value={formAddress}
            onChange={(event) => setFormAddress(event.target.value)}
            placeholder="Lyon 6e arrondissement"
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          />
        </div>

        <div>
          <label className="text-sm font-black text-[#141414]">
            Lien Google Forms
          </label>
          <input
            required
            type="url"
            value={formUrl}
            onChange={(event) => setFormUrl(event.target.value)}
            placeholder="https://forms.gle/..."
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          />
        </div>
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

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}