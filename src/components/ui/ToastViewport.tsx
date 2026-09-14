"use client";

import {
  CheckCircle2,
  CircleAlert,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import type {
  ToastDetail,
  ToastTone,
} from "@/lib/toast";

type ToastItem = ToastDetail & {
  id: number;
};

function appearance(tone: ToastTone) {
  if (tone === "error") {
    return {
      icon: CircleAlert,
      className:
        "border-red-200 bg-red-50 text-red-900",
    };
  }

  if (tone === "warning") {
    return {
      icon: TriangleAlert,
      className:
        "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  return {
    icon: CheckCircle2,
    className:
      "border-emerald-200 bg-white text-zinc-900",
  };
}

export function ToastViewport() {
  const [
    toast,
    setToast,
  ] =
    useState<ToastItem | null>(
      null,
    );

  useEffect(() => {
    let timeout:
      | ReturnType<typeof setTimeout>
      | undefined;

    function handleToast(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<ToastDetail>;

      const item: ToastItem = {
        id: Date.now(),
        ...customEvent.detail,
      };

      setToast(item);

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(
        () => {
          setToast(null);
        },
        3500,
      );
    }

    window.addEventListener(
      "chorale:toast",
      handleToast,
    );

    return () => {
      window.removeEventListener(
        "chorale:toast",
        handleToast,
      );

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  if (!toast) {
    return null;
  }

  const style =
    appearance(toast.tone);

  const Icon = style.icon;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[300] sm:right-6 sm:top-6">
      <div
        className={[
          "pointer-events-auto flex max-w-[380px] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg",
          style.className,
        ].join(" ")}
      >
        <Icon
          size={18}
          className="mt-0.5 shrink-0"
        />

        <p className="flex-1 text-sm font-medium leading-5">
          {toast.message}
        </p>

        <button
          type="button"
          onClick={() =>
            setToast(null)
          }
          className="shrink-0 opacity-50 transition hover:opacity-100"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
