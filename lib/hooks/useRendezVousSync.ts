import { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';

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
    priseEnChargeId?: string | null;
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

  /**
   * true = tous les rendez-vous (vues Semaine / Mois, filtrées ensuite par la page) au
   * lieu des seuls rendez-vous du jour `date`.
   */
  allDates?: boolean;
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
  const allDates = !!options.allDates;

  // Charge les rendez-vous du jour (ou tous, pour les vues Semaine / Mois). Passe par
  // apiFetch : en-têtes d'identité et nouvelles tentatives au réveil du serveur.
  const loadRendezVous = useCallback(async () => {
    try {
      setError(null);
      let path = allDates ? '/api/rendezvous' : `/api/rendezvous/jour/${date}`;
      if (optionsRef.current.serviceId) {
        path += `?serviceId=${optionsRef.current.serviceId}`;
      }

      const response = await apiFetch(path);
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
  }, [date, allDates]);

  // Charger les rendez-vous au montage et quand la date (ou la vue) change
  useEffect(() => {
    loadRendezVous();
  }, [loadRendezVous]);

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

  // Actualisation manuelle : indicateur de chargement visible pendant la requête
  // (le rafraîchissement automatique, lui, reste silencieux).
  const refresh = useCallback(() => {
    setLoading(true);
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
