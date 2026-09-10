"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  useMemo,
  useRef,
  useState,
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
  ] = useState<ImportRow[]>([]);

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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[350] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fermer"
        onClick={close}
        className="absolute inset-0"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[26px] border border-[#e5e1d7] bg-[#faf9f6] shadow-2xl sm:max-w-5xl sm:rounded-[26px]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e8e4db] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#817d74]">
              Membres
            </p>

            <h2 className="mt-1 text-xl font-black text-[#292923]">
              Importer une liste
            </h2>
          </div>

          <button
            type="button"
            aria-label="Fermer"
            disabled={
              loading ||
              importing
            }
            onClick={close}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#f3f1eb] disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              {error}
            </div>
          )}

          {rows.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8d3c9] bg-white px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf1ea] text-[#607057]">
                <FileSpreadsheet
                  size={26}
                />
              </div>

              <h3 className="mt-4 text-lg font-black">
                Sélectionnez votre liste de membres
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#77746c]">
                Le fichier doit contenir au minimum le prénom, le nom et l&apos;email.
                Le téléphone est facultatif.
              </p>

              <p className="mt-2 text-xs font-semibold text-[#969187]">
                XLSX ou CSV · 10 Mo maximum
              </p>

              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv"
                disabled={loading}
                onChange={(event) => {
                  const file =
                    event
                      .target
                      .files?.[0];

                  if (file) {
                    void parseFile(
                      file,
                    );
                  }
                }}
                className="hidden"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  inputRef.current?.click()
                }
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#687a5e] px-5 text-sm font-bold text-white transition hover:bg-[#56664d] disabled:opacity-50"
              >
                <Upload size={17} />

                {loading
                  ? "Analyse…"
                  : "Choisir un fichier"}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#e3dfd5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#292923]">
                    {fileName}
                  </p>

                  <p className="mt-1 text-sm text-[#77746c]">
                    {rows.length} ligne
                    {rows.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    détectée
                    {rows.length !==
                    1
                      ? "s"
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-[#edf3ea] px-3 py-1.5 text-[#52634a]">
                    {newCount} nouveau
                    {newCount !== 1
                      ? "x"
                      : ""}
                  </span>

                  {existingCount >
                    0 && (
                    <span className="rounded-full bg-[#f2f0ea] px-3 py-1.5 text-[#6c685f]">
                      {existingCount} déjà présent
                      {existingCount !==
                      1
                        ? "s"
                        : ""}
                    </span>
                  )}

                  {invalidCount >
                    0 && (
                    <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                      {invalidCount} à corriger
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#e3dfd5] bg-white">
                <div className="hidden grid-cols-[1fr_1fr_1.5fr_1fr_44px] gap-3 border-b border-[#ece8df] bg-[#f8f7f3] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#817d74] md:grid">
                  <span>Prénom</span>
                  <span>Nom</span>
                  <span>Email</span>
                  <span>Téléphone</span>
                  <span />
                </div>

                <div className="divide-y divide-[#eeeae2]">
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

                      return (
                        <div
                          key={
                            row.rowId
                          }
                          className="p-4"
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
                                  event.target
                                    .value,
                                )
                              }
                              className="min-h-10 rounded-lg border border-[#dedad1] bg-white px-3 text-sm outline-none focus:border-[#687a5e]"
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
                                  event.target
                                    .value,
                                )
                              }
                              className="min-h-10 rounded-lg border border-[#dedad1] bg-white px-3 text-sm outline-none focus:border-[#687a5e]"
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
                                  event.target
                                    .value,
                                )
                              }
                              className="min-h-10 rounded-lg border border-[#dedad1] bg-white px-3 text-sm outline-none focus:border-[#687a5e]"
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
                                  event.target
                                    .value,
                                )
                              }
                              className="min-h-10 rounded-lg border border-[#dedad1] bg-white px-3 text-sm outline-none focus:border-[#687a5e]"
                            />

                            <button
                              type="button"
                              aria-label="Supprimer la ligne"
                              onClick={() =>
                                removeRow(
                                  row.rowId,
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#8a867d] transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {validation && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle
                                  size={13}
                                />

                                {
                                  validation
                                }
                              </span>
                            )}

                            {duplicate && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertCircle
                                  size={13}
                                />

                                Email en double dans le fichier
                              </span>
                            )}

                            {!validation &&
                              !duplicate &&
                              existing && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#716d64]">
                                  <CheckCircle2
                                    size={13}
                                  />

                                  {existing.accountStatus ===
                                    "pending"
                                    ? "Inscription en attente — sera approuvée"
                                    : "Déjà présent — les informations seront mises à jour"}
                                </span>
                              )}
                          </div>
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
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#e8e4db] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
              className="min-h-11 rounded-xl border border-[#ddd9cf] px-4 text-sm font-bold text-[#625f57]"
            >
              Changer de fichier
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  importing
                }
                onClick={close}
                className="min-h-11 rounded-xl border border-[#ddd9cf] px-4 text-sm font-bold"
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
                className="min-h-11 rounded-xl bg-[#687a5e] px-5 text-sm font-bold text-white transition hover:bg-[#56664d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing
                  ? "Import…"
                  : `Importer ${rows.length} membre${
                      rows.length !==
                      1
                        ? "s"
                        : ""
                    }`}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}