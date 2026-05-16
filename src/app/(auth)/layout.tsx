import { NexoLogo } from "@/components/nexo-logo";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-warm">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
        <section className="hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <NexoLogo variant="light" />
          <div className="max-w-xl space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-lavender">
              Nexo RH
            </p>
            <h1 className="text-5xl font-semibold leading-tight tracking-normal">
              Accueillez chaque collaborateur avec clarté, attention et élan.
            </h1>
            <p className="text-lg leading-8 text-white/70">
              Créez des parcours adaptés aux rôles, collectez les documents et
              accompagnez chaque arrivée depuis un espace RH apaisant.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm text-white/70">
            <div className="rounded-lg bg-white/10 p-4">Parcours rôles</div>
            <div className="rounded-lg bg-white/10 p-4">Docs intelligents</div>
            <div className="rounded-lg bg-white/10 p-4">Alertes équipe</div>
          </div>
        </section>
        <section className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
