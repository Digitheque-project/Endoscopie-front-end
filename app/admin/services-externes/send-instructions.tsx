'use client';

import { useEffect, useState } from 'react';
import { Mail, Download, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceExterne {
  id: string;
  nom: string;
  apiKey?: string;
  actif: boolean;
  hopital?: string;
  contact?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://endoscopie-api.onrender.com';

export default function SendInstructionsPage() {
  const [services, setServices] = useState<ServiceExterne[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceExterne | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/services-externes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
        if (data.length > 0) setSelectedService(data[0]);
      }
    } catch (error) {
      console.error('Erreur', error);
      toast.error('Erreur lors du chargement');
    }
  };

  const generateEmailText = () => {
    if (!selectedService) return '';

    return `Bonjour,

Nous sommes heureux de vous présenter notre nouvelle API sécurisée pour accéder aux résultats d'examens d'endoscopie.

====================================
📋 INFORMATIONS D'ACCÈS API
====================================

Service: ${selectedService.nom}
${selectedService.hopital ? `Établissement: ${selectedService.hopital}` : ''}

🔑 Votre clé API:
${selectedService.apiKey || 'N/A'}

⚠️  IMPORTANT: Gardez cette clé secrète et sécurisée!

====================================
🌐 ENDPOINT API
====================================

Méthode: GET
URL: https://endoscopie-api.onrender.com/api/examens/resultats/:prescriptionId
Header: x-api-key: ${selectedService.apiKey || 'VOTRE_CLE_API'}

Exemple:
curl -X GET \\
  https://endoscopie-api.onrender.com/api/examens/resultats/PRES-2024-0187 \\
  -H "x-api-key: ${selectedService.apiKey || 'VOTRE_CLE_API'}"

====================================
📋 RÉPONSE ATTENDUE
====================================

La réponse contient:
- prescriptionId: Numéro de la prescription
- patient: Informations du patient (nom, prénom, DOB)
- typeExamen: Type d'examen effectué
- dateExamen: Date de l'examen
- statut: TERMINE / PREVU / ANNULE
- resultats: Résultats détaillés de l'examen
- conclusion: Conclusion du médecin
- recommandation: Suivi recommandé
- medecin: Nom du médecin qui a réalisé l'examen
- dateResultat: Date/heure de la création du rapport

====================================
⚠️  CODES D'ERREUR
====================================

401 Unauthorized: Clé API invalide ou absente
403 Forbidden: Résultat non disponible (examen pas encore terminé)
404 Not Found: Prescription introuvable

====================================
✅ GUIDE D'INTÉGRATION COMPLET
====================================

Pour un guide détaillé avec exemples en Python, JavaScript, etc:
${API_URL}/admin/services-externes/guide-complet

Vous pouvez également:
1. Stocker votre clé API dans vos variables d'environnement
2. Implémenter un retry logic en cas d'erreur
3. Tester manuellement avec cURL avant la production

====================================
📞 SUPPORT
====================================

Pour toute question d'intégration technique:
- Consultez le guide complet ci-dessus
- Vérifiez que vous utilisez la bonne prescription ID
- Testez d'abord que votre clé API fonctionne
- Contactez notre équipe technique si besoin

Cordialement,
Équipe Endoscopie du CHU`;
  };

  const downloadAsText = () => {
    if (!selectedService) return;

    const text = generateEmailText();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `instructions-${selectedService.nom.toLowerCase().replace(/\s/g, '-')}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Fichier téléchargé');
  };

  const copyToClipboard = () => {
    const text = generateEmailText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copié');
  };

  const openEmailClient = () => {
    if (!selectedService?.contact) {
      toast.error('Email de contact non configuré');
      return;
    }

    const subject = `Accès API - Résultats Endoscopie - ${selectedService.nom}`;
    const body = generateEmailText();
    const mailtoLink = `mailto:${selectedService.contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">📧 Envoyer les Instructions API</h1>

      {/* Sélection du service */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <label className="block text-sm font-semibold mb-2">Sélectionner un service:</label>
        <select
          value={selectedService?.id || ''}
          onChange={(e) => {
            const service = services.find((s) => s.id === e.target.value);
            setSelectedService(service || null);
          }}
          className="w-full border rounded px-4 py-2"
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.nom} {service.hopital ? `(${service.hopital})` : ''}
              {!service.actif && ' [INACTIF]'}
            </option>
          ))}
        </select>
      </div>

      {selectedService && (
        <>
          {/* Aperçu des instructions */}
          <div className="bg-gray-50 border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">📋 Aperçu des Instructions</h2>
            <div className="bg-white border rounded p-4 h-96 overflow-y-auto whitespace-pre-wrap text-sm font-mono text-gray-700">
              {generateEmailText()}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">🚀 Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bouton Email */}
              <button
                onClick={openEmailClient}
                disabled={!selectedService.contact}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                <Mail className="w-5 h-5" />
                Ouvrir Email
              </button>

              {/* Bouton Copier */}
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copié!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copier
                  </>
                )}
              </button>

              {/* Bouton Télécharger */}
              <button
                onClick={downloadAsText}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                <Download className="w-5 h-5" />
                Télécharger
              </button>
            </div>
          </div>

          {/* Infos du service */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ Infos du Service</h3>
            <div className="space-y-2 text-blue-800">
              <p><strong>Nom:</strong> {selectedService.nom}</p>
              {selectedService.hopital && <p><strong>Établissement:</strong> {selectedService.hopital}</p>}
              {selectedService.contact && <p><strong>Email:</strong> {selectedService.contact}</p>}
              <p><strong>Statut:</strong> {selectedService.actif ? '✓ Actif' : '✕ Inactif'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
