"use client";

import Image from "next/image";
import Link from "next/link";
import {
  XCircle,
} from "lucide-react";
import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  Button,
} from "@/components/ui/Button";
import {
  PasswordInput,
} from "@/components/ui/PasswordInput";

type UserRole =
  | "member"
  | "admin"
  | "super_admin";

type LoginResponse = {
  ok?: boolean;
  message?: string;
  requiresTwoFactor?: boolean;
  challengeId?: string;
  user?: {
    role: UserRole;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [challengeId, setChallengeId] =
    useState("");
  const [code, setCode] =
    useState("");
  const [rememberDevice, setRememberDevice] =
    useState(true);
  const [isLoading, setIsLoading] =
    useState(false);
  const [notice, setNotice] =
    useState("");
  const [error, setError] =
    useState("");

  const waitingForTwoFactor =
    Boolean(challengeId);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setIsLoading(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const result =
        (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(
          result.message ??
            "Email ou mot de passe incorrect.",
        );
        return;
      }

      if (result.requiresTwoFactor) {
        if (!result.challengeId) {
          setError(
            "Impossible de préparer la vérification.",
          );
          return;
        }

        setChallengeId(
          result.challengeId,
        );
        setCode("");
        return;
      }

      if (!result.user) {
        setError(
          "Impossible de charger votre compte.",
        );
        return;
      }

      router.replace("/membre");
      router.refresh();
    } catch {
      setError(
        "Connexion impossible.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyTwoFactor(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError(
        "Entrez le code à 6 chiffres.",
      );
      return;
    }

    setIsLoading(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        "/api/auth/2fa/login/verify",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            challengeId,
            code,
            rememberDevice,
          }),
        },
      );

      const result =
        (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(
          result.message ??
            "Code invalide.",
        );
        return;
      }

      router.replace("/membre");
      router.refresh();
    } catch {
      setError(
        "Impossible de vérifier le code.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function resendCode() {
    setIsLoading(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        "/api/auth/2fa/login/resend",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            challengeId,
          }),
        },
      );

      const result =
        (await response.json()) as LoginResponse;

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
      setIsLoading(false);
    }
  }

  function restartLogin() {
    setChallengeId("");
    setCode("");
    setNotice("");
    setError("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5 py-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex justify-center sm:mb-7">
          <Link
            href="/"
            aria-label="Retour à l'accueil"
          >
            <Image
              src="/images/logo-chorale.png"
              alt="Chorale Rayon de Soleil Lyon 6"
              width={145}
              height={58}
              style={{ height: "auto" }}
              className="w-[145px] object-contain"
              priority
            />
          </Link>
        </div>

        <div className="rounded-[2rem] border border-[#e6e1d6] bg-white p-6 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#687a5e]">
            Accès membres
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#1f1f1a]">
            {waitingForTwoFactor
              ? "Code de sécurité"
              : "Connexion"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6d6b63]">
            {waitingForTwoFactor
              ? "Entrez le code envoyé par email."
              : "Connectez-vous à votre espace de la Chorale Rayon de Soleil."}
          </p>

          {!waitingForTwoFactor ? (
            <form
              onSubmit={handleSubmit}
              className="mt-7 grid gap-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-[#1f1f1a]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none transition focus:border-[#687a5e]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-[#1f1f1a]"
                  >
                    Mot de passe
                  </label>

                  <Link
                    href="/mot-de-passe-oublie"
                    className="text-xs font-semibold text-[#687a5e] hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none transition focus:border-[#687a5e]"
                />
              </div>

              {error && (
                <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <XCircle size={17} />
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading
                  ? "Connexion..."
                  : "Se connecter"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={verifyTwoFactor}
              className="mt-6 grid gap-4"
            >
              <div>
                <label
                  htmlFor="two-factor-code"
                  className="text-sm font-semibold text-[#1f1f1a]"
                >
                  Code
                </label>

                <input
                  id="two-factor-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-center text-xl font-black tracking-[0.35em] text-[#1f1f1a] outline-none transition focus:border-[#687a5e]"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#1f1f1a]">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(event) =>
                    setRememberDevice(
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4"
                />
                Se souvenir de cet appareil
              </label>

              {notice && (
                <p className="text-xs font-semibold text-emerald-700">
                  {notice}
                </p>
              )}

              {error && (
                <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <XCircle size={17} />
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading
                  ? "Vérification..."
                  : "Vérifier"}
              </Button>

              <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void resendCode()
                  }
                  className="text-[#687a5e] hover:underline disabled:opacity-50"
                >
                  Renvoyer le code
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={restartLogin}
                  className="text-[#6d6b63] hover:underline disabled:opacity-50"
                >
                  Changer de compte
                </button>
              </div>
            </form>
          )}

          {!waitingForTwoFactor && (
            <div className="mt-6 border-t border-[#e6e1d6] pt-5">
              <p className="text-center text-sm text-[#6d6b63]">
                Vous n’avez pas encore de compte ?{" "}
                <Link
                  href="/inscription"
                  className="font-bold text-[#687a5e] hover:underline"
                >
                  S’inscrire
                </Link>
              </p>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-xs font-semibold text-[#6d6b63] hover:underline"
                >
                  Retour au site
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
