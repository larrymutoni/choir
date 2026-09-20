"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileUp,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UsersRound,
  UserX,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  MemberImportDialog,
} from "@/components/directory/MemberImportDialog";

import {
  RoleManagementModal,
} from "@/components/directory/RoleManagementModal";

import {
  showToast,
} from "@/lib/toast";

type Role =
  | "member"
  | "admin"
  | "super_admin";

type AccountStatus =
  | "pending"
  | "active"
  | "rejected"
  | null;

type MemberEntry = {
  membershipId: string | null;
  userId: string | null;

  firstname: string;
  lastname: string;

  email: string;
  phone: string | null;

  role: Role;

  customRoleId:
    string | null;

  customRoleName:
    string | null;

  roleName: string;

  accountStatus:
    AccountStatus;

  isOfficial: boolean;
};

type StatusFilter =
  | "all"
  | "active"
  | "not_registered"
  | "pending"
  | "rejected";

type RoleFilter =
  string;

type RoleChoice = {
  value: string;
  label: string;
};

type MemberForm = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  roleAssignment: string;
};

const emptyForm: MemberForm = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  roleAssignment:
    "system:member",
};

const PAGE_SIZE = 10;

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function initials(
  member: MemberEntry,
) {
  const first =
    member.firstname
      .trim()
      .charAt(0);

  const last =
    member.lastname
      .trim()
      .charAt(0);

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return member.email
    .charAt(0)
    .toUpperCase();
}

function fullName(
  member: MemberEntry,
) {
  return (
    `${member.lastname} ${member.firstname}`.trim() ||
    member.email
  );
}

function roleLabel(
  member: MemberEntry,
) {
  if (
    member.customRoleName
  ) {
    return member.customRoleName;
  }

  if (
    member.role ===
    "super_admin"
  ) {
    return "Super administrateur";
  }

  if (
    member.role ===
    "admin"
  ) {
    return "Administrateur";
  }

  return "Membre";
}

function memberRoleValue(
  member: MemberEntry,
) {
  if (
    member.customRoleId
  ) {
    return `custom:${member.customRoleId}`;
  }

  return `system:${member.role}`;
}

function roleAssignmentBody(
  value: string,
) {
  if (
    value.startsWith(
      "custom:",
    )
  ) {
    return {
      kind:
        "custom" as const,

      customRoleId:
        value.slice(
          "custom:".length,
        ),
    };
  }

  return {
    kind:
      "system" as const,

    role:
      value.slice(
        "system:".length,
      ) as Role,
  };
}

function roleClasses(
  role: Role,
) {
  if (role === "super_admin") {
    return "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/10";
  }

  if (role === "admin") {
    return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10";
}


function statusOf(
  member: MemberEntry,
): Exclude<
  StatusFilter,
  "all"
> {
  if (
    member.accountStatus ===
    "active"
  ) {
    return "active";
  }

  if (
    member.accountStatus ===
    "rejected"
  ) {
    return "rejected";
  }

  if (
    member.isOfficial &&
    !member.userId
  ) {
    return "not_registered";
  }

  return "pending";
}

function statusLabel(
  status: Exclude<
    StatusFilter,
    "all"
  >,
) {
  if (
    status === "active"
  ) {
    return "Actif";
  }

  if (
    status ===
    "not_registered"
  ) {
    return "Non inscrit";
  }

  if (
    status === "pending"
  ) {
    return "À valider";
  }

  return "Refusé";
}

function statusClasses(
  status: Exclude<
    StatusFilter,
    "all"
  >,
) {
  if (
    status === "active"
  ) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10";
  }

  if (
    status ===
    "not_registered"
  ) {
    return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10";
  }

  if (
    status === "pending"
  ) {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10";
  }

  return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10";
}

async function responseError(
  response: Response,
) {
  try {
    const data =
      (await response.json()) as {
        message?: string;
      };

    return (
      data.message ||
      "Une erreur est survenue."
    );
  } catch {
    return "Une erreur est survenue.";
  }
}

