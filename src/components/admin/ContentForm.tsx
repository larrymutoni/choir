"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Check,
  Save,
} from "lucide-react";

import {
  PageImageEditor,
} from "@/components/admin/PageImageEditor";

import {
  ContactPageFields,
  type ContactPageData,
} from "@/components/admin/ContactPageFields";

type ContentField = {
  key: string;
  label: string;
  value: string;
  type: "text" | "textarea";
  rows?: number;
};

type ContentImage = {
  key: string;
  label: string;
  url: string;
  alt: string;
  canRemove: boolean;
};

type ContentGroup = {
  id: string;
  title: string;
  image?: ContentImage;
  fields: ContentField[];
};

type ContentPage = {
  id: string;
  label: string;
  groups: ContentGroup[];
};

type ContentFormProps = {
  pages: ContentPage[];
  canManageImages: boolean;
  contactData: ContactPageData;
};

function getInitialValues(
  pages: ContentPage[],
) {
  const values:
    Record<string, string> =
      {};

  for (const page of pages) {
    for (const group of page.groups) {
      for (const field of group.fields) {
        values[field.key] =
          field.value;
      }
    }
  }

  return values;
}

function getPageKeys(
  page: ContentPage,
) {
  return new Set(
    page.groups.flatMap(
      (group) =>
        group.fields.map(
          (field) =>
            field.key,
        ),
    ),
  );
}

export function ContentForm({
  pages,
  canManageImages,
  contactData,
}: ContentFormProps) {
  const initialValues =
    useMemo(
      () =>
        getInitialValues(
          pages,
        ),
      [pages],
    );

  const [
    values,
    setValues,
  ] = useState<
    Record<string, string>
  >(initialValues);

  const [
    savedValues,
    setSavedValues,
  ] = useState<
    Record<string, string>
  >(initialValues);

  const [
    contact,
    setContact,
  ] = useState<ContactPageData>(
    contactData,
  );

  const [
    savedContact,
    setSavedContact,
  ] = useState<ContactPageData>(
    contactData,
  );

  const [
    activePageId,
    setActivePageId,
  ] = useState(
    pages[0]?.id ?? "",
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const activePage =
    pages.find(
      (page) =>
        page.id ===
        activePageId,
    ) ?? pages[0];

  if (!activePage) {
    return null;
  }

  const activeKeys =
    getPageKeys(
      activePage,
    );

  const activeChanges =
    Object.entries(
      values,
    ).filter(
      ([key, value]) =>
        activeKeys.has(
          key,
        ) &&
        savedValues[key] !==
          value,
    );

  const contactDirty =
    JSON.stringify(contact) !==
    JSON.stringify(
      savedContact,
    );

  const activeDirty =
    activeChanges.length > 0 ||
    (
      activePage.id ===
        "contact" &&
      contactDirty
    );

  function pageChangeCount(
    page: ContentPage,
  ) {
    const keys =
      getPageKeys(page);

    const textChanges =
      Object.entries(
        values,
      ).filter(
        ([key, value]) =>
          keys.has(key) &&
          savedValues[key] !==
            value,
      ).length;

    return (
      textChanges +
      (
        page.id ===
          "contact" &&
        contactDirty
          ? 1
          : 0
      )
    );
  }

  function selectPage(
    id: string,
  ) {
    setActivePageId(id);
    setSuccess("");
    setError("");
  }

  function updateValue(
    key: string,
    value: string,
  ) {
    setValues(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );

    setSuccess("");
    setError("");
  }

  async function readResult(
    response: Response,
  ) {
    return (await response
      .json()
      .catch(() => ({}))) as {
      message?: string;
    };
  }

  async function savePage() {
    if (
      saving ||
      !activeDirty
    ) {
      return;
    }

    const submitted =
      activeChanges.map(
        ([key, value]) => ({
          key,
          value,
        }),
      );

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      let response: Response;

      if (
        activePage.id ===
        "contact"
      ) {
        response =
          await fetch(
            "/api/admin/content/contact",
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  content_items:
                    submitted,

                  ...contact,
                }),
            },
          );
      } else {
        response =
          await fetch(
            "/api/admin/content",
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  items:
                    submitted,
                }),
            },
          );
      }

      const result =
        await readResult(
          response,
        );

      if (!response.ok) {
        setError(
          result.message ??
            "Erreur pendant l’enregistrement.",
        );

        return;
      }

      setSavedValues(
        (current) => {
          const next = {
            ...current,
          };

          for (
            const item
            of submitted
          ) {
            next[
              item.key
            ] =
              item.value;
          }

          return next;
        },
      );

      if (
        activePage.id ===
        "contact"
      ) {
        setSavedContact(
          structuredClone(
            contact,
          ),
        );
      }

      setSuccess(
        "Enregistré",
      );
    } catch {
      setError(
        "Impossible de contacter le serveur.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6">
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
          <nav className="p-2">
            {pages.map(
              (page) => {
                const active =
                  page.id ===
                  activePage.id;

                const count =
                  pageChangeCount(
                    page,
                  );

                return (
                  <button
                    key={
                      page.id
                    }
                    type="button"
                    onClick={() =>
                      selectPage(
                        page.id,
                      )
                    }
                    className={[
                      "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition",
                      active
                        ? "bg-slate-900 font-semibold text-white"
                        : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    ].join(
                      " ",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {
                        page.label
                      }
                    </span>

                    {count >
                      0 && (
                      <span
                        className={[
                          "ml-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                          active
                            ? "bg-white text-slate-900"
                            : "bg-amber-100 text-amber-700",
                        ].join(
                          " ",
                        )}
                      >
                        {
                          count
                        }
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </nav>
        </div>

        <div className="lg:hidden">
          <select
            value={
              activePage.id
            }
            onChange={(
              event,
            ) =>
              selectPage(
                event.target
                  .value,
              )
            }
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none"
          >
            {pages.map(
              (page) => (
                <option
                  key={
                    page.id
                  }
                  value={
                    page.id
                  }
                >
                  {
                    page.label
                  }
                </option>
              ),
            )}
          </select>
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 px-5 py-3 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              {
                activePage.label
              }
            </h2>

            {error && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            {!error &&
              success && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <Check
                    size={13}
                  />
                  {
                    success
                  }
                </p>
              )}
          </div>

          <button
            type="button"
            onClick={() =>
              void savePage()
            }
            disabled={
              saving ||
              !activeDirty
            }
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Save
              size={14}
            />

            {saving
              ? "Enregistrement…"
              : "Enregistrer"}
          </button>
        </header>

        <div className="divide-y divide-slate-200">
          {activePage.groups.map(
            (group) => (
              <section
                key={
                  group.id
                }
                className="px-5 py-5 sm:px-6"
              >
                <h3 className="mb-4 text-sm font-semibold text-slate-900">
                  {
                    group.title
                  }
                </h3>

                <div
                  className={
                    group.image
                      ? "grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]"
                      : ""
                  }
                >
                  {group.image && (
                    <PageImageEditor
                      imageKey={
                        group
                          .image
                          .key
                      }
                      label={
                        group
                          .image
                          .label
                      }
                      imageUrl={
                        group
                          .image
                          .url
                      }
                      altText={
                        group
                          .image
                          .alt
                      }
                      canManage={
                        canManageImages
                      }
                      canRemove={
                        group
                          .image
                          .canRemove
                      }
                    />
                  )}

                  <div className="grid max-w-2xl gap-4">
                    {group.fields.map(
                      (field) => (
                        <label
                          key={
                            field.key
                          }
                        >
                          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                            {
                              field.label
                            }
                          </span>

                          {field.type ===
                          "textarea" ? (
                            <textarea
                              rows={
                                field.rows ??
                                3
                              }
                              value={
                                values[
                                  field
                                    .key
                                ] ??
                                ""
                              }
                              onChange={(
                                event,
                              ) =>
                                updateValue(
                                  field.key,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          ) : (
                            <input
                              type="text"
                              value={
                                values[
                                  field
                                    .key
                                ] ??
                                ""
                              }
                              onChange={(
                                event,
                              ) =>
                                updateValue(
                                  field.key,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          )}
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </section>
            ),
          )}

          {activePage.id ===
            "contact" && (
            <ContactPageFields
              value={contact}
              onChange={(
                next,
              ) => {
                setContact(
                  next,
                );

                setSuccess("");
                setError("");
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
