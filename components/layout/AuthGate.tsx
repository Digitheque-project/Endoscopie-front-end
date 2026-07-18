"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_PATHS = new Set(["/connexion"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { role, isLoaded, loginWithToken } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // Jeton reçu depuis le portail d'authentification central (redirection SSO,
  // ex. https://auth-client-dun.vercel.app) : on l'échange contre une session
  // locale sans jamais repasser par notre propre formulaire /connexion.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("accessToken");
    if (!token) return;

    setIsProcessingToken(true);
    loginWithToken(token)
      .catch((err) => {
        console.error("Échec de connexion via le jeton SSO:", err);
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
  if (!isLoaded || isProcessingToken || !role) {
    return null;
  }

  return <>{children}</>;
}
