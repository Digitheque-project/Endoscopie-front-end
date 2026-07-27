'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface GuideApiProps {
  serviceName?: string;
  apiKey?: string;
  hopital?: string;
}

export default function GuideApi({ serviceName = 'Radiologie', apiKey = 'YOUR_API_KEY_HERE', hopital = 'Votre Hôpital' }: GuideApiProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
    toast.success('Copié');
  };

  const exampleCurl = `curl -X GET \\
  https://endoscopie-api.onrender.com/api/examens/resultats/PRES-2024-0187 \\
  -H "x-api-key: ${apiKey}"`;

  const examplePython = `import requests

headers = {
    'x-api-key': '${apiKey}'
}

response = requests.get(
    'https://endoscopie-api.onrender.com/api/examens/resultats/PRES-2024-0187',
    headers=headers
)

resultat = response.json()
print(resultat)`;

  const exampleJavaScript = `const headers = {
  'x-api-key': '${apiKey}',
  'Content-Type': 'application/json'
};

fetch('https://endoscopie-api.onrender.com/api/examens/resultats/PRES-2024-0187', {
  method: 'GET',
  headers: headers
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erreur:', error));`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📚 Guide d'Intégration API</h1>
        <p className="text-gray-600">Service: <strong>{serviceName}</strong> ({hopital})</p>
      </div>

      {/* Section 1: Clé API */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🔑 Votre Clé API</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-sm text-yellow-800 mb-3">
            ⚠️ <strong>IMPORTANT:</strong> Gardez cette clé API secrète. Ne la partagez jamais!
          </p>
          <div className="bg-white border border-yellow-300 rounded p-3 flex justify-between items-center font-mono text-sm">
            <code className="break-all">{apiKey}</code>
            <button
              onClick={() => copyToClipboard(apiKey, 'apiKey')}
              className="ml-2 p-2 hover:bg-gray-100 rounded"
            >
              {copiedText === 'apiKey' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: URL Endpoint */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🌐 Endpoint API</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="font-semibold mb-2">Méthode:</p>
          <code className="bg-white border rounded p-2 block mb-4">GET</code>

          <p className="font-semibold mb-2">URL:</p>
          <div className="bg-white border border-blue-300 rounded p-3 flex justify-between items-center font-mono text-sm mb-4">
            <code className="break-all">https://endoscopie-api.onrender.com/api/examens/resultats/:prescriptionId</code>
            <button
              onClick={() => copyToClipboard('https://endoscopie-api.onrender.com/api/examens/resultats/:prescriptionId', 'url')}
              className="ml-2 p-2 hover:bg-gray-100 rounded flex-shrink-0"
            >
              {copiedText === 'url' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="font-semibold mb-2">Paramètres:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-4">
            <li><code>:prescriptionId</code> = Numéro de la prescription du patient (ex: PRES-2024-0187)</li>
          </ul>

          <p className="font-semibold mb-2">Header requis:</p>
          <div className="bg-white border border-blue-300 rounded p-3 font-mono text-sm">
            <code>x-api-key: {apiKey}</code>
          </div>
        </div>
      </section>

      {/* Section 3: Format de réponse */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">📋 Format de Réponse</h2>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-4">Réponse HTTP 200 OK:</p>
          <div className="bg-gray-800 text-gray-100 rounded p-4 overflow-x-auto text-sm">
            <pre>{`{
  "prescriptionId": "PRES-2024-0187",
  "patient": {
    "nom": "Rakoto",
    "prenoms": "Jean",
    "dateNaissance": "1975-03-12"
  },
  "typeExamen": "Fibroscopie digestive haute",
  "dateExamen": "2024-06-24",
  "statut": "TERMINE",
  "resultats": {
    "oesophage": "Normal",
    "cardia": "Normale",
    "estomac": "Gastrite érythémateuse",
    "pylore": "Franchissable",
    "duodenum": "Normal"
  },
  "conclusion": "Gastrite érythémateuse modérée",
  "recommandation": "Traitement IPP 6 semaines",
  "medecin": "Dr. Razafindrabe",
  "dateResultat": "2024-06-24T10:30:00Z"
}`}</pre>
          </div>
        </div>
      </section>

      {/* Section 4: Codes d'erreur */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">⚠️ Codes d'Erreur</h2>
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-900 mb-1">401 Unauthorized</p>
            <p className="text-red-700 text-sm">Clé API invalide, absente ou expirée. Vérifiez le header <code>x-api-key</code>.</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="font-semibold text-yellow-900 mb-1">403 Forbidden</p>
            <p className="text-yellow-700 text-sm">Le résultat d'examen n'est pas encore disponible. L'examen doit avoir le statut TERMINE.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-900 mb-1">404 Not Found</p>
            <p className="text-gray-700 text-sm">La prescription spécifiée n'existe pas. Vérifiez le numéro de prescription.</p>
          </div>
        </div>
      </section>

      {/* Section 5: Exemples */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">💻 Exemples d'Appel</h2>

        {/* cURL */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">cURL</h3>
          <div className="bg-gray-800 text-gray-100 rounded p-4 overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap">{exampleCurl}</pre>
          </div>
          <button
            onClick={() => copyToClipboard(exampleCurl, 'curl')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            {copiedText === 'curl' ? (
              <>
                <Check className="w-4 h-4" /> Copié
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copier
              </>
            )}
          </button>
        </div>

        {/* Python */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Python</h3>
          <div className="bg-gray-800 text-gray-100 rounded p-4 overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap">{examplePython}</pre>
          </div>
          <button
            onClick={() => copyToClipboard(examplePython, 'python')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            {copiedText === 'python' ? (
              <>
                <Check className="w-4 h-4" /> Copié
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copier
              </>
            )}
          </button>
        </div>

        {/* JavaScript */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">JavaScript / Node.js</h3>
          <div className="bg-gray-800 text-gray-100 rounded p-4 overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap">{exampleJavaScript}</pre>
          </div>
          <button
            onClick={() => copyToClipboard(exampleJavaScript, 'js')}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            {copiedText === 'js' ? (
              <>
                <Check className="w-4 h-4" /> Copié
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copier
              </>
            )}
          </button>
        </div>
      </section>

      {/* Section 6: Bonnes pratiques */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">✅ Bonnes Pratiques</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-green-600 font-bold text-lg">✓</span>
              <span>Gardez votre clé API <strong>secrète et sécurisée</strong> (jamais en dur dans le code)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold text-lg">✓</span>
              <span>Utilisez des variables d'environnement pour stocker votre clé API</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold text-lg">✓</span>
              <span>Vérifiez que le <strong>statut HTTP est 200</strong> avant de traiter la réponse</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold text-lg">✓</span>
              <span>Implémentez un <strong>retry logic</strong> en cas de timeout ou erreur 5xx</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-600 font-bold text-lg">✓</span>
              <span>Testez avec un vrai numéro de prescription avant de passer en production</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 7: Support */}
      <section>
        <h2 className="text-2xl font-bold mb-4">📞 Support Technique</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="mb-3">Pour toute question ou problème d'intégration:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>Consultez la documentation API complète</li>
            <li>Vérifiez vos logs d'accès dans le tableau de bord admin</li>
            <li>Testez manuellement avec cURL avant d'implémenter</li>
            <li>Contactez l'équipe technique du CHU</li>
          </ul>
        </div>
      </section>

      {/* Bouton d'impression */}
      <div className="mt-8 flex gap-3 justify-center">
        <button
          onClick={() => window.print()}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          🖨️ Imprimer ce guide
        </button>
      </div>
    </div>
  );
}
