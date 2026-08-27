import "server-only";

import { getUsersForAdmin } from "@/server/auth/service";
import { sendEmail } from "@/server/email/service";

type NotificationInput = {
  subject: string;
  html: string;
  text?: string;
};

const BATCH_SIZE = 10;

export async function notifyActiveMembers({
  subject,
  html,
  text,
}: NotificationInput) {
  const users = await getUsersForAdmin();

  const recipients = users
    .filter((user) => user.status === "active")
    .map((user) => ({
      email: user.email,
      name: `${user.firstname} ${user.lastname}`.trim(),
    }));

  if (recipients.length === 0) {
    return {
      sent: 0,
    };
  }

  let sent = 0;

  for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
    const batch = recipients.slice(index, index + BATCH_SIZE);

    await Promise.all(
      batch.map(async (recipient) => {
        await sendEmail({
          to: [recipient],
          subject,
          html,
          text,
        });

        sent += 1;
      }),
    );
  }

  return {
    sent,
  };
}