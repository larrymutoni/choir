"use client";

import {
  Laptop,
  LoaderCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  PasswordInput,
} from "@/components/ui/PasswordInput";
import type {
  TrustedDevice,
} from "@/server/auth/security-repository";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  challengeId?: string;
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}

export function SecuritySettings({
  initialEnabled,
  initialDevices,
}: {
  initialEnabled: boolean;
  initialDevices: TrustedDevice[];
}) {
  const router = useRouter();

  const [enabled, setEnabled] =
    useState(initialEnabled);
  const [devices, setDevices] =
    useState(initialDevices);
  const [mode, setMode] =
    useState<
      | "idle"
      | "enable-code"
      | "disable-password"
      | "disable-code"
    >("idle");
  const [challengeId, setChallengeId] =
    useState("");
  const [code, setCode] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [busy, setBusy] =
    useState(false);
  const [notice, setNotice] =
    useState("");
  const [error, setError] =
    useState("");

  function clearFeedback() {
    setNotice("");
    setError("");
  }

  async function startEnable(
    resend = false,
  ) {
    clearFeedback();
    setBusy(true);

    try {
      const response = await fetch(
        "/api/auth/2fa/enable",
        {
          method: "POST",
        },
      );
      const result =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !result.challengeId
      ) {
        setError(
          result.message ??
            "Impossible d’envoyer le code.",
        );
        return;
      }

      setChallengeId(
        result.challengeId,
      );
      setCode("");
      setMode("enable-code");
      if (resend) {
        setNotice("Code renvoyé.");
      }
    } catch {
      setError(
        "Impossible d’envoyer le code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable() {
    if (!/^\d{6}$/.test(code)) {
      setError(
        "Entrez le code à 6 chiffres.",
      );
      return;
    }

    clearFeedback();
    setBusy(true);

    try {
      const response = await fetch(
        "/api/auth/2fa/enable",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            challengeId,
            code,
          }),
        },
      );
      const result =
        (await response.json()) as ApiResponse;

      if (!response.ok) {
        setError(
          result.message ??
            "Code invalide.",
        );
        return;
      }

      setEnabled(true);
      setMode("idle");
      setCode("");
      setChallengeId("");
      router.refresh();
    } catch {
      setError(
        "Impossible d’activer la double authentification.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function continueDisable() {
    if (!password) {
      setError(
        "Entrez votre mot de passe.",
      );
      return;
    }

    clearFeedback();
    setBusy(true);

    try {
      const response = await fetch(
        "/api/auth/2fa/disable",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        },
      );
      const result =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !result.challengeId
      ) {
        setError(
          result.message ??
            "Impossible de continuer.",
        );
        return;
      }

      setChallengeId(
        result.challengeId,
      );
      setCode("");
      setMode("disable-code");
    } catch {
      setError(
        "Impossible de continuer.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendDisableCode() {
    clearFeedback();
    setBusy(true);

    try {
      const response = await fetch(
        "/api/auth/2fa/disable",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        },
      );
      const result =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !result.challengeId
      ) {
        setError(
          result.message ??
            "Impossible de renvoyer le code.",
        );
        return;
      }

      setChallengeId(
        result.challengeId,
      );
      setCode("");
      setNotice("Code renvoyé.");
    } catch {
      setError(
        "Impossible de renvoyer le code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    if (!/^\d{6}$/.test(code)) {
      setError(
        "Entrez le code à 6 chiffres.",
      );
      return;
    }

    clearFeedback();
    setBusy(true);

    try {
      const response = await fetch(
        "/api/auth/2fa/disable",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            challengeId,
            code,
          }),
        },
      );
      const result =
        (await response.json()) as ApiResponse;

      if (!response.ok) {
        setError(
          result.message ??
            "Code invalide.",
        );
        return;
      }

      setEnabled(false);
      setDevices([]);
      setMode("idle");
      setCode("");
      setPassword("");
      setChallengeId("");
      router.refresh();
    } catch {
      setError(
        "Impossible de désactiver la double authentification.",
      );
    } finally {
      setBusy(false);
    }
  }

  function toggleTwoFactor() {
    if (
      busy ||
      mode !== "idle"
    ) {
      return;
    }

    clearFeedback();

    if (enabled) {
      setMode(
        "disable-password",
      );
      return;
    }

    void startEnable();
  }

  async function revokeDevice(
    id: string,
  ) {
    clearFeedback();

    const response = await fetch(
      "/api/auth/2fa/trusted-devices",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({ id }),
      },
    );
    const result =
      (await response.json()) as ApiResponse;

    if (!response.ok) {
      setError(
        result.message ??
          "Impossible de révoquer l’appareil.",
      );
      return;
    }

    setDevices((current) =>
      current.filter(
        (device) =>
          device.id !== id,
      ),
    );
  }

  function cancel() {
    setMode("idle");
    setCode("");
    setPassword("");
    setChallengeId("");
    clearFeedback();
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-950">
                Double authentification
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  enabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {enabled
                  ? "Activée"
                  : "Désactivée"}
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={
              enabled
                ? "Désactiver la double authentification"
                : "Activer la double authentification"
            }
            disabled={
              busy ||
              mode !== "idle"
            }
            onClick={toggleTwoFactor}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              enabled
                ? "bg-blue-600"
                : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                enabled
                  ? "translate-x-5"
                  : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {mode !== "idle" && (
          <div className="border-t border-slate-100 px-5 py-5">
            {mode === "enable-code" && (
              <div className="max-w-sm space-y-3">
                <p className="text-sm text-slate-600">
                  Entrez le code envoyé par email.
                </p>

                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    )
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-center text-lg font-semibold tracking-[0.3em] outline-none focus:border-blue-500"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void confirmEnable()
                    }
                    className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {busy ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      "Activer"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void startEnable(true)
                    }
                    className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Renvoyer
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={cancel}
                    className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {mode ===
              "disable-password" && (
              <div className="max-w-sm space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Mot de passe
                  </span>
                  <PasswordInput
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    autoFocus
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void continueDisable()
                    }
                    className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Continuer
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={cancel}
                    className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {mode === "disable-code" && (
              <div className="max-w-sm space-y-3">
                <p className="text-sm text-slate-600">
                  Entrez le code envoyé par email.
                </p>

                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    )
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-center text-lg font-semibold tracking-[0.3em] outline-none focus:border-blue-500"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void confirmDisable()
                    }
                    className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Désactiver
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void resendDisableCode()
                    }
                    className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Renvoyer
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={cancel}
                    className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {(notice || error) && (
          <div className="border-t border-slate-100 px-5 py-3">
            {notice && (
              <p className="text-sm font-medium text-emerald-700">
                {notice}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
      </section>

      {enabled &&
        devices.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <Laptop
              size={18}
              className="text-slate-400"
            />
            <h2 className="text-sm font-semibold text-slate-950">
              Appareils reconnus
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {devices.map(
              (device) => (
                <div
                  key={device.id}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {
                        device.device_label
                      }
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Jusqu’au {dateLabel(
                        device.expires_at,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void revokeDevice(
                        device.id,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Révoquer cet appareil"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
