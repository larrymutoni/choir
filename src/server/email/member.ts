import { sendEmail } from "@/server/email/service";

export async function sendMemberInvitationEmail(
  email: string,
  registrationUrl: string,
) {
  await sendEmail({
    to: [{ email }],
    subject:
      "Votre accès à l’espace membre — Chorale Rayon de Soleil Lyon",
    text:
      "Votre adresse email a été ajoutée à la liste des membres de la Chorale Rayon de Soleil Lyon.\n\n" +
      "Vous pouvez maintenant créer votre compte ici :\n" +
      `${registrationUrl}\n\n` +
      "Utilisez cette même adresse email lors de l’inscription.",
    html: `
      <h2>Bienvenue dans l’espace membre</h2>
      <p>Votre adresse email a été ajoutée à la liste des membres de la Chorale Rayon de Soleil Lyon.</p>
      <p>Vous pouvez maintenant créer votre compte :</p>
      <p>
        <a href="${registrationUrl}">Créer mon compte</a>
      </p>
      <p>Utilisez cette même adresse email lors de l’inscription.</p>
    `,
  });
}


function emailHtmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export async function sendMemberWelcomeEmail(
  email: string,
  firstname: string,
  status: "active" | "pending",
  siteUrl: string,
) {
  const name = firstname.trim();
  const message = status === "active"
    ? "Votre compte a été créé. Vous pouvez maintenant accéder à votre espace membre."
    : "Votre compte a été créé et attend la validation d’un administrateur.";
  await sendEmail({
    to: [{ email }],
    subject: "Votre compte est créé — Chorale Rayon de Soleil Lyon",
    text: `Bonjour ${name},\n\n${message}\n\nSite : ${siteUrl}\n\nÀ bientôt !`,
    html: `<p>Bonjour ${emailHtmlEscape(name)},</p><p>${emailHtmlEscape(message)}</p>` +
      `<p><a href="${emailHtmlEscape(siteUrl)}">Accéder au site</a></p><p>À bientôt !</p>`,
  });
}
