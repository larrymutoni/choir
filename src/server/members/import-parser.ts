import ExcelJS from "exceljs-hardened";
import Papa from "papaparse";

export type ParsedMember = {
  rowId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
};

type RawRow = string[];

type ColumnMap = {
  firstname: number | null;
  lastname: number | null;
  fullName: number | null;
  email: number | null;
  phone: number | null;
  fullNameOrder: "firstname-lastname" | "lastname-firstname";
};

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    const candidate = value as {
      text?: unknown;
      result?: unknown;
      hyperlink?: unknown;
      richText?: Array<{
        text?: unknown;
      }>;
    };

    if (typeof candidate.text === "string") {
      return candidate.text.trim();
    }

    if (
      candidate.result !== undefined &&
      candidate.result !== null
    ) {
      return String(candidate.result).trim();
    }

    if (Array.isArray(candidate.richText)) {
      return candidate.richText
        .map((part) =>
          typeof part.text === "string"
            ? part.text
            : "",
        )
        .join("")
        .trim();
    }

    if (typeof candidate.hyperlink === "string") {
      return candidate.hyperlink.trim();
    }
  }

  return String(value).trim();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim(),
  );
}

function findHeaderIndex(
  headers: string[],
  variants: string[],
) {
  const normalizedVariants =
    variants.map(normalizeHeader);

  const index =
    headers.findIndex((header) =>
      normalizedVariants.includes(
        normalizeHeader(header),
      ),
    );

  return index >= 0 ? index : null;
}

function detectColumns(
  headers: string[],
): ColumnMap {
  const firstname =
    findHeaderIndex(headers, [
      "prénom",
      "prenom",
      "first name",
      "firstname",
      "given name",
    ]);

  const lastname =
    findHeaderIndex(headers, [
      "nom",
      "nom de famille",
      "last name",
      "lastname",
      "surname",
      "family name",
    ]);

  const email =
    findHeaderIndex(headers, [
      "email",
      "e-mail",
      "mail",
      "adresse email",
      "adresse e-mail",
      "adresse mail",
      "courriel",
    ]);

  const phone =
    findHeaderIndex(headers, [
      "téléphone",
      "telephone",
      "tel",
      "tél",
      "portable",
      "mobile",
      "phone",
      "phone number",
      "numéro de téléphone",
      "numero de telephone",
    ]);

  const lastnameFirstname =
    findHeaderIndex(headers, [
      "nom prénom",
      "nom prenom",
      "nom et prénom",
      "nom et prenom",
    ]);

  const firstnameLastname =
    findHeaderIndex(headers, [
      "prénom nom",
      "prenom nom",
      "prénom et nom",
      "prenom et nom",
      "nom complet",
      "full name",
      "membre",
    ]);

  let fullName: number | null =
    firstnameLastname;

  let fullNameOrder:
    | "firstname-lastname"
    | "lastname-firstname" =
    "firstname-lastname";

  if (
    lastnameFirstname !== null
  ) {
    fullName =
      lastnameFirstname;

    fullNameOrder =
      "lastname-firstname";
  }

  return {
    firstname,
    lastname,
    fullName,
    email,
    phone,
    fullNameOrder,
  };
}

function splitFullName(
  value: string,
  order:
    | "firstname-lastname"
    | "lastname-firstname",
) {
  const cleaned =
    value
      .trim()
      .replace(/\s+/g, " ");

  if (!cleaned) {
    return {
      firstname: "",
      lastname: "",
    };
  }

  const parts =
    cleaned.split(" ");

  if (parts.length === 1) {
    return order ===
      "lastname-firstname"
      ? {
          firstname: "",
          lastname:
            parts[0],
        }
      : {
          firstname:
            parts[0],
          lastname: "",
        };
  }

  if (
    order ===
    "lastname-firstname"
  ) {
    return {
      lastname:
        parts[0],
      firstname:
        parts
          .slice(1)
          .join(" "),
    };
  }

  return {
    firstname:
      parts[0],
    lastname:
      parts
        .slice(1)
        .join(" "),
  };
}

function looksLikeHeader(
  row: RawRow,
) {
  const normalized =
    row.map(normalizeHeader);

  const known = new Set([
    "prenom",
    "first name",
    "firstname",
    "nom",
    "nom de famille",
    "last name",
    "lastname",
    "surname",
    "email",
    "e mail",
    "mail",
    "adresse email",
    "adresse mail",
    "courriel",
    "telephone",
    "tel",
    "portable",
    "mobile",
    "phone",
    "nom prenom",
    "prenom nom",
    "nom complet",
    "full name",
    "membre",
  ]);

  return normalized.some(
    (value) =>
      known.has(value),
  );
}

