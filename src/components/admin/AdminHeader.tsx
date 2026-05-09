import { LogoutButton } from "@/components/admin/LogoutButton";

type AdminHeaderProps = {
  title: string;
  description?: string;
  email?: string;
};

export function AdminHeader({ title, description, email }: AdminHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 rounded-[2rem] bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
          Administration
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#141414] sm:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#675e56]">
            {description}
          </p>
        )}

        {email && (
          <p className="mt-3 text-sm font-semibold text-[#675e56]">
            Connecté avec : <span className="text-[#141414]">{email}</span>
          </p>
        )}
      </div>

      <LogoutButton />
    </header>
  );
}
