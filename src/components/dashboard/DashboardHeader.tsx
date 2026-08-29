type DashboardHeaderProps = {
  title: string;
  description?: string;
  email?: string;
  eyebrow?: string;
};

export function DashboardHeader({
  title,
  description,
  email,
  eyebrow,
}: DashboardHeaderProps) {
  return (
    <header className="mb-7">
      {eyebrow && (
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#687a5e]">
          {eyebrow}
        </p>
      )}

      <h1 className="text-3xl font-black tracking-[-0.035em] text-[#1f1f1a] sm:text-4xl">
        {title}
      </h1>

      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736a] sm:text-[15px]">
          {description}
        </p>
      )}

      {email && <p className="mt-2 text-xs text-[#98958d]">{email}</p>}
    </header>
  );
}
