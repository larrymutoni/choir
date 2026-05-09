"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function GalleryUploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("Concerts");
  const [position, setPosition] = useState("0");
  const [file, setFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choisis une image.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("alt_text", altText);
    formData.append("category", category);
    formData.append("position", position);
    formData.append("file", file);

    const response = await fetch("/api/admin/gallery", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.message ?? "Erreur pendant l’upload.");
      return;
    }

    setTitle("");
    setAltText("");
    setCategory("Concerts");
    setPosition("0");
    setFile(null);
    setMessage("Image ajoutée à la galerie.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] bg-white p-6 shadow-sm"
    >
      <h2 className="text-2xl font-black text-[#141414]">Ajouter une photo</h2>

      <div className="mt-6 grid gap-5">
        <div>
          <label className="text-sm font-black text-[#141414]">Image</label>
          <input
            required
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm"
          />
        </div>

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
          <label className="text-sm font-black text-[#141414]">
            Texte alternatif
          </label>
          <input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="La chorale pendant un concert"
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          />
        </div>

        <div>
          <label className="text-sm font-black text-[#141414]">Catégorie</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
          >
            <option>Concerts</option>
            <option>Répétitions</option>
            <option>Vie associative</option>
            <option>Autre</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-black text-[#141414]">Position</label>
          <input
            type="number"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
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

      <div className="mt-6">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Upload..." : "Ajouter la photo"}
        </Button>
      </div>
    </form>
  );
}
