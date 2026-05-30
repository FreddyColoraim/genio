export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BookOpen, CheckCircle2, Circle, Clock, ClipboardList,
  Mail, MapPin, Phone, Shield, Tag, UserCheck, Wrench,
} from "lucide-react";
import { getTrainerPortalData } from "@/services/trainer-service";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await getTrainerPortalData(token);
  return {
    title: data ? `Portail ${data.trainer.name} | Nomade RH` : "Formateur",
  };
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  product:    { label: "Produit",       icon: BookOpen,  color: "bg-blue/10 text-blue"         },
  security:   { label: "Sécurité",      icon: Shield,    color: "bg-red-50 text-red-600"       },
  procedure:  { label: "Procédure",     icon: Wrench,    color: "bg-amber-50 text-amber-700"   },
  regulatory: { label: "Réglementaire", icon: Tag,       color: "bg-purple-50 text-purple-700" },
  other:      { label: "Autre",         icon: BookOpen,  color: "bg-slate-100 text-slate-600"  },
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default async function TrainerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getTrainerPortalData(token);
  if (!data) return notFound();

  const { trainer, sessions } = data;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const totalRookies   = sessions.reduce((acc, s) => acc + s.rookies.length, 0);
  const completedCount = sessions.reduce((acc, s) => acc + s.rookies.filter((r) => r.completedAt).length, 0);
  const avgProgress    = totalRookies > 0 ? Math.round((completedCount / totalRookies) * 100) : 0;

  return (
    <div className="min-h-screen bg-warm">
      {/* Top bar */}
      <div className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <MapPin className="size-5 text-blue shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue">Portail Nomade</p>
            <p className="text-sm font-semibold text-navy">Espace formateur</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">

        {/* Profil formateur */}
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
              {getInitials(trainer.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-navy">{trainer.name}</h1>
              {trainer.bio && <p className="mt-0.5 text-sm text-muted-foreground">{trainer.bio}</p>}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {trainer.email && (
                  <span className="flex items-center gap-1"><Mail className="size-3" />{trainer.email}</span>
                )}
                {trainer.phone && (
                  <span className="flex items-center gap-1"><Phone className="size-3" />{trainer.phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Compétences + spécialités */}
          {(trainer.competences.length > 0 || trainer.specialties.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {trainer.competences.map((c) => (
                <span key={c} className="rounded-full bg-blue/8 px-2.5 py-1 text-xs font-medium text-blue">{c}</span>
              ))}
              {trainer.specialties.map((s) => (
                <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">{s}</span>
              ))}
            </div>
          )}

          {/* Stats globales */}
          {totalRookies > 0 && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              {[
                { label: "Sessions",  value: sessions.length },
                { label: "Rookies",   value: totalRookies     },
                { label: "Complétés", value: completedCount   },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold text-navy">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          {totalRookies > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progression globale</span>
                <span className="font-medium text-navy">{avgProgress}%</span>
              </div>
              <Progress value={avgProgress} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Sessions */}
        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center">
            <BookOpen className="mx-auto size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune session assignée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <BookOpen className="size-4 text-muted-foreground" />
              Mes sessions de formation
            </h2>

            {sessions.map((session) => {
              const meta = TYPE_META[session.type] ?? TYPE_META.other!;
              const Icon = meta.icon;
              const done = session.rookies.filter((r) => r.completedAt).length;

              return (
                <div key={session.id} className="rounded-xl border bg-white overflow-hidden">
                  {/* Session header */}
                  <div className="flex items-start gap-3 p-4">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.color)}>
                      <Icon className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-navy">{session.title}</p>
                        {session.isLead && (
                          <span className="rounded-full bg-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="size-3" />{session.duration} min</span>
                        <span>{meta.label}</span>
                      </div>
                      {session.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{session.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Rookies */}
                  {session.rookies.length > 0 && (
                    <div className="border-t divide-y">
                      <div className="flex items-center justify-between px-4 py-2 bg-warm/30">
                        <p className="text-xs font-semibold text-navy flex items-center gap-1.5">
                          <UserCheck className="size-3.5" />
                          Rookies assignés ({session.rookies.length})
                        </p>
                        <span className="text-xs text-muted-foreground">{done}/{session.rookies.length} complétés</span>
                      </div>
                      {session.rookies.map((rookie) => (
                        <div key={rookie.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {getInitials(rookie.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-navy">{rookie.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Assigné le {new Date(rookie.assignedAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          {rookie.completedAt ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="size-4" />Terminé
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Circle className="size-4" />En cours
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Questionnaires liés */}
                  {session.quizzes.length > 0 && (
                    <div className="border-t bg-warm/10 px-4 py-3 space-y-2">
                      <p className="text-xs font-semibold text-navy flex items-center gap-1.5">
                        <ClipboardList className="size-3.5" />Questionnaires liés
                      </p>
                      {session.quizzes.map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-medium text-navy">{quiz.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {quiz.responseCount} réponse{quiz.responseCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <a
                            href={`${APP_URL}/quiz/${quiz.accessToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-lg border border-input bg-white px-3 py-1 text-xs font-medium text-navy hover:border-blue/40 hover:bg-blue/5 transition-colors"
                          >
                            Ouvrir le quiz →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-4">
          Propulsé par <span className="font-semibold text-navy">Nexo RH — Nomade</span>
        </p>
      </div>
    </div>
  );
}
