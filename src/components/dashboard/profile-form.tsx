"use client";

import { useState, useTransition, useRef } from "react";
import { Camera, KeyRound, Loader2, Save, User } from "lucide-react";
import {
  updateProfileNameAction, updatePasswordAction, uploadAvatarAction,
} from "@/app/(dashboard)/settings/profile/actions";
import type { UserProfile } from "@/services/profile-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/services/members-service";
import type { MemberRole } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileForm({ profile }: { profile: UserProfile }) {
  return (
    <div className="space-y-6 max-w-xl">
      <AvatarSection profile={profile} />
      <div className="border-t" />
      <NameSection profile={profile} />
      <div className="border-t" />
      <PasswordSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

function AvatarSection({ profile }: { profile: UserProfile }) {
  const [avatarUrl, setAvatarUrl]      = useState(profile.avatarUrl ?? null);
  const [isPending, startTransition]   = useTransition();
  const [error, setError]              = useState<string | null>(null);
  const fileInputRef                   = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("avatar", file);
      const result = await uploadAvatarAction(fd);
      if (!result.success) { setError(result.error); return; }
      if (result.url) setAvatarUrl(result.url);
    });
  }

  const initials = profile.fullName.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-navy">Photo de profil</Label>
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="size-20 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-navy/10 text-2xl font-bold text-navy border-2 border-border">
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-blue text-white hover:bg-blue/90 transition-colors shadow-sm"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-navy">{profile.fullName}</p>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ROLE_LABELS[(profile.role as MemberRole)] ?? profile.role}
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <p className="text-xs text-muted-foreground">PNG, JPEG ou WebP · max 2 Mo</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

function NameSection({ profile }: { profile: UserProfile }) {
  const [name, setName]              = useState(profile.fullName);
  const [saved, setSaved]            = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const fd = new FormData();
      fd.set("fullName", name);
      const result = await updateProfileNameAction(fd);
      if (!result.success) { setError(result.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <User className="size-4 text-muted-foreground" />
        <Label className="text-sm font-semibold text-navy">Informations personnelles</Label>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prénom Nom"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-warm/40 cursor-not-allowed" />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isPending ? "Sauvegarde…" : "Enregistrer"}
          </Button>
          {saved && <span className="text-sm text-green-700">✓ Nom mis à jour</span>}
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

function PasswordSection() {
  const [current, setCurrent]        = useState("");
  const [next, setNext]              = useState("");
  const [confirm, setConfirm]        = useState("");
  const [saved, setSaved]            = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const fd = new FormData();
      fd.set("currentPassword", current);
      fd.set("newPassword", next);
      fd.set("confirmPassword", confirm);
      const result = await updatePasswordAction(fd);
      if (!result.success) { setError(result.error); return; }
      setSaved(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-muted-foreground" />
        <Label className="text-sm font-semibold text-navy">Changer le mot de passe</Label>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Min. 8 caractères"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmer</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending || !current || !next}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {isPending ? "Modification…" : "Changer le mot de passe"}
          </Button>
          {saved && <span className="text-sm text-green-700">✓ Mot de passe mis à jour</span>}
        </div>
      </form>
    </div>
  );
}
