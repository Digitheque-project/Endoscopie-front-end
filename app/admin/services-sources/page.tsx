'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ServiceSource {
  id: string;
  nom: string;
  urlWebhook: string;
  actif: boolean;
  contact?: string;
  hopital?: string;
  createdAt: string;
  lastNotifiedAt?: string;
}

interface LogWebhook {
  id: string;
  serviceSourceId: string;
  serviceSource: { nom: string };
  prescriptionId: string;
  patientId: string;
  eventType: string;
  httpStatus?: number;
  tentatives: number;
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://endoscopie-api.onrender.com';

export default function ServiceSourcesPage() {
  const [services, setServices] = useState<ServiceSource[]>([]);
  const [logs, setLogs] = useState<LogWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    urlWebhook: '',
    contact: '',
    hopital: '',
  });

  useEffect(() => {
    loadServices();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadServices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/services-sources`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Erreur', error);
      toast.error('Erreur lors du chargement');
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/services-sources/logs/webhooks?limit=50`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Erreur logs', error);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/services-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Service créé');
        setFormData({ nom: '', urlWebhook: '', contact: '', hopital: '' });
        setShowForm(false);
        loadServices();
      } else {
        toast.error('Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleToggleActive = async (service: ServiceSource) => {
    try {
      const res = await fetch(`${API_URL}/api/services-sources/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ actif: !service.actif }),
      });
      if (res.ok) {
        toast.success(service.actif ? 'Service désactivé' : 'Service activé');
        loadServices();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm('Êtes-vous sûr?')) {
      try {
        const res = await fetch(`${API_URL}/api/services-sources/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (res.ok) {
          toast.success('Service supprimé');
          loadServices();
        }
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-red-600'; // Erreur
    if (status === 200) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    loadLogs();
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🔔 Services Sources (Webhook)</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Ajouter service
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📋 Nouveau Service Source</h2>
          <form onSubmit={handleCreateService}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nom du service"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="url"
                placeholder="URL webhook (ex: https://service.mg/webhook)"
                required
                value={formData.urlWebhook}
                onChange={(e) => setFormData({ ...formData, urlWebhook: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="email"
                placeholder="Email de contact (optionnel)"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Hôpital/Service (optionnel)"
                value={formData.hopital}
                onChange={(e) => setFormData({ ...formData, hopital: e.target.value })}
                className="border rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📍 Services Enregistrés</h2>
        {services.length === 0 ? (
          <p className="text-gray-600">Aucun service enregistré</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">URL Webhook</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-left">Dernier appel</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold">{service.nom}</td>
                    <td className="px-4 py-2 text-xs text-gray-600 truncate">
                      {service.urlWebhook}
                    </td>
                    <td className="px-4 py-2">
                      {service.actif ? (
                        <span className="text-green-600 font-semibold">✓ Actif</span>
                      ) : (
                        <span className="text-red-600 font-semibold">✕ Inactif</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {service.lastNotifiedAt
                        ? new Date(service.lastNotifiedAt).toLocaleString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleToggleActive(service)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded mr-2 ${
                          service.actif
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {service.actif ? (
                          <>
                            <X className="w-4 h-4" /> Désactiver
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Activer
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Webhook Logs */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Logs Webhooks (Temps réel)</h2>
        <p className="text-sm text-gray-600 mb-4">Auto-refresh toutes les 5 secondes</p>
        {logs.length === 0 ? (
          <p className="text-gray-600">Aucun log</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-left">Prescription</th>
                  <th className="px-4 py-2 text-left">Événement</th>
                  <th className="px-4 py-2 text-center">Statut</th>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold">{log.serviceSource.nom}</td>
                    <td className="px-4 py-2 text-xs">{log.prescriptionId}</td>
                    <td className="px-4 py-2 text-xs">{log.eventType}</td>
                    <td className={`px-4 py-2 text-center font-semibold ${getStatusColor(log.httpStatus)}`}>
                      {log.httpStatus || 'ERR'}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
