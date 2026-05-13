import { LogoutButton } from "@/components/admin/LogoutButton";

type AdminHeaderProps = {
  title: string;
  description?: string;
  email?: string;
};

export function AdminHeader({ title, description, email }: AdminHeaderProps) {
  return (
    <header className="mb-7 rounded-[2rem] border border-[#e6e1d6] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#687a5e]">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#1f1f1a] sm:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d6b63]">
              {description}
            </p>
          )}

          {email && (
            <p className="mt-3 text-sm font-semibold text-[#6d6b63]">
              Connecté avec : <span className="text-[#1f1f1a]">{email}</span>
            </p>
          )}
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
