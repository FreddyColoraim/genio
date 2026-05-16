import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { UserMenu } from "@/components/dashboard/user-menu";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-warm text-navy">
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-warm/85 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Opérations RH
                </p>
                <h1 className="text-xl font-semibold">Nexo RH</h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <UserMenu />
              </div>
            </div>
          </header>
          <section className="flex-1 px-4 py-5 pb-24 md:px-6 lg:px-8 lg:pb-5">
            {children}
          </section>
          <MobileNav />
        </div>
      </div>
    </main>
  );
}
