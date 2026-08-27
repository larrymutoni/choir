import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/server/email/service";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(2).max(5000),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  try {
    const recipient =
      process.env.CONTACT_RECIPIENT_EMAIL ?? process.env.BREVO_SENDER_EMAIL;

    if (!recipient) {
      throw new Error("Missing contact recipient configuration.");
    }

    const { name, email, phone, subject, message } = parsed.data;

    const emailSubject = subject
      ? `Contact site — ${subject}`
      : "Nouveau message depuis le site";

    await sendEmail({
      to: [
        {
          email: recipient,
          name: "Chorale Rayon de Soleil",
        },
      ],
      replyTo: {
        email,
        name,
      },
      subject: emailSubject,
      text: [
        `Nom : ${name}`,
        `Email : ${email}`,
        `Téléphone : ${phone || "Non renseigné"}`,
        "",
        message,
      ].join("\n"),
      html: `
        <h2>Nouveau message depuis le site</h2>
        <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
        <p><strong>Email :</strong> ${escapeHtml(email)}</p>
        <p><strong>Téléphone :</strong> ${
          phone ? escapeHtml(phone) : "Non renseigné"
        }</p>
        ${
          subject
            ? `<p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>`
            : ""
        }
        <hr />
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    });

    return NextResponse.json({
      ok: true,
      message: "Message envoyé.",
    });
  } catch (error) {
    console.error("Contact email failed:", error);

    return NextResponse.json(
      { message: "Le message n’a pas pu être envoyé." },
      { status: 500 },
    );
  }
}
