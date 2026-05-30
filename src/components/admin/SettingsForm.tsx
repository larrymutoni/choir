"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type SettingsFormValues = {
  email: string;
  phone: string;
  address: string;
  google_form_url: string;
  admin_address: string;
  rehearsal_address: string;
  accessibility_note: string;
  monique_phone: string;
  francois_phone: string;
  show_map: boolean;
  map_query: string;
};

type SettingsFormProps = {
  initialValues: SettingsFormValues;
};

export function SettingsForm({ initialValues }: SettingsFormProps) {
  const [values, setValues] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function updateValue<K extends keyof SettingsFormValues>(
    key: K,
    value: SettingsFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setSuccess("");
    setError("");

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    setIsSaving(false);

    if (!response.ok) {
      setError(result.message ?? "Erreur pendant l’enregistrement.");
      return;
    }

    setSuccess("Paramètres enregistrés.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-[1.8rem] border border-[#e6e1d6] bg-white p-6 shadow-sm"
    >
      <section>
        <h2 className="text-xl font-black text-[#1f1f1a]">Contact principal</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Email destinataire du formulaire"
            value={values.email}
            onChange={(value) => updateValue("email", value)}
          />

          <Field
            label="Téléphone général"
            value={values.phone}
            onChange={(value) => updateValue("phone", value)}
          />

          <Field
            label="Adresse générale"
            value={values.address}
            onChange={(value) => updateValue("address", value)}
            className="md:col-span-2"
          />
        </div>
      </section>

      <section className="border-t border-[#e6e1d6] pt-6">
        <h2 className="text-xl font-black text-[#1f1f1a]">
          Infos pratiques affichées sur Contact
        </h2>

        <div className="mt-5 grid gap-5">
          <Field
            label="Adresse administrative"
            value={values.admin_address}
            onChange={(value) => updateValue("admin_address", value)}
          />

          <Field
            label="Adresse des répétitions"
            value={values.rehearsal_address}
            onChange={(value) => updateValue("rehearsal_address", value)}
          />

          <TextareaField
            label="Accessibilité"
            value={values.accessibility_note}
            onChange={(value) => updateValue("accessibility_note", value)}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Téléphone Monique"
              value={values.monique_phone}
              onChange={(value) => updateValue("monique_phone", value)}
            />

            <Field
              label="Téléphone François"
              value={values.francois_phone}
              onChange={(value) => updateValue("francois_phone", value)}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[#e6e1d6] pt-6">
        <h2 className="text-xl font-black text-[#1f1f1a]">Carte</h2>

        <label className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f7f5ef] px-4 py-3 text-sm font-semibold text-[#5d5a52]">
          <input
            type="checkbox"
            checked={values.show_map}
            onChange={(event) => updateValue("show_map", event.target.checked)}
          />
          Afficher la carte sur la page Contact
        </label>

        <div className="mt-5">
          <Field
            label="Adresse utilisée pour la carte"
            value={values.map_query}
            onChange={(value) => updateValue("map_query", value)}
          />
        </div>
      </section>

      {success && (
        <p className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </p>
      )}

      {error && (
        <p className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <XCircle size={18} />
          {error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-[#1f1f1a]">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#1f1f1a]">{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm leading-7 text-[#1f1f1a] outline-none focus:border-[#687a5e]"
      />
    </div>
  );
}
