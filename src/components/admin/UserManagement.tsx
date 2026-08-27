"use client";

import { useState } from "react";
import type { AdminUser, UserRole, UserStatus } from "@/server/auth/repository";

type Props = {
  initialUsers: AdminUser[];
  currentUserId: string;
  currentUserRole: UserRole;
};

export default function UserManagement({
  initialUsers,
  currentUserId,
  currentUserRole,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(userId: string, status: "active" | "rejected") {
    setError("");
    setLoadingUserId(userId);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setError(result.message ?? "Modification impossible.");
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                status: status as UserStatus,
              }
            : user,
        ),
      );
    } catch {
      setError("Modification impossible.");
    } finally {
      setLoadingUserId(null);
    }
  }

  async function updateRole(userId: string, role: UserRole) {
    setError("");
    setLoadingUserId(userId);

    try {
      const response = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setError(result.message ?? "Modification impossible.");
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                role,
              }
            : user,
        ),
      );
    } catch {
      setError("Modification impossible.");
    } finally {
      setLoadingUserId(null);
    }
  }

  if (users.length === 0) {
    return <p>Aucun utilisateur.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-3">Nom</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Rôle</th>
              <th className="px-3 py-3">Statut</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-3 py-3">
                  {user.firstname} {user.lastname}
                </td>

                <td className="px-3 py-3">{user.email}</td>

                <td className="px-3 py-3">
                  {currentUserRole === "super_admin" &&
                  user.id !== currentUserId ? (
                    <select
                      value={user.role}
                      disabled={loadingUserId === user.id}
                      onChange={(event) =>
                        updateRole(user.id, event.target.value as UserRole)
                      }
                      className="rounded-md border px-2 py-1"
                    >
                      <option value="member">Membre</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>

                <td className="px-3 py-3">{user.status}</td>

                <td className="px-3 py-3">
                  {user.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={loadingUserId === user.id}
                        onClick={() => updateStatus(user.id, "active")}
                        className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                      >
                        Accepter
                      </button>

                      <button
                        type="button"
                        disabled={loadingUserId === user.id}
                        onClick={() => updateStatus(user.id, "rejected")}
                        className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </div>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
