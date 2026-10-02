"use client";

import {
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useState,
} from "react";

import {
  PasswordSettings,
} from "@/components/settings/PasswordSettings";
import {
  ProfileSettings,
  type AccountProfile,
} from "@/components/settings/ProfileSettings";
import {
  SecuritySettings,
} from "@/components/settings/SecuritySettings";
import type {
  TrustedDevice,
} from "@/server/auth/security-repository";

type Tab =
  | "profile"
  | "security";

export function AccountSettings({
  profile,
  initialEnabled,
  initialDevices,
}: {
  profile: AccountProfile;
  initialEnabled: boolean;
  initialDevices: TrustedDevice[];
}) {
  const [tab, setTab] =
    useState<Tab>("profile");

  return (
    <div>
      <div className="mb-5 flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() =>
            setTab("profile")
          }
          className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
            tab === "profile"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <UserRound size={16} />
          Profil
        </button>

        <button
          type="button"
          onClick={() =>
            setTab("security")
          }
          className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
            tab === "security"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck size={16} />
          Sécurité
        </button>
      </div>

      {tab === "profile" ? (
        <ProfileSettings
          profile={profile}
        />
      ) : (
        <div className="space-y-5">
          <PasswordSettings />

          <SecuritySettings
            initialEnabled={
              initialEnabled
            }
            initialDevices={
              initialDevices
            }
          />
        </div>
      )}
    </div>
  );
}
