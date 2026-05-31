"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[PWA] Service Worker enregistré :", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Enregistrement SW échoué :", err);
        });
    }
  }, []);

  return null;
}
