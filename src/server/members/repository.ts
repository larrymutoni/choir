import {
  dbRequest,
} from "@/server/db/client";

export type MemberAccountStatus =
  | "pending"
  | "active"
  | "rejected"
  | null;

export type MemberRole =
  | "member"
  | "admin"
  | "super_admin";

export type MemberEntry = {
  membershipId: string | null;
  userId: string | null;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  role: MemberRole;
  customRoleId: string | null;
  customRoleName: string | null;
  roleName: string;
  accountStatus: MemberAccountStatus;
  isOfficial: boolean;
};

type MemberEntryRow = {
  membership_id: string | null;
  user_id: string | null;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  role: MemberRole;
  custom_role_id: string | null;
  custom_role_name: string | null;
  account_status: MemberAccountStatus;
  is_official: number;
};

export type MemberFormInput = {
  firstname: string;
  lastname: string;
  email: string;
  phone?: string | null;
};

export type RoleAssignment =
  | {
      kind: "system";
      role: MemberRole;
    }
  | {
      kind: "custom";
      customRoleId: string;
    };

function systemRoleLabel(
  role: MemberRole,
) {
  if (
    role === "super_admin"
  ) {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return "Membre";
}

function mapEntry(
  row: MemberEntryRow,
): MemberEntry {
  return {
    membershipId:
      row.membership_id,

    userId:
      row.user_id,

    firstname:
      row.firstname,

    lastname:
      row.lastname,

    email:
      row.email,

    phone:
      row.phone,

    role:
      row.role,

    customRoleId:
      row.custom_role_id,

    customRoleName:
      row.custom_role_name,

    roleName:
      row.custom_role_name ??
      systemRoleLabel(
        row.role,
      ),

    accountStatus:
      row.account_status,

    isOfficial:
      Boolean(
        row.is_official,
      ),
  };
}

export async function listMemberEntries() {
  const result =
    await dbRequest<{
      members:
        MemberEntryRow[];
    }>("/v1/members", {
      method: "GET",
    });

  return result.members.map(
    mapEntry,
  );
}

export async function createMember(
  input: MemberFormInput,
) {
  return dbRequest<{
    ok: true;
    id: string;
  }>("/v1/members", {
    method: "POST",
    body:
      JSON.stringify(
        input,
      ),
  });
}

export async function updateMember(
  id: string,
  input: MemberFormInput,
) {
  return dbRequest<{
    ok: true;
  }>("/v1/members", {
    method: "PATCH",

    body:
      JSON.stringify({
        id,
        ...input,
      }),
  });
}

export async function deleteMember(
  id: string,
) {
  return dbRequest<{
    ok: true;
  }>("/v1/members", {
    method: "DELETE",

    body:
      JSON.stringify({
        id,
      }),
  });
}

export async function approveMemberUser(
  userId: string,
) {
  return dbRequest<{
    ok: true;
  }>(
    "/v1/members/approve-user",
    {
      method: "POST",

      body:
        JSON.stringify({
          userId,
        }),
    },
  );
}

export async function rejectMemberUser(
  userId: string,
) {
  return dbRequest<{
    ok: true;
  }>(
    "/v1/members/reject-user",
    {
      method: "POST",

      body:
        JSON.stringify({
          userId,
        }),
    },
  );
}

export async function updateMemberAccountRole(
  userId: string,
  assignment:
    | MemberRole
    | RoleAssignment,
) {
  const normalized:
    RoleAssignment =
    typeof assignment ===
    "string"
      ? {
          kind:
            "system",
          role:
            assignment,
        }
      : assignment;

  return dbRequest<{
    ok: true;
  }>("/v1/users/role", {
    method: "PATCH",

    body:
      JSON.stringify({
        userId,
        ...normalized,
      }),
  });
}

export async function updateMemberPlannedRole(
  memberId: string,
  assignment: RoleAssignment,
) {
  return dbRequest<{
    ok: true;
  }>(
    "/v1/members/planned-role",
    {
      method: "PATCH",

      body:
        JSON.stringify({
          memberId,
          ...assignment,
        }),
    },
  );
}

export async function importMembers(
  members:
    MemberFormInput[],
) {
  return dbRequest<{
    ok: true;
    count: number;
  }>("/v1/members/import", {
    method: "POST",

    body:
      JSON.stringify({
        members,
      }),
  });
}
