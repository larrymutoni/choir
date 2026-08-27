import { NextResponse } from "next/server";
import { deleteCurrentSession } from "@/server/auth/session";

export async function POST() {
  try {
    await deleteCurrentSession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout failed:", error);

    return NextResponse.json({ message: "Unable to logout." }, { status: 500 });
  }
}
