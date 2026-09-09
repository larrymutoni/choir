import ExcelJS from "exceljs-hardened";
import mammoth from "mammoth";
import Papa from "papaparse";

export type PlanningImportEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  notes: string;
  valid: boolean;
  warning: string | null;
};

type RawCell = {
  text: string;
  raw: unknown;
};

type RawRow = RawCell[];

type HeaderMap = {
  rowIndex: number;
  date?: number;
  title?: number;
  time?: number;
  course?: number;
  details?: number;
  event?: number;
  location?: number;
  notes?: number;
};

type DetectedTime = {
  time: string;
  startIndex: number;
  endIndex: number;
};

const MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
};

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(year: number, month: number, day: number) {
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() + 1 !== month ||
    candidate.getUTCDate() !== day
  ) {
    return "";
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

function excelSerialToDate(serial: number, date1904 = false) {
  if (!Number.isFinite(serial) || serial < 1 || serial > 100000) {
    return "";
  }

  const wholeDays = Math.floor(serial);

  const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);

  const timestamp = date1904
    ? base + wholeDays * 86_400_000
    : base + wholeDays * 86_400_000;

  const date = new Date(timestamp);

  return formatDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function parseDateText(
  value: string,
  fallbackYear?: number,
  allowExcelSerial = false,
  date1904 = false,
) {
  const text = value.trim();

  if (!text) {
    return "";
  }

  if (allowExcelSerial && /^\d{4,6}(?:\.\d+)?$/.test(text)) {
    const serial = Number(text);

    if (serial >= 20000 && serial <= 80000) {
      const result = excelSerialToDate(serial, date1904);

      if (result) {
        return result;
      }
    }
  }

  let match = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);

  if (match) {
    return formatDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  match = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);

  if (match) {
    let year = Number(match[3]);

    if (year < 100) {
      year += 2000;
    }

    return formatDate(year, Number(match[2]), Number(match[1]));
  }

  const normalized = normalizeLabel(text);

  for (const [monthName, month] of Object.entries(MONTHS)) {
    const named = normalized.match(
      new RegExp(`\\b(\\d{1,2})\\s+${monthName}(?:\\s+(\\d{4}))?\\b`, "i"),
    );

    if (!named) {
      continue;
    }

    const year = Number(named[2]) || fallbackYear;

    if (!year) {
      return "";
    }

    return formatDate(year, month, Number(named[1]));
  }

  match = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})\b/);

  if (match && fallbackYear) {
    return formatDate(fallbackYear, Number(match[2]), Number(match[1]));
  }

  return "";
}

function parseDateCell(
  cell: RawCell,
  fallbackYear: number,
  allowExcelSerial: boolean,
  date1904: boolean,
) {
  if (cell.raw instanceof Date) {
    return formatDate(
      cell.raw.getUTCFullYear(),
      cell.raw.getUTCMonth() + 1,
      cell.raw.getUTCDate(),
    );
  }

  if (typeof cell.raw === "number" && allowExcelSerial) {
    const result = excelSerialToDate(cell.raw, date1904);

    if (result) {
      return result;
    }
  }

  if (cell.raw && typeof cell.raw === "object" && "result" in cell.raw) {
    const result = (
      cell.raw as {
        result?: unknown;
      }
    ).result;

    if (result instanceof Date) {
      return formatDate(
        result.getUTCFullYear(),
        result.getUTCMonth() + 1,
        result.getUTCDate(),
      );
    }

    if (typeof result === "number" && allowExcelSerial) {
      const parsed = excelSerialToDate(result, date1904);

      if (parsed) {
        return parsed;
      }
    }
  }

  return parseDateText(cell.text, fallbackYear, allowExcelSerial, date1904);
}

function detectYear(rows: RawRow[]) {
  const text = rows
    .flat()
    .map((cell) => cell.text)
    .join(" ");

  const matches = [...text.matchAll(/\b(20\d{2})\b/g)];

  if (matches.length > 0) {
    return Number(matches[0][1]);
  }

  return new Date().getFullYear();
}

