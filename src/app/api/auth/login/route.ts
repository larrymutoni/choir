import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/server/auth/service";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid login data." },
      { status: 400 },
    );
  }

  try {
    const result = await loginUser(
      parsed.data.email,
      parsed.data.password,
    );

    if (!result.ok) {
      if (result.reason === "pending") {
        return NextResponse.json(
          { message: "Your account is waiting for approval." },
          { status: 403 },
        );
      }

      if (result.reason === "rejected") {
        return NextResponse.json(
          { message: "Your account is not authorized." },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: result.user,
    });
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { message: "Unable to login." },
      { status: 500 },
    );
  }
}