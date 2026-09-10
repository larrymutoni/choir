import { dbRequest } from "@/server/db/client";

type UserRow = {
  id: string;
  role: "member" | "admin" | "super_admin";
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  status: "pending" | "active" | "rejected";
  created_at: string;
  updated_at: string;
};

export type DirectoryMember = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  role: "member" | "admin" | "super_admin";
};

export async function listDirectoryMembers(): Promise<
  DirectoryMember[]
> {
  const result = await dbRequest<{
    users: UserRow[];
  }>("/v1/users");

  return result.users
    .filter(
      (user) =>
        user.status === "active",
    )
    .map((user) => ({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      role: user.role,
    }))
    .sort((a, b) => {
      const lastname =
        a.lastname.localeCompare(
          b.lastname,
          "fr",
          {
            sensitivity: "base",
          },
        );

      if (lastname !== 0) {
        return lastname;
      }

      return a.firstname.localeCompare(
        b.firstname,
        "fr",
        {
          sensitivity: "base",
        },
      );
    });
}