"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { decodeJwt, type AuthServiceClaim } from "@/lib/auth";
import { AUTH_ENDOSCOPIE_SERVICE_ID } from "@/lib/config";
import { apiJson } from "@/lib/api";

export type AppRole = "MAJOR" | "MEDECIN";
export type { AuthServiceClaim };

interface AuthData {
  role: AppRole | null;
  medecinId: string;
  medecinName: string;
  accessToken: string;
  userEmail: string;
  /** Expiration du JWT (timestamp Unix, secondes). */
  exp: number;
  /** Autres services auxquels ce compte a accès (hors Endoscopie) — pour le changement rapide de service. */
  otherServices: AuthServiceClaim[];
}

interface AuthContextType extends AuthData {
  /** false jusqu'à ce que la lecture initiale du localStorage soit faite (évite un redirect prématuré, voir AuthGate). */
  isLoaded: boolean;
  /** Établit la session à partir d'un JWT déjà émis par le portail d'authentification central (voir AuthGate). */
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const EMPTY_AUTH: AuthData = { role: null, medecinId: "", medecinName: "", accessToken: "", userEmail: "", exp: 0, otherServices: [] };
const STORAGE_KEY = "current_auth_context";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isExpired(auth: AuthData): boolean {
  return !auth.exp || Date.now() >= auth.exp * 1000;
}

/**
 * Retrouve le médecin local (base clinique) correspondant à l'utilisateur authentifié,
 * pour préserver le rattachement des dossiers/comptes-rendus existants. Le token n'est
 * pas encore dans localStorage à ce stade (on est encore en train de construire la
 * session) : on le transmet explicitement pour que le backend utilise l'identité de
 * l'utilisateur plutôt que de retomber sur le compte de service.
 */
async function resolveMedecinId(nom: string, prenom: string, fallbackId: string, token: string): Promise<{ id: string; name: string }> {
  try {
    const medecins = await apiJson<Array<{ id: string; nom: string; prenom: string }>>(
      "/api/medecins",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const match = medecins.find(
      (m) => m.nom.trim().toLowerCase() === nom.trim().toLowerCase() && m.prenom.trim().toLowerCase() === prenom.trim().toLowerCase(),
    );
    if (match) return { id: match.id, name: `${match.prenom} ${match.nom}`.trim() };
  } catch {
    // API indisponible : on retombe sur l'identité fournie par le JWT.
  }
  return { id: fallbackId, name: `${prenom} ${nom}`.trim() };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AuthData>(EMPTY_AUTH);
  const [isLoaded, setIsLoaded] = useState(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = () => {
    setData(EMPTY_AUTH);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuthData;
        if (!isExpired(parsed)) {
          // Fusionne avec les valeurs par défaut : une session enregistrée avant
          // l'ajout d'un nouveau champ (ex. otherServices) ne l'aurait pas encore.
          setData({ ...EMPTY_AUTH, ...parsed });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {}
    }
    setIsLoaded(true);

    // Déconnexion automatique dès expiration du JWT, sans attendre un rechargement de page.
    checkIntervalRef.current = setInterval(() => {
      const current = localStorage.getItem(STORAGE_KEY);
      if (!current) return;
      try {
        const parsed = JSON.parse(current) as AuthData;
        if (isExpired(parsed)) logout();
      } catch {}
    }, 60000);
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  const applyAccessToken = async (token: string) => {
    const payload = decodeJwt(token);
    if (!payload) {
      throw new Error("Jeton de connexion invalide.");
    }

    // Cherché d'abord par nom (stable d'un déploiement à l'autre — l'ID, lui, peut
    // changer selon l'écosystème d'auth utilisé), avec l'ID figé en secours.
    const claim =
      payload.services.find((s) => s.serviceName?.trim().toLowerCase() === "endoscopie") ??
      payload.services.find((s) => s.serviceId === AUTH_ENDOSCOPIE_SERVICE_ID);
    if (!claim) {
      throw new Error("Ce compte n'a pas accès au service Endoscopie.");
    }

    let role: AppRole;
    if (claim.permissions.includes("ENDOSCOPIE_ACCESS_MEDECIN")) {
      role = "MEDECIN";
    } else if (claim.permissions.includes("ENDOSCOPIE_ACCESS_MAJOR")) {
      role = "MAJOR";
    } else {
      throw new Error("Rôle non reconnu pour le service Endoscopie.");
    }

    let medecinId = "";
    let medecinName = `${payload.firstname} ${payload.name}`.trim();
    if (role === "MEDECIN") {
      const resolved = await resolveMedecinId(payload.name, payload.firstname, payload.userId, token);
      medecinId = resolved.id;
      medecinName = resolved.name;
    }

    const otherServices = payload.services.filter((s) => s.serviceId !== claim.serviceId);

    const updated: AuthData = {
      role,
      medecinId,
      medecinName,
      accessToken: token,
      userEmail: payload.email,
      exp: payload.exp,
      otherServices,
    };
    setData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loginWithToken: AuthContextType["loginWithToken"] = async (token) => {
    await applyAccessToken(token);
  };

  return (
    <AuthContext.Provider value={{ ...data, isLoaded, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
