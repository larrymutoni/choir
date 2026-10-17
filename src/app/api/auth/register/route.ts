import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/server/auth/service";
import { sendMemberWelcomeEmail } from "@/server/email/member";

const registerSchema = z.object({
  firstname: z.string().trim().min(2).max(80),
  lastname: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional().nullable(),
  invitation: z.string().max(1500).optional().nullable(),
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

    if (!result.ok) {
      return NextResponse.json(
        { message: result.reason === "invitation_required"
          ? "Pour cette adresse membre, utilisez le lien d’invitation reçu par email. Un administrateur peut vous le renvoyer."
          : "Lien d’invitation invalide ou expiré. Demandez un nouveau lien." },
        { status: 403 },
      );
    }

    if (result.ok) {
      // An email delivery failure must never roll back a successfully created account.
      try {
        const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
        const siteUrl = configuredUrl?.startsWith("https://")
          ? configuredUrl.replace(/\/$/, "")
          : new URL(request.url).origin;
        await sendMemberWelcomeEmail(parsed.data.email.toLowerCase(), parsed.data.firstname, result.status === "active" ? "active" : "pending", siteUrl);
      } catch (emailError) {
        console.warn("Account created, welcome email could not be sent:", emailError);
      }
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