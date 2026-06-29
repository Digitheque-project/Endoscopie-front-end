"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type AppRole = "MAJOR" | "MEDECIN";

interface AuthData {
  role: AppRole | null;
  medecinId: string;
  medecinName: string;
}

interface AuthContextType extends AuthData {
  /** false jusqu'à ce que la lecture initiale du localStorage soit faite (évite un redirect prématuré, voir AuthGate). */
  isLoaded: boolean;
  login: (data: { role: AppRole; medecinId?: string; medecinName?: string }) => void;
  logout: () => void;
}

const EMPTY_AUTH: AuthData = { role: null, medecinId: "", medecinName: "" };
const STORAGE_KEY = "current_auth_context";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AuthData>(EMPTY_AUTH);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  const login: AuthContextType["login"] = ({ role, medecinId, medecinName }) => {
    const updated: AuthData = {
      role,
      medecinId: medecinId ?? "",
      medecinName: medecinName ?? "",
    };
    setData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const logout = () => {
    setData(EMPTY_AUTH);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ ...data, isLoaded, login, logout }}>
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
