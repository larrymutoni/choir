"use client";

import FullCalendar, {
  type CalendarRef,
  type EventClickInfo,
} from "@fullcalendar/react";

import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import frLocale from "@fullcalendar/react/locales/fr";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  FileUp,
  MapPin,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { CalendarImportModal } from "@/components/calendar/CalendarImportModal";
import { NotifyMembersField } from "@/components/notifications/NotifyMembersField";
import { publishMemberUpdate } from "@/lib/publish-member-update";
import { showToast } from "@/lib/toast";

type RepeatType =
  | "none"
  | "weekly"
  | "biweekly";

type RepeatEnd =
  | "never"
  | "date";

type ModalMode =
  | "create"
  | "view"
  | "edit";

type Scope =
  | "single"
  | "following"
  | "series";

type CalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  colorOverride: string | null;
  seriesId: string | null;
  originalStartAt: string | null;
  isRecurring: boolean;
  isException: boolean;
};

type DisplayEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  color?: string;
  contrastColor?: string;

  extendedProps: {
    location: string | null;
    notes: string | null;
    colorOverride: string | null;
    seriesId: string | null;
    originalStartAt: string | null;
    isRecurring: boolean;
    isException: boolean;
  };
};

type CalendarForm = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  notes: string;
  colorOverride: string | null;

  repeat: RepeatType;
  repeatEnd: RepeatEnd;
  repeatUntil: string;
};

type SelectedEvent = {
  id: string;
  seriesId: string | null;
  originalStartAt: string | null;
  isRecurring: boolean;
  isException: boolean;
};

type EventPayload = {
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  colorOverride: string | null;
};

type ScopeMetadata = {
  seriesId: string;
  originalStartAt: string;
};

type PendingScopeAction =
  | {
      kind: "save";
      title: string;
      payload: EventPayload;
      metadata: ScopeMetadata;
    }
  | {
      kind: "delete";
      title: string;
      metadata: ScopeMetadata;
    }
  | {
      kind: "move";
      title: string;
      payload: EventPayload;
      metadata: ScopeMetadata;
      revert: () => void;
    };

type VisibleRange = {
  start: string;
  end: string;
};

/** Automatic event categories, inferred from existing titles (no database change). */
const EVENT_COLORS = {
  repetition: { label: "Répétition", color: "#2563eb" },
  concert: { label: "Concert / spectacle", color: "#7c3aed" },
  reunion: { label: "Réunion", color: "#ea580c" },
  atelier: { label: "Atelier / formation", color: "#0f766e" },
  vacances: { label: "Vacances / jour férié", color: "#d97706" },
  autre: { label: "Autre événement", color: "#475569" },
} as const;

const EVENT_PALETTE = [
  "#2563eb", "#7c3aed", "#ea580c", "#0f766e",
  "#d97706", "#475569", "#16a34a", "#dc2626",
] as const;

function eventCategory(title: string): keyof typeof EVENT_COLORS {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/vacanc|conge|ferie|absence|pause|pas de cours|relache|fermeture/.test(normalized)) return "vacances";
  if (/concert|spectacle|representation|fete de la musique|recital|chorale en scene/.test(normalized)) return "concert";
  if (/repet|filage|echauffement vocal|\bcours\b|entrainement/.test(normalized)) return "repetition";
  if (/reunion|assemblee|ag |conseil|bureau/.test(normalized)) return "reunion";
  if (/atelier|formation|stage|masterclass|technique vocale/.test(normalized)) return "atelier";
  return "autre";
}

function eventTextColor(color: string) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 160 ? "#0f172a" : "#ffffff";
}

const emptyForm: CalendarForm = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  allDay: false,
  location: "",
  notes: "",
  colorOverride: null,
  repeat: "none",
  repeatEnd: "never",
  repeatUntil: "",
};

function formatDateInput(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeInput(
  date: Date | null,
) {
  if (!date) {
    return "";
  }

  const hours = String(
    date.getHours(),
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatLongDate(
  date: string,
) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  );
}

function toIso(
  date: string,
  time: string,
) {
  return new Date(
    `${date}T${time}:00`,
  ).toISOString();
}

async function responseError(
  response: Response,
) {
  try {
    const body =
      (await response.json()) as {
        message?: string;
      };

    return (
      body.message ||
      "Une erreur est survenue."
    );
  } catch {
    return "Une erreur est survenue.";
  }
}

function escapeIcsText(
  value: string,
) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatIcsUtc(
  value: string,
) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function formatIcsDate(
  value: string,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(value),
    );

  const get =
    (type: string) =>
      parts.find(
        (part) =>
          part.type === type,
      )?.value ?? "";

  return `${get("year")}${get("month")}${get("day")}`;
}

function nextIcsDate(
  value: string,
) {
  const year =
    Number(value.slice(0, 4));

  const month =
    Number(value.slice(4, 6));

  const day =
    Number(value.slice(6, 8));

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + 1,
      ),
    );

  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getUTCDate(),
    ).padStart(2, "0"),
  ].join("");
}

