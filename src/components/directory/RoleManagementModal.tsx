"use client";

import {
  Check,
  LockKeyhole,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  showToast,
} from "@/lib/toast";

type Permissions = {
  members: boolean;
  calendar: boolean;
  resources: boolean;
  content: boolean;
  images: boolean;
  gallery: boolean;
  settings: boolean;
};

type SystemRole =
  | "member"
  | "admin"
  | "super_admin";

type SystemRoleEntry = {
  id: SystemRole;
  name: string;
  permissions: Permissions;
};

type CustomRole = {
  id: string;
  name: string;
  permissions: Permissions;
  usageCount: number;
};

type Editor =
  | {
      type: "new";
    }
  | {
      type: "system";
      role: SystemRoleEntry;
    }
  | {
      type: "custom";
      role: CustomRole;
    };

const emptyPermissions:
  Permissions = {
  members: false,
  calendar: false,
  resources: false,
  content: false,
  images: false,
  gallery: false,
  settings: false,
};

const permissionRows: Array<{
  key: keyof Permissions;
  label: string;
}> = [
  {
    key: "members",
    label: "Membres",
  },
  {
    key: "calendar",
    label: "Calendrier",
  },
  {
    key: "resources",
    label: "Répertoire",
  },
  {
    key: "content",
    label: "Contenu du site",
  },
  {
    key: "images",
    label: "Images",
  },
  {
    key: "gallery",
    label: "Galerie",
  },
  {
    key: "settings",
    label: "Paramètres",
  },
];

