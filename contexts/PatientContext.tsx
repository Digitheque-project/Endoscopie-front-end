"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PatientContextType {
  patientId: string;
  prescriptionId: string;
  patientName: string;
  procedure: string;
  age: string;
  setPatientData: (data: Partial<Omit<PatientContextType, 'setPatientData' | 'clearPatientData'>>) => void;
  clearPatientData: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState({
    patientId: "",
    prescriptionId: "",
    patientName: "",
    procedure: "",
    age: "54",
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("current_patient_context");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const setPatientData = (newData: Partial<Omit<PatientContextType, 'setPatientData' | 'clearPatientData'>>) => {
    setData((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem("current_patient_context", JSON.stringify(updated));
      return updated;
    });
  };

  const clearPatientData = () => {
    const empty = { patientId: "", prescriptionId: "", patientName: "", procedure: "", age: "" };
    setData(empty);
    localStorage.removeItem("current_patient_context");
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
