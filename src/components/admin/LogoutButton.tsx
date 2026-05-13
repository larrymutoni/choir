"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full bg-[#687a5e] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#56664d]"
    >
      Se déconnecter
    </button>
  );
}
