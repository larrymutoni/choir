import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/server/auth/service";

const registerSchema = z.object({
  firstname: z.string().trim().min(2).max(80),
  lastname: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional().nullable(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid registration data." },
      { status: 400 },
    );
  }

  try {
    const result = await registerUser(parsed.data);

    if (!result.ok && result.reason === "already_exists") {
      return NextResponse.json(
        { message: "An account already exists with this email." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: result.status,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration failed:", error);

    return NextResponse.json(
      { message: "Unable to create account." },
      { status: 500 },
    );
  }
}