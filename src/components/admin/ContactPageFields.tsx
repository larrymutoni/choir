"use client";

import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";

export type ContactPersonValue = {
  name: string;
  role_label: string;
  phone: string;
  is_visible: boolean;
};

export type ContactPageData = {
  email: string;
  admin_address: string;
  rehearsal_address: string;
  accessibility_note: string;
  show_map: boolean;
  map_query: string;
  contact_people:
    ContactPersonValue[];
};

type Props = {
  value: ContactPageData;
  onChange: (
    value: ContactPageData,
  ) => void;
};

export function ContactPageFields({
  value,
  onChange,
}: Props) {
  function update<
    K extends keyof ContactPageData,
  >(
    key: K,
    next:
      ContactPageData[K],
  ) {
    onChange({
      ...value,
      [key]: next,
    });
  }

  function updatePerson(
    index: number,
    key:
      keyof ContactPersonValue,
    next: string | boolean,
  ) {
    update(
      "contact_people",
      value.contact_people.map(
        (
          person,
          personIndex,
        ) =>
          personIndex ===
          index
            ? {
                ...person,
                [key]: next,
              }
            : person,
      ),
    );
  }

  function removePerson(
    index: number,
  ) {
    update(
      "contact_people",
      value.contact_people.filter(
        (_, i) => i !== index,
      ),
    );
  }

  function addPerson() {
    update(
      "contact_people",
      [
        ...value.contact_people,
        {
          name: "",
          role_label: "",
          phone: "",
          is_visible: true,
        },
      ],
    );
  }

  return (
    <>
      <section className="border-t border-slate-200 px-5 py-5 sm:px-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Infos pratiques
        </h3>

        <div className="grid max-w-2xl gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Adresse administrative
            </span>

            <input
              value={
                value.admin_address
              }
              onChange={(
                event,
              ) =>
                update(
                  "admin_address",
                  event.target
                    .value,
                )
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Adresse des répétitions
            </span>

            <input
              value={
                value.rehearsal_address
              }
              onChange={(
                event,
              ) =>
                update(
                  "rehearsal_address",
                  event.target
                    .value,
                )
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Accessibilité
            </span>

            <textarea
              rows={3}
              value={
                value.accessibility_note
              }
              onChange={(
                event,
              ) =>
                update(
                  "accessibility_note",
                  event.target
                    .value,
                )
              }
              className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email
            </span>

            <input
              type="email"
              value={
                value.email
              }
              onChange={(
                event,
              ) =>
                update(
                  "email",
                  event.target
                    .value,
                )
              }
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      </section>

      <section className="border-t border-slate-200 px-5 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Personnes à contacter
          </h3>

          <button
            type="button"
            onClick={
              addPerson
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus
              size={14}
            />
            Ajouter
          </button>
        </div>

        <div className="grid max-w-3xl gap-3">
          {value.contact_people.map(
            (
              person,
              index,
            ) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Nom
                    </span>

                    <input
                      value={
                        person.name
                      }
                      onChange={(
                        event,
                      ) =>
                        updatePerson(
                          index,
                          "name",
                          event
                            .target
                            .value,
                        )
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Fonction
                    </span>

                    <input
                      value={
                        person.role_label
                      }
                      onChange={(
                        event,
                      ) =>
                        updatePerson(
                          index,
                          "role_label",
                          event
                            .target
                            .value,
                        )
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Téléphone
                    </span>

                    <input
                      value={
                        person.phone
                      }
                      onChange={(
                        event,
                      ) =>
                        updatePerson(
                          index,
                          "phone",
                          event
                            .target
                            .value,
                        )
                      }
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      updatePerson(
                        index,
                        "is_visible",
                        !person.is_visible,
                      )
                    }
                    title={
                      person.is_visible
                        ? "Visible"
                        : "Masquée"
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600"
                  >
                    {person.is_visible ? (
                      <Eye
                        size={15}
                      />
                    ) : (
                      <EyeOff
                        size={15}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removePerson(
                        index,
                      )
                    }
                    title="Supprimer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2
                      size={15}
                    />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 px-5 py-5 sm:px-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Carte
        </h3>

        <div className="grid max-w-2xl gap-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={
                value.show_map
              }
              onChange={(
                event,
              ) =>
                update(
                  "show_map",
                  event.target
                    .checked,
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm font-medium text-slate-700">
              Afficher la carte
            </span>
          </label>

          {value.show_map && (
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Adresse de la carte
              </span>

              <input
                value={
                  value.map_query
                }
                onChange={(
                  event,
                ) =>
                  update(
                    "map_query",
                    event.target
                      .value,
                  )
                }
                placeholder={
                  value.rehearsal_address
                }
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          )}
        </div>
      </section>
    </>
  );
}
