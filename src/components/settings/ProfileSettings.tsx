"use client";

import {
  Camera,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

export type AccountProfile = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  avatarKey: string | null;
  role:
    | "member"
    | "admin"
    | "super_admin";
  status:
    | "pending"
    | "active"
    | "rejected";
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
  avatarKey?: string;
};

function roleLabel(
  role: AccountProfile["role"],
) {
  if (role === "super_admin") {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return "Membre";
}

export function ProfileSettings({
  profile,
}: {
  profile: AccountProfile;
}) {
  const router = useRouter();
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [firstname, setFirstname] =
    useState(profile.firstname);
  const [lastname, setLastname] =
    useState(profile.lastname);
  const [email, setEmail] =
    useState(profile.email);
  const [phone, setPhone] =
    useState(profile.phone ?? "");
  const [avatarKey, setAvatarKey] =
    useState<string | null>(
      profile.avatarKey,
    );
  const [avatarFailed, setAvatarFailed] =
    useState(false);
  const [avatarLoading, setAvatarLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");
  const [avatarError, setAvatarError] =
    useState("");

  const initials =
    `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();

  const avatarUrl = avatarKey
    ? `/api/member/profile/avatar?v=${encodeURIComponent(
        avatarKey,
      )}`
    : null;

  async function saveProfile(
    event: FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/member/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            firstname,
            lastname,
            email:
              email.trim(),
            phone:
              phone.trim() || null,
          }),
        },
      );

      const result =
        (await response
          .json()
          .catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Impossible d’enregistrer le profil.",
        );
      }

      setEmail(
        email.trim().toLowerCase(),
      );
      setMessage("Enregistré.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setAvatarError("");

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setAvatarError(
        "Utilisez une image JPG, PNG ou WebP.",
      );
      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      setAvatarError(
        "La photo ne doit pas dépasser 2 Mo.",
      );
      return;
    }

    setAvatarLoading(true);

    try {
      const body =
        new FormData();
      body.set("file", file);

      const response = await fetch(
        "/api/member/profile/avatar",
        {
          method: "POST",
          body,
        },
      );

      const result =
        (await response
          .json()
          .catch(() => ({}))) as ApiResponse;

      if (
        !response.ok ||
        !result.avatarKey
      ) {
        throw new Error(
          result.message ??
            "Impossible d’enregistrer la photo.",
        );
      }

      setAvatarKey(
        result.avatarKey,
      );
      setAvatarFailed(false);
      router.refresh();
    } catch (reason) {
      setAvatarError(
        reason instanceof Error
          ? reason.message
          : "Une erreur est survenue.",
      );
    } finally {
      setAvatarLoading(false);
    }
  }

  async function removeAvatar() {
    if (
      !window.confirm(
        "Supprimer votre photo de profil ?",
      )
    ) {
      return;
    }

    setAvatarLoading(true);
    setAvatarError("");

    try {
      const response = await fetch(
        "/api/member/profile/avatar",
        {
          method: "DELETE",
        },
      );

      const result =
        (await response
          .json()
          .catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Impossible de supprimer la photo.",
        );
      }

      setAvatarKey(null);
      setAvatarFailed(false);
      router.refresh();
    } catch (reason) {
      setAvatarError(
        reason instanceof Error
          ? reason.message
          : "Une erreur est survenue.",
      );
    } finally {
      setAvatarLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xl font-semibold text-slate-600">
              {avatarUrl &&
              !avatarFailed ? (
                <img
                  src={avatarUrl}
                  alt={`${firstname} ${lastname}`}
                  onError={() =>
                    setAvatarFailed(true)
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || (
                  <UserRound size={30} />
                )
              )}
            </div>

            <button
              type="button"
              disabled={avatarLoading}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              aria-label="Changer la photo"
            >
              {avatarLoading ? (
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Camera size={15} />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadAvatar}
              className="hidden"
            />
          </div>

          <h2 className="mt-4 text-base font-semibold text-slate-950">
            {firstname} {lastname}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {roleLabel(profile.role)}
          </p>

          {avatarKey && (
            <button
              type="button"
              disabled={avatarLoading}
              onClick={() =>
                void removeAvatar()
              }
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
            >
              <Trash2 size={13} />
              Supprimer la photo
            </button>
          )}

          {avatarError && (
            <p className="mt-3 text-xs text-red-600">
              {avatarError}
            </p>
          )}
        </div>
      </aside>

      <form
        onSubmit={saveProfile}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">
            Informations personnelles
          </h2>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Prénom
            </span>
            <div className="relative">
              <UserRound
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={firstname}
                onChange={(event) =>
                  setFirstname(
                    event.target.value,
                  )
                }
                required
                minLength={2}
                maxLength={80}
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Nom
            </span>
            <div className="relative">
              <UserRound
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={lastname}
                onChange={(event) =>
                  setLastname(
                    event.target.value,
                  )
                }
                required
                minLength={2}
                maxLength={80}
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Téléphone
            </span>
            <div className="relative">
              <Phone
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value,
                  )
                }
                maxLength={30}
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email
            </span>
            <div className="relative">
              <Mail
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                required
                maxLength={254}
                autoComplete="email"
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
          <div>
            {message && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 size={15} />
                {message}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving && (
              <LoaderCircle
                size={15}
                className="animate-spin"
              />
            )}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
