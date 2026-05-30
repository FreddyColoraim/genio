export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { UserMenu } from "@/components/dashboard/user-menu";
import { AppTour } from "@/components/onboarding/app-tour";
import { getNotifications } from "@/services/notification-service";
import { getUrgentActions } from "@/services/dashboard-service";

async function getLayoutData() {
  try {
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return null;

    const admin = createAdminClient();

    // Membership + tenant en une seule requête
    const { data: membership } = await admin
      .from("memberships")
      .select("tenant_id, role, tenants(name)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    // Aucun membership → compte incomplet, renvoie vers l'onboarding
    if (!membership) return "no_tenant";

    // Profil utilisateur
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const tenants    = membership?.tenants as unknown as { name: string } | null;
    const tenantName = tenants?.name ?? "Mon workspace";
    const fullName   = profile?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur";
    const email      = user.email ?? "";
    const role       = (membership?.role as string) ?? "member";

    // Initiales : max 2 chars
    const initials = fullName
      .split(" ")
      .map((w: string) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return { tenantName, fullName, email, role, initials };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, notifications, urgentActions] = await Promise.all([
    getLayoutData(),
    getNotifications().catch(() => []),
    getUrgentActions().catch(() => []),
  ]);

  // Non authentifié → login
  if (data === null) {
    redirect("/login" as never);
  }

  // Compte sans tenant → retour onboarding pour reprovisioning
  if (data === "no_tenant") {
    redirect("/onboarding?repair=1" as never);
  }

  const tenantName = data?.tenantName ?? "Mon workspace";
  const userProps = {
    name:     data?.fullName    ?? "Utilisateur",
    email:    data?.email       ?? "",
    initials: data?.initials    ?? "U",
    role:     data?.role        ?? "member",
  };

  return (
    <main className="min-h-screen bg-warm text-navy">
      <AppTour autoStart />
      <div className="flex min-h-screen">
        <AppSidebar tenantName={tenantName} urgentCount={urgentActions.length} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-warm/85 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Opérations RH
                </p>
                <h1 className="text-xl font-semibold">{tenantName}</h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationCenter notifications={notifications} count={notifications.length} />
                <UserMenu {...userProps} />
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
