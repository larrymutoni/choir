"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, Phone, Save, UserRound } from "lucide-react";

type Profile = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
};

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [firstname, setFirstname] = useState(profile.firstname);
  const [lastname, setLastname] = useState(profile.lastname);
  const [phone, setPhone] = useState(profile.phone ?? "");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasChanges =
    firstname.trim() !== profile.firstname ||
    lastname.trim() !== profile.lastname ||
    phone.trim() !== (profile.phone ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasChanges || loading) {
      return;
    }

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          phone: phone.trim() || null,
        }),
      });

      if (!response.ok) {
        setError("Impossible de modifier le profil.");
        return;
      }

      setFirstname(firstname.trim());
      setLastname(lastname.trim());
      setPhone(phone.trim());

      setMessage("Profil mis à jour.");
      router.refresh();
    } catch {
      setError("Impossible de modifier le profil.");
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "w-full rounded-xl border border-[#ded9ce] bg-white px-4 py-3 text-sm text-[#1f1f1a] outline-none transition placeholder:text-[#aaa69d] focus:border-[#9ba793] focus:ring-4 focus:ring-[#687a5e]/10 disabled:cursor-not-allowed disabled:bg-[#f4f2ed] disabled:text-[#8e8a82]";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-[#e6e1d6] bg-white"
    >
      <div className="border-b border-[#eeeae1] px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef1ea] text-[#687a5e]">
            <UserRound size={19} />
          </div>

          <div>
            <h2 className="text-base font-black text-[#1f1f1a]">
              Informations personnelles
            </h2>

            <p className="mt-0.5 text-sm text-[#817e75]">
              Ces informations sont liées à votre compte.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstname"
              className="mb-2 block text-sm font-bold text-[#4f4d47]"
            >
              Prénom
            </label>

            <input
              id="firstname"
              name="firstname"
              autoComplete="given-name"
              required
              minLength={2}
              maxLength={80}
              value={firstname}
              onChange={(event) => {
                setFirstname(event.target.value);
                setMessage("");
                setError("");
              }}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="lastname"
              className="mb-2 block text-sm font-bold text-[#4f4d47]"
            >
              Nom
            </label>

            <input
              id="lastname"
              name="lastname"
              autoComplete="family-name"
              required
              minLength={2}
              maxLength={80}
              value={lastname}
              onChange={(event) => {
                setLastname(event.target.value);
                setMessage("");
                setError("");
              }}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-[#4f4d47]"
            >
              Email
            </label>

            <div className="relative">
              <Mail
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98958d]"
              />

              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className={`${inputClassName} pl-11`}
              />
            </div>

            <p className="mt-1.5 text-xs text-[#98958d]">
              L’adresse email ne peut pas être modifiée ici.
            </p>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-bold text-[#4f4d47]"
            >
              Téléphone
              <span className="ml-1 font-normal text-[#98958d]">
                (facultatif)
              </span>
            </label>

            <div className="relative">
              <Phone
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98958d]"
              />

              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="+33 6 00 00 00 00"
                className={`${inputClassName} pl-11`}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 min-h-6" aria-live="polite">
          {error && (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          )}

          {message && (
            <p className="flex items-center gap-2 text-sm font-semibold text-[#687a5e]">
              <CheckCircle2 size={16} />
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end border-t border-[#eeeae1] bg-[#faf9f6] px-5 py-4 sm:px-6">
        <button
          type="submit"
          disabled={loading || !hasChanges}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#687a5e] px-5 text-sm font-bold text-white transition hover:bg-[#56664d] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Save size={16} />

          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
