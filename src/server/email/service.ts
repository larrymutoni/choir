import "server-only";

type EmailRecipient = {
  email: string;
  name?: string;
};

type SendEmailInput = {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailRecipient;
};

function getEmailConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("Missing Brevo email configuration.");
  }

  return {
    apiKey,
    senderEmail,
    senderName,
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendEmailInput) {
  const { apiKey, senderEmail, senderName } = getEmailConfig();

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      to,
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
      ...(replyTo ? { replyTo } : {}),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();

    console.error("Brevo email error:", response.status, error);

    throw new Error("Unable to send email.");
  }

  return response.json() as Promise<{
    messageId: string;
  }>;
}
