import "server-only";

import { getUsersForAdmin } from "@/server/auth/service";
import { sendEmail } from "@/server/email/service";
import { createMemberNotification } from "@/server/notifications/repository";

type MemberUpdateInput = {
  message: string;
  href: string;
  createdByUserId: string;
  appUrl: string;
  sendEmail: boolean;
};

const BATCH_SIZE = 10;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function notifyMembersOfUpdate({
  message,
  href,
  createdByUserId,
  appUrl,
  sendEmail: shouldSendEmail,
}: MemberUpdateInput) {
  const users = await getUsersForAdmin();

  const recipients = users.filter(
    (user) => user.status === "active" && user.id !== createdByUserId,
  );

  if (recipients.length === 0) {
    return {
      recipients: 0,
      emailsSent: 0,
      emailsFailed: 0,
    };
  }

  await createMemberNotification({
    id: crypto.randomUUID(),
    message,
    href,
    createdByUserId,
    recipientUserIds: recipients.map((recipient) => recipient.id),
    createdAt: new Date().toISOString(),
  });

  if (!shouldSendEmail) {
    return {
      recipients: recipients.length,
      emailsSent: 0,
      emailsFailed: 0,
    };
  }

  const destinationUrl = new URL(href, appUrl).toString();

  const safeMessage = escapeHtml(message);

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#18181b;font-size:15px;line-height:1.6">
      <p>Bonjour,</p>

      <p>${safeMessage}</p>

      <p style="margin-top:24px">
        <a
          href="${destinationUrl}"
          style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600"
        >
          Consulter
        </a>
      </p>

      <p style="margin-top:28px;color:#71717a;font-size:12px">
        Chorale Rayon de Soleil Lyon 6
      </p>
    </div>
  `;

  let emailsSent = 0;
  let emailsFailed = 0;

  for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
    const batch = recipients.slice(index, index + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (recipient) => {
        try {
          await sendEmail({
            to: [
              {
                email: recipient.email,
                name: `${recipient.firstname} ${recipient.lastname}`.trim(),
              },
            ],

            subject: "Mise à jour de votre espace membre",

            text: `${message}\n\nConsulter : ${destinationUrl}`,

            html: emailHtml,
          });

          return true;
        } catch (error) {
          console.error(
            `Notification email failed for ${recipient.email}:`,
            error,
          );

          return false;
        }
      }),
    );

    emailsSent += results.filter(Boolean).length;

    emailsFailed += results.filter((result) => !result).length;
  }

  return {
    recipients: recipients.length,
    emailsSent,
    emailsFailed,
  };
}
