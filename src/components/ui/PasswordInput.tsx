"use client";

import { Eye, EyeOff } from "lucide-react";
import {
  useState,
  type InputHTMLAttributes,
} from "react";

type PasswordInputProps =
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({
  className = "",
  style,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] =
    useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={className}
        style={{
          ...style,
          paddingRight: "2.75rem",
        }}
      />

      <button
        type="button"
        onClick={() =>
          setVisible((current) => !current)
        }
        aria-label={
          visible
            ? "Masquer le mot de passe"
            : "Afficher le mot de passe"
        }
        aria-pressed={visible}
        className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-slate-700"
      >
        {visible ? (
          <EyeOff size={17} />
        ) : (
          <Eye size={17} />
        )}
      </button>
    </div>
  );
}
