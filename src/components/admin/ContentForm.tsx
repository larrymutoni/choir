"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type ContentItem = {
  key: string;
  label: string;
  value: string;
  type?: "input" | "textarea";
};

type ContentFormProps = {
  items: ContentItem[];
};

export function ContentForm({ items }: ContentFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>(() => {
    return items.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateValue(key: string, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: Object.entries(values).map(([key, value]) => ({
          key,
          value,
        })),
      }),
    });

    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setError(result.message ?? "Erreur pendant l’enregistrement.");
      return;
    }

    setMessage("Contenu enregistré.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] bg-white p-6 shadow-sm"
    >
      <div className="grid gap-6">
        {items.map((item) => (
          <div key={item.key}>
            <label className="text-sm font-black text-[#141414]">
              {item.label}
            </label>

            {item.type === "textarea" ? (
              <textarea
                value={values[item.key] ?? ""}
                onChange={(event) => updateValue(item.key, event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm leading-7 text-[#141414] outline-none focus:border-[#e9552f]"
              />
            ) : (
              <input
                value={values[item.key] ?? ""}
                onChange={(event) => updateValue(item.key, event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e8ded2] bg-[#fff8ec] px-4 py-3 text-sm text-[#141414] outline-none focus:border-[#e9552f]"
              />
            )}
          </div>
        ))}
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
