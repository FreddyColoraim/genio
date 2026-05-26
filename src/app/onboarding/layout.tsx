import type { Metadata } from "next";
import { NexoLogo } from "@/components/nexo-logo";

export const metadata: Metadata = {
  title: "Configuration | GeniO",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-warm">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        <div className="mb-10">
          <NexoLogo />
        </div>
        {children}
      </div>
    </main>
  );
}