export function MemberDirectory() {
  const [
    nameSortDirection,
    setNameSortDirection,
  ] = useState<"asc" | "desc">("asc");

  const [
    members,
    setMembers,
  ] =
    useState<MemberEntry[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    canManage,
    setCanManage,
  ] = useState(false);

  const [
    canManageRoles,
    setCanManageRoles,
  ] = useState(false);

  const [
    canManageSuperAdminRoles,
    setCanManageSuperAdminRoles,
  ] = useState(false);

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState("");

  const [
    roleChoices,
    setRoleChoices,
  ] =
    useState<RoleChoice[]>([
      {
        value:
          "system:member",
        label:
          "Membre",
      },
      {
        value:
          "system:admin",
        label:
          "Administrateur",
      },
      {
        value:
          "system:super_admin",
        label:
          "Super administrateur",
      },
    ]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState<RoleFilter>(
      "all",
    );

  const [
    selected,
    setSelected,
  ] =
    useState<MemberEntry | null>(
      null,
    );

  const [
    menuMemberId,
    setMenuMemberId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    importOpen,
    setImportOpen,
  ] = useState(false);

  const [
    rolesOpen,
    setRolesOpen,
  ] = useState(false);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingMember,
    setEditingMember,
  ] =
    useState<MemberEntry | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<MemberForm>(
      emptyForm,
    );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    accountAction,
    setAccountAction,
  ] =
    useState<string | null>(
      null,
    );

  async function loadRoleChoices() {
    try {
      const response =
        await fetch(
          "/api/admin/role-options",
          {
            cache:
              "no-store",
          },
        );

      if (!response.ok) {
        return;
      }

      const data =
        (await response.json()) as {
          systemRoles: Array<{
            id: Role;
            name: string;
          }>;

          roles: Array<{
            id: string;
            name: string;
          }>;
        };

      setRoleChoices([
        ...data.systemRoles.map(
          (role) => ({
            value:
              `system:${role.id}`,
            label:
              role.name,
          }),
        ),

        ...data.roles.map(
          (role) => ({
            value:
              `custom:${role.id}`,
            label:
              role.name,
          }),
        ),
      ]);
    } catch {
      // Member list remains usable
      // even if role options fail.
    }
  }

  async function loadMembers() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/member/members",
          {
            cache: "no-store",
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseError(
            response,
          ),
        );
      }

      const data =
        (await response.json()) as {
          members:
            MemberEntry[];

          canManage:
            boolean;

          canManageRoles:
            boolean;

          canManageSuperAdminRoles:
            boolean;

          currentUserId:
            string;
        };

      setMembers(
        data.members,
      );

      setCanManage(
        data.canManage,
      );

      setCanManageRoles(
        data.canManageRoles,
      );

      setCanManageSuperAdminRoles(
        data.canManageSuperAdminRoles,
      );

      setCurrentUserId(
        data.currentUserId,
      );

      setSelected(
        (current) => {
          if (!current) {
            return null;
          }

          return (
            data.members.find(
              (member) =>
                (
                  current.membershipId &&
                  member.membershipId ===
                    current.membershipId
                ) ||
                (
                  current.userId &&
                  member.userId ===
                    current.userId
                ) ||
                normalizeEmail(
                  member.email,
                ) ===
                  normalizeEmail(
                    current.email,
                  ),
            ) ?? null
          );
        },
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de charger les membres.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    if (canManageRoles) {
      void loadRoleChoices();
    }
  }, [canManageRoles]);

  const counts =
    useMemo(() => {
      const result = {
        active: 0,
        not_registered: 0,
        pending: 0,
        rejected: 0,
      };

      for (
        const member of
        members
      ) {
        result[
          statusOf(member)
        ] += 1;
      }

      return result;
    }, [members]);

  const superAdminCount =
    useMemo(
      () =>
        members.filter(
          (member) =>
            member.userId &&
            member.role ===
              "super_admin",
        ).length,
      [members],
    );


  const roleFilterOptions =
    useMemo(() => {
      const values =
        new Map<
          string,
          string
        >();

      for (
        const member of
        members
      ) {
        values.set(
          memberRoleValue(
            member,
          ),
          roleLabel(
            member,
          ),
        );
      }

      return Array.from(
        values.entries(),
      )
        .map(
          ([
            value,
            label,
          ]) => ({
            value,
            label,
          }),
        )
        .sort(
          (left, right) =>
            left.label.localeCompare(
              right.label,
              "fr",
            ),
        );
    }, [members]);

  const filteredMembers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "fr",
          );

      return members.filter(
        (member) => {
          if (
            statusFilter !==
              "all" &&
            statusOf(member) !==
              statusFilter
          ) {
            return false;
          }

          if (
            roleFilter !==
              "all" &&
            memberRoleValue(
              member,
            ) !== roleFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            [
              member.firstname,
              member.lastname,
              member.email,
              member.phone ?? "",
              roleLabel(member),
            ]
              .join(" ")
              .toLocaleLowerCase(
                "fr",
              );

          return searchable.includes(
            query,
          );
        },
      );
    }, [
      members,
      search,
      statusFilter,
      roleFilter,
    ]);

  const sortedMembers =
    useMemo(
      () =>
        [...filteredMembers].sort(
          (left, right) => {
            const byLastName =
              left.lastname.localeCompare(
                right.lastname,
                "fr",
                { sensitivity: "base" },
              );

            if (byLastName !== 0) {
              return nameSortDirection === "asc"
                ? byLastName
                : -byLastName;
            }

            const byFirstName =
              left.firstname.localeCompare(
                right.firstname,
                "fr",
                { sensitivity: "base" },
              );

            if (byFirstName !== 0) {
              return nameSortDirection === "asc"
                ? byFirstName
                : -byFirstName;
            }

            const byEmail =
              left.email.localeCompare(
                right.email,
                "fr",
                { sensitivity: "base" },
              );

            return nameSortDirection === "asc"
              ? byEmail
              : -byEmail;
          },
        ),
      [filteredMembers, nameSortDirection],
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredMembers.length /
          PAGE_SIZE,
      ),
    );

  const paginatedMembers =
    sortedMembers.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage *
        PAGE_SIZE,
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    roleFilter,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  function canEditTarget(
    member: MemberEntry,
  ) {
    if (
      !canManage ||
      !member.membershipId
    ) {
      return false;
    }

    if (canManageRoles) {
      return (
        canManageSuperAdminRoles ||
        member.role !==
          "super_admin"
      );
    }

    return (
      member.role ===
      "member"
    );
  }

  function canRemoveTarget(
    member: MemberEntry,
  ) {
    if (
      !canEditTarget(
        member,
      )
    ) {
      return false;
    }

    return (
      member.userId !==
      currentUserId
    );
  }

  function openCreate() {
    setEditingMember(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(
    member: MemberEntry,
  ) {
    if (
      !member.membershipId
    ) {
      return;
    }

    setEditingMember(
      member,
    );

    setForm({
      firstname:
        member.firstname,

      lastname:
        member.lastname,

      email:
        member.email,

      phone:
        member.phone ?? "",

      roleAssignment:
        memberRoleValue(
          member,
        ),
    });

    setMenuMemberId(null);
    setFormError("");
    setFormOpen(true);
  }

  async function saveMember(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (
      !form.firstname.trim() ||
      !form.lastname.trim() ||
      !form.email.trim()
    ) {
      setFormError(
        "Prénom, nom et email sont obligatoires.",
      );

      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const editing =
        Boolean(
          editingMember
            ?.membershipId,
        );

      if (
        editing &&
        editingMember &&
        (
          editingMember.userId ||
          editingMember.membershipId
        ) &&
        canManageRoles &&
        (
          canManageSuperAdminRoles ||
          editingMember.role !==
            "super_admin"
        ) &&
        editingMember.userId !==
          currentUserId &&
        form.roleAssignment !==
          memberRoleValue(
            editingMember,
          )
      ) {
        const assignment =
          roleAssignmentBody(
            form.roleAssignment,
          );

        const roleEndpoint =
          editingMember.userId
            ? "/api/admin/member-role"
            : "/api/admin/member-planned-role";

        const roleTarget =
          editingMember.userId
            ? {
                userId:
                  editingMember
                    .userId,
              }
            : {
                memberId:
                  editingMember
                    .membershipId,
              };

        const roleResponse =
          await fetch(
            roleEndpoint,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  ...roleTarget,
                  ...assignment,
                }),
            },
          );

        if (
          !roleResponse.ok
        ) {
          throw new Error(
            await responseError(
              roleResponse,
            ),
          );
        }
      }

      const response =
        await fetch(
          "/api/member/members",
          {
            method:
              editing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...(editing
                  ? {
                      id:
                        editingMember
                          ?.membershipId,
                    }
                  : {}),

                firstname:
                  form.firstname.trim(),

                lastname:
                  form.lastname.trim(),

                email:
                  normalizeEmail(
                    form.email,
                  ),

                phone:
                  form.phone.trim() ||
                  null,
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseError(
            response,
          ),
        );
      }

      setFormOpen(false);
      setEditingMember(null);
      setForm(emptyForm);

      await loadMembers();

      showToast(
        editing
          ? "Membre modifié"
          : "Membre ajouté",
      );
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer ce membre.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function runUserAction(
    member: MemberEntry,
    action:
      | "approve"
      | "reject",
  ) {
    if (!member.userId) {
      return;
    }

    if (
      action === "reject" &&
      !window.confirm(
        `Refuser l'inscription de ${fullName(member)} ?`,
      )
    ) {
      return;
    }

    setAccountAction(
      `${action}:${member.userId}`,
    );

    setMenuMemberId(null);

    try {
      const response =
        await fetch(
          "/api/member/members",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action,
                userId:
                  member.userId,
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseError(
            response,
          ),
        );
      }

      await loadMembers();

      showToast(
        action === "approve"
          ? "Accès membre activé"
          : "Inscription refusée",
        action === "approve"
          ? "success"
          : "warning",
      );
    } catch (cause) {
      showToast(
        cause instanceof Error
          ? cause.message
          : "Impossible d'effectuer cette action.",
        "error",
      );
    } finally {
      setAccountAction(null);
    }
  }

  async function removeMember(
    member: MemberEntry,
  ) {
    if (
      !member.membershipId
    ) {
      return;
    }

    if (
      !window.confirm(
        `Retirer ${fullName(member)} de la chorale ? Son accès au compte sera également révoqué.`,
      )
    ) {
      return;
    }

    setAccountAction(
      `delete:${member.membershipId}`,
    );

    setMenuMemberId(null);

    try {
      const response =
        await fetch(
          "/api/member/members",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  member.membershipId,
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseError(
            response,
          ),
        );
      }

      setSelected(null);

      await loadMembers();

      showToast(
        "Membre retiré",
      );
    } catch (cause) {
      showToast(
        cause instanceof Error
          ? cause.message
          : "Impossible de retirer ce membre.",
        "error",
      );
    } finally {
      setAccountAction(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setRoleFilter("all");
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">
              {members.length}
            </span>{" "}
            membre
            {members.length !==
            1
              ? "s"
              : ""}
          </p>

          {canManage && (
            <div className="flex items-center gap-2">
              {canManageSuperAdminRoles && (
                <button
                  type="button"
                  onClick={() =>
                    setRolesOpen(true)
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100"
                >
                  <ShieldCheck
                    size={16}
                  />
                  Gérer les rôles
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  setImportOpen(true)
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FileUp
                  size={16}
                />
                Importer
              </button>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Ajouter
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "active"
                  ? "all"
                  : "active",
              )
            }
            className={[
              "flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition",
              statusFilter ===
              "active"
                ? "border-emerald-300 ring-2 ring-emerald-100"
                : "border-slate-200 hover:border-slate-300",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck
                size={17}
              />
            </span>

            <span>
              <span className="block text-lg font-semibold leading-none text-slate-950">
                {counts.active}
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Actifs
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "not_registered"
                  ? "all"
                  : "not_registered",
              )
            }
            className={[
              "flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition",
              statusFilter ===
              "not_registered"
                ? "border-slate-400 ring-2 ring-slate-100"
                : "border-slate-200 hover:border-slate-300",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Clock3
                size={17}
              />
            </span>

            <span>
              <span className="block text-lg font-semibold leading-none text-slate-950">
                {
                  counts.not_registered
                }
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Non inscrits
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "pending"
                  ? "all"
                  : "pending",
              )
            }
            className={[
              "flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition",
              statusFilter ===
              "pending"
                ? "border-amber-300 ring-2 ring-amber-100"
                : "border-slate-200 hover:border-slate-300",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <UsersRound
                size={17}
              />
            </span>

            <span>
              <span className="block text-lg font-semibold leading-none text-slate-950">
                {counts.pending}
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                À valider
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "rejected"
                  ? "all"
                  : "rejected",
              )
            }
            className={[
              "flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition",
              statusFilter ===
              "rejected"
                ? "border-red-300 ring-2 ring-red-100"
                : "border-slate-200 hover:border-slate-300",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <UserX
                size={17}
              />
            </span>

            <span>
              <span className="block text-lg font-semibold leading-none text-slate-950">
                {counts.rejected}
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Refusés
              </span>
            </span>
          </button>
        </div>

        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Rechercher par nom, email ou téléphone…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(
                event,
              ) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter,
                )
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="all">
                Tous les statuts
              </option>
              <option value="active">
                Actifs
              </option>
              <option value="not_registered">
                Non inscrits
              </option>
              <option value="pending">
                À valider
              </option>
              <option value="rejected">
                Refusés
              </option>
            </select>

            <select
              value={
                roleFilter
              }
              onChange={(
                event,
              ) =>
                setRoleFilter(
                  event.target
                    .value as RoleFilter,
                )
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500"
            >
              <option value="all">
                Tous les rôles
              </option>

              {roleFilterOptions.map(
                (role) => (
                  <option
                    key={
                      role.value
                    }
                    value={
                      role.value
                    }
                  >
                    {
                      role.label
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          {!loading &&
            !error && (
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 sm:px-5">
                <p className="text-xs text-slate-500">
                  {
                    filteredMembers.length
                  }{" "}
                  résultat
                  {filteredMembers.length !==
                  1
                    ? "s"
                    : ""}
                </p>

                {(
                  statusFilter !==
                    "all" ||
                  roleFilter !==
                    "all" ||
                  search
                ) && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            )}

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Chargement…
            </div>
          ) : error ? (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredMembers.length ===
            0 ? (
            <div className="py-16 text-center">
              <UserRound
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-medium text-slate-600">
                Aucun membre trouvé
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(260px,1.5fr)_minmax(190px,1fr)_150px_125px_85px_48px] border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 lg:grid">
                <span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameSortDirection(
                        (current) =>
                          current === "asc"
                            ? "desc"
                            : "asc",
                      );
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-1 transition hover:text-slate-700"
                    aria-label="Trier les membres par nom"
                  >
                    Membre
                    <span
                      aria-hidden="true"
                      className="text-[11px]"
                    >
                      {nameSortDirection === "asc"
                        ? "↑"
                        : "↓"}
                    </span>
                  </button>
                </span>
                <span>
                  Contact
                </span>
                <span>
                  Rôle
                </span>
                <span>
                  Statut
                </span>
                <span>
                  Compte
                </span>
                <span />
              </div>

              <div className="divide-y divide-slate-100">
                {paginatedMembers.map(
                  (member) => {
                    const status =
                      statusOf(
                        member,
                      );

                    const rowKey =
                      member.membershipId ??
                      member.userId ??
                      member.email;

                    const pendingAction =
                      Boolean(
                        member.userId &&
                        (
                          status ===
                            "pending" ||
                          status ===
                            "rejected"
                        ) &&
                        member.role ===
                          "member",
                      );

                    const editable =
                      canEditTarget(
                        member,
                      );

                    const removable =
                      canRemoveTarget(
                        member,
                      );

                    const hasMenu =
                      pendingAction ||
                      editable ||
                      removable;

                    return (
                      <div
                        key={
                          rowKey
                        }
                        className="relative px-4 py-3 transition hover:bg-slate-50 sm:px-5 lg:grid lg:grid-cols-[minmax(260px,1.5fr)_minmax(190px,1fr)_150px_125px_85px_48px] lg:items-center lg:gap-0 lg:py-3"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(
                              member,
                            );

                            setMenuMemberId(
                              null,
                            );
                          }}
                          className="flex min-w-0 items-center gap-3 text-left lg:pr-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                            {initials(
                              member,
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {fullName(
                                member,
                              )}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-400 lg:hidden">
                              {
                                member.email
                              }
                            </p>
                          </div>
                        </button>

                        <div className="hidden min-w-0 pr-4 lg:block">
                          <p className="truncate text-sm text-slate-700">
                            {
                              member.email
                            }
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {member.phone ??
                              "—"}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-2 lg:mt-0">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
                              member.role,
                            )}`}
                          >
                            {roleLabel(member)}
                          </span>

                          {member.userId ===
                            currentUserId && (
                            <span className="text-[11px] font-medium text-slate-400">
                              Vous
                            </span>
                          )}
                        </div>

                        <div className="mt-2 lg:mt-0">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                              status,
                            )}`}
                          >
                            {statusLabel(
                              status,
                            )}
                          </span>
                        </div>

                        <div className="hidden text-xs text-slate-500 lg:block">
                          {member.userId
                            ? "Créé"
                            : "—"}
                        </div>

                        {hasMenu ? (
                          <div className="absolute right-3 top-3 lg:static">
                            <button
                              type="button"
                              aria-label="Actions"
                              onClick={() =>
                                setMenuMemberId(
                                  (
                                    current,
                                  ) =>
                                    current ===
                                    rowKey
                                      ? null
                                      : rowKey,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <MoreHorizontal
                                size={18}
                              />
                            </button>

                            {menuMemberId ===
                              rowKey && (
                              <div className="absolute right-0 top-10 z-[80] min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                                {pendingAction && (
                                  <button
                                    type="button"
                                    disabled={
                                      accountAction !==
                                      null
                                    }
                                    onClick={() =>
                                      void runUserAction(
                                        member,
                                        "approve",
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                                  >
                                    <Check
                                      size={15}
                                    />

                                    {status ===
                                    "rejected"
                                      ? "Réintégrer"
                                      : "Approuver"}
                                  </button>
                                )}

                                {status ===
                                  "pending" &&
                                  member.userId &&
                                  member.role ===
                                    "member" && (
                                  <button
                                    type="button"
                                    disabled={
                                      accountAction !==
                                      null
                                    }
                                    onClick={() =>
                                      void runUserAction(
                                        member,
                                        "reject",
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    <UserX
                                      size={15}
                                    />
                                    Refuser
                                  </button>
                                )}

                                {editable && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEdit(
                                        member,
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                  >
                                    <Pencil
                                      size={15}
                                    />
                                    Modifier
                                  </button>
                                )}

                                {removable && (
                                  <button
                                    type="button"
                                    disabled={
                                      accountAction !==
                                      null
                                    }
                                    onClick={() =>
                                      void removeMember(
                                        member,
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    <Trash2
                                      size={15}
                                    />
                                    Retirer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </>
          )}

          {!loading &&
            !error &&
            filteredMembers.length >
              0 &&
            totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-5">
                <p className="text-xs text-slate-500">
                  Page {currentPage} sur{" "}
                  {totalPages}
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1,
                          ),
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Page précédente"
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (_, index) =>
                      index + 1,
                  )
                    .filter(
                      (page) =>
                        page === 1 ||
                        page ===
                          totalPages ||
                        Math.abs(
                          page -
                            currentPage,
                        ) <= 1,
                    )
                    .map(
                      (
                        page,
                        index,
                        pages,
                      ) => {
                        const previous =
                          pages[
                            index - 1
                          ];

                        return (
                          <div
                            key={page}
                            className="flex items-center gap-1.5"
                          >
                            {previous &&
                              page -
                                previous >
                                1 && (
                                <span className="px-1 text-sm text-slate-400">
                                  …
                                </span>
                              )}

                            <button
                              type="button"
                              onClick={() =>
                                setCurrentPage(
                                  page,
                                )
                              }
                              className={[
                                "flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition",
                                page ===
                                currentPage
                                  ? "bg-slate-900 text-white"
                                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                              ].join(
                                " ",
                              )}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      },
                    )}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1,
                          ),
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Page suivante"
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[280] flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() =>
              setSelected(null)
            }
            className="absolute inset-0"
          />

          <aside className="relative z-10 flex h-full w-full max-w-[460px] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
              <p className="text-sm font-semibold text-slate-900">
                Détails du membre
              </p>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X size={17} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white">
                    {initials(
                      selected,
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-slate-950">
                      {fullName(
                        selected,
                      )}
                    </h2>

                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
                        selected.role,
                      )}`}
                    >
                      {roleLabel(selected)}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                      statusOf(
                        selected,
                      ),
                    )}`}
                  >
                    {statusLabel(
                      statusOf(
                        selected,
                      ),
                    )}
                  </span>
                </div>
              </div>

              <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Coordonnées
                  </h3>
                </div>

                <div className="space-y-4 p-4">
                  <a
                    href={`mailto:${selected.email}`}
                    className="flex items-center gap-3 text-sm text-slate-700 transition hover:text-blue-600"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Mail
                        size={15}
                      />
                    </span>

                    <span className="min-w-0 break-all">
                      {
                        selected.email
                      }
                    </span>
                  </a>

                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Phone
                        size={15}
                      />
                    </span>

                    {selected.phone ? (
                      <a
                        href={`tel:${selected.phone}`}
                        className="transition hover:text-blue-600"
                      >
                        {
                          selected.phone
                        }
                      </a>
                    ) : (
                      <span className="text-slate-400">
                        Non renseigné
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Accès
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">
                      Liste officielle
                    </span>

                    <span className="font-medium text-slate-900">
                      {selected.isOfficial
                        ? "Oui"
                        : "Non"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">
                      Compte
                    </span>

                    <span className="font-medium text-slate-900">
                      {selected.userId
                        ? "Créé"
                        : "Non créé"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">
                      Statut
                    </span>

                    <span className="font-medium text-slate-900">
                      {statusLabel(
                        statusOf(
                          selected,
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </section>

              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={16}
                    className="text-slate-500"
                  />

                  <h3 className="text-sm font-semibold text-slate-900">
                    Rôle
                  </h3>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleClasses(
                      selected.role,
                    )}`}
                  >
                    {roleLabel(
                      selected,
                    )}
                  </span>
                </div>
              </section>
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white p-4">
              <div className="flex flex-wrap justify-end gap-2">
                {(
                  statusOf(
                    selected,
                  ) ===
                    "pending" ||
                  statusOf(
                    selected,
                  ) ===
                    "rejected"
                ) &&
                  selected.userId &&
                  selected.role ===
                    "member" && (
                    <button
                      type="button"
                      disabled={
                        accountAction !==
                        null
                      }
                      onClick={() =>
                        void runUserAction(
                          selected,
                          "approve",
                        )
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check
                        size={15}
                      />

                      {statusOf(
                        selected,
                      ) ===
                      "rejected"
                        ? "Réintégrer"
                        : "Approuver"}
                    </button>
                  )}

                {canEditTarget(
                  selected,
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      openEdit(
                        selected,
                      )
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil
                      size={15}
                    />
                    Modifier
                  </button>
                )}

                {canRemoveTarget(
                  selected,
                ) && (
                  <button
                    type="button"
                    disabled={
                      accountAction !==
                      null
                    }
                    onClick={() =>
                      void removeMember(
                        selected,
                      )
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2
                      size={15}
                    />
                    Retirer
                  </button>
                )}
              </div>
            </footer>
          </aside>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[320] flex items-end justify-center bg-slate-950/30 backdrop-blur-[2px] sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() =>
              !saving &&
              setFormOpen(false)
            }
            className="absolute inset-0"
          />

          <div className="relative z-10 w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                {editingMember
                  ? "Modifier le membre"
                  : "Ajouter un membre"}
              </h2>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setFormOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X size={17} />
              </button>
            </header>

            <form
              onSubmit={saveMember}
            >
              <div className="space-y-4 p-5">
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Prénom
                    </span>

                    <input
                      autoFocus
                      value={
                        form.firstname
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,
                          firstname:
                            event
                              .target
                              .value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Nom
                    </span>

                    <input
                      value={
                        form.lastname
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,
                          lastname:
                            event
                              .target
                              .value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Email
                  </span>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        email:
                          event
                            .target
                            .value,
                      })
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Téléphone
                  </span>

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        phone:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Facultatif"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </label>

                {editingMember &&
                  (editingMember.userId ||
                    editingMember.membershipId) &&
                  canManageRoles &&
                  (canManageSuperAdminRoles ||
                    editingMember.role !==
                      "super_admin") && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Rôle
                    </span>

                    <select
                      value={
                        form.roleAssignment
                      }
                      disabled={
                        saving ||
                        editingMember
                          .userId ===
                          currentUserId ||
                        (
                          Boolean(
                            editingMember
                              .userId,
                          ) &&
                          editingMember
                            .role ===
                            "super_admin" &&
                          superAdminCount <=
                            1
                        )
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,

                          roleAssignment:
                            event
                              .target
                              .value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {roleChoices
                        .filter(
                          (role) =>
                            canManageSuperAdminRoles ||
                            role.value !==
                              "system:super_admin",
                        )
                        .map(
                        (role) => (
                          <option
                            key={
                              role.value
                            }
                            value={
                              role.value
                            }
                          >
                            {
                              role.label
                            }
                          </option>
                        ),
                      )}
                    </select>

                    {editingMember
                      .userId ===
                      currentUserId && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        Vous ne pouvez pas modifier votre propre rôle.
                      </p>
                    )}

                    {editingMember
                        .userId &&
                      editingMember
                        .role ===
                        "super_admin" &&
                      superAdminCount <=
                        1 &&
                      editingMember
                        .userId !==
                        currentUserId && (
                        <p className="mt-1.5 text-xs text-amber-700">
                          Le dernier super administrateur doit conserver ce rôle.
                        </p>
                      )}
                  </label>
                )}
              </div>

              <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setFormOpen(
                      false,
                    )
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving
                    ? "Enregistrement…"
                    : editingMember
                      ? "Enregistrer"
                      : "Ajouter"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <RoleManagementModal
        open={rolesOpen}
        onClose={() =>
          setRolesOpen(false)
        }
        onChanged={() => {
          void loadRoleChoices();
          void loadMembers();
        }}
      />

      <MemberImportDialog
        open={importOpen}
        existingMembers={
          members
        }
        onClose={() =>
          setImportOpen(false)
        }
        onImported={() => {
          setImportOpen(false);

          void loadMembers();

          showToast(
            "Membres importés",
          );
        }}
      />
    </>
  );
}
