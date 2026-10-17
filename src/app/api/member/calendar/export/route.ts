import { NextResponse } from "next/server";
import ExcelJS from "exceljs-hardened";
import { getCurrentSession } from "@/server/auth/session";
import { listCalendarOccurrences } from "@/server/calendar/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parisDateTime(iso: string) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "";
  return { date: `${part("day")}/${part("month")}/${part("year")}`, time: `${part("hour")}:${part("minute")}` };
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Connexion requise." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const start = params.get("start") ?? "";
  const end = params.get("end") ?? "";
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs ||
      endMs - startMs > 100 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ message: "Période d'export invalide." }, { status: 400 });
  }

  try {
    const events = await listCalendarOccurrences(start, end);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Chorale Rayon de Soleil Lyon 6";
    const sheet = workbook.addWorksheet("Calendrier");
    sheet.columns = [
      { header: "Date", key: "date", width: 17 },
      { header: "Début", key: "start", width: 12 },
      { header: "Fin", key: "end", width: 12 },
      { header: "Événement", key: "title", width: 42 },
      { header: "Lieu", key: "location", width: 36 },
      { header: "Notes", key: "notes", width: 55 },
      { header: "Journée entière", key: "allDay", width: 18 },
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = "A1:G1";

    for (const item of [...events].sort((a,b) => Date.parse(a.startAt) - Date.parse(b.startAt))) {
      const startAt = parisDateTime(item.startAt);
      const endAt = item.endAt ? parisDateTime(item.endAt) : null;
      sheet.addRow({
        date: startAt.date, start: item.allDay ? "" : startAt.time,
        end: item.allDay ? "" : (endAt?.time ?? ""),
        title: item.title, location: item.location ?? "", notes: item.notes ?? "",
        allDay: item.allDay ? "Oui" : "Non",
      });
    }
    sheet.getColumn("notes").alignment = { wrapText: true, vertical: "top" };
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const bytes = Uint8Array.from(new Uint8Array(arrayBuffer));
    return new NextResponse(new Blob([bytes]), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="calendrier-rayon-de-soleil.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Calendar Excel export error:", error);
    return NextResponse.json({ message: "Export Excel indisponible." }, { status: 500 });
  }
}
