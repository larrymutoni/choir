"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

type ExistingMember = {
  membershipId: string | null;
  userId: string | null;
  email: string;

  accountStatus:
    | "pending"
    | "active"
    | "rejected"
    | null;

  isOfficial: boolean;
};

type ImportRow = {
  rowId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  error: string | null;
};

type Props = {
  open: boolean;

  existingMembers:
    ExistingMember[];

  onClose: () => void;

  onImported: () => void;
};

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function validEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim(),
  );
}

function rowError(
  row: ImportRow,
) {
  if (
    !row.firstname.trim()
  ) {
    return "Prénom manquant";
  }

  if (
    !row.lastname.trim()
  ) {
    return "Nom manquant";
  }

  if (
    !validEmail(
      row.email,
    )
  ) {
    return "Email invalide";
  }

  return null;
}

export function MemberImportDialog({
  open,
  existingMembers,
  onClose,
  onImported,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    rows,
    setRows,
  ] =
    useState<ImportRow[]>(
      [],
    );

  const [
    fileName,
    setFileName,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    importing,
    setImporting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const duplicateEmails =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      for (
        const row of rows
      ) {
        const email =
          normalizeEmail(
            row.email,
          );

        if (!email) {
          continue;
        }

        counts.set(
          email,
          (counts.get(
            email,
          ) ?? 0) + 1,
        );
      }

      return new Set(
        [...counts.entries()]
          .filter(
            ([, count]) =>
              count > 1,
          )
          .map(
            ([email]) =>
              email,
          ),
      );
    }, [rows]);

  const existingByEmail =
    useMemo(() => {
      return new Map(
        existingMembers.map(
          (member) => [
            normalizeEmail(
              member.email,
            ),
            member,
          ],
        ),
      );
    }, [
      existingMembers,
    ]);

  const invalidCount =
    useMemo(() => {
      return rows.filter(
        (row) =>
          Boolean(
            rowError(row),
          ) ||
          duplicateEmails.has(
            normalizeEmail(
              row.email,
            ),
          ),
      ).length;
    }, [
      rows,
      duplicateEmails,
    ]);

  const newCount =
    useMemo(() => {
      return rows.filter(
        (row) =>
          !existingByEmail.has(
            normalizeEmail(
              row.email,
            ),
          ),
      ).length;
    }, [
      rows,
      existingByEmail,
    ]);

  const existingCount =
    rows.length -
    newCount;

  function reset() {
    setRows([]);
    setFileName("");
    setError("");
    setLoading(false);
    setImporting(false);

    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  }

  function close() {
    if (
      loading ||
      importing
    ) {
      return;
    }

    reset();
    onClose();
  }

  async function parseFile(
    file: File,
  ) {
    setLoading(true);
    setError("");
    setRows([]);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          "/api/member/members/import/parse",
          {
            method: "POST",
            body: formData,
          },
        );

      const data =
        (await response
          .json()
          .catch(
            () => null,
          )) as {
          message?: string;
          fileName?: string;
          members?: ImportRow[];
        } | null;

      if (
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            "Impossible d'analyser le fichier.",
        );
      }

      setFileName(
        data?.fileName ||
          file.name,
      );

      setRows(
        data?.members ??
          [],
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'analyser le fichier.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateRow(
    rowId: string,
    field:
      | "firstname"
      | "lastname"
      | "email"
      | "phone",
    value: string,
  ) {
    setRows(
      (current) =>
        current.map(
          (row) =>
            row.rowId ===
            rowId
              ? {
                  ...row,
                  [field]:
                    value,
                }
              : row,
        ),
    );
  }

  function removeRow(
    rowId: string,
  ) {
    setRows(
      (current) =>
        current.filter(
          (row) =>
            row.rowId !==
            rowId,
        ),
    );
  }

  async function commit() {
    if (
      rows.length === 0 ||
      invalidCount > 0
    ) {
      return;
    }

    setImporting(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/member/members/import/commit",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                members:
                  rows.map(
                    (row) => ({
                      firstname:
                        row.firstname.trim(),

                      lastname:
                        row.lastname.trim(),

                      email:
                        normalizeEmail(
                          row.email,
                        ),

                      phone:
                        row.phone.trim() ||
                        null,
                    }),
                  ),
              }),
          },
        );

      const data =
        (await response
          .json()
          .catch(
            () => null,
          )) as {
          message?: string;
        } | null;

      if (
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            "Impossible d'importer les membres.",
        );
      }

      reset();
      onClose();
      onImported();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'importer les membres.",
      );
    } finally {
      setImporting(false);
    }
  }

  function handleDrop(
    event:
      DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const file =
      event.dataTransfer
        .files?.[0];

    if (file) {
      void parseFile(file);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[350] flex items-end justify-center bg-slate-950/30 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fermer"
        onClick={close}
        className="absolute inset-0"
      />

      <div className="relative z-10 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-slate-50 shadow-2xl sm:max-w-6xl sm:rounded-2xl">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950">
            Importer des membres
          </h2>

          <button
            type="button"
            aria-label="Fermer"
            disabled={
              loading ||
              importing
            }
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </header>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          disabled={
            loading ||
            importing
          }
          onChange={(
            event,
          ) => {
            const file =
              event.target
                .files?.[0];

            if (file) {
              void parseFile(
                file,
              );
            }
          }}
          className="hidden"
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>
                {error}
              </span>
            </div>
          )}

          {rows.length ===
          0 ? (
            <div
              onDragOver={(
                event,
              ) =>
                event.preventDefault()
              }
              onDrop={
                handleDrop
              }
              className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center transition hover:border-slate-400"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                {loading ? (
                  <LoaderCircle
                    size={22}
                    className="animate-spin"
                  />
                ) : (
                  <FileSpreadsheet
                    size={22}
                  />
                )}
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {loading
                  ? "Analyse du fichier…"
                  : "Sélectionner un fichier"}
              </h3>

              {!loading && (
                <>
                  <p className="mt-1.5 text-sm text-slate-500">
                    XLSX ou CSV
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      inputRef.current?.click()
                    }
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Upload
                      size={16}
                    />
                    Choisir un fichier
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FileSpreadsheet
                      size={18}
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {fileName}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {rows.length} ligne
                      {rows.length !==
                      1
                        ? "s"
                        : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    importing
                  }
                  onClick={() => {
                    reset();

                    setTimeout(
                      () =>
                        inputRef.current?.click(),
                      0,
                    );
                  }}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                  />
                  Changer
                </button>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-lg font-semibold text-slate-950">
                    {newCount}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Nouveau
                    {newCount !==
                    1
                      ? "x"
                      : ""}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-lg font-semibold text-slate-950">
                    {
                      existingCount
                    }
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Déjà présent
                    {existingCount !==
                    1
                      ? "s"
                      : ""}
                  </p>
                </div>

                <div
                  className={[
                    "rounded-xl border px-4 py-3",
                    invalidCount >
                    0
                      ? "border-red-200 bg-red-50"
                      : "border-slate-200 bg-white",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-lg font-semibold",
                      invalidCount >
                      0
                        ? "text-red-700"
                        : "text-slate-950",
                    ].join(" ")}
                  >
                    {
                      invalidCount
                    }
                  </p>

                  <p
                    className={[
                      "mt-0.5 text-xs",
                      invalidCount >
                      0
                        ? "text-red-600"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    À corriger
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="hidden grid-cols-[1fr_1fr_1.5fr_1fr_44px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 md:grid">
                  <span>
                    Prénom
                  </span>

                  <span>
                    Nom
                  </span>

                  <span>
                    Email
                  </span>

                  <span>
                    Téléphone
                  </span>

                  <span />
                </div>

                <div className="divide-y divide-slate-100">
                  {rows.map(
                    (row) => {
                      const validation =
                        rowError(
                          row,
                        );

                      const email =
                        normalizeEmail(
                          row.email,
                        );

                      const duplicate =
                        duplicateEmails.has(
                          email,
                        );

                      const existing =
                        existingByEmail.get(
                          email,
                        );

                      const invalid =
                        Boolean(
                          validation ||
                          duplicate,
                        );

                      return (
                        <div
                          key={
                            row.rowId
                          }
                          className={[
                            "p-4 transition",
                            invalid
                              ? "bg-red-50/40"
                              : "bg-white hover:bg-slate-50/70",
                          ].join(" ")}
                        >
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1.5fr_1fr_44px]">
                            <input
                              value={
                                row.firstname
                              }
                              placeholder="Prénom"
                              onChange={(
                                event,
                              ) =>
                                updateRow(
                                  row.rowId,
                                  "firstname",
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />

                            <input
                              value={
                                row.lastname
                              }
                              placeholder="Nom"
                              onChange={(
                                event,
                              ) =>
                                updateRow(
                                  row.rowId,
                                  "lastname",
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />

                            <input
                              type="email"
                              value={
                                row.email
                              }
                              placeholder="Email"
                              onChange={(
                                event,
                              ) =>
                                updateRow(
                                  row.rowId,
                                  "email",
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />

                            <input
                              type="tel"
                              value={
                                row.phone
                              }
                              placeholder="Téléphone"
                              onChange={(
                                event,
                              ) =>
                                updateRow(
                                  row.rowId,
                                  "phone",
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                            />

                            <button
                              type="button"
                              aria-label="Supprimer la ligne"
                              onClick={() =>
                                removeRow(
                                  row.rowId,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>
                          </div>

                          {(validation ||
                            duplicate ||
                            existing) && (
                            <div className="mt-2 flex flex-wrap gap-3">
                              {validation && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                                  <AlertCircle
                                    size={13}
                                  />
                                  {
                                    validation
                                  }
                                </span>
                              )}

                              {duplicate && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                                  <AlertCircle
                                    size={13}
                                  />
                                  Email en double
                                </span>
                              )}

                              {!validation &&
                                !duplicate &&
                                existing && (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <CheckCircle2
                                      size={13}
                                      className="text-emerald-600"
                                    />

                                    {existing.accountStatus ===
                                    "pending"
                                      ? "Inscription en attente — sera approuvée"
                                      : "Déjà présent — sera mis à jour"}
                                  </span>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {rows.length >
          0 && (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-400">
              {invalidCount >
              0
                ? `${invalidCount} ligne${
                    invalidCount !==
                    1
                      ? "s"
                      : ""
                  } à corriger`
                : `${rows.length} membre${
                    rows.length !==
                    1
                      ? "s"
                      : ""
                  } prêt${
                    rows.length !==
                    1
                      ? "s"
                      : ""
                  } à importer`}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={
                  importing
                }
                onClick={close}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={
                  importing ||
                  invalidCount >
                    0 ||
                  rows.length ===
                    0
                }
                onClick={() =>
                  void commit()
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing && (
                  <LoaderCircle
                    size={15}
                    className="animate-spin"
                  />
                )}

                {importing
                  ? "Import…"
                  : `Importer ${rows.length}`}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
