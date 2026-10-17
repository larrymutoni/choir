"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useRef, useState } from "react";

type ExistingCalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  notes: string | null;
  seriesId: string | null;
  originalStartAt: string | null;
  isRecurring: boolean;
};

type DuplicateSource =
  | "calendar"
  | "file"
  | null;

type ImportedRow = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  duplicate: boolean;
  duplicateSource: DuplicateSource;
  timeConflict: boolean;
  conflictAction:
    | "keep-existing"
    | "replace"
    | "keep-both";
  existingEvent: ExistingCalendarEvent | null;
  warning: string | null;
};

type ParsedRow = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  duplicate?: boolean;
  duplicateSource?: DuplicateSource;
  timeConflict?: boolean;
  existingEvent?: ExistingCalendarEvent | null;
  warning: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  canClear: boolean;
};

function emptyRow(): ImportedRow {
  return {
    id: crypto.randomUUID(),
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    notes: "",
    duplicate: false,
    duplicateSource: null,
    timeConflict: false,
    conflictAction: "keep-existing",
    existingEvent: null,
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

  if (!row.startTime) {
    return "Heure de début manquante";
  }

  if (
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

function formatExistingDate(startAt: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(startAt));
}

function formatExistingTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function existingTimeRange(event: ExistingCalendarEvent) {
  const start = formatExistingTime(event.startAt);

  if (!event.endAt) {
    return start;
  }

  return `${start} – ${formatExistingTime(event.endAt)}`;
}

export function CalendarImportModal({
  open,
  onClose,
  onImported,
  canClear,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const [
    clearBeforeImport,
    setClearBeforeImport,
  ] = useState(false);


  if (!open) {
    return null;
  }

  const duplicateCount =
    rows.filter(
      (row) =>
        row.duplicate,
    ).length;

  const calendarDuplicateCount =
    clearBeforeImport
      ? 0
      : rows.filter(
          (row) =>
            row.duplicateSource ===
            "calendar",
        ).length;

  const fileDuplicateCount =
    rows.filter(
      (row) =>
        row.duplicateSource ===
        "file",
    ).length;

  const importableRows =
    rows.filter((row) => {
      /*
       * Un doublon présent plusieurs fois
       * dans le fichier reste ignoré.
       */
      if (
        row.duplicateSource ===
        "file"
      ) {
        return false;
      }

      /*
       * Si on nettoie tout le calendrier,
       * tout ce qui vient du fichier peut
       * être réimporté.
       */
      if (clearBeforeImport) {
        return true;
      }

      /*
       * Doublon exact déjà présent :
       * on conserve l'existant.
       */
      if (row.duplicate) {
        return false;
      }

      /*
       * Même créneau mais événement
       * différent :
       * "Conserver l'ancien" signifie
       * ne pas importer le nouveau.
       */
      if (
        row.timeConflict &&
        row.conflictAction ===
          "keep-existing"
      ) {
        return false;
      }

      return true;
    });

  const invalidCount =
    importableRows.filter(
      (row) =>
        Boolean(
          rowError(row),
        ),
    ).length;

  const warningCount =
    importableRows.filter(
      (row) =>
        !rowError(row) &&
        Boolean(
          row.warning,
        ),
    ).length;

  const validCount =
    importableRows.filter(
      (row) =>
        !rowError(row),
    ).length;

  const newRows =
    rows.filter(
      (row) =>
        row.duplicateSource !==
          "file" &&
        (
          clearBeforeImport ||
          (
            !row.duplicate &&
            !row.timeConflict
          )
        ),
    );

  const conflictRows =
    clearBeforeImport
      ? []
      : rows.filter(
          (row) =>
            !row.duplicate &&
            row.timeConflict,
        );

  const duplicateRows =
    rows.filter(
      (row) =>
        row.duplicateSource ===
          "file" ||
        (
          !clearBeforeImport &&
          row.duplicate
        ),
    );

  function reset() {
    setFileName("");
    setRows([]);
    setExpanded(new Set());
    setError("");
    setClearBeforeImport(false);

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
    setRows((current) =>
      current.filter((row) => row.id !== id),
    );
  }

  function toggleDetails(id: string) {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  async function parseFile(file: File) {
    setParsing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/member/calendar/import/parse",
        {
          method: "POST",
          body: formData,
        },
      );

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
          location: event.location,
          notes: event.notes,
          duplicate: Boolean(event.duplicate),
          duplicateSource: event.duplicateSource ?? null,
          timeConflict: Boolean(event.timeConflict),
          conflictAction: "keep-existing",
          existingEvent: event.existingEvent ?? null,
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
    if (importing || validCount === 0) {
      return;
    }

    if (invalidCount > 0) {
      setError(
        "Corrigez ou supprimez les lignes invalides avant l'import.",
      );
      return;
    }

    if (
      clearBeforeImport &&
      !window.confirm(
        "Tout le calendrier actuel sera supprimé avant l'import. Cette action est irréversible. Continuer ?",
      )
    ) {
      return;
    }

    setImporting(true);
    setError("");

    try {
      const events =
        importableRows.map(
          (row) => ({
          title: row.title.trim(),
          startAt: toIso(row.date, row.startTime),
          endAt: row.endTime
            ? toIso(row.date, row.endTime)
            : null,
          allDay: false,
          location: row.location.trim() || null,
          notes: row.notes.trim() || null,

          replaceExisting:
            !clearBeforeImport &&
            row.timeConflict &&
            row.conflictAction === "replace" &&
            row.existingEvent
              ? {
                  id:
                    row.existingEvent.id,
                  seriesId:
                    row.existingEvent.seriesId,
                  originalStartAt:
                    row.existingEvent.originalStartAt,
                  isRecurring:
                    row.existingEvent.isRecurring,
                }
              : null,
        }));

      const response = await fetch(
        "/api/member/calendar/import/commit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            events,
            clearBeforeImport,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const result = (await response.json()) as {
        count?: number;
      };

      if ((result.count ?? 0) === 0) {
        setError(
          "Le calendrier a changé entre-temps. Aucun nouvel événement n'a été enregistré.",
        );
        return;
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
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

  return (
    <div className="fixed inset-0 z-[350] flex items-end justify-center bg-slate-950/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Fermer"
        onClick={close}
        className="absolute inset-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-slate-50 shadow-xl sm:max-w-4xl sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Importer un planning
            </h2>

            {fileName && (
              <p className="mt-0.5 max-w-lg truncate text-xs text-slate-500">
                {fileName}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={close}
            disabled={parsing || importing}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        {rows.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
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
              className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
            >
              {parsing ? (
                <>
                  <Loader2
                    size={28}
                    className="animate-spin text-slate-700"
                  />
                  <span className="mt-3 text-sm font-semibold text-slate-800">
                    Analyse du planning…
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Upload size={21} />
                  </div>

                  <span className="mt-3 text-sm font-semibold text-slate-900">
                    Choisir un fichier
                  </span>

                  <span className="mt-1 text-xs text-slate-500">
                    XLSX recommandé · CSV ou DOCX acceptés · 10 Mo max
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet
                    size={18}
                    className="text-slate-500"
                  />

                  <p className="text-sm font-medium text-slate-700">
                    {rows.length} événement
                    {rows.length > 1 ? "s" : ""} détecté
                    {rows.length > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {validCount > 0 && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {validCount} nouveau
                      {validCount > 1 ? "x" : ""}
                    </span>
                  )}

                  {calendarDuplicateCount > 0 && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {calendarDuplicateCount} doublon{calendarDuplicateCount > 1 ? "s" : ""} exact{calendarDuplicateCount > 1 ? "s" : ""}
                    </span>
                  )}

                  {fileDuplicateCount > 0 && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {fileDuplicateCount} en double dans le fichier
                    </span>
                  )}

                  {warningCount > 0 && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {warningCount} à vérifier
                    </span>
                  )}

                  {invalidCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                      {invalidCount} invalide
                      {invalidCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {validCount === 0 &&
                duplicateCount > 0 &&
                invalidCount === 0 && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Tous les événements de ce fichier sont déjà enregistrés.
                    Vous pouvez consulter les correspondances ci-dessous ou
                    choisir un autre fichier.
                  </p>
                )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={importing}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Autre fichier
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRows((current) => [
                      ...current,
                      emptyRow(),
                    ])
                  }
                  disabled={importing}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <Plus size={13} />
                  Ajouter une ligne
                </button>
              </div>

            </div>

            {canClear && rows.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-2.5 sm:px-5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={clearBeforeImport}
                    disabled={importing}
                    onChange={(event) =>
                      setClearBeforeImport(
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />

                  Tout nettoyer avant l'import
                </label>

                {clearBeforeImport && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    Tous les événements actuellement dans le calendrier seront supprimés.
                  </p>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="space-y-5">
                {newRows.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nouveaux événements
                      </h3>

                      <span className="text-xs text-slate-400">
                        Modifiables avant l'import
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {newRows.map((row, index) => {
                        const validation = rowError(row);

                        return (
                          <div
                            key={row.id}
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    Nouveau
                                  </span>

                                  {validation ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                                      <AlertTriangle size={12} />
                                      {validation}
                                    </span>
                                  ) : row.warning ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                      <AlertTriangle size={12} />
                                      À vérifier
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                      <CheckCircle2 size={12} />
                                      Prêt
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => deleteRow(row.id)}
                                disabled={importing}
                                aria-label={`Supprimer l'événement ${index + 1}`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {row.warning && (
                              <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                                {row.warning}
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12">
                              <div className="md:col-span-5">
                                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
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
                                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
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

                              <div className="md:col-span-2">
                                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
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

                              <div className="md:col-span-2">
                                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
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

                              <div className="md:col-span-5">
                                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
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

                              <div className="md:col-span-7">
                                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                                  Notes
                                </label>
                                <input
                                  value={row.notes}
                                  maxLength={5000}
                                  onChange={(event) =>
                                    updateRow(row.id, {
                                      notes: event.target.value,
                                    })
                                  }
                                  placeholder="Facultatif"
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {conflictRows.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Créneaux déjà occupés
                      </h3>

                      <span className="text-xs text-slate-400">
                        Choisissez quoi faire
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
                      {conflictRows.map((row) => {
                        const existing = row.existingEvent;

                        return (
                          <div
                            key={row.id}
                            className="border-b border-slate-100 px-3 py-3 last:border-b-0"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                  {row.title}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  {row.date} · {row.startTime}
                                  {row.endTime ? ` – ${row.endTime}` : ""}
                                </p>

                                {existing && (
                                  <p className="mt-1.5 text-xs text-amber-800">
                                    Déjà à cette heure :{" "}
                                    <strong>{existing.title}</strong>
                                  </p>
                                )}
                              </div>

                              <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1">
                                <button
                                  type="button"
                                  disabled={importing || clearBeforeImport}
                                  onClick={() =>
                                    updateRow(row.id, {
                                      conflictAction: "keep-existing",
                                    })
                                  }
                                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                    row.conflictAction === "keep-existing"
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "text-slate-500 hover:text-slate-900"
                                  }`}
                                >
                                  Conserver l'ancien
                                </button>

                                <button
                                  type="button"
                                  disabled={importing || clearBeforeImport}
                                  onClick={() =>
                                    updateRow(row.id, {
                                      conflictAction: "replace",
                                    })
                                  }
                                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                    row.conflictAction === "replace"
                                      ? "bg-amber-600 text-white shadow-sm"
                                      : "text-slate-500 hover:text-slate-900"
                                  }`}
                                >
                                  Remplacer l'ancien
                                </button>

                                <button
                                  type="button"
                                  disabled={importing || clearBeforeImport}
                                  onClick={() =>
                                    updateRow(row.id, {
                                      conflictAction: "keep-both",
                                    })
                                  }
                                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                    row.conflictAction === "keep-both"
                                      ? "bg-slate-900 text-white shadow-sm"
                                      : "text-slate-500 hover:text-slate-900"
                                  }`}
                                >
                                  Garder les deux
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-2 text-[11px] leading-4 text-slate-400">
                      {clearBeforeImport
                        ? "Le calendrier actuel sera entièrement remplacé par le fichier."
                        : "Par défaut, l'événement existant est conservé."}
                    </p>
                  </section>
                )}

                {duplicateRows.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Doublons exacts
                      </h3>

                      <span className="text-xs text-slate-400">
                        Ignorés automatiquement
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {duplicateRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-700">
                              {row.title}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {row.date}
                              {row.startTime
                                ? ` · ${row.startTime}`
                                : ""}
                            </p>
                          </div>

                          <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                            Ignoré
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
              {error && (
                <div
                  role="alert"
                  className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {validCount > 0 ? (
                    <>
                      <strong className="text-slate-800">
                        {validCount}
                      </strong>{" "}
                      événement
                      {validCount > 1 ? "s" : ""} sera
                      {validCount > 1 ? "ont" : ""} importé
                      {validCount > 1 ? "s" : ""}.
                    </>
                  ) : conflictRows.length > 0 ? (
                    "Les événements existants seront conservés."
                  ) : duplicateCount > 0 ? (
                    "Le fichier ne contient rien de nouveau à importer."
                  ) : (
                    "Corrigez les événements avant de continuer."
                  )}
                </p>

                <div className="flex gap-2">
                  {validCount > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={close}
                        disabled={importing}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Annuler
                      </button>

                      <button
                        type="button"
                        onClick={importRows}
                        disabled={importing || invalidCount > 0}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {importing && (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        )}

                        {importing
                          ? "Ajout…"
                          : `Importer ${validCount} événement${
                              validCount > 1 ? "s" : ""
                            }`}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={close}
                      className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Fermer
                    </button>
                  )}
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
