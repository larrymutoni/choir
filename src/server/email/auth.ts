import { sendEmail } from "@/server/email/service";

export async function sendPasswordResetEmail(email: string, token: string) {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Missing APP_URL configuration.");
  }

  const resetUrl = `${appUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: [{ email }],
    subject: "Réinitialisation de votre mot de passe",
    text:
      `Vous avez demandé à réinitialiser votre mot de passe.\n\n` +
      `Utilisez ce lien dans l'heure qui suit :\n${resetUrl}\n\n` +
      `Si vous n'avez pas fait cette demande, ignorez cet email.`,
    html: `
      <h2>Réinitialisation du mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>
        <a href="${resetUrl}">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `,
  });
}