function findHeaderRow(
  rows: RawRow[],
) {
  const limit =
    Math.min(
      rows.length,
      15,
    );

  for (
    let index = 0;
    index < limit;
    index += 1
  ) {
    if (
      looksLikeHeader(
        rows[index],
      )
    ) {
      return index;
    }
  }

  return 0;
}

function parseRows(
  rawRows: RawRow[],
): ParsedMember[] {
  const usefulRows =
    rawRows.filter((row) =>
      row.some(
        (value) =>
          value.trim() !== "",
      ),
    );

  if (
    usefulRows.length <
    2
  ) {
    return [];
  }

  const headerRowIndex =
    findHeaderRow(
      usefulRows,
    );

  const headers =
    usefulRows[
      headerRowIndex
    ];

  const columns =
    detectColumns(
      headers,
    );

  if (
    columns.email ===
    null
  ) {
    throw new Error(
      "Impossible de détecter la colonne email. Vérifiez que le fichier contient une colonne Email.",
    );
  }

  if (
    columns.firstname ===
      null &&
    columns.lastname ===
      null &&
    columns.fullName ===
      null
  ) {
    throw new Error(
      "Impossible de détecter les colonnes Prénom/Nom.",
    );
  }

  const members:
    ParsedMember[] =
    [];

  for (
    let index =
      headerRowIndex + 1;
    index <
    usefulRows.length;
    index += 1
  ) {
    const row =
      usefulRows[index];

    const email =
      row[
        columns.email
      ]?.trim() ?? "";

    const phone =
      columns.phone !==
      null
        ? row[
            columns.phone
          ]?.trim() ?? ""
        : "";

    let firstname =
      columns.firstname !==
      null
        ? row[
            columns.firstname
          ]?.trim() ?? ""
        : "";

    let lastname =
      columns.lastname !==
      null
        ? row[
            columns.lastname
          ]?.trim() ?? ""
        : "";

    if (
      (!firstname ||
        !lastname) &&
      columns.fullName !==
        null
    ) {
      const parsedName =
        splitFullName(
          row[
            columns.fullName
          ] ?? "",
          columns.fullNameOrder,
        );

      firstname =
        firstname ||
        parsedName.firstname;

      lastname =
        lastname ||
        parsedName.lastname;
    }

    if (
      !email &&
      !firstname &&
      !lastname &&
      !phone
    ) {
      continue;
    }

    members.push({
      rowId:
        crypto.randomUUID(),

      firstname,
      lastname,
      email:
        email.toLowerCase(),

      phone,
    });
  }

  return members;
}

async function parseXlsx(
  file: File,
) {
  const workbook =
    new ExcelJS.Workbook();

  const buffer =
    Buffer.from(
      await file.arrayBuffer(),
    );

  await workbook.xlsx.load(
    buffer,
  );

  const worksheet =
    workbook.worksheets[0];

  if (!worksheet) {
    return [];
  }

  const rows: RawRow[] =
    [];

  worksheet.eachRow(
    {
      includeEmpty: false,
    },
    (row) => {
      const values:
        string[] = [];

      const maxColumn =
        Math.max(
          row.cellCount,
          worksheet.columnCount,
        );

      for (
        let column = 1;
        column <= maxColumn;
        column += 1
      ) {
        values.push(
          cellToString(
            row.getCell(
              column,
            ).value,
          ),
        );
      }

      rows.push(values);
    },
  );

  return parseRows(rows);
}

async function parseCsv(
  file: File,
) {
  const text =
    await file.text();

  const parsed =
    Papa.parse<string[]>(
      text,
      {
        skipEmptyLines:
          "greedy",
      },
    );

  if (
    parsed.errors.length >
    0
  ) {
    throw new Error(
      "Le fichier CSV n'a pas pu être lu correctement.",
    );
  }

  const rows =
    parsed.data.map(
      (row) =>
        row.map(
          (value) =>
            String(
              value ?? "",
            ).trim(),
        ),
    );

  return parseRows(rows);
}

export async function parseMemberFile(
  file: File,
) {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    extension ===
    "xlsx"
  ) {
    return parseXlsx(
      file,
    );
  }

  if (
    extension ===
    "csv"
  ) {
    return parseCsv(
      file,
    );
  }

  throw new Error(
    "Formats acceptés : XLSX et CSV.",
  );
}

export function validateParsedMember(
  member: ParsedMember,
) {
  if (
    !member.firstname.trim()
  ) {
    return "Prénom manquant";
  }

  if (
    !member.lastname.trim()
  ) {
    return "Nom manquant";
  }

  if (
    !isEmail(member.email)
  ) {
    return "Email invalide";
  }

  return null;
}