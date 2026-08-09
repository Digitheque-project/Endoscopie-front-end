"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_PATHS = new Set(["/connexion"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { role, isLoaded, loginWithToken, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Force logout on app startup - require fresh login every session
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasStartup = sessionStorage.getItem("auth_startup_check");
    if (!hasStartup) {
      logout();
      sessionStorage.setItem("auth_startup_check", "true");
    }
  }, []);

  // Jeton reçu depuis le portail d'authentification central (redirection SSO,
  // ex. https://authentification-front.vercel.app) : on l'échange contre une session
  // locale sans jamais repasser par notre propre formulaire /connexion.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("accessToken");
    if (!token) return;

    setIsProcessingToken(true);
    setLoginError(null);
    loginWithToken(token)
      .catch((err) => {
        console.error("Échec de connexion via le jeton SSO:", err);
        setLoginError(
          err instanceof Error
            ? err.message
            : "Impossible de vous connecter. Contactez l'administrateur si le problème persiste.",
        );
      })
      .finally(() => {
        params.delete("accessToken");
        const query = params.toString();
        router.replace(`${pathname}${query ? `?${query}` : ""}`);
        setIsProcessingToken(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isLoaded || isProcessingToken || PUBLIC_PATHS.has(pathname)) {
      return;
    }
    if (!role) {
      router.replace("/connexion");
    }
  }, [role, isLoaded, isProcessingToken, pathname, router]);

  if (PUBLIC_PATHS.has(pathname)) {
    return <>{children}</>;
  }
  if (!isLoaded || isProcessingToken) {
    return null;
  }
  if (!role) {
    // Redirection en cours vers /connexion (voir l'effet ci-dessus) — un écran vide
    // sans texte laissait croire à une page bloquée/plantée.
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-container-lowest px-4">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-on-surface-variant">Redirection vers la connexion…</p>
          {loginError && (
            <p className="text-sm font-semibold text-error max-w-sm">{loginError}</p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
