"use client";

import { CheckCircle2, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [name, setName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSending(true);
    setSuccess("");
    setError("");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email: senderEmail,
        phone,
        subject,
        message,
      }),
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    setIsSending(false);

    if (!response.ok) {
      setError(result.message ?? "Le message n’a pas pu être envoyé.");
      return;
    }

    setName("");
    setSenderEmail("");
    setPhone("");
    setSubject("");
    setMessage("");
    setSuccess("Message envoyé.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-[#e6e1d6] bg-white p-6 shadow-sm sm:p-7"
    >
      <h2 className="editorial-title text-3xl text-[#1f1f1a]">
        Envoyer un message
      </h2>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">Nom</label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">Email</label>
          <input
            required
            type="email"
            value={senderEmail}
            onChange={(event) => setSenderEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">
            Téléphone
          </label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">Sujet</label>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm text-[#1f1f1a] outline-none focus:border-[#687a5e]"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#1f1f1a]">
            Message
          </label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="mt-2 w-full resize-none rounded-2xl border border-[#e6e1d6] bg-[#f7f5ef] px-4 py-3 text-sm leading-7 text-[#1f1f1a] outline-none focus:border-[#687a5e]"
          />
        </div>
      </div>

      {success && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </p>
      )}

      {error && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <XCircle size={18} />
          {error}
        </p>
      )}

      <div className="mt-6">
        <Button type="submit" disabled={isSending}>
          <Send size={17} />
          {isSending ? "Envoi..." : "Envoyer"}
        </Button>
      </div>
    </form>
  );
}
