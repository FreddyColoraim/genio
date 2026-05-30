"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RepairTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/repair/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantName: name.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Erreur lors de la création du workspace.");
        return;
      }

      // Rechargement complet pour rafraîchir la session et le layout
      window.location.href = "/onboarding";
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-white p-8 shadow-soft">
        {/* Icône avertissement */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
          <AlertTriangle className="size-6 text-orange-500" />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-navy">Finaliser la création du compte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre compte a été créé mais le workspace n'a pas pu être initialisé.
            Donnez-lui un nom pour continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Nom du workspace</Label>
            <Input
              id="workspace-name"
              placeholder="Acme People"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? (
              <><Loader2 className="mr-2 size-4 animate-spin" />Création…</>
            ) : (
              <><ArrowRight className="mr-2 size-4" />Créer mon workspace</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
