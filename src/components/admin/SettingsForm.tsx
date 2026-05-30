"use client";

import { CheckCircle2, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ContactPersonFormValue = {
  id?: string;
  name: string;
  role_label: string;
  phone: string;
  is_visible: boolean;
};

type SettingsFormValues = {
  email: string;
  phone: string;
  address: string;
  google_form_url: string;
  admin_address: string;
  rehearsal_address: string;
  accessibility_note: string;
  show_map: boolean;
  map_query: string;
  contact_people: ContactPersonFormValue[];
};

type SettingsFormProps = {
  initialValues: SettingsFormValues;
};

function createEmptyPerson(): ContactPersonFormValue {
  return {
    name: "",
    role_label: "Personne à contacter",
    phone: "",
    is_visible: true,
  };
}

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

  function updatePerson(
    index: number,
    key: keyof ContactPersonFormValue,
    value: string | boolean,
  ) {
    setValues((current) => ({
      ...current,
      contact_people: current.contact_people.map((person, personIndex) =>
        personIndex === index ? { ...person, [key]: value } : person,
      ),
    }));
  }

  function addPerson() {
    setValues((current) => ({
      ...current,
      contact_people: [...current.contact_people, createEmptyPerson()],
    }));
  }

  function removePerson(index: number) {
    setValues((current) => ({
      ...current,
      contact_people: current.contact_people.filter(
        (_, personIndex) => personIndex !== index,
      ),
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
      className="grid gap-6 rounded-[1.8rem] border border-[#e6e1d6] bg-white shadow-sm"
    >
      <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[1.5rem] bg-[#f7f5ef] p-5">
          <h2 className="text-xl font-black text-[#1f1f1a]">
            Contact principal
          </h2>

          <div className="mt-5 grid gap-5">
            <Field
              label="Email affiché sur le site"
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
            />
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-[#f7f5ef] p-5">
          <h2 className="text-xl font-black text-[#1f1f1a]">Carte</h2>

          <label className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#5d5a52]">
            <input
              type="checkbox"
              checked={values.show_map}
              onChange={(event) =>
                updateValue("show_map", event.target.checked)
              }
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

        <section className="rounded-[1.5rem] bg-[#f7f5ef] p-5 lg:col-span-2">
          <h2 className="text-xl font-black text-[#1f1f1a]">Infos pratiques</h2>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
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
              className="lg:col-span-2"
            />
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-[#f7f5ef] p-5 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#1f1f1a]">
                Personnes à contacter
              </h2>
              <p className="mt-1 text-sm text-[#6d6b63]">
                Ajoutez les personnes affichées sur la page Contact.
              </p>
            </div>

            <button
              type="button"
              onClick={addPerson}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#687a5e] px-4 py-2 text-sm font-bold text-white"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            {values.contact_people.length === 0 && (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6d6b63]">
                Aucune personne à contacter.
              </p>
            )}

            {values.contact_people.map((person, index) => (
              <div
                key={person.id ?? index}
                className="rounded-2xl border border-[#e6e1d6] bg-white p-4"
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <Field
                    label="Nom"
                    value={person.name}
                    onChange={(value) => updatePerson(index, "name", value)}
                  />

                  <Field
                    label="Rôle / description"
                    value={person.role_label}
                    onChange={(value) =>
                      updatePerson(index, "role_label", value)
                    }
                  />

                  <Field
                    label="Téléphone"
                    value={person.phone}
                    onChange={(value) => updatePerson(index, "phone", value)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-3 rounded-full bg-[#f7f5ef] px-4 py-2 text-sm font-semibold text-[#5d5a52]">
                    <input
                      type="checkbox"
                      checked={person.is_visible}
                      onChange={(event) =>
                        updatePerson(index, "is_visible", event.target.checked)
                      }
                    />
                    Afficher
                  </label>

                  <button
                    type="button"
                    onClick={() => removePerson(index)}
                    className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {success && (
        <p className="mx-5 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 sm:mx-6">
          <CheckCircle2 size={18} />
          {success}
        </p>
      )}

      {error && (
        <p className="mx-5 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 sm:mx-6">
          <XCircle size={18} />
          {error}
        </p>
      )}

      <div className="sticky bottom-0 rounded-b-[1.8rem] border-t border-[#e6e1d6] bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
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
        className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-white px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
      />
    </div>
  );
}

function TextareaField({
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
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-2xl border border-[#e6e1d6] bg-white px-4 py-3 text-sm leading-7 text-[#1f1f1a] outline-none focus:border-[#687a5e]"
      />
    </div>
  );
}
