import { useEffect, useState, useCallback, useRef } from 'react';
import { apiUrl } from '@/lib/api';

/**
 * Hook personnalisé pour synchroniser automatiquement les rendez-vous
 * - Charge les rendez-vous du jour au montage
 * - Peut rafraîchir automatiquement à un intervalle régulier
 * - Émet un événement (callback) quand un nouveau rendez-vous est créé
 */
export interface RendezVous {
  id: string;
  patient: {
    id: string;
    nom: string;
    prenom: string;
    dateNaissance?: string | null;
    sexe?: string | null;
  } | null;
  medecin: {
    nom: string;
    prenom: string;
  } | null;
  salle: {
    nom: string;
    numero: string;
  } | null;
  dateHeureDebut: string;
  dateHeureFin?: string;
  typeExamen?: string;
  typeExamenSecondaire?: string | null;
  statut: string;
  notesCliniques?: string;
  prescriptionId?: string;
}

interface UseRendezVousSyncOptions {
  /**
   * Date au format YYYY-MM-DD (défaut: aujourd'hui)
   */
  date?: string;
  
  /**
   * Intervalle de rafraîchissement en millisecondes (défaut: 0 = pas de rafraîchissement)
   */
  refreshInterval?: number;
  
  /**
   * Callback appelé quand un rendez-vous est créé
   */
  onRendezVousCreated?: (rdv: RendezVous) => void;
  
  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void;
  
  /**
   * Service ID optionnel
   */
  serviceId?: string;
}

export function useRendezVousSync(options: UseRendezVousSyncOptions = {}) {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const previousCountRef = useRef(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rendezVousRef = useRef<RendezVous[]>([]);

  // Toujours à jour sans faire de loadRendezVous une fonction instable :
  // évite que les callbacks/objets inline passés par l'appelant ne
  // provoquent une boucle de re-render (dépendance `options` recréée à chaque rendu).
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Obtenir la date du jour au format YYYY-MM-DD
  const getTodayISO = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const date = options.date || getTodayISO();

  // Fonction pour charger les rendez-vous du jour
  const loadRendezVous = useCallback(async () => {
    try {
      setError(null);
      let url = apiUrl(`/api/rendezvous/jour/${date}`);
      if (optionsRef.current.serviceId) {
        url += `?serviceId=${optionsRef.current.serviceId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data: RendezVous[] = await response.json();

      // Vérifier si un nouveau rendez-vous a été créé et notifier
      if (data.length > previousCountRef.current) {
        const newRdv = data.find(rdv => !rendezVousRef.current.find(existing => existing.id === rdv.id));
        if (newRdv && optionsRef.current.onRendezVousCreated) {
          optionsRef.current.onRendezVousCreated(newRdv);
        }
      }

      previousCountRef.current = data.length;
      rendezVousRef.current = data;
      setRendezVous(data);
      setLastRefresh(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (optionsRef.current.onError) {
        optionsRef.current.onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Charger les rendez-vous au montage et quand la date change
  useEffect(() => {
    loadRendezVous();
  }, [date, loadRendezVous]);

  // Configurer le rafraîchissement automatique si demandé
  useEffect(() => {
    if (!options.refreshInterval || options.refreshInterval <= 0) {
      return;
    }

    refreshIntervalRef.current = setInterval(() => {
      loadRendezVous();
    }, options.refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [options.refreshInterval, loadRendezVous]);

  const refresh = useCallback(() => {
    return loadRendezVous();
  }, [loadRendezVous]);

  return {
    rendezVous,
    loading,
    error,
    lastRefresh,
    refresh,
  };
}
