"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResultatPublic {
  id: string;
  prescriptionId: string;
  serviceId: string;
  reportText?: string;
  doctorName?: string;
  dateCreation: string;
  biopsy?: string;
  complication?: string;
  conclusion?: string;
  followUp?: string;
  mainDiagnosis?: string;
  observations?: string;
  details?: string;
  prescription?: {
    typeExamen: string;
    motif?: string;
    dateDemande: string;
    medecinPrescripteur?: {
      nom: string;
      prenom: string;
    };
  };
}

export default function ResultatPublicPage() {
  const params = useParams();
  const token = params.token as string;
  const [resultat, setResultat] = useState<ResultatPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResultat() {
      try {
        const response = await fetch(
          `/api/resultats/public/${token}`,
          { method: "GET" }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Résultat non trouvé. Le lien de partage est peut-être invalide ou expiré.");
          } else {
            setError("Erreur lors de la récupération du résultat.");
          }
          return;
        }

        const data = await response.json();
        setResultat(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du résultat"
        );
      } finally {
        setLoading(false);
      }
    }

    loadResultat();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du résultat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!resultat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert>
          <AlertDescription>Résultat non trouvé</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header public */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Résultat d'Endoscopie
          </h1>
          <p className="text-gray-600 mt-2">
            Accès public - Document médical
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info box */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-900">
            Ce document est partagé en ligne. Conservez l'URL en sécurité si vous souhaitez y accéder ultérieurement.
          </AlertDescription>
        </Alert>

        {/* Patient & Prescription Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase">
                Type d'examen
              </h3>
              <p className="text-lg text-gray-900 mt-1">
                {resultat.prescription?.typeExamen || "Non spécifié"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase">
                Date de l'examen
              </h3>
              <p className="text-lg text-gray-900 mt-1">
                {formatDate(resultat.dateCreation)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase">
                Médecin
              </h3>
              <p className="text-lg text-gray-900 mt-1">
                {resultat.doctorName || "Non spécifié"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase">
                Prescripteur
              </h3>
              <p className="text-lg text-gray-900 mt-1">
                {resultat.prescription?.medecinPrescripteur
                  ? `Dr. ${resultat.prescription.medecinPrescripteur.prenom} ${resultat.prescription.medecinPrescripteur.nom}`
                  : "Non spécifié"}
              </p>
            </div>
          </div>
        </div>

        {/* Results sections */}
        {resultat.mainDiagnosis && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Diagnostic Principal
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {resultat.mainDiagnosis}
            </p>
          </div>
        )}

        {resultat.reportText && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Compte Rendu
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {resultat.reportText}
            </p>
          </div>
        )}

        {resultat.observations && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Observations
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {resultat.observations}
            </p>
          </div>
        )}

        {resultat.conclusion && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Conclusion
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {resultat.conclusion}
            </p>
          </div>
        )}

        {resultat.biopsy && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Biopsies
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {resultat.biopsy}
            </p>
          </div>
        )}

        {resultat.complication && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Complications
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {resultat.complication}
            </p>
          </div>
        )}

        {resultat.followUp && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Suivi Recommandé
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {resultat.followUp}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-12 pb-8">
          <p>
            Document généré le {formatDate(resultat.dateCreation)}
          </p>
          <p className="mt-2">
            Ce document est confidentiel et réservé au destinataire autorisé.
          </p>
        </div>
      </div>
    </div>
  );
}
