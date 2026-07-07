"use client";

import React, { createContext, useContext, useState } from "react";

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

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const STORAGE_KEY = "current_patient_context";

const DEFAULTS = {
  patientId: "",
  prescriptionId: "",
  patientName: "",
  procedure: "",
  prescriber: "",
  priority: "",
  age: "54",
};

function readStorage() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULTS, ...JSON.parse(saved) };
  } catch (e) {}
  return DEFAULTS;
}

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(readStorage);

  const setPatientData = (newData: Partial<Omit<PatientContextType, 'setPatientData' | 'clearPatientData'>>) => {
    setData((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearPatientData = () => {
    setData(DEFAULTS);
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
