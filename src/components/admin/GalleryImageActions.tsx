"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GalleryImageActionsProps = {
  id: string;
  isVisible: boolean;
};

export function GalleryImageActions({
  id,
  isVisible,
}: GalleryImageActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function toggleVisibility() {
    setIsLoading(true);

    const response = await fetch("/api/admin/gallery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        is_visible: !isVisible,
      }),
    });

    setIsLoading(false);

    if (!response.ok) return;

    router.refresh();
  }

  async function deleteImage() {
    const confirmed = window.confirm(
      "Supprimer cette image ? Cette action est définitive.",
    );

    if (!confirmed) return;

    setIsLoading(true);

    const response = await fetch("/api/admin/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    setIsLoading(false);

    if (!response.ok) return;

    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={isLoading}
        onClick={toggleVisibility}
        className="rounded-full border border-[#e8ded2] px-4 py-2 text-xs font-black text-[#141414] transition hover:bg-[#fff8ec] disabled:opacity-50"
      >
        {isVisible ? "Masquer" : "Afficher"}
      </button>

      <button
        type="button"
        disabled={isLoading}
        onClick={deleteImage}
        className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  );
}
