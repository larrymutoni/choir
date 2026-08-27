import { requireRole } from "@/server/auth/guard";
import { listAuthorizedEmails } from "@/server/auth/repository";
import AuthorizedEmailManagement from "@/components/admin/AuthorizedEmailManagement";

export default async function AuthorizedEmailsPage() {
  await requireRole(["admin", "super_admin"]);

  const emails = await listAuthorizedEmails();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-semibold">
        Emails autorisés
      </h1>

      <AuthorizedEmailManagement initialEmails={emails} />
    </main>
  );
}