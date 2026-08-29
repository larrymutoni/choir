import { Clock3 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

type ComingSoonProps = {
  title: string;
  description: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <main>
      <DashboardHeader title={title} description={description} />

      <section className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#d9d4c9] bg-white/45 px-6 py-12">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef1ea] text-[#687a5e]">
            <Clock3 size={20} />
          </div>

          <h2 className="mt-4 text-lg font-black text-[#1f1f1a]">
            Bientôt disponible
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#817e75]">
            Cette fonctionnalité est en cours de préparation.
          </p>
        </div>
      </section>
    </main>
  );
}
