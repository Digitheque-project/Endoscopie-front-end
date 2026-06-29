"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_PATHS = new Set(["/connexion"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { role, isLoaded } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || PUBLIC_PATHS.has(pathname)) {
      return;
    }
    if (!role) {
      router.replace("/connexion");
    }
  }, [role, isLoaded, pathname, router]);

  if (PUBLIC_PATHS.has(pathname)) {
    return <>{children}</>;
  }
  if (!isLoaded || !role) {
    return null;
  }

  return <>{children}</>;
}
