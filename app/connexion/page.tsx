"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { apiJson } from "@/lib/api";

type Medecin = {
  id: string;
  nom: string;
  prenom: string;
  specialite?: string | null;
};

export default function ConnexionPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [choice, setChoice] = useState<AppRole | null>(null);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [selectedMedecinId, setSelectedMedecinId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (choice !== "MEDECIN" || medecins.length > 0) return;
    setIsLoading(true);
    apiJson<Medecin[]>("/api/medecins")
      .then((data) => setMedecins(data))
      .catch(() => setError("Impossible de charger la liste des médecins."))
      .finally(() => setIsLoading(false));
  }, [choice, medecins.length]);

  const handleMajorLogin = () => {
    login({ role: "MAJOR" });
    router.push("/");
  };

  const handleMedecinLogin = () => {
    const medecin = medecins.find((m) => m.id === selectedMedecinId);
    if (!medecin) {
      setError("Veuillez sélectionner un médecin.");
      return;
    }
    login({
      role: "MEDECIN",
      medecinId: medecin.id,
      medecinName: `${medecin.prenom} ${medecin.nom}`.trim(),
    });
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-on-surface">Unité Endoscopie</h1>
          <p className="text-sm text-on-surface-variant">
            Connexion simulée — sélectionnez votre rôle
          </p>
        </div>

        {!choice && (
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setChoice("MAJOR")}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-outline-variant/20 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-3xl text-primary">badge</span>
              <span className="font-bold text-on-surface">Major</span>
            </button>
            <button
              type="button"
              onClick={() => setChoice("MEDECIN")}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-outline-variant/20 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-3xl text-primary">stethoscope</span>
              <span className="font-bold text-on-surface">Médecin</span>
            </button>
          </div>
        )}

        {choice === "MAJOR" && (
          <div className="space-y-5">
            <p className="text-sm text-on-surface-variant text-center">
              Vous vous connectez en tant que <strong>Major</strong>.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setChoice(null)}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-bold border border-outline-variant/20 text-on-surface hover:bg-surface-container transition-all"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleMajorLogin}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                Entrer
              </button>
            </div>
          </div>
        )}

        {choice === "MEDECIN" && (
          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.1em]">
                Votre nom
              </span>
              <select
                value={selectedMedecinId}
                onChange={(e) => setSelectedMedecinId(e.target.value)}
                className="w-full bg-surface-container-low rounded-xl p-3 text-sm font-medium text-on-surface border-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  {isLoading ? "Chargement..." : "Sélectionnez un médecin"}
                </option>
                {medecins.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.prenom} {m.nom}
                    {m.specialite ? ` — ${m.specialite}` : ""}
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setChoice(null);
                  setError(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-bold border border-outline-variant/20 text-on-surface hover:bg-surface-container transition-all"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleMedecinLogin}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all"
              >
                Entrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
