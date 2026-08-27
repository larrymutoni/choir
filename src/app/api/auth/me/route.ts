import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.user_id,
        firstname: session.firstname,
        lastname: session.lastname,
        email: session.email,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("Session lookup failed:", error);

    return NextResponse.json(
      { message: "Unable to retrieve session." },
      { status: 500 },
    );
  }
}
