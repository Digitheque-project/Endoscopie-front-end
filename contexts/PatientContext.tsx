"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PatientContextType {
  patientId: string;
  prescriptionId: string;
  patientName: string;
  procedure: string;
  prescriber: string;
  priority: string;
  age: string;
  setPatientData: (data: Partial<Omit<PatientContextType, 'setPatientData' | 'clearPatientData'>>) => void;
  clearPatientData: () => void;
}

type PatientData = Omit<PatientContextType, 'setPatientData' | 'clearPatientData'>;

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const STORAGE_KEY = "current_patient_context";

const DEFAULTS: PatientData = {
  patientId: "",
  prescriptionId: "",
  patientName: "",
  procedure: "",
  prescriber: "",
  priority: "",
  age: "54",
};

// Utilisé par clearPatientData : contrairement à DEFAULTS (âge pré-rempli pour un nouveau
// dossier), on veut un état réellement vide après une remise à zéro explicite.
const EMPTY: PatientData = { ...DEFAULTS, age: "" };

function readStorage(): PatientData {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULTS, ...(JSON.parse(saved) as Partial<PatientData>) };
  } catch (e) {}
  return DEFAULTS;
}

export function PatientProvider({ children }: { children: React.ReactNode }) {
  // Toujours démarrer avec DEFAULTS (identique serveur/client) pour éviter un mismatch
  // d'hydratation ; le contenu réel de localStorage est chargé juste après le montage.
  const [data, setData] = useState<PatientData>(DEFAULTS);

  useEffect(() => {
    setData(readStorage());
  }, []);

  const setPatientData = (newData: Partial<Omit<PatientContextType, 'setPatientData' | 'clearPatientData'>>) => {
    setData((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearPatientData = () => {
    setData(EMPTY);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PatientContext.Provider value={{ ...data, setPatientData, clearPatientData }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
}