async function responseMessage(
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

function permissionSummary(
  permissions: Permissions,
) {
  const enabled =
    permissionRows
      .filter(
        (item) =>
          permissions[
            item.key
          ],
      )
      .map(
        (item) =>
          item.label,
      );

  if (enabled.length === 0) {
    return "Aucun accès";
  }

  return enabled.join(" · ");
}

export function RoleManagementModal({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [
    systemRoles,
    setSystemRoles,
  ] =
    useState<
      SystemRoleEntry[]
    >([]);

  const [
    roles,
    setRoles,
  ] =
    useState<
      CustomRole[]
    >([]);

  const [
    editor,
    setEditor,
  ] =
    useState<
      Editor | null
    >(null);

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    permissions,
    setPermissions,
  ] =
    useState<Permissions>({
      ...emptyPermissions,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function loadRoles() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/admin/roles",
          {
            cache:
              "no-store",
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseMessage(
            response,
          ),
        );
      }

      const data =
        (await response.json()) as {
          systemRoles:
            SystemRoleEntry[];

          roles:
            CustomRole[];
        };

      setSystemRoles(
        data.systemRoles,
      );

      setRoles(
        data.roles,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de charger les rôles.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      void loadRoles();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function openNew() {
    setName("");

    setPermissions({
      ...emptyPermissions,
    });

    setError("");

    setEditor({
      type: "new",
    });
  }

  function openSystem(
    role: SystemRoleEntry,
  ) {
    if (
      role.id ===
      "super_admin"
    ) {
      return;
    }

    setName(role.name);

    setPermissions({
      ...role.permissions,
    });

    setError("");

    setEditor({
      type: "system",
      role,
    });
  }

  function openCustom(
    role: CustomRole,
  ) {
    setName(role.name);

    setPermissions({
      ...role.permissions,
    });

    setError("");

    setEditor({
      type: "custom",
      role,
    });
  }

  async function saveRole() {
    if (
      !editor ||
      saving
    ) {
      return;
    }

    if (
      editor.type !==
        "system" &&
      name.trim().length < 2
    ) {
      setError(
        "Le nom du rôle doit contenir au moins 2 caractères.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      let method:
        | "POST"
        | "PATCH";

      let body: unknown;

      if (
        editor.type ===
        "new"
      ) {
        method = "POST";

        body = {
          name:
            name.trim(),

          permissions,
        };
      } else if (
        editor.type ===
        "system"
      ) {
        method = "PATCH";

        body = {
          kind:
            "system",

          id:
            editor.role.id,

          permissions,
        };
      } else {
        method = "PATCH";

        body = {
          kind:
            "custom",

          id:
            editor.role.id,

          name:
            name.trim(),

          permissions,
        };
      }

      const response =
        await fetch(
          "/api/admin/roles",
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body,
              ),
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseMessage(
            response,
          ),
        );
      }

      showToast(
        editor.type ===
          "new"
          ? "Rôle créé"
          : "Rôle enregistré",
      );

      setEditor(null);

      await loadRoles();

      onChanged?.();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer le rôle.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeRole() {
    if (
      !editor ||
      editor.type !==
        "custom" ||
      saving
    ) {
      return;
    }

    if (
      editor.role
        .usageCount > 0
    ) {
      setError(
        "Ce rôle est encore attribué à un utilisateur.",
      );

      return;
    }

    if (
      !window.confirm(
        `Supprimer le rôle « ${editor.role.name} » ?`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/admin/roles",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  editor.role.id,
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          await responseMessage(
            response,
          ),
        );
      }

      showToast(
        "Rôle supprimé",
      );

      setEditor(null);

      await loadRoles();

      onChanged?.();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de supprimer ce rôle.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[420] flex items-end justify-center bg-slate-950/40 backdrop-blur-[2px] sm:items-center sm:p-6">
        <button
          type="button"
          aria-label="Fermer"
          className="absolute inset-0"
          onClick={onClose}
        />

        <div className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={18}
                className="text-violet-600"
              />

              <h2 className="text-lg font-semibold text-slate-950">
                Gérer les rôles
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fermer"
            >
              <X size={17} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {error && !editor && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={openNew}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Nouveau rôle
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Chargement…
              </div>
            ) : (
              <div className="space-y-3">
                {systemRoles.map(
                  (role) => {
                    const protectedRole =
                      role.id ===
                      "super_admin";

                    return (
                      <div
                        key={
                          role.id
                        }
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            {protectedRole ? (
                              <LockKeyhole
                                size={17}
                              />
                            ) : (
                              <ShieldCheck
                                size={17}
                              />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-950">
                                {
                                  role.name
                                }
                              </h3>

                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Système
                              </span>
                            </div>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {protectedRole
                                ? "Accès complet · Protégé"
                                : permissionSummary(
                                    role.permissions,
                                  )}
                            </p>
                          </div>

                          {!protectedRole && (
                            <button
                              type="button"
                              onClick={() =>
                                openSystem(
                                  role,
                                )
                              }
                              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              <Pencil
                                size={14}
                              />
                              Modifier
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}

                {roles.map(
                  (role) => (
                    <div
                      key={role.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <UsersRound
                            size={17}
                          />
                        </span>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-slate-950">
                            {
                              role.name
                            }
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {permissionSummary(
                              role.permissions,
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {role.usageCount} utilisateur
                            {role.usageCount !==
                            1
                              ? "s"
                              : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openCustom(
                              role,
                            )
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil
                            size={14}
                          />
                          Modifier
                        </button>
                      </div>
                    </div>
                  ),
                )}

                {roles.length ===
                  0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                    Aucun rôle personnalisé.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editor && (
        <div className="fixed inset-0 z-[440] flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0"
            onClick={() =>
              !saving &&
              setEditor(null)
            }
          />

          <div className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                {editor.type ===
                "new"
                  ? "Créer un rôle"
                  : `Modifier le rôle — ${
                      editor.type ===
                      "system"
                        ? editor.role
                            .name
                        : editor.role
                            .name
                    }`}
              </h2>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setEditor(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              {editor.type !==
                "system" && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Nom du rôle
                  </span>

                  <input
                    autoFocus
                    value={name}
                    disabled={saving}
                    onChange={(
                      event,
                    ) =>
                      setName(
                        event
                          .target
                          .value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </label>
              )}

              <div className={editor.type === "system" ? "" : "mt-5"}>
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Permissions
                </p>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {permissionRows.map(
                    (
                      permission,
                      index,
                    ) => (
                      <label
                        key={
                          permission.key
                        }
                        className={[
                          "flex cursor-pointer items-center justify-between gap-4 bg-white px-4 py-3.5",
                          index > 0
                            ? "border-t border-slate-100"
                            : "",
                        ].join(
                          " ",
                        )}
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {
                            permission.label
                          }
                        </span>

                        <input
                          type="checkbox"
                          checked={
                            permissions[
                              permission.key
                            ]
                          }
                          disabled={saving}
                          onChange={() =>
                            setPermissions(
                              (
                                current,
                              ) => ({
                                ...current,

                                [permission.key]:
                                  !current[
                                    permission.key
                                  ],
                              }),
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                {editor.type ===
                  "custom" && (
                  <button
                    type="button"
                    disabled={
                      saving ||
                      editor.role
                        .usageCount >
                        0
                    }
                    onClick={() =>
                      void removeRole()
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    <Trash2
                      size={15}
                    />
                    Supprimer
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setEditor(null)
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void saveRole()
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {editor.type ===
                  "new" ? (
                    <Plus
                      size={15}
                    />
                  ) : (
                    <Check
                      size={15}
                    />
                  )}

                  {saving
                    ? "Enregistrement…"
                    : editor.type ===
                        "new"
                      ? "Créer"
                      : "Enregistrer"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