function detectHeader(rows: RawRow[]) {
  let best: {
    map: HeaderMap;
    score: number;
  } | null = null;

  const limit = Math.min(rows.length, 20);

  for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
    const row = rows[rowIndex];

    const map: HeaderMap = {
      rowIndex,
    };

    let score = 0;

    row.forEach((cell, index) => {
      const label = normalizeLabel(cell.text);

      if (!label) {
        return;
      }

      if (
        label === "date" ||
        label === "dates" ||
        label === "jour" ||
        label === "jours"
      ) {
        map.date = index;
        score += 5;
        return;
      }

      if (
        label === "titre" ||
        label.includes("intitule") ||
        label === "activite" ||
        label === "activites"
      ) {
        map.title = index;
        score += 2;
        return;
      }

      if (
        label === "horaire" ||
        label === "horaires" ||
        label === "heure" ||
        label === "heures"
      ) {
        map.time = index;
        score += 2;
        return;
      }

      if (
        label === "cours" ||
        label === "repetition" ||
        label === "repetitions"
      ) {
        map.course = index;
        score += 2;
        return;
      }

      if (
        label.includes("precision") ||
        label === "detail" ||
        label === "details" ||
        label.includes("description")
      ) {
        map.details = index;
        score += 2;
        return;
      }

      if (
        label === "evenement" ||
        label === "evenements" ||
        label === "event" ||
        label === "events"
      ) {
        map.event = index;
        score += 2;
        return;
      }

      if (label === "lieu" || label === "adresse" || label === "salle") {
        map.location = index;
        score += 1;
        return;
      }

      if (
        label === "notes" ||
        label === "note" ||
        label.includes("commentaire")
      ) {
        map.notes = index;
        score += 1;
      }
    });

    if (map.date !== undefined && (!best || score > best.score)) {
      best = {
        map,
        score,
      };
    }
  }

  return best?.map ?? null;
}

function normalizeTime(hours: number, minutes: number) {
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return "";
  }

  return `${pad(hours)}:${pad(minutes)}`;
}

