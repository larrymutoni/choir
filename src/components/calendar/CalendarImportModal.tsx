"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useRef, useState } from "react";

type ImportedRow = {
  id: string;

  title: string;
  date: string;

  startTime: string;
  endTime: string;

  allDay: boolean;

  location: string;
  notes: string;

  warning: string | null;
};

type ParsedRow = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  notes: string;
  warning: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

function emptyRow(): ImportedRow {
  return {
    id: crypto.randomUUID(),

    title: "",
    date: "",

    startTime: "",
    endTime: "",

    allDay: false,

    location: "",
    notes: "",

    warning: null,
  };
}

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function rowError(row: ImportedRow) {
  if (!row.title.trim()) {
    return "Titre manquant";
  }

  if (!row.date) {
    return "Date manquante";
  }

  if (!row.allDay && !row.startTime) {
    return "Heure de début manquante";
  }

  if (
    !row.allDay &&
    row.startTime &&
    row.endTime &&
    row.endTime <= row.startTime
  ) {
    return "L'heure de fin doit être après l'heure de début";
  }

  return null;
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as {
      message?: string;
    };

    return body.message || "Une erreur est survenue.";
  } catch {
    return "Une erreur est survenue.";
  }
}

export function CalendarImportModal({ open, onClose, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState("");

  const [rows, setRows] = useState<ImportedRow[]>([]);

  const [parsing, setParsing] = useState(false);

  const [importing, setImporting] = useState(false);

  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  const invalidCount = rows.filter((row) => Boolean(rowError(row))).length;

  const warningCount = rows.filter(
    (row) => !rowError(row) && Boolean(row.warning),
  ).length;

  const validCount = rows.length - invalidCount;

  function reset() {
    setFileName("");
    setRows([]);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function close() {
    if (parsing || importing) {
      return;
    }

    reset();
    onClose();
  }

  function updateRow(id: string, changes: Partial<ImportedRow>) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              ...changes,
            }
          : row,
      ),
    );
  }

  function deleteRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  async function parseFile(file: File) {
    setParsing(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/member/calendar/import/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = (await response.json()) as {
        fileName: string;
        events: ParsedRow[];
      };

      setFileName(data.fileName);

      setRows(
        data.events.map((event) => ({
          id: event.id,

          title: event.title,

          date: event.date,

          startTime: event.startTime,

          endTime: event.endTime,

          allDay: event.allDay,

          location: event.location,

          notes: event.notes,

          warning: event.warning,
        })),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'analyser le fichier.",
      );
    } finally {
      setParsing(false);
    }
  }

  async function importRows() {
    if (importing || rows.length === 0) {
      return;
    }

    if (invalidCount > 0) {
      setError("Corrigez ou supprimez les lignes invalides avant l'import.");

      return;
    }

    setImporting(true);
    setError("");

    try {
      const events = rows.map((row) => ({
        title: row.title.trim(),

        startAt: row.allDay
          ? new Date(`${row.date}T00:00:00`).toISOString()
          : toIso(row.date, row.startTime),

        endAt: !row.allDay && row.endTime ? toIso(row.date, row.endTime) : null,

        allDay: row.allDay,

        location: row.location.trim() || null,

        notes: row.notes.trim() || null,
      }));

      const response = await fetch("/api/member/calendar/import/commit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          events,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      onImported();
      close();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'importer le planning.",
      );
    } finally {
      setImporting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#ddd9cf] bg-white px-3 py-2.5 text-[16px] text-[#292923] outline-none transition focus:border-[#687a5e] focus:ring-3 focus:ring-[#687a5e]/10 sm:text-sm";

  return (
    <div className="fixed inset-0 z-[350] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fermer"
        onClick={close}
        className="absolute inset-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[24px] border border-[#e5e1d7] bg-[#faf9f6] shadow-2xl sm:max-w-6xl sm:rounded-[24px]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e9e5dc] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#77746c]">
              Calendrier
            </p>

            <h2 className="mt-1 text-xl font-black text-[#25251f]">
              Importer un planning
            </h2>

            <p className="mt-1 text-sm text-[#77746c]">
              Vérifiez les événements détectés avant de les ajouter au
              calendrier.
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            disabled={parsing || importing}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#625f58] transition hover:bg-[#f2f0ea] disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </header>

        {rows.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {error}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv,.docx"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  void parseFile(file);
                }
              }}
            />

            <button
              type="button"
              disabled={parsing}
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9d5ca] bg-white px-6 py-10 text-center transition hover:border-[#aeb8a8] hover:bg-[#fbfcfa] disabled:opacity-60"
            >
              {parsing ? (
                <>
                  <Loader2 size={34} className="animate-spin text-[#687a5e]" />

                  <span className="mt-4 font-bold text-[#34342e]">
                    Analyse du planning…
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef1eb] text-[#687a5e]">
                    <Upload size={25} />
                  </div>

                  <span className="mt-4 text-base font-bold text-[#34342e]">
                    Choisir un fichier
                  </span>

                  <span className="mt-2 max-w-md text-sm leading-6 text-[#77746c]">
                    XLSX, CSV ou DOCX · maximum 10 Mo
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e9e5dc] bg-[#faf9f6] px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <FileSpreadsheet
                  size={20}
                  className="shrink-0 text-[#687a5e]"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#33332d]">
                    {fileName}
                  </p>

                  <p className="text-xs text-[#77746c]">
                    {rows.length} événement
                    {rows.length > 1 ? "s" : ""} détecté
                    {rows.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {invalidCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                    <AlertTriangle size={14} />
                    {invalidCount} invalide
                    {invalidCount > 1 ? "s" : ""}
                  </span>
                ) : warningCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                    <AlertTriangle size={14} />
                    {warningCount} à vérifier
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2ea] px-3 py-1.5 text-xs font-bold text-[#53614c]">
                    <CheckCircle2 size={14} />
                    Tout est prêt
                  </span>
                )}

                <button
                  type="button"
                  onClick={reset}
                  disabled={importing}
                  className="min-h-10 rounded-xl border border-[#ddd9cf] bg-white px-3 text-sm font-bold text-[#5d5a53] transition hover:bg-[#f5f3ed]"
                >
                  Autre fichier
                </button>

                <button
                  type="button"
                  onClick={() => setRows((current) => [...current, emptyRow()])}
                  disabled={importing}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#ddd9cf] bg-white px-3 text-sm font-bold text-[#4f5c49] transition hover:bg-[#f3f6f1]"
                >
                  <Plus size={15} />
                  Ajouter une ligne
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-[#ece8df]">
                {rows.map((row, index) => {
                  const validation = rowError(row);

                  return (
                    <div key={row.id} className="bg-white px-4 py-5 sm:px-6">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#8a867d]">
                            Événement {index + 1}
                          </p>

                          {validation ? (
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                              <AlertTriangle size={13} />
                              {validation}
                            </p>
                          ) : row.warning ? (
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                              <AlertTriangle size={13} />À vérifier
                            </p>
                          ) : (
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#66745f]">
                              <CheckCircle2 size={13} />
                              Prêt
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          disabled={importing}
                          aria-label={`Supprimer l'événement ${index + 1}`}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {row.warning && (
                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium leading-5 text-amber-800">
                          {row.warning}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="md:col-span-5">
                          <label className="mb-1.5 block text-xs font-bold text-[#646159]">
                            Titre
                          </label>

                          <input
                            value={row.title}
                            maxLength={120}
                            onChange={(event) =>
                              updateRow(row.id, {
                                title: event.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="mb-1.5 block text-xs font-bold text-[#646159]">
                            Date
                          </label>

                          <input
                            type="date"
                            value={row.date}
                            onChange={(event) =>
                              updateRow(row.id, {
                                date: event.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className="flex items-end md:col-span-4">
                          <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-[#ddd9cf] bg-[#faf9f6] px-3 text-sm font-semibold text-[#57544d]">
                            <input
                              type="checkbox"
                              checked={row.allDay}
                              onChange={(event) =>
                                updateRow(row.id, {
                                  allDay: event.target.checked,
                                })
                              }
                              className="h-4 w-4 accent-[#687a5e]"
                            />
                            Toute la journée
                          </label>
                        </div>

                        {!row.allDay && (
                          <>
                            <div className="md:col-span-3">
                              <label className="mb-1.5 block text-xs font-bold text-[#646159]">
                                Début
                              </label>

                              <input
                                type="time"
                                value={row.startTime}
                                onChange={(event) =>
                                  updateRow(row.id, {
                                    startTime: event.target.value,
                                  })
                                }
                                className={inputClass}
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="mb-1.5 block text-xs font-bold text-[#646159]">
                                Fin
                              </label>

                              <input
                                type="time"
                                value={row.endTime}
                                onChange={(event) =>
                                  updateRow(row.id, {
                                    endTime: event.target.value,
                                  })
                                }
                                className={inputClass}
                              />
                            </div>
                          </>
                        )}

                        <div
                          className={
                            row.allDay ? "md:col-span-12" : "md:col-span-6"
                          }
                        >
                          <label className="mb-1.5 block text-xs font-bold text-[#646159]">
                            Lieu
                          </label>

                          <input
                            value={row.location}
                            maxLength={200}
                            onChange={(event) =>
                              updateRow(row.id, {
                                location: event.target.value,
                              })
                            }
                            placeholder="Facultatif"
                            className={inputClass}
                          />
                        </div>

                        <div className="md:col-span-12">
                          <label className="mb-1.5 block text-xs font-bold text-[#646159]">
                            Notes
                          </label>

                          <textarea
                            rows={2}
                            value={row.notes}
                            maxLength={5000}
                            onChange={(event) =>
                              updateRow(row.id, {
                                notes: event.target.value,
                              })
                            }
                            placeholder="Facultatif"
                            className={`${inputClass} resize-none`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <footer className="shrink-0 border-t border-[#e9e5dc] bg-white px-4 py-4 sm:px-6">
              {error && (
                <div
                  role="alert"
                  className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#77746c]">
                  <strong className="text-[#33332d]">{validCount}</strong>{" "}
                  événement
                  {validCount > 1 ? "s" : ""} prêt
                  {validCount > 1 ? "s" : ""} à être ajouté
                  {validCount > 1 ? "s" : ""}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={close}
                    disabled={importing}
                    className="min-h-11 rounded-xl border border-[#ddd9cf] bg-white px-4 text-sm font-bold text-[#57544d]"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={importRows}
                    disabled={
                      importing || rows.length === 0 || invalidCount > 0
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#687a5e] px-5 text-sm font-bold text-white transition hover:bg-[#56664d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importing && (
                      <Loader2 size={16} className="animate-spin" />
                    )}

                    {importing
                      ? "Ajout…"
                      : `Ajouter ${rows.length} événement${rows.length > 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
