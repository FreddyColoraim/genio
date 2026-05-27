"use client";

import { useCallback, useEffect } from "react";
import { driver } from "driver.js";

// ── Clé localStorage ────────────────────────────────────────────────────────
export const TOUR_KEY = "nexo_tour_v1_done";

// ── Événement global pour relancer depuis n'importe où ──────────────────────
export const TOUR_EVENT = "nexo:start-tour";

// ── Étapes de la visite ─────────────────────────────────────────────────────
const STEPS = [
  // 1 — Bienvenue (pas d'élément → centré)
  {
    popover: {
      title:       "Bienvenue sur Nexo RH 👋",
      description: "Cette visite guidée vous présente les fonctionnalités clés en moins de 2 minutes. Cliquez sur <strong>Suivant</strong> pour commencer.",
    },
  },
  // 2 — Tableau de bord
  {
    element: "#tour-dashboard",
    popover: {
      title:       "Tableau de bord",
      description: "Vue d'ensemble de votre activité RH : KPIs temps réel, alertes et événements à venir.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  // 3 — Collaborateurs
  {
    element: "#tour-employees",
    popover: {
      title:       "Collaborateurs",
      description: "Toutes vos fiches collaborateurs avec 6 onglets : informations, contrat, documents, onboarding, historique et notes.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  // 4 — Mon équipe
  {
    element: "#tour-team",
    popover: {
      title:       "Mon équipe",
      description: "Nouvelles arrivées, vue d'ensemble de l'équipe et événements RH importants à venir.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  // 5 — Brief RH
  {
    element: "#tour-briefs",
    popover: {
      title:       "Brief RH",
      description: "Rédigez vos fiches de poste, générez l'offre automatiquement et créez un <strong>QR Code Salon</strong> pour vos forums d'emploi.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  // 6 — Pipeline
  {
    element: "#tour-pipeline",
    popover: {
      title:       "Pipeline candidats",
      description: "Suivez chaque candidat de la réception à l'intégration : Nouveau → Contacté → Entretien → Retenu.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  // 7 — Documents
  {
    element: "#tour-documents",
    popover: {
      title:       "Documents RH",
      description: "26 modèles pré-remplis prêts à l'emploi : contrats, avenants, DPAE, attestations, règlement intérieur…",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  // 8 — Analytiques
  {
    element: "#tour-analytics",
    popover: {
      title:       "Analytiques",
      description: "Tableaux de bord RH avancés : turnover, délais d'intégration, sources de recrutement.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  // 9 — Paramètres
  {
    element: "#tour-settings",
    popover: {
      title:       "Paramètres & abonnement",
      description: "Invitez vos membres, définissez les rôles et gérez votre abonnement depuis la page Facturation.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  // 10 — Pulse RH (widget bas de sidebar)
  {
    element: "#tour-pulse",
    popover: {
      title:       "Pulse RH ✨",
      description: "Votre assistant RH vous alerte chaque semaine sur les points d'attention : fins d'essai, documents à renouveler, anniversaires.",
      side:        "top" as const,
      align:       "center" as const,
    },
  },
  // 11 — Fin
  {
    popover: {
      title:       "Vous êtes prêt ! 🎉",
      description: "Commencez par <strong>ajouter vos premiers collaborateurs</strong> ou <strong>créer un brief de recrutement</strong>. Vous pouvez relancer cette visite à tout moment depuis votre menu utilisateur.",
    },
  },
];

// ── Composant principal ──────────────────────────────────────────────────────

type Props = {
  /** Lance automatiquement au premier visit (si pas encore vu) */
  autoStart?: boolean;
};

export function AppTour({ autoStart = false }: Props) {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress:   true,
      progressText:   "{{current}} / {{total}}",
      nextBtnText:    "Suivant →",
      prevBtnText:    "← Précédent",
      doneBtnText:    "Terminer ✓",
      allowClose:     true,
      overlayOpacity: 0.6,
      smoothScroll:   true,
      animate:        true,
      steps:          STEPS,
      onDestroyed: () => {
        localStorage.setItem(TOUR_KEY, "1");
      },
    });
    driverObj.drive();
  }, []);

  // Auto-démarrage au premier chargement
  useEffect(() => {
    if (!autoStart) return;
    if (localStorage.getItem(TOUR_KEY)) return;

    const timer = setTimeout(startTour, 900);
    return () => clearTimeout(timer);
  }, [autoStart, startTour]);

  // Écoute l'événement global (relance depuis UserMenu, Settings…)
  useEffect(() => {
    const handler = () => startTour();
    window.addEventListener(TOUR_EVENT, handler);
    return () => window.removeEventListener(TOUR_EVENT, handler);
  }, [startTour]);

  return null;
}
