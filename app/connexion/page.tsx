"use client";

import { useEffect } from "react";
import { AUTH_CLIENT_LOGIN_URL } from "@/lib/config";

/**
 * Aucune connexion locale : on redirige systématiquement vers le portail
 * d'authentification central. Le retour se fait via ?accessToken=<JWT> sur
 * l'URL de l'app, récupéré automatiquement par AuthGate (voir ce composant).
 */
export default function ConnexionPage() {
  useEffect(() => {
    window.location.href = AUTH_CLIENT_LOGIN_URL;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-on-surface-variant">Redirection vers l'authentification…</p>
      </div>
    </div>
  );
}