export function CalendarClient({
  canManage,
  canClear,
}: {
  canManage: boolean;
  canClear: boolean;
}) {
  const calendarRef =
    useRef<CalendarRef | null>(
      null,
    );

  const mountedRef =
    useRef(false);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    modalMode,
    setModalMode,
  ] = useState<ModalMode>(
    "view",
  );

  const [
    importOpen,
    setImportOpen,
  ] = useState(false);

  const [
    clearingCalendar,
    setClearingCalendar,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<CalendarForm>(
    emptyForm,
  );

  const [
    originalForm,
    setOriginalForm,
  ] = useState<CalendarForm>(
    emptyForm,
  );

  const [
    selected,
    setSelected,
  ] =
    useState<SelectedEvent | null>(
      null,
    );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    notifyMembers,
    setNotifyMembers,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    repeatError,
    setRepeatError,
  ] = useState("");

  const [
    mobile,
    setMobile,
  ] = useState(false);

  const [
    pendingScopeAction,
    setPendingScopeAction,
  ] =
    useState<PendingScopeAction | null>(
      null,
    );

  const [
    scopeSaving,
    setScopeSaving,
  ] = useState(false);

  const [
    scopeError,
    setScopeError,
  ] = useState("");

  const [
    visibleRange,
    setVisibleRange,
  ] =
    useState<VisibleRange | null>(
      null,
    );

  const [
    displayEvents,
    setDisplayEvents,
  ] = useState<DisplayEvent[]>(
    [],
  );

  const [
    calendarError,
    setCalendarError,
  ] = useState("");

  const [
    calendarLoading,
    setCalendarLoading,
  ] = useState(false);

  const [
    reloadVersion,
    setReloadVersion,
  ] = useState(0);

  useEffect(() => {
    mountedRef.current = true;

    const api =
      calendarRef.current?.getApi();

    if (api) {
      setVisibleRange({
        start:
          api.view.activeStart.toISOString(),

        end:
          api.view.activeEnd.toISOString(),
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const media =
      window.matchMedia(
        "(max-width: 767px)",
      );

    function updateView() {
      const isMobile =
        media.matches;

      setMobile(isMobile);

      const api =
        calendarRef.current?.getApi();

      if (api) {
        api.changeView(
          isMobile
            ? "listMonth"
            : "dayGridMonth",
        );
      }
    }

    updateView();

    media.addEventListener(
      "change",
      updateView,
    );

    return () => {
      media.removeEventListener(
        "change",
        updateView,
      );
    };
  }, []);

  useEffect(() => {
    if (!visibleRange) {
      return;
    }

    /*
     * Capture the non-null range here.
     * TypeScript can now safely use it
     * inside the asynchronous function.
     */
    const range =
      visibleRange;

    const controller =
      new AbortController();

    async function loadEvents() {
      setCalendarLoading(true);
      setCalendarError("");

      try {
        const params =
          new URLSearchParams({
            start:
              range.start,

            end:
              range.end,
          });

        const response =
          await fetch(
            `/api/member/calendar?${params.toString()}`,
            {
              signal:
                controller.signal,
              cache: "no-store",
            },
          );

        if (!response.ok) {
          throw new Error(
            await responseError(
              response,
            ),
          );
        }

        const data =
          (await response.json()) as {
            events:
              CalendarEvent[];
          };

        if (
          controller.signal
            .aborted
        ) {
          return;
        }

        setDisplayEvents(
          data.events.map(
            (item) => ({
              id:
                item.id,

              title:
                item.title,

              start:
                item.startAt,

              end:
                item.endAt ??
                undefined,

              allDay:
                item.allDay,
              // FullCalendar 7 : la palette du thème utilise --fc-event-color.
              // "color" et "contrastColor" priment sur les couleurs globales.
              color: item.colorOverride ?? EVENT_COLORS[eventCategory(item.title)].color,
              contrastColor: eventTextColor(item.colorOverride ?? EVENT_COLORS[eventCategory(item.title)].color),

              extendedProps: {
                location:
                  item.location,

                notes:
                  item.notes,

                colorOverride: item.colorOverride ?? null,

                seriesId:
                  item.seriesId,

                originalStartAt:
                  item.originalStartAt,

                isRecurring:
                  item.isRecurring,

                isException:
                  item.isException,
              },
            }),
          ),
        );
      } catch (cause) {
        if (
          controller.signal
            .aborted
        ) {
          return;
        }

        setDisplayEvents([]);

        setCalendarError(
          cause instanceof Error
            ? cause.message
            : "Impossible de charger le calendrier.",
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setCalendarLoading(
            false,
          );
        }
      }
    }

    void loadEvents();

    return () => {
      controller.abort();
    };
  }, [
    visibleRange,
    reloadVersion,
  ]);

  function refetchEvents() {
    setReloadVersion(
      (current) =>
        current + 1,
    );
  }

  function handleDatesSet(
    start: Date,
    end: Date,
  ) {
    if (
      typeof window ===
        "undefined" ||
      !mountedRef.current
    ) {
      return;
    }

    const nextRange = {
      start:
        start.toISOString(),

      end:
        end.toISOString(),
    };

    setVisibleRange(
      (current) => {
        if (
          current?.start ===
            nextRange.start &&
          current?.end ===
            nextRange.end
        ) {
          return current;
        }

        return nextRange;
      },
    );
  }

  function closeModal() {
    setModalOpen(false);
    setModalMode("view");

    setForm(emptyForm);
    setOriginalForm(
      emptyForm,
    );

    setSelected(null);

    setError("");
    setRepeatError("");
    setNotifyMembers(false);
  }

  function openCreate(
    date: Date,
  ) {
    if (!canManage) {
      return;
    }

    const nextForm = {
      ...emptyForm,

      date:
        formatDateInput(
          date,
        ),
    };

    setForm(nextForm);

    setOriginalForm(
      nextForm,
    );

    setSelected(null);

    setError("");
    setRepeatError("");
    setNotifyMembers(false);

    setModalMode(
      "create",
    );

    setModalOpen(true);
  }

  function openEvent(
    event: EventClickInfo["event"],
  ) {
    if (!event.start) {
      return;
    }

    const nextForm:
      CalendarForm = {
      ...emptyForm,

      title:
        event.title,

      date:
        formatDateInput(
          event.start,
        ),

      startTime:
        event.allDay
          ? ""
          : formatTimeInput(
              event.start,
            ),

      endTime:
        event.allDay
          ? ""
          : formatTimeInput(
              event.end,
            ),

      allDay:
        event.allDay,

      location:
        String(
          event.extendedProps
            .location ?? "",
        ),

      notes:
        String(
          event.extendedProps
            .notes ?? "",
        ),

      colorOverride:
        typeof event.extendedProps.colorOverride === "string"
          ? event.extendedProps.colorOverride
          : null,
    };

    const nextSelected:
      SelectedEvent = {
      id:
        event.id,

      seriesId:
        event.extendedProps
          .seriesId ?? null,

      originalStartAt:
        event.extendedProps
          .originalStartAt ??
        null,

      isRecurring:
        Boolean(
          event.extendedProps
            .isRecurring,
        ),

      isException:
        Boolean(
          event.extendedProps
            .isException,
        ),
    };

    setForm(nextForm);

    setOriginalForm(
      nextForm,
    );

    setSelected(
      nextSelected,
    );

    setError("");
    setRepeatError("");
    setNotifyMembers(false);

    setModalMode("view");
    setModalOpen(true);
  }

  function buildPayload():
    EventPayload | null {
    setError("");
    setRepeatError("");

    if (
      !form.title.trim() ||
      !form.date
    ) {
      setError(
        "Le titre et la date sont obligatoires.",
      );

      return null;
    }

    if (
      !form.allDay &&
      !form.startTime
    ) {
      setError(
        "Indiquez une heure de début.",
      );

      return null;
    }

    if (
      modalMode ===
        "create" &&
      form.repeat !==
        "none" &&
      form.repeatEnd ===
        "date"
    ) {
      if (
        !form.repeatUntil
      ) {
        setRepeatError(
          "Choisissez une date de fin ou sélectionnez « Jamais ».",
        );

        return null;
      }

      if (
        form.repeatUntil <
        form.date
      ) {
        setRepeatError(
          "La fin de la répétition ne peut pas être avant la première date.",
        );

        return null;
      }
    }

    const startAt =
      form.allDay
        ? new Date(
            `${form.date}T00:00:00`,
          ).toISOString()
        : toIso(
            form.date,
            form.startTime,
          );

    const endAt =
      !form.allDay &&
      form.endTime
        ? toIso(
            form.date,
            form.endTime,
          )
        : null;

    if (
      endAt &&
      Date.parse(endAt) <=
        Date.parse(startAt)
    ) {
      setError(
        "L'heure de fin doit être après l'heure de début.",
      );

      return null;
    }

    return {
      title:
        form.title.trim(),

      startAt,
      endAt,

      allDay:
        form.allDay,

      location:
        form.location.trim() ||
        null,

      notes:
        form.notes.trim() ||
        null,

      colorOverride: form.colorOverride,
    };
  }

  async function findManualConflict(
    payload: EventPayload,
  ) {
    const start =
      new Date(
        payload.startAt,
      );

    const end =
      new Date(
        start.getTime() +
          60_000,
      );

    const params =
      new URLSearchParams({
        start:
          start.toISOString(),

        end:
          end.toISOString(),
      });

    const response =
      await fetch(
        `/api/member/calendar?${params.toString()}`,
        {
          cache:
            "no-store",
        },
      );

    if (!response.ok) {
      throw new Error(
        await responseError(
          response,
        ),
      );
    }

    const data =
      (await response.json()) as {
        events:
          CalendarEvent[];
      };

    return (
      data.events.find(
        (item) =>
          Date.parse(
            item.startAt,
          ) ===
          Date.parse(
            payload.startAt,
          ),
      ) ?? null
    );
  }

  async function createEvent(
    payload: EventPayload,
  ) {
    const recurrence =
      form.repeat === "none"
        ? null
        : {
            type:
              form.repeat,

            until:
              form.repeatEnd ===
              "date"
                ? form.repeatUntil
                : null,
          };

    const response =
      await fetch(
        "/api/member/calendar",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              ...payload,
              recurrence,
            }),
        },
      );

    if (!response.ok) {
      throw new Error(
        await responseError(
          response,
        ),
      );
    }
  }

  async function patchSingleEvent(
    payload: EventPayload,
  ) {
    if (!selected) {
      throw new Error(
        "Événement invalide.",
      );
    }

    const response =
      await fetch(
        "/api/member/calendar",
        {
          method:
            "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              id:
                selected.id,

              ...payload,
            }),
        },
      );

    if (!response.ok) {
      throw new Error(
        await responseError(
          response,
        ),
      );
    }
  }

  async function saveEvent(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !canManage ||
      saving
    ) {
      return;
    }

    const payload =
      buildPayload();

    if (!payload) {
      return;
    }

    if (
      modalMode ===
        "edit" &&
      selected?.isRecurring &&
      selected.seriesId &&
      selected.originalStartAt
    ) {
      setScopeError("");

      setPendingScopeAction({
        kind: "save",

        title:
          form.title,

        payload,

        metadata: {
          seriesId:
            selected.seriesId,

          originalStartAt:
            selected.originalStartAt,
        },
      });

      return;
    }

    setSaving(true);

    try {
      if (
        modalMode ===
        "create"
      ) {
        const conflict =
          await findManualConflict(
            payload,
          );

        if (
          conflict &&
          !window.confirm(
            `Un événement existe déjà à cette heure : "${conflict.title}".\n\nAjouter quand même ?`,
          )
        ) {
          return;
        }

        await createEvent(
          payload,
        );
      } else {
        await patchSingleEvent(
          payload,
        );
      }

      void publishMemberUpdate(
        "calendar",
        notifyMembers,
      );

      const savedDate =
        form.date;

      const successMessage =
        modalMode === "create"
          ? "Événement créé"
          : "Événement modifié";

      closeModal();

      calendarRef.current
        ?.getApi()
        .gotoDate(savedDate);

      refetchEvents();
      showToast(successMessage);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer cet événement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (
      !canManage ||
      !selected ||
      saving
    ) {
      return;
    }

    if (
      selected.isRecurring &&
      selected.seriesId &&
      selected.originalStartAt
    ) {
      setScopeError("");

      setPendingScopeAction({
        kind: "delete",

        title:
          form.title,

        metadata: {
          seriesId:
            selected.seriesId,

          originalStartAt:
            selected.originalStartAt,
        },
      });

      return;
    }

    if (
      !window.confirm(
        "Supprimer cet événement ?",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/member/calendar",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  selected.id,
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseError(
            response,
          ),
        );
      }

      closeModal();
      refetchEvents();
      showToast(
        "Événement supprimé",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de supprimer cet événement.",
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelScopeChoice() {
    if (
      pendingScopeAction
        ?.kind === "move"
    ) {
      pendingScopeAction.revert();
    }

    setPendingScopeAction(
      null,
    );

    setScopeError("");
  }

  async function applyScope(
    scope: Scope,
  ) {
    if (
      !pendingScopeAction ||
      scopeSaving
    ) {
      return;
    }

    setScopeSaving(true);
    setScopeError("");

    try {
      const {
        metadata,
      } = pendingScopeAction;

      if (
        pendingScopeAction
          .kind ===
          "save" ||
        pendingScopeAction
          .kind === "move"
      ) {
        const response =
          await fetch(
            "/api/member/calendar",
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  ...pendingScopeAction.payload,

                  seriesId:
                    metadata.seriesId,

                  originalStartAt:
                    metadata.originalStartAt,

                  scope,
                }),
            },
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await responseError(
              response,
            ),
          );
        }

        if (
          pendingScopeAction.kind ===
            "save"
        ) {
          void publishMemberUpdate(
            "calendar",
            notifyMembers,
          );
        }
      } else {
        const response =
          await fetch(
            "/api/member/calendar",
            {
              method:
                "DELETE",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  seriesId:
                    metadata.seriesId,

                  originalStartAt:
                    metadata.originalStartAt,

                  scope,
                }),
            },
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await responseError(
              response,
            ),
          );
        }
      }

      const completedAction =
        pendingScopeAction.kind;

      setPendingScopeAction(
        null,
      );

      setScopeError("");

      if (
        completedAction ===
          "save" ||
        completedAction ===
          "delete"
      ) {
        closeModal();
      }

      refetchEvents();

      if (
        completedAction ===
        "delete"
      ) {
        showToast(
          "Événement supprimé",
        );
      } else if (
        completedAction ===
        "move"
      ) {
        showToast(
          "Événement déplacé",
        );
      } else {
        showToast(
          "Événement modifié",
        );
      }
    } catch (cause) {
      if (
        pendingScopeAction
          .kind === "move"
      ) {
        pendingScopeAction.revert();
      }

      setScopeError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'appliquer cette modification.",
      );
    } finally {
      setScopeSaving(false);
    }
  }

  function exportCalendarView() {
    if (
      displayEvents.length === 0
    ) {
      showToast(
        "Aucun événement à exporter",
      );

      return;
    }

    const stamp =
      formatIcsUtc(
        new Date().toISOString(),
      );

    const eventLines =
      [...displayEvents]
        .sort(
          (left, right) =>
            new Date(
              left.start,
            ).getTime() -
            new Date(
              right.start,
            ).getTime(),
        )
        .flatMap(
          (event) => {
            const lines = [
              "BEGIN:VEVENT",
              `UID:${event.id}-${event.start.replace(/[^0-9A-Za-z]/g, "")}@rayon-de-soleil-lyon6`,
              `DTSTAMP:${stamp}`,
              `SUMMARY:${escapeIcsText(event.title)}`,
            ];

            if (
              event.allDay
            ) {
              const start =
                formatIcsDate(
                  event.start,
                );

              const end =
                event.end
                  ? formatIcsDate(
                      event.end,
                    )
                  : nextIcsDate(
                      start,
                    );

              lines.push(
                `DTSTART;VALUE=DATE:${start}`,
                `DTEND;VALUE=DATE:${end}`,
              );
            } else {
              lines.push(
                `DTSTART:${formatIcsUtc(event.start)}`,
              );

              if (
                event.end
              ) {
                lines.push(
                  `DTEND:${formatIcsUtc(event.end)}`,
                );
              }
            }

            if (
              event.extendedProps
                .location
            ) {
              lines.push(
                `LOCATION:${escapeIcsText(
                  event.extendedProps
                    .location,
                )}`,
              );
            }

            if (
              event.extendedProps
                .notes
            ) {
              lines.push(
                `DESCRIPTION:${escapeIcsText(
                  event.extendedProps
                    .notes,
                )}`,
              );
            }

            lines.push(
              "END:VEVENT",
            );

            return lines;
          },
        );

    const content = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Chorale Rayon de Soleil Lyon 6//Calendrier//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Chorale Rayon de Soleil Lyon 6",
      ...eventLines,
      "END:VCALENDAR",
      "",
    ].join("\r\n");

    const blob =
      new Blob(
        [content],
        {
          type:
            "text/calendar;charset=utf-8",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href = url;

    link.download =
      "calendrier-rayon-de-soleil.ics";

    document.body.appendChild(
      link,
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url,
    );

    showToast(
      "Calendrier exporté",
    );
  }

  async function exportCalendarExcel() {
    if (!visibleRange || !displayEvents.length) return;
    try {
      const params = new URLSearchParams({ start: visibleRange.start, end: visibleRange.end });
      const response = await fetch(`/api/member/calendar/export?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "calendrier-rayon-de-soleil.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      showToast("Calendrier Excel exporté");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Export Excel impossible");
    }
  }

  async function clearEntireCalendar() {
    if (!canClear || clearingCalendar) {
      return;
    }

    const confirmed =
      window.confirm(
        "Supprimer tous les événements du calendrier ?",
      );

    if (!confirmed) {
      return;
    }

    const verification =
      window.prompt(
        'Tapez exactement "SUPPRIMER" pour confirmer.',
      );

    if (verification !== "SUPPRIMER") {
      return;
    }

    setClearingCalendar(true);
    setCalendarError("");

    try {
      const response =
        await fetch(
          "/api/member/calendar/clear",
          {
            method: "DELETE",
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseError(response),
        );
      }

      setDisplayEvents([]);
      refetchEvents();

      showToast(
        "Calendrier entièrement vidé",
      );
    } catch (cause) {
      setCalendarError(
        cause instanceof Error
          ? cause.message
          : "Impossible de vider le calendrier.",
      );
    } finally {
      setClearingCalendar(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[16px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 sm:text-sm";

  const isEditing =
    modalMode === "create" ||
    modalMode === "edit";



  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[#e2e8f0] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={
              exportCalendarView
            }
            disabled={
              displayEvents.length ===
              0
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download
              size={16}
            />

            Exporter la vue (.ics)
          </button>
          <button
            type="button"
            onClick={() => void exportCalendarExcel()}
            disabled={!displayEvents.length}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} /> Exporter la vue (.xlsx)
          </button>

          {canManage && (
            <>
              {canClear && (
                <button
                  type="button"
                  onClick={clearEntireCalendar}
                  disabled={clearingCalendar}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />

                  {clearingCalendar
                    ? "Suppression…"
                    : "Vider le calendrier"}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setImportOpen(
                    true,
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FileUp
                  size={16}
                />

                Importer un planning
              </button>

              <button
                type="button"
                onClick={() =>
                  openCreate(
                    new Date(),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus
                  size={16}
                />

                Ajouter
              </button>
            </>
          )}
        </div>

        {calendarError && (
          <div
            role="alert"
            className="mx-3 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:mx-5 sm:mt-5"
          >
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>
              {calendarError}
            </span>
          </div>
        )}

        <div>
          <div className="relative min-w-0 overflow-x-auto p-3 sm:p-4">
          {calendarLoading && (
            <div className="pointer-events-none absolute right-5 top-5 z-10 rounded-lg border border-[#e2e8f0] bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#64748b] shadow-sm">
              Chargement…
            </div>
          )}

          <FullCalendar
            ref={
              calendarRef
            }
            plugins={[
              classicThemePlugin,
              dayGridPlugin,
              timeGridPlugin,
              listPlugin,
              interactionPlugin,
            ]}
            locale={
              frLocale
            }
            initialView="dayGridMonth"
            firstDay={1}
            height={
              mobile
                ? "auto"
                : 560
            }
            nowIndicator
            dayMaxEvents={2}
            editable={
              canManage
            }
            eventDurationEditable={
              false
            }
            eventColor="#475569"
            eventContrastColor="#ffffff"
            eventDisplay="block"
            events={
              displayEvents
            }
            headerToolbar={
              mobile
                ? {
                    start:
                      "prev,next",

                    center:
                      "title",

                    end:
                      "today",
                  }
                : {
                    start:
                      "prev,next today",

                    center:
                      "title",

                    end:
                      "dayGridMonth,timeGridWeek,listMonth",
                  }
            }
            eventTimeFormat={{
              hour:
                "2-digit",

              minute:
                "2-digit",

              hour12:
                false,
            }}
            datesSet={(
              info,
            ) => {
              handleDatesSet(
                info.start,
                info.end,
              );
            }}
            dateClick={(
              info,
            ) => {
              openCreate(
                info.date,
              );
            }}
            eventClick={(
              info,
            ) => {
              openEvent(
                info.event,
              );
            }}
            eventDrop={async (
              info,
            ) => {
              if (
                !canManage ||
                !info.event
                  .start
              ) {
                info.revert();
                return;
              }

              const payload:
                EventPayload = {
                title:
                  info.event
                    .title,

                startAt:
                  info.event
                    .start
                    .toISOString(),

                endAt:
                  info.event
                    .end
                    ?.toISOString() ??
                  null,

                allDay:
                  info.event
                    .allDay,

                location:
                  info.event
                    .extendedProps
                    .location ??
                  null,

                notes:
                  info.event
                    .extendedProps
                    .notes ??
                  null,

                colorOverride:
                  typeof info.event.extendedProps.colorOverride === "string"
                    ? info.event.extendedProps.colorOverride
                    : null,
              };

              const seriesId =
                info.event
                  .extendedProps
                  .seriesId as
                  | string
                  | null;

              const originalStartAt =
                info.event
                  .extendedProps
                  .originalStartAt as
                  | string
                  | null;

              const isRecurring =
                Boolean(
                  info.event
                    .extendedProps
                    .isRecurring,
                );

              if (
                isRecurring &&
                seriesId &&
                originalStartAt
              ) {
                setScopeError(
                  "",
                );

                setPendingScopeAction({
                  kind:
                    "move",

                  title:
                    info.event
                      .title,

                  payload,

                  metadata: {
                    seriesId,

                    originalStartAt,
                  },

                  revert:
                    info.revert,
                });

                return;
              }

              try {
                const response =
                  await fetch(
                    "/api/member/calendar",
                    {
                      method:
                        "PATCH",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },

                      body:
                        JSON.stringify({
                          id:
                            info.event
                              .id,

                          ...payload,
                        }),
                    },
                  );

                if (
                  !response.ok
                ) {
                  info.revert();
                  return;
                }

                refetchEvents();

                showToast(
                  "Événement déplacé",
                );

                void publishMemberUpdate(
                  "calendar",
                  false,
                );
              } catch {
                info.revert();

                showToast(
                  "Impossible de déplacer l'événement.",
                  "error",
                );
              }
            }}
          />
          </div>

        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Fermer"
            onClick={
              closeModal
            }
            className="absolute inset-0"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#e2e8f0] bg-[#f8fafc] shadow-2xl sm:max-w-xl sm:rounded-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-950">
                  {modalMode ===
                  "create"
                    ? "Nouvel événement"
                    : modalMode ===
                        "edit"
                      ? "Modifier l'événement"
                      : form.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                aria-label="Fermer"
                className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#f1f5f9]"
              >
                <X
                  size={19}
                />
              </button>
            </header>

            {isEditing ? (
              <form
                onSubmit={
                  saveEvent
                }
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="calendar-title"
                      className="mb-2 block text-sm font-bold text-[#475569]"
                    >
                      Titre
                    </label>

                    <input
                      id="calendar-title"
                      required
                      maxLength={
                        120
                      }
                      value={
                        form.title
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,

                          title:
                            event
                              .target
                              .value,
                        })
                      }
                      className={
                        inputClass
                      }
                      placeholder="Titre de l'événement"
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold text-slate-700">Couleur</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {EVENT_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Choisir la couleur ${color}`}
                          aria-pressed={(form.colorOverride ?? EVENT_COLORS[eventCategory(form.title)].color) === color}
                          onClick={() => setForm((current) => ({ ...current, colorOverride: color }))}
                          title={color}
                          className={`h-8 w-8 shrink-0 rounded-full border border-white transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 ${
                            (form.colorOverride ?? EVENT_COLORS[eventCategory(form.title)].color) === color
                              ? "ring-2 ring-slate-900 ring-offset-2"
                              : "ring-1 ring-slate-200"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <label
                        title="Autre couleur"
                        className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-slate-300 bg-white"
                      >
                        <span className="pointer-events-none absolute z-10 text-base font-semibold text-slate-900">+</span>
                        <input
                          type="color"
                          aria-label="Choisir une autre couleur"
                          value={form.colorOverride ?? EVENT_COLORS[eventCategory(form.title)].color}
                          onChange={(event) => setForm((current) => ({ ...current, colorOverride: event.target.value }))}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, colorOverride: null }))}
                        aria-label="Rétablir la couleur par défaut"
                        title="Rétablir la couleur par défaut"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-600 transition hover:bg-slate-100"
                      >
                        ↺
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="calendar-date"
                      className="mb-2 block text-sm font-bold text-[#475569]"
                    >
                      Date
                    </label>

                    <input
                      id="calendar-date"
                      type="date"
                      required
                      value={
                        form.date
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,

                          date:
                            event
                              .target
                              .value,
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </div>

                  <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-[#475569]">
                    <input
                      type="checkbox"
                      checked={
                        form.allDay
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,

                          allDay:
                            event
                              .target
                              .checked,
                        })
                      }
                      className="h-4 w-4 accent-[#0f172a]"
                    />

                    Toute la journée
                  </label>

                  {!form.allDay && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="calendar-start"
                          className="mb-2 block text-sm font-bold text-[#475569]"
                        >
                          Heure de début
                        </label>

                        <input
                          id="calendar-start"
                          type="time"
                          required
                          value={
                            form.startTime
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm({
                              ...form,

                              startTime:
                                event
                                  .target
                                  .value,
                            })
                          }
                          className={
                            inputClass
                          }
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="calendar-end"
                          className="mb-2 block text-sm font-bold text-[#475569]"
                        >
                          Heure de fin
                        </label>

                        <input
                          id="calendar-end"
                          type="time"
                          value={
                            form.endTime
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm({
                              ...form,

                              endTime:
                                event
                                  .target
                                  .value,
                            })
                          }
                          className={
                            inputClass
                          }
                        />
                      </div>
                    </div>
                  )}

                  {modalMode ===
                    "create" && (
                    <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Repeat2
                          size={
                            18
                          }
                          className="text-[#0f172a]"
                        />

                        <p className="font-bold text-[#0f172a]">
                          Répétition
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="calendar-repeat"
                            className="mb-2 block text-sm font-bold text-[#475569]"
                          >
                            Fréquence
                          </label>

                          <select
                            id="calendar-repeat"
                            value={
                              form.repeat
                            }
                            onChange={(
                              event,
                            ) => {
                              const repeat =
                                event
                                  .target
                                  .value as RepeatType;

                              setRepeatError(
                                "",
                              );

                              setForm({
                                ...form,

                                repeat,

                                repeatEnd:
                                  repeat ===
                                  "none"
                                    ? "never"
                                    : form.repeatEnd,

                                repeatUntil:
                                  repeat ===
                                  "none"
                                    ? ""
                                    : form.repeatUntil,
                              });
                            }}
                            className={
                              inputClass
                            }
                          >
                            <option value="none">
                              Ne se répète pas
                            </option>

                            <option value="weekly">
                              Chaque semaine
                            </option>

                            <option value="biweekly">
                              Toutes les 2 semaines
                            </option>
                          </select>
                        </div>

                        {form.repeat !==
                          "none" && (
                          <>
                            <div>
                              <label
                                htmlFor="calendar-repeat-end"
                                className="mb-2 block text-sm font-bold text-[#475569]"
                              >
                                Fin de la répétition
                              </label>

                              <select
                                id="calendar-repeat-end"
                                value={
                                  form.repeatEnd
                                }
                                onChange={(
                                  event,
                                ) => {
                                  const repeatEnd =
                                    event
                                      .target
                                      .value as RepeatEnd;

                                  setRepeatError(
                                    "",
                                  );

                                  setForm({
                                    ...form,

                                    repeatEnd,

                                    repeatUntil:
                                      repeatEnd ===
                                      "never"
                                        ? ""
                                        : form.repeatUntil,
                                  });
                                }}
                                className={
                                  inputClass
                                }
                              >
                                <option value="never">
                                  Jamais
                                </option>

                                <option value="date">
                                  À une date
                                </option>
                              </select>
                            </div>

                            {form.repeatEnd ===
                              "date" && (
                              <div>
                                <label
                                  htmlFor="calendar-repeat-until"
                                  className="mb-2 block text-sm font-bold text-[#475569]"
                                >
                                  Jusqu&apos;au
                                </label>

                                <input
                                  id="calendar-repeat-until"
                                  type="date"
                                  min={
                                    form.date ||
                                    undefined
                                  }
                                  value={
                                    form.repeatUntil
                                  }
                                  onChange={(
                                    event,
                                  ) => {
                                    setRepeatError(
                                      "",
                                    );

                                    setForm({
                                      ...form,

                                      repeatUntil:
                                        event
                                          .target
                                          .value,
                                    });
                                  }}
                                  className={
                                    inputClass
                                  }
                                />
                              </div>
                            )}

                            {repeatError && (
                              <p
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700"
                              >
                                {
                                  repeatError
                                }
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="calendar-location"
                      className="mb-2 block text-sm font-bold text-[#475569]"
                    >
                      Lieu
                    </label>

                    <input
                      id="calendar-location"
                      maxLength={
                        200
                      }
                      value={
                        form.location
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,

                          location:
                            event
                              .target
                              .value,
                        })
                      }
                      className={
                        inputClass
                      }
                      placeholder="Facultatif"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="calendar-notes"
                      className="mb-2 block text-sm font-bold text-[#475569]"
                    >
                      Notes
                    </label>

                    <textarea
                      id="calendar-notes"
                      rows={5}
                      maxLength={
                        5000
                      }
                      value={
                        form.notes
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,

                          notes:
                            event
                              .target
                              .value,
                        })
                      }
                      className={`${inputClass} resize-none`}
                      placeholder="Informations complémentaires"
                    />
                  </div>

                  <NotifyMembersField
                    checked={
                      notifyMembers
                    }
                    onCheckedChange={
                      setNotifyMembers
                    }
                    disabled={
                      saving
                    }
                  />
                </div>

                <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
                  <div>
                    {modalMode ===
                      "edit" && (
                      <button
                        type="button"
                        onClick={
                          deleteEvent
                        }
                        disabled={
                          saving
                        }
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2
                          size={
                            16
                          }
                        />

                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setRepeatError(
                          "",
                        );

                        if (
                          modalMode ===
                          "edit"
                        ) {
                          setForm(
                            originalForm,
                          );

                          setNotifyMembers(
                            false,
                          );

                          setModalMode(
                            "view",
                          );
                        } else {
                          closeModal();
                        }
                      }}
                      className="min-h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-bold text-[#475569]"
                    >
                      Annuler
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving
                      }
                      className="min-h-11 rounded-xl bg-[#0f172a] px-5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {saving
                        ? "Enregistrement..."
                        : modalMode ===
                            "create"
                          ? "Ajouter"
                          : "Enregistrer"}
                    </button>
                  </div>
                </footer>
              </form>
            ) : (
              <>
                <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
                  {selected?.isRecurring && (
                    <div className="flex items-center gap-2 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm font-semibold text-[#1d4ed8]">
                      <Repeat2
                        size={
                          17
                        }
                      />

                      Événement récurrent
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <CalendarDays
                      size={
                        20
                      }
                      className="mt-1 shrink-0 text-[#0f172a]"
                    />

                    <div>
                      <p className="text-xs font-bold uppercase text-[#94a3b8]">
                        Date
                      </p>

                      <p className="mt-1 font-semibold capitalize">
                        {formatLongDate(
                          form.date,
                        )}
                      </p>
                    </div>
                  </div>


                  <div className="flex items-start gap-4">
                    <Clock3
                      size={
                        20
                      }
                      className="mt-1 shrink-0 text-[#64748b]"
                    />

                    <div>
                      <p className="text-xs font-bold uppercase text-[#94a3b8]">
                        Horaire
                      </p>

                      <p className="mt-1 font-semibold">
                        {form.allDay
                          ? "Toute la journée"
                          : form.endTime
                            ? `${form.startTime} – ${form.endTime}`
                            : form.startTime}
                      </p>
                    </div>
                  </div>

                  {form.location && (
                    <div className="flex items-start gap-4">
                      <MapPin
                        size={
                          20
                        }
                        className="mt-1 shrink-0 text-[#64748b]"
                      />

                      <div>
                        <p className="text-xs font-bold uppercase text-[#94a3b8]">
                          Lieu
                        </p>

                        <p className="mt-1 font-semibold">
                          {
                            form.location
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {form.notes && (
                    <div className="flex items-start gap-4">
                      <FileText
                        size={
                          20
                        }
                        className="mt-1 shrink-0 text-[#64748b]"
                      />

                      <div>
                        <p className="text-xs font-bold uppercase text-[#94a3b8]">
                          Notes
                        </p>

                        <p className="mt-1 whitespace-pre-wrap leading-6">
                          {
                            form.notes
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <footer className="flex shrink-0 justify-end gap-2 border-t border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    className="min-h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-bold"
                  >
                    Fermer
                  </button>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm(
                          originalForm,
                        );

                        setNotifyMembers(
                          false,
                        );

                        setModalMode(
                          "edit",
                        );
                      }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0f172a] px-5 text-sm font-bold text-white"
                    >
                      <Pencil
                        size={
                          16
                        }
                      />

                      Modifier
                    </button>
                  )}
                </footer>
              </>
            )}
          </div>
        </div>
      )}

      {pendingScopeAction && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Annuler"
            onClick={
              cancelScopeChoice
            }
            className="absolute inset-0"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full overflow-hidden rounded-t-2xl border border-[#e2e8f0] bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
          >
            <header className="border-b border-[#e2e8f0] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-2 text-[#0f172a]">
                <Repeat2
                  size={
                    18
                  }
                />

                <span className="text-xs font-bold uppercase">
                  Série
                </span>
              </div>

              <h3 className="mt-2 text-xl font-semibold">
                {pendingScopeAction.kind ===
                "delete"
                  ? "Que voulez-vous supprimer ?"
                  : pendingScopeAction.kind ===
                      "move"
                    ? "Que voulez-vous déplacer ?"
                    : "Que voulez-vous modifier ?"}
              </h3>
            </header>

            <div className="space-y-2 p-4 sm:p-5">
              {[
                {
                  scope:
                    "single" as Scope,

                  title:
                    "Cet événement uniquement",

                  description:
                    "Les autres dates ne changent pas.",
                },

                {
                  scope:
                    "following" as Scope,

                  title:
                    "Cet événement et les suivants",

                  description:
                    "Les dates précédentes restent inchangées.",
                },

                {
                  scope:
                    "series" as Scope,

                  title:
                    "Toute la série",

                  description:
                    "Appliquer à toutes les occurrences.",
                },
              ].map(
                (choice) => (
                  <button
                    key={
                      choice.scope
                    }
                    type="button"
                    disabled={
                      scopeSaving
                    }
                    onClick={() =>
                      applyScope(
                        choice.scope,
                      )
                    }
                    className="w-full rounded-xl border border-[#e2e8f0] px-4 py-4 text-left transition hover:bg-[#f8fafc] disabled:opacity-50"
                  >
                    <span className="block font-bold">
                      {
                        choice.title
                      }
                    </span>

                    <span className="mt-1 block text-sm text-[#64748b]">
                      {
                        choice.description
                      }
                    </span>
                  </button>
                ),
              )}

              {scopeError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  {scopeError}
                </div>
              )}
            </div>

            <footer className="flex justify-end border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-4">
              <button
                type="button"
                onClick={
                  cancelScopeChoice
                }
                disabled={
                  scopeSaving
                }
                className="min-h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-bold"
              >
                Annuler
              </button>
            </footer>
          </div>
        </div>
      )}

      <CalendarImportModal
        canClear={canClear}
        open={
          importOpen
        }
        onClose={() =>
          setImportOpen(
            false,
          )
        }
        onImported={() => {
          refetchEvents();

          showToast(
            "Planning importé",
          );

          void publishMemberUpdate(
            "calendar",
            false,
          );
        }}
      />
    </>
  );
}