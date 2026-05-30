"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Send, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendBriefToCandidate } from "@/app/(dashboard)/nomade/actions";
import type { NomadeContact } from "@/app/(dashboard)/nomade/actions";

type Props = { contacts: NomadeContact[] };

function StarRating({ score }: { score: number | null }) {
  if (!score) return null;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("size-3", s <= score ? "fill-amber-400 text-amber-400" : "text-slate-200")}
        />
      ))}
    </span>
  );
}

function ContactCard({ contact }: { contact: NomadeContact }) {
  const [sent, setSent] = useState(contact.briefSent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSendBrief() {
    if (!contact.briefId || !contact.email) return;
    setError(null);
    startTransition(async () => {
      const result = await sendBriefToCandidate(contact.entityId, contact.briefId!);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-navy">{contact.name}</p>
          {contact.poste && <p className="text-xs text-muted-foreground">{contact.poste}</p>}
        </div>
        <StarRating score={contact.score} />
      </div>

      <div className="space-y-1">
        {contact.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="size-3 shrink-0" />{contact.email}
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="size-3 shrink-0" />{contact.phone}
          </div>
        )}
        {contact.eventName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />{contact.eventName}
          </div>
        )}
      </div>

      {contact.briefTitle && (
        <Badge variant="soft" className="text-xs">{contact.briefTitle}</Badge>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        {contact.briefId && contact.email && (
          sent ? (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="size-3" />Brief envoyé
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              disabled={pending}
              onClick={handleSendBrief}
            >
              {pending
                ? <Loader2 className="size-3 animate-spin" />
                : <Send className="size-3" />}
              Envoyer l'annonce
            </Button>
          )
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {new Date(contact.capturedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

export function NomadeContactList({ contacts }: Props) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-warm/30 p-8 text-center">
        <MapPin className="mx-auto size-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Aucun contact capturé. Utilisez le formulaire ci-dessus.</p>
      </div>
    );
  }

  // Grouper par événement
  const grouped = contacts.reduce<Record<string, NomadeContact[]>>((acc, c) => {
    const key = c.eventName ?? "Sans événement";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([event, items]) => (
        <div key={event} className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-blue shrink-0" />
            <h3 className="text-sm font-semibold text-navy">{event}</h3>
            <span className="text-xs text-muted-foreground">— {items.length} contact{items.length > 1 ? "s" : ""}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => <ContactCard key={c.id} contact={c} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
