import "server-only";

import {
  dbRequest,
} from "@/server/db/client";

import type {
  RolePermissions,
} from "@/lib/permissions";

export type SystemRole = {
  id:
    | "member"
    | "admin"
    | "super_admin";

  name: string;
  permissions: RolePermissions;
};

export type CustomRole = {
  id: string;
  name: string;
  permissions: RolePermissions;
  usageCount: number;
};

export async function listRoles() {
  return dbRequest<{
    systemRoles: SystemRole[];
    roles: CustomRole[];
  }>("/v1/custom-roles", {
    method: "GET",
  });
}

export async function createCustomRole(
  input: {
    name: string;
    permissions: RolePermissions;
  },
) {
  return dbRequest<{
    ok: true;
    id: string;
  }>("/v1/custom-roles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSystemRole(
  input: {
    id:
      | "member"
      | "admin"
      | "super_admin";

    permissions: RolePermissions;
  },
) {
  return dbRequest<{
    ok: true;
  }>("/v1/custom-roles", {
    method: "PATCH",

    body: JSON.stringify({
      kind: "system",
      ...input,
    }),
  });
}

export async function updateCustomRole(
  input: {
    id: string;
    name: string;
    permissions: RolePermissions;
  },
) {
  return dbRequest<{
    ok: true;
  }>("/v1/custom-roles", {
    method: "PATCH",

    body: JSON.stringify({
      kind: "custom",
      ...input,
    }),
  });
}

export async function deleteCustomRole(
  id: string,
) {
  return dbRequest<{
    ok: true;
  }>("/v1/custom-roles", {
    method: "DELETE",

    body: JSON.stringify({
      id,
    }),
  });
}
