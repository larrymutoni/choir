"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type ImageSlotCardProps = {
  imageKey: string;
  label: string;
  path: string;
  altText: string;
  imageUrl: string;
};

export function ImageSlotCard({
  imageKey,
  label,
  path,
  altText,
  imageUrl,
}: ImageSlotCardProps) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState(altText);
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
    formData.append("key", imageKey);
    formData.append("alt_text", alt);
    formData.append("file", file);

    const response = await fetch("/api/admin/images", {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    setIsSaving(false);

    if (!response.ok) {
      setError(result.message ?? "Erreur pendant le remplacement.");
      return;
    }

    setFile(null);
    setMessage("Image remplacée.");
    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#e8ded2] bg-white shadow-sm">
      <div className="aspect-[16/10] bg-[#fff8ec]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText || label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-[#675e56]">
            Aucune image
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-xl font-black text-[#141414]">{label}</h2>

        <p className="mt-2 break-all text-xs font-semibold text-[#675e56]">
          {path}
        </p>

        <div className="mt-5 grid gap-4">
          <div>
            <label className="text-sm font-black text-[#141414]">
              Nouvelle image
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-black text-[#141414]">
              Texte alternatif
            </label>
            <input
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm outline-none focus:border-[#e9552f]"
            />
          </div>
        </div>

        {message && (
          <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Remplacement..." : "Remplacer"}
          </Button>
        </div>
      </form>
    </article>
  );
}
