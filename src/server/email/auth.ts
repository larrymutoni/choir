import { sendEmail } from "@/server/email/service";
import type { TwoFactorPurpose } from "@/server/auth/security-repository";

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  appUrl: string,
) {
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

function twoFactorPurposeLabel(
  purpose: TwoFactorPurpose,
) {
  if (purpose === "enable") {
    return "activer la double authentification";
  }

  if (purpose === "disable") {
    return "désactiver la double authentification";
  }

  return "terminer votre connexion";
}

export async function sendTwoFactorCodeEmail(
  email: string,
  code: string,
  purpose: TwoFactorPurpose,
) {
  const action =
    twoFactorPurposeLabel(
      purpose,
    );

  await sendEmail({
    to: [{ email }],
    subject:
      "Votre code de sécurité",
    text:
      `Votre code pour ${action} est : ${code}\n\n` +
      `Ce code est valable 15 minutes et ne peut être utilisé qu'une seule fois.\n\n` +
      `Si vous n'êtes pas à l'origine de cette demande, ne communiquez ce code à personne.`,
    html: `
      <h2>Votre code de sécurité</h2>
      <p>Utilisez ce code pour ${action} :</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:24px 0;">${code}</p>
      <p>Ce code est valable <strong>15 minutes</strong> et ne peut être utilisé qu'une seule fois.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ne communiquez ce code à personne.</p>
    `,
  });
}

export async function sendTwoFactorStatusEmail(
  email: string,
  enabled: boolean,
) {
  const action = enabled
    ? "activée"
    : "désactivée";

  await sendEmail({
    to: [{ email }],
    subject:
      `Double authentification ${action}`,
    text:
      `La double authentification par email a été ${action} sur votre compte.\n\n` +
      `Si vous n'êtes pas à l'origine de ce changement, modifiez immédiatement votre mot de passe.`,
    html: `
      <h2>Double authentification ${action}</h2>
      <p>La double authentification par email a été <strong>${action}</strong> sur votre compte.</p>
      <p>Si vous n'êtes pas à l'origine de ce changement, modifiez immédiatement votre mot de passe.</p>
    `,
  });
}
