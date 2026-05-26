"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, MoreHorizontal, Shield, Trash2, UserPlus } from "lucide-react";
import {
  inviteMemberAction, updateMemberRoleAction, removeMemberAction,
} from "@/app/(dashboard)/settings/actions";
import type { MemberItem } from "@/services/members-service";
import { ROLE_LABELS, EDITABLE_ROLES } from "@/services/members-service";
import type { MemberRole } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Role badge colors
// ---------------------------------------------------------------------------

const roleBadgeVariant: Record<MemberRole, "blue" | "success" | "soft"> = {
  owner:       "blue",
  admin:       "blue",
  rh:          "success",
  manager:     "soft",
  member:      "soft",
  readonly:    "soft",
  field_agent: "soft",
  nurse:       "success",
  vet:         "success",
  craftsman:   "soft",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MembersSettings({ initialMembers }: { initialMembers: MemberItem[] }) {
  const [members, setMembers]     = useState(initialMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError]          = useState<string | null>(null);
  const [success, setSuccess]      = useState<string | null>(null);
  const [openMenu, setOpenMenu]    = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess(null); }
    else         { setSuccess(msg); setError(null); }
    setTimeout(() => { setError(null); setSuccess(null); }, 3500);
  }

  async function handleInvite(formData: FormData) {
    startTransition(async () => {
      const result = await inviteMemberAction(formData);
      if (!result.success) { flash(result.error ?? "Erreur", true); return; }
      flash("Invitation envoyée ✓");
      setShowInvite(false);
    });
  }

  async function handleRoleChange(membershipId: string, role: MemberRole) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("membershipId", membershipId);
      fd.set("role", role);
      const result = await updateMemberRoleAction(fd);
      if (!result.success) { flash(result.error ?? "Erreur", true); return; }
      setMembers((prev) =>
        prev.map((m) => m.membershipId === membershipId ? { ...m, role } : m)
      );
      setOpenMenu(null);
      flash("Rôle mis à jour ✓");
    });
  }

  async function handleRemove(membershipId: string, name: string) {
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("membershipId", membershipId);
      const result = await removeMemberAction(fd);
      if (!result.success) { flash(result.error ?? "Erreur", true); return; }
      setMembers((prev) => prev.filter((m) => m.membershipId !== membershipId));
      flash(`${name} a été retiré ✓`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-navy">{members.length} membre{members.length > 1 ? "s" : ""}</p>
          <p className="text-xs text-muted-foreground">Gérez les accès à votre espace Nexo RH.</p>
        </div>
        <Button onClick={() => setShowInvite((v) => !v)} type="button" variant={showInvite ? "outline" : "default"}>
          <UserPlus className="size-4" />
          Inviter
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <form
          action={handleInvite}
          className="rounded-xl border bg-blue/5 p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-navy">Inviter un collaborateur</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="prenom@entreprise.com"
                className="mt-1 h-9 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Rôle</label>
              <select
                name="role"
                defaultValue="member"
                className="mt-1 h-9 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {EDITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Envoyer
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            L'invité recevra un email pour créer son compte et rejoindre votre workspace.
          </p>
        </form>
      )}

      {/* Feedback */}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
      )}

      {/* Members list */}
      <div className="rounded-xl border bg-white divide-y overflow-hidden">
        {members.map((member) => (
          <div key={member.membershipId} className="flex items-center gap-3 px-4 py-3.5">
            {/* Avatar */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy/10 text-sm font-semibold text-navy uppercase">
              {member.name.slice(0, 2)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>

            {/* Role badge */}
            <Badge variant={roleBadgeVariant[member.role]}>{ROLE_LABELS[member.role]}</Badge>

            {/* Actions (non-owners only) */}
            {!member.isOwner && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu(openMenu === member.membershipId ? null : member.membershipId)}
                  className="flex items-center justify-center rounded-lg border border-transparent p-1.5 text-muted-foreground hover:border-border hover:text-navy transition-colors"
                >
                  <MoreHorizontal className="size-4" />
                </button>

                {openMenu === member.membershipId && (
                  <div className="absolute right-0 top-8 z-10 w-52 rounded-xl border bg-white p-1.5 shadow-lg">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Changer le rôle
                    </p>
                    {EDITABLE_ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(member.membershipId, r)}
                        disabled={isPending}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                          member.role === r
                            ? "bg-blue/10 font-semibold text-blue"
                            : "hover:bg-warm text-navy"
                        )}
                      >
                        <Shield className="size-3.5 shrink-0" />
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                    <div className="my-1.5 border-t" />
                    <button
                      type="button"
                      onClick={() => handleRemove(member.membershipId, member.name)}
                      disabled={isPending}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      Retirer de l'équipe
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
