"use client";

import {
  Camera,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import Link from "next/link";

import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

import { useRouter } from "next/navigation";

type Role = "member" | "admin" | "super_admin";

type Profile = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  avatarKey: string | null;
  role: Role;
  status: "pending" | "active" | "rejected";
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
  avatarKey?: string;
};

function roleLabel(role: Role) {
  if (role === "super_admin") {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return "Membre";
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstname, setFirstname] = useState(profile.firstname);

  const [lastname, setLastname] = useState(profile.lastname);

  const [phone, setPhone] = useState(profile.phone ?? "");

  const [profileSaving, setProfileSaving] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState("");

  const [profileError, setProfileError] = useState("");

  const [avatarKey, setAvatarKey] = useState<string | null>(profile.avatarKey);

  const [avatarLoading, setAvatarLoading] = useState(false);

  const [avatarError, setAvatarError] = useState("");

  const [avatarFailed, setAvatarFailed] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordSaving, setPasswordSaving] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const initials = `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();

  const avatarUrl = avatarKey
    ? `/api/member/profile/avatar?v=${encodeURIComponent(avatarKey)}`
    : null;

  async function saveProfile(event: FormEvent) {
    event.preventDefault();

    setProfileSaving(true);

    setProfileSuccess("");

    setProfileError("");

    try {
      const response = await fetch("/api/member/profile", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          firstname,
          lastname,

          phone: phone.trim() || null,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          result.message ?? "Impossible d’enregistrer le profil.",
        );
      }

      setProfileSuccess("Profil enregistré.");

      router.refresh();
    } catch (reason) {
      setProfileError(
        reason instanceof Error ? reason.message : "Une erreur est survenue.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setAvatarError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Utilisez une image JPG, PNG ou WebP.");

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("La photo ne doit pas dépasser 2 Mo.");

      return;
    }

    setAvatarLoading(true);

    try {
      const body = new FormData();

      body.set("file", file);

      const response = await fetch("/api/member/profile/avatar", {
        method: "POST",
        body,
      });

      const result = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok || !result.avatarKey) {
        throw new Error(result.message ?? "Impossible d’enregistrer la photo.");
      }

      setAvatarKey(result.avatarKey);

      setAvatarFailed(false);

      router.refresh();
    } catch (reason) {
      setAvatarError(
        reason instanceof Error ? reason.message : "Une erreur est survenue.",
      );
    } finally {
      setAvatarLoading(false);
    }
  }

  async function removeAvatar() {
    if (!window.confirm("Supprimer votre photo de profil ?")) {
      return;
    }

    setAvatarLoading(true);

    setAvatarError("");

    try {
      const response = await fetch("/api/member/profile/avatar", {
        method: "DELETE",
      });

      const result = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        throw new Error(result.message ?? "Impossible de supprimer la photo.");
      }

      setAvatarKey(null);

      setAvatarFailed(false);

      router.refresh();
    } catch (reason) {
      setAvatarError(
        reason instanceof Error ? reason.message : "Une erreur est survenue.",
      );
    } finally {
      setAvatarLoading(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();

    setPasswordSuccess("");

    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les deux nouveaux mots de passe ne correspondent pas.");

      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch("/api/member/profile/password", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          result.message ?? "Impossible de modifier le mot de passe.",
        );
      }

      setCurrentPassword("");

      setNewPassword("");

      setConfirmPassword("");

      setPasswordSuccess("Mot de passe modifié avec succès.");
    } catch (reason) {
      setPasswordError(
        reason instanceof Error ? reason.message : "Une erreur est survenue.",
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-[#e2ded5] bg-white p-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#e6ece2] text-2xl font-bold text-[#5e7055]">
              {avatarUrl && !avatarFailed ? (
                <img
                  src={avatarUrl}
                  alt={`${firstname} ${lastname}`}
                  onError={() => setAvatarFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || <UserRound size={34} />
              )}
            </div>

            <button
              type="button"
              disabled={avatarLoading}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#687a5e] text-white shadow-sm transition hover:bg-[#596950] disabled:opacity-50"
              aria-label="Changer la photo"
            >
              {avatarLoading ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Camera size={16} />
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

          <h2 className="mt-4 text-lg font-semibold text-[#302f29]">
            {firstname} {lastname}
          </h2>

          <span className="mt-2 rounded-full bg-[#eef2eb] px-3 py-1 text-xs font-bold text-[#5c6d54]">
            {roleLabel(profile.role)}
          </span>

          <p className="mt-4 break-all text-sm text-[#817d74]">
            {profile.email}
          </p>

          {avatarKey && (
            <button
              type="button"
              disabled={avatarLoading}
              onClick={() => void removeAvatar()}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#a45f5f] hover:text-[#884b4b]"
            >
              <Trash2 size={13} />
              Supprimer la photo
            </button>
          )}

          {avatarError && (
            <p className="mt-3 text-xs leading-5 text-red-600">{avatarError}</p>
          )}
        </div>
      </aside>

      <div className="grid gap-5">
        <form
          onSubmit={saveProfile}
          className="rounded-2xl border border-[#e2ded5] bg-white"
        >
          <header className="border-b border-[#ebe7df] px-5 py-4">
            <h2 className="text-base font-bold text-[#302f29]">
              Informations personnelles
            </h2>

            <p className="mt-1 text-xs text-[#918d84]">
              Informations associées à votre compte membre.
            </p>
          </header>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#656159]">
                Prénom
              </span>

              <div className="relative">
                <UserRound
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#99958d]"
                />

                <input
                  value={firstname}
                  onChange={(event) => setFirstname(event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  className="h-10 w-full rounded-lg border border-[#ddd9cf] pl-9 pr-3 text-sm outline-none focus:border-[#aab5a3]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#656159]">
                Nom
              </span>

              <div className="relative">
                <UserRound
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#99958d]"
                />

                <input
                  value={lastname}
                  onChange={(event) => setLastname(event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  className="h-10 w-full rounded-lg border border-[#ddd9cf] pl-9 pr-3 text-sm outline-none focus:border-[#aab5a3]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#656159]">
                Téléphone
              </span>

              <div className="relative">
                <Phone
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#99958d]"
                />

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={30}
                  placeholder="Optionnel"
                  className="h-10 w-full rounded-lg border border-[#ddd9cf] pl-9 pr-3 text-sm outline-none focus:border-[#aab5a3]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#656159]">
                Email
              </span>

              <div className="relative">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa69d]"
                />

                <input
                  value={profile.email}
                  disabled
                  className="h-10 w-full cursor-not-allowed rounded-lg border border-[#e4e0d7] bg-[#f7f5f0] pl-9 pr-3 text-sm text-[#8a867d]"
                />
              </div>
            </label>
          </div>

          {(profileSuccess || profileError) && (
            <div className="px-5 pb-1">
              {profileSuccess && (
                <p className="flex items-center gap-2 text-sm font-semibold text-[#607157]">
                  <CheckCircle2 size={15} />
                  {profileSuccess}
                </p>
              )}

              {profileError && (
                <p className="text-sm text-red-600">{profileError}</p>
              )}
            </div>
          )}

          <footer className="flex justify-end border-t border-[#ebe7df] px-5 py-4">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#687a5e] px-4 text-sm font-bold text-white transition hover:bg-[#596950] disabled:opacity-50"
            >
              {profileSaving && (
                <LoaderCircle size={15} className="animate-spin" />
              )}
              Enregistrer
            </button>
          </footer>
        </form>

        <form
          onSubmit={changePassword}
          className="rounded-2xl border border-[#e2ded5] bg-white"
        >
          <header className="flex items-start gap-3 border-b border-[#ebe7df] px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2eb] text-[#687a5e]">
              <ShieldCheck size={18} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#302f29]">Sécurité</h2>

              <p className="mt-1 text-xs text-[#918d84]">
                Modifiez le mot de passe de votre compte.
              </p>
            </div>
          </header>

          <div className="grid gap-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#656159]">
                Mot de passe actuel
              </span>

              <div className="relative">
                <KeyRound
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#99958d]"
                />

                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-[#ddd9cf] pl-9 pr-3 text-sm outline-none focus:border-[#aab5a3]"
                />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#656159]">
                  Nouveau mot de passe
                </span>

                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  className="h-10 w-full rounded-lg border border-[#ddd9cf] px-3 text-sm outline-none focus:border-[#aab5a3]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#656159]">
                  Confirmer
                </span>

                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  className="h-10 w-full rounded-lg border border-[#ddd9cf] px-3 text-sm outline-none focus:border-[#aab5a3]"
                />
              </label>
            </div>

            {passwordSuccess && (
              <p className="flex items-center gap-2 text-sm font-semibold text-[#607157]">
                <CheckCircle2 size={15} />
                {passwordSuccess}
              </p>
            )}

            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}

            <div>
              <Link
                href="/mot-de-passe-oublie"
                className="text-xs font-bold text-[#687a5e] hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <footer className="flex justify-end border-t border-[#ebe7df] px-5 py-4">
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d8d4ca] bg-white px-4 text-sm font-bold text-[#4e4b44] transition hover:bg-[#f5f3ee] disabled:opacity-50"
            >
              {passwordSaving && (
                <LoaderCircle size={15} className="animate-spin" />
              )}
              Modifier le mot de passe
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
