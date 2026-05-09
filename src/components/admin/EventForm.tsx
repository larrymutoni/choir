"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function EventForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError("");

    const response = await fetch("/api/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        event_date: eventDate,
        location,
        description,
        is_visible: true,
      }),
    });

    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.message ?? "Erreur pendant la création.");
      return;
    }

    setTitle("");
    setEventDate("");
    setLocation("");
    setDescription("");

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] bg-white p-6 shadow-sm"
    >
      <h2 className="text-2xl font-black text-[#141414]">
        Ajouter un événement
      </h2>

      <div className="mt-6 grid gap-5">
        <div>
          <label className="text-sm font-black text-[#141414]">Titre</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Concert d’été"
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          />
        </div>

        <div>
          <label className="text-sm font-black text-[#141414]">Date</label>
          <input
            required
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          />
        </div>

        <div>
          <label className="text-sm font-black text-[#141414]">Lieu</label>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Lyon 6"
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          />
        </div>

        <div>
          <label className="text-sm font-black text-[#141414]">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description courte de l’événement..."
            className="mt-2 w-full resize-none rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm leading-7 outline-none focus:border-[#e9552f]"
          />
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Création..." : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
