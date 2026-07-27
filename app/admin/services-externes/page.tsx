'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceExterne {
  id: string;
  nom: string;
  actif: boolean;
  createdAt: string;
  lastUsedAt?: string;
  hopital?: string;
  contact?: string;
}

interface LogAcces {
  id: string;
  serviceExterne: {
    nom: string;
    hopital?: string;
  };
  prescriptionId: string;
  patientId: string;
  statut: number;
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://endoscopie-api.onrender.com';

export default function ServicesExternesPage() {
  const [services, setServices] = useState<ServiceExterne[]>([]);
  const [logs, setLogs] = useState<LogAcces[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newServiceId, setNewServiceId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    hopital: '',
    contact: '',
  });

  useEffect(() => {
    loadServices();
    loadLogs();
    const interval = setInterval(loadLogs, 5000); // Rafraîchir les logs toutes les 5s
    return () => clearInterval(interval);
  }, []);

  const loadServices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/services-externes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        setServices(await res.json());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des services', error);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/logs-acces-externes?limit=50`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs', error);
    }
  };

  const handleCreateService = async () => {
    if (!formData.nom.trim()) {
      toast.error('Le nom du service est requis');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/services-externes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newService = await res.json();
        setNewApiKey(newService.apiKey);
        setNewServiceId(newService.id);
        setShowNewForm(false);
        setFormData({ nom: '', hopital: '', contact: '' });
        loadServices();
        toast.success('Service créé avec succès');
      } else {
        toast.error('Erreur lors de la création du service');
      }
    } catch (error) {
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/services-externes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ actif: !currentStatus }),
      });

      if (res.ok) {
        loadServices();
        toast.success(currentStatus ? 'Service désactivé' : 'Service activé');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service?')) return;

    try {
      const res = await fetch(`${API_URL}/api/services-externes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.ok) {
        loadServices();
        toast.success('Service supprimé');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success('Copié');
  };

  const getStatusColor = (statut: number) => {
    if (statut === 200) return 'bg-green-100 text-green-700';
    if (statut === 401) return 'bg-red-100 text-red-700';
    if (statut === 403) return 'bg-yellow-100 text-yellow-700';
    if (statut === 404) return 'bg-gray-100 text-gray-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Gestion des Services Externes</h1>

      {/* Affichage de la clé API nouvellement générée */}
      {newApiKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            ✅ Service créé avec succès!
          </h3>
          <p className="text-green-800 mb-4">
            Voici la clé API (affichée une seule fois):
          </p>
          <div className="bg-white border border-green-300 rounded p-3 mb-4 flex justify-between items-center">
            <code className="font-mono text-sm break-all">{newApiKey}</code>
            <button
              onClick={() => copyToClipboard(newApiKey, 'newKey')}
              className="ml-2 p-2 hover:bg-gray-100 rounded"
            >
              {copiedKey === 'newKey' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <button
            onClick={() => {
              setNewApiKey(null);
              setNewServiceId(null);
            }}
            className="text-green-600 hover:text-green-800 text-sm font-semibold"
          >
            Fermer ✕
          </button>
        </div>
      )}

      {/* Bouton créer nouveau service */}
      {!showNewForm && (
        <button
          onClick={() => setShowNewForm(true)}
          className="mb-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Créer un nouveau service
        </button>
      )}

      {/* Formulaire de création */}
      {showNewForm && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Nouveau Service Externe</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nom du service (ex: Radiologie Générale)"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Hôpital/Établissement (optionnel)"
              value={formData.hopital}
              onChange={(e) => setFormData({ ...formData, hopital: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email de contact (optionnel)"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreateService}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition"
              >
                {loading ? 'Création...' : 'Créer'}
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des services */}
      <div className="bg-white border rounded-lg overflow-hidden mb-8">
        <div className="bg-gray-100 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Services Enregistrés</h3>
        </div>
        <div className="divide-y">
          {services.length === 0 ? (
            <div className="px-6 py-4 text-gray-500">Aucun service enregistré</div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{service.nom}</h4>
                    {service.hopital && (
                      <p className="text-sm text-gray-600">{service.hopital}</p>
                    )}
                    {service.contact && (
                      <p className="text-sm text-gray-600">{service.contact}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Créé: {new Date(service.createdAt).toLocaleDateString()}
                      {service.lastUsedAt &&
                        ` | Dernier accès: ${new Date(service.lastUsedAt).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleService(service.id, service.actif)}
                      className={`px-3 py-1 rounded text-sm font-semibold transition ${
                        service.actif
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {service.actif ? '✓ Actif' : '✕ Inactif'}
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dashboard de monitoring des logs */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            📊 Monitoring des Accès Externes (Derniers 50)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Service</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Prescription</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucun accès enregistré
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">
                      <strong>{log.serviceExterne.nom}</strong>
                      {log.serviceExterne.hopital && (
                        <div className="text-xs text-gray-500">
                          {log.serviceExterne.hopital}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono">{log.prescriptionId}</td>
                    <td className="px-6 py-3 text-sm font-mono text-gray-600">
                      {log.patientId}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.statut)}`}>
                        {log.statut}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
