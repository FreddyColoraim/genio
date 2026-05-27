"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Printer, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  briefId: string;
  briefTitle: string;
  onClose: () => void;
};

export function BriefQrModal({ briefId, briefTitle, onClose }: Props) {
  const [copied, setCopied]     = useState(false);
  const overlayRef              = useRef<HTMLDivElement>(null);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/candidater/${briefId}`;
  const qrSrc     = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicUrl)}&size=280x280&margin=12&color=1e1b4b&bgcolor=ffffff`;

  // Fermer sur Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  function downloadQr() {
    const link = document.createElement("a");
    link.href     = qrSrc;
    link.download = `qr-${briefId}.png`;
    link.click();
  }

  function printQr() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code — ${briefTitle}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; gap: 16px; }
            img  { width: 280px; height: 280px; }
            h1   { font-size: 18px; font-weight: 700; color: #1e1b4b; text-align: center; }
            p    { font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${briefTitle}</h1>
          <img src="${qrSrc}" alt="QR Code" />
          <p>Scannez ce QR code pour postuler</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <QrCode className="size-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">QR Code Salon</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="px-5 py-6 space-y-5">
          <div>
            <p className="text-xs text-slate-500">Poste</p>
            <p className="mt-0.5 font-semibold text-slate-900 leading-snug">
              {briefTitle}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border-2 border-indigo-100 bg-white p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`QR Code — ${briefTitle}`}
                className="size-[200px] rounded-lg"
                src={qrSrc}
              />
            </div>
            <p className="text-center text-xs text-slate-400">
              Affichez ce QR code dans votre stand salon<br />
              — les candidats postulent en 30 secondes
            </p>
          </div>

          {/* Lien copier */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="flex-1 truncate text-xs text-slate-600 font-mono">
              {publicUrl}
            </p>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              title="Copier le lien"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              variant="outline"
              onClick={printQr}
            >
              <Printer className="size-3.5" />
              Imprimer
            </Button>
            <Button
              className="flex-1"
              size="sm"
              variant="outline"
              onClick={downloadQr}
            >
              <Download className="size-3.5" />
              Télécharger
            </Button>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Les candidatures apparaissent directement dans le pipeline Nexo RH
            avec la source <span className="font-medium">Événement</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