function extractTimes(value: string) {
  const regex = /\b([01]?\d|2[0-3])\s*(?:h(?:eure(?:s)?)?|:)\s*([0-5]\d)?\b/gi;

  const matches: DetectedTime[] = [];

  for (const match of value.matchAll(regex)) {
    const time = normalizeTime(Number(match[1]), Number(match[2] ?? 0));

    if (!time || match.index === undefined) {
      continue;
    }

    matches.push({
      time,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  let isRange = false;

  if (matches.length >= 2) {
    const between = value.slice(matches[0].endIndex, matches[1].startIndex);

    isRange = /\b(?:à|a|au)\b|[-–—]/i.test(between);
  }

  return {
    matches,
    isRange,
  };
}

function stripTimes(value: string) {
  return value
    .replace(
      /\b([01]?\d|2[0-3])\s*(?:h(?:eure(?:s)?)?|:)\s*([0-5]\d)?\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function cellText(row: RawRow, index?: number) {
  if (index === undefined) {
    return "";
  }

  return (row[index]?.text ?? "").trim();
}

function findDate(
  row: RawRow,
  header: HeaderMap | null,
  fallbackYear: number,
  date1904: boolean,
) {
  if (header?.date !== undefined) {
    const date = parseDateCell(
      row[header.date] ?? {
        text: "",
        raw: null,
      },
      fallbackYear,
      true,
      date1904,
    );

    if (date) {
      return {
        date,
        index: header.date,
      };
    }

    return null;
  }

  for (let index = 0; index < row.length; index += 1) {
    const date = parseDateCell(row[index], fallbackYear, true, date1904);

    if (date) {
      return {
        date,
        index,
      };
    }
  }

  return null;
}

function isGenericDetail(value: string) {
  const normalized = normalizeLabel(value);

  return (
    normalized === "cours" ||
    normalized === "repetition" ||
    /^\d+\s+cours?$/.test(normalized)
  );
}

function isVacation(value: string) {
  return normalizeLabel(value).startsWith("vacances");
}

function chooseTitle({
  explicitTitle,
  courseText,
  detailsText,
  eventText,
  fallbackTexts,
  hasTime,
}: {
  explicitTitle: string;
  courseText: string;
  detailsText: string;
  eventText: string;
  fallbackTexts: string[];
  hasTime: boolean;
}) {
  if (explicitTitle) {
    return explicitTitle;
  }

  const normalizedCourse = normalizeLabel(courseText);

  const noCourse = normalizedCourse.includes("pas de cours");

  if (noCourse && eventText) {
    return eventText;
  }

  if (detailsText && !isGenericDetail(detailsText)) {
    return detailsText;
  }

  if (eventText && !(hasTime && isVacation(eventText))) {
    return eventText;
  }

  if (hasTime) {
    return "Cours";
  }

  if (eventText) {
    return eventText;
  }

  if (noCourse) {
    return "Pas de cours";
  }

  for (const candidate of fallbackTexts) {
    const stripped = stripTimes(candidate)
      .replace(/^(?:et|à|a|au)$/i, "")
      .trim();

    if (stripped && stripped !== "1") {
      return stripped;
    }
  }

  return "Événement";
}

function buildNotes({
  title,
  courseText,
  detailsText,
  eventText,
  notesText,
}: {
  title: string;
  courseText: string;
  detailsText: string;
  eventText: string;
  notesText: string;
}) {
  const parts: string[] = [];

  function add(value: string) {
    const cleaned = value.trim();

    if (!cleaned) {
      return;
    }

    if (normalizeLabel(cleaned) === normalizeLabel(title)) {
      return;
    }

    if (
      parts.some((part) => normalizeLabel(part) === normalizeLabel(cleaned))
    ) {
      return;
    }

    parts.push(cleaned);
  }

  add(notesText);
  add(detailsText);
  add(eventText);

  const courseResidual = stripTimes(courseText)
    .replace(/^(?:et|à|a|au)$/i, "")
    .trim();

  if (courseResidual) {
    add(courseResidual);
  }

  return parts.join(" · ");
}

function mergeWarning(...values: Array<string | null | undefined>) {
  const warnings = values.filter((value): value is string => Boolean(value));

  if (warnings.length === 0) {
    return null;
  }

  return warnings.join(" ");
}

function rowToEvents(
  row: RawRow,
  header: HeaderMap | null,
  fallbackYear: number,
  date1904: boolean,
): PlanningImportEvent[] {
  const dateInfo = findDate(row, header, fallbackYear, date1904);

  if (!dateInfo) {
    return [];
  }

  const explicitTitle = cellText(row, header?.title);

  const courseText = cellText(row, header?.course);

  const dedicatedTime = cellText(row, header?.time);

  const detailsText = cellText(row, header?.details);

  const eventText = cellText(row, header?.event);

  const location = cellText(row, header?.location);

  const notesText = cellText(row, header?.notes);

  const fallbackTexts = row
    .map((cell, index) => ({
      text: cell.text.trim(),
      index,
    }))
    .filter(
      ({ text, index }) =>
        Boolean(text) && index !== dateInfo.index && text !== "1",
    )
    .map(({ text }) => text);

  const timeSource = [
    dedicatedTime,
    courseText,
    detailsText,
    eventText,
    notesText,
  ]
    .filter(Boolean)
    .join(" ");

  const timeInfo = extractTimes(timeSource);

  const title = chooseTitle({
    explicitTitle,
    courseText,
    detailsText,
    eventText,
    fallbackTexts,
    hasTime: timeInfo.matches.length > 0,
  });

  const notes = buildNotes({
    title,
    courseText,
    detailsText,
    eventText,
    notesText,
  });

  const uncertaintyWarning = /\?{2,}/.test(
    row.map((cell) => cell.text).join(" "),
  )
    ? "Le fichier contient une information incertaine (« ??? ») : à vérifier."
    : null;

  if (timeInfo.matches.length === 0) {
    return [
      {
        id: crypto.randomUUID(),

        title,
        date: dateInfo.date,

        startTime: "",
        endTime: "",

        allDay: true,

        location,
        notes,

        valid: Boolean(title && dateInfo.date),

        warning: mergeWarning(
          "Aucun horaire détecté : importé sur toute la journée.",
          uncertaintyWarning,
        ),
      },
    ];
  }

  if (timeInfo.matches.length >= 2 && timeInfo.isRange) {
    return [
      {
        id: crypto.randomUUID(),

        title,
        date: dateInfo.date,

        startTime: timeInfo.matches[0].time,

        endTime: timeInfo.matches[1].time,

        allDay: false,

        location,
        notes,

        valid: Boolean(title && dateInfo.date),

        warning: uncertaintyWarning,
      },
    ];
  }

  if (timeInfo.matches.length > 1) {
    const count = timeInfo.matches.length;

    return timeInfo.matches.map((time) => ({
      id: crypto.randomUUID(),

      title,
      date: dateInfo.date,

      startTime: time.time,

      endTime: "",

      allDay: false,

      location,
      notes,

      valid: Boolean(title && dateInfo.date),

      warning: mergeWarning(
        `${count} horaires distincts détectés dans la même ligne : ${count} événements ont été créés.`,
        uncertaintyWarning,
      ),
    }));
  }

  return [
    {
      id: crypto.randomUUID(),

      title,
      date: dateInfo.date,

      startTime: timeInfo.matches[0].time,

      endTime: "",

      allDay: false,

      location,
      notes,

      valid: Boolean(title && dateInfo.date),

      warning: uncertaintyWarning,
    },
  ];
}

function rowsToEvents(rows: RawRow[], date1904 = false) {
  const fallbackYear = detectYear(rows);

  const header = detectHeader(rows);

  const startIndex = header ? header.rowIndex + 1 : 0;

  const events: PlanningImportEvent[] = [];

  for (let index = startIndex; index < rows.length; index += 1) {
    events.push(...rowToEvents(rows[index], header, fallbackYear, date1904));
  }

  return events;
}

function textCell(value: unknown): RawCell {
  return {
    text: clean(value),
    raw: value,
  };
}

async function parseXlsx(arrayBuffer: ArrayBuffer) {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(arrayBuffer);

  const rows: RawRow[] = [];

  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      const values: RawCell[] = [];

      row.eachCell(
        {
          includeEmpty: true,
        },
        (cell, columnNumber) => {
          values[columnNumber - 1] = {
            text: clean(cell.text),
            raw: cell.value,
          };
        },
      );

      rows.push(values);
    });
  });

  const date1904 =
    (
      workbook.properties as {
        date1904?: boolean;
      }
    ).date1904 === true;

  return rowsToEvents(rows, date1904);
}

function parseCsv(arrayBuffer: ArrayBuffer) {
  const text = new TextDecoder("utf-8")
    .decode(new Uint8Array(arrayBuffer))
    .replace(/^\uFEFF/, "");

  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error("Impossible de lire le fichier CSV.");
  }

  const rows = result.data.map((row) => row.map((value) => textCell(value)));

  return rowsToEvents(rows);
}

async function parseDocx(arrayBuffer: ArrayBuffer) {
  const result = await mammoth.extractRawText({
    arrayBuffer,
  });

  const lines = result.value.split(/\r?\n/).map(clean).filter(Boolean);

  const rows: RawRow[] = lines.map((line) =>
    line
      .split(/\t+|\s{2,}/)
      .map((value) => textCell(value))
      .filter((cell) => Boolean(cell.text)),
  );

  return rowsToEvents(rows);
}

export async function parsePlanningFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  const arrayBuffer = await file.arrayBuffer();

  if (extension === "xlsx") {
    return parseXlsx(arrayBuffer);
  }

  if (extension === "csv") {
    return parseCsv(arrayBuffer);
  }

  if (extension === "docx") {
    return parseDocx(arrayBuffer);
  }

  throw new Error(
    "Format non pris en charge. Utilisez un fichier XLSX, CSV ou DOCX.",
  );
}
