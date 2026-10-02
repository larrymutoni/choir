"use client";

import {
  useRef,
  useState,
} from "react";

import {
  ImagePlus,
  LoaderCircle,
  Pencil,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";

import { useRouter } from "next/navigation";

type PageImageEditorProps = {
  imageKey: string;
  label: string;
  imageUrl: string;
  altText: string;
  canManage: boolean;
  canRemove?: boolean;
};

export function PageImageEditor({
  imageKey,
  label,
  imageUrl,
  altText,
  canManage,
  canRemove = false,
}: PageImageEditorProps) {
  const router = useRouter();

  const fileInput =
    useRef<HTMLInputElement>(null);

  const [modal, setModal] =
    useState<
      "preview" | "edit" | null
    >(null);

  const [busy, setBusy] =
    useState(false);

  const [dragging, setDragging] =
    useState(false);

  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [error, setError] =
    useState("");

  function closeModal() {
    if (busy) return;

    setModal(null);
    setError("");
    setDragging(false);
    setConfirmDelete(false);
  }

  function chooseFile() {
    fileInput.current?.click();
  }

  async function upload(
    file: File,
  ) {
    setBusy(true);
    setError("");

    const formData =
      new FormData();

    formData.append(
      "key",
      imageKey,
    );

    formData.append(
      "alt_text",
      altText,
    );

    formData.append(
      "file",
      file,
    );

    try {
      const response =
        await fetch(
          "/api/admin/images",
          {
            method: "POST",
            body: formData,
          },
        );

      const result =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as {
          message?: string;
        };

      if (!response.ok) {
        setError(
          result.message ??
            "Impossible d’enregistrer l’image.",
        );
        return;
      }

      setModal(null);
      router.refresh();
    } catch {
      setError(
        "Impossible de contacter le serveur.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/admin/images",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                key: imageKey,
              }),
          },
        );

      const result =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as {
          message?: string;
        };

      if (!response.ok) {
        setError(
          result.message ??
            "Impossible de supprimer l’image.",
        );
        return;
      }

      setModal(null);
      router.refresh();
    } catch {
      setError(
        "Impossible de contacter le serveur.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-600">
          {label}
        </p>

        {imageUrl ? (
          <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
            <img
              src={imageUrl}
              alt={
                altText ||
                label
              }
              className="aspect-[4/3] w-full object-cover"
            />

            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 opacity-0 transition duration-200 group-hover:bg-black/35 group-hover:opacity-100">
              <button
                type="button"
                onClick={() =>
                  setModal(
                    "preview",
                  )
                }
                title="Agrandir"
                aria-label="Agrandir"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition hover:scale-105 hover:bg-slate-50"
              >
                <ZoomIn
                  size={19}
                />
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={() =>
                    setModal(
                      "edit",
                    )
                  }
                  title="Modifier"
                  aria-label="Modifier"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition hover:scale-105 hover:bg-slate-50"
                >
                  <Pencil
                    size={18}
                  />
                </button>
              )}
            </div>
          </div>
        ) : canManage ? (
          <button
            type="button"
            onClick={() =>
              setModal("edit")
            }
            className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-slate-400 hover:bg-slate-100"
          >
            <ImagePlus
              size={24}
              className="text-slate-400"
            />
          </button>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <ImagePlus
              size={22}
              className="text-slate-300"
            />
          </div>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(
            event,
          ) => {
            const file =
              event.target
                .files?.[0];

            event.target.value =
              "";

            if (file) {
              void upload(
                file,
              );
            }
          }}
        />
      </div>

      {modal === "preview" &&
        imageUrl && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5"
            onMouseDown={(
              event,
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <img
              src={imageUrl}
              alt={
                altText ||
                label
              }
              className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            />

            <button
              type="button"
              onClick={
                closeModal
              }
              aria-label="Fermer"
              className="fixed right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            >
              <X
                size={22}
              />
            </button>
          </div>
        )}

      {modal === "edit" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  {imageUrl
                    ? "Modifier la photo"
                    : "Ajouter une photo"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {label}
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={
                  closeModal
                }
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <X
                  size={18}
                />
              </button>
            </header>

            <div className="p-6">
              {!confirmDelete ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={
                      chooseFile
                    }
                    onDragOver={(
                      event,
                    ) => {
                      event.preventDefault();
                      setDragging(
                        true,
                      );
                    }}
                    onDragLeave={() =>
                      setDragging(
                        false,
                      )
                    }
                    onDrop={(
                      event,
                    ) => {
                      event.preventDefault();
                      setDragging(
                        false,
                      );

                      const file =
                        event
                          .dataTransfer
                          .files?.[0];

                      if (file) {
                        void upload(
                          file,
                        );
                      }
                    }}
                    className={[
                      "flex min-h-56 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 text-center transition",
                      dragging
                        ? "border-slate-600 bg-slate-100"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
                    ].join(
                      " ",
                    )}
                  >
                    {busy ? (
                      <LoaderCircle
                        size={28}
                        className="animate-spin text-slate-500"
                      />
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
                          <Upload
                            size={20}
                          />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-900">
                          {imageUrl
                            ? "Choisir une nouvelle photo"
                            : "Choisir une photo"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          JPG, PNG ou WebP · 8 Mo max.
                        </p>
                      </>
                    )}
                  </button>

                  {imageUrl &&
                    canRemove && (
                      <div className="mt-5 border-t border-slate-200 pt-5">
                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            setConfirmDelete(
                              true,
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2
                            size={14}
                          />
                          Supprimer la photo
                        </button>
                      </div>
                    )}
                </>
              ) : (
                <div className="py-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <Trash2
                      size={19}
                    />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-slate-950">
                    Supprimer cette photo ?
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Cette action est définitive.
                  </p>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={
                        busy
                      }
                      onClick={() =>
                        setConfirmDelete(
                          false,
                        )
                      }
                      className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      disabled={
                        busy
                      }
                      onClick={() =>
                        void remove()
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy && (
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                        />
                      )}

                      Supprimer
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
