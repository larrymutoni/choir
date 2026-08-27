import { requireUser } from "@/server/auth/guard";

export default async function MemberPage() {
  const user = await requireUser();

  return (
    <main>
      <h1>Espace membre</h1>
      <p>
        Bonjour {user.firstname} {user.lastname}
      </p>
    </main>
  );
}
