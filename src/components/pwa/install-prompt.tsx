"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Props = {
  appName:  string;
  appColor: string;
};

export function InstallPrompt({ appName, appColor }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [isIOS, setIsIOS]                   = useState(false);
  const [isInstalled, setIsInstalled]       = useState(false);

  useEffect(() => {
    // Déjà installée en mode standalone → ne rien afficher
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // iOS Safari — détection manuelle (pas de beforeinstallprompt)
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Bannière iOS après 3 secondes si jamais vue
    if (ios && !localStorage.getItem("pwa-install-dismissed")) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    // Chrome/Android — événement standard
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("pwa-install-dismissed")) {
        setTimeout(() => setShowBanner(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowBanner(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  }

  if (!showBanner || isInstalled) return null;

  return (
    <div
      className="fixed bottom-24 left-3 right-3 z-[100] mx-auto max-w-[400px] rounded-2xl border border-white/20 p-4 shadow-2xl"
      style={{ background: appColor }}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Download className="size-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Installer {appName}</p>
          {isIOS ? (
            <p className="mt-1 text-xs text-white/70 leading-relaxed">
              Appuyez sur <strong className="text-white">⎙ Partager</strong> puis{" "}
              <strong className="text-white">"Sur l'écran d'accueil"</strong>
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/70">
              Accès rapide depuis votre écran d'accueil, même hors ligne.
            </p>
          )}
        </div>
        <button onClick={handleDismiss} className="shrink-0 text-white/60 hover:text-white p-0.5">
          <X className="size-4" />
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <button
          onClick={handleInstall}
          className="mt-3 w-full rounded-xl bg-white/20 py-2.5 text-sm font-bold text-white hover:bg-white/30 transition-colors"
        >
          Installer l'application
        </button>
      )}
    </div>
  );
}
