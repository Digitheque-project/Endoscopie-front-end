/**
 * Configuration centralisée des types d'endoscopie
 * Définit les champs spécifiques à chaque type d'examen
 */

export type EndoscopyType = 
  | 'Gastroscopie' 
  | 'Coloscopie' 
  | 'Bronchoscopie' 
  | 'Urétéroscopie'
  | 'Laparoscopie'
  | 'Arthroscopie'
  | 'Autre';

export interface FieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'boolean';
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  group?: string;
}

export interface EndoscopyTypeConfig {
  name: EndoscopyType;
  label: string;
  icon: string;
  color: string;
  commonFields: FieldDefinition[];
  specificFields: FieldDefinition[];
  conclusion?: string;
  recommendations?: string[];
}

/**
 * Champs communs à tous les types d'endoscopie
 */
const COMMON_FIELDS: FieldDefinition[] = [
  {
    id: 'indication',
    label: 'Indication Clinique',
    type: 'textarea',
    placeholder: 'Motif de l\'examen',
    required: true,
    group: 'clinique'
  },
  {
    id: 'reportText',
    label: 'Compte Rendu Détaillé',
    type: 'textarea',
    placeholder: 'Description complète des observations',
    required: true,
    group: 'observations'
  },
  {
    id: 'observations',
    label: 'Observations Principales',
    type: 'textarea',
    placeholder: 'Points clés observés durant l\'examen',
    group: 'observations'
  },
  {
    id: 'mainDiagnosis',
    label: 'Diagnostic Principal',
    type: 'text',
    placeholder: 'Diagnostic identifié',
    required: true,
    group: 'diagnostic'
  },
  {
    id: 'conclusion',
    label: 'Conclusion',
    type: 'textarea',
    placeholder: 'Synthèse finale',
    group: 'diagnostic'
  },
  {
    id: 'complication',
    label: 'Complications',
    type: 'select',
    options: [
      { label: 'Aucune', value: 'none' },
      { label: 'Mineure', value: 'minor' },
      { label: 'Majeure', value: 'major' }
    ],
    group: 'complications'
  },
  {
    id: 'biopsy',
    label: 'Biopsie',
    type: 'select',
    options: [
      { label: 'Non', value: 'no' },
      { label: 'Oui', value: 'yes' }
    ],
    group: 'procedures'
  },
  {
    id: 'followUp',
    label: 'Suivi Recommandé',
    type: 'select',
    options: [
      { label: 'Consultation', value: 'consultation' },
      { label: 'Rappel 1 mois', value: 'recall_1m' },
      { label: 'Rappel 3 mois', value: 'recall_3m' },
      { label: 'Rappel 6 mois', value: 'recall_6m' },
      { label: 'Rappel 1 an', value: 'recall_1y' }
    ],
    group: 'followup'
  }
];

/**
 * Configuration spécifique pour chaque type d'endoscopie
 */
export const ENDOSCOPY_CONFIGS: Record<EndoscopyType, EndoscopyTypeConfig> = {
  'Gastroscopie': {
    name: 'Gastroscopie',
    label: 'Gastroscopie',
    icon: 'stomach',
    color: 'primary',
    commonFields: COMMON_FIELDS,
    specificFields: [
      {
        id: 'stomachMucosa',
        label: 'État de la Muqueuse Gastrique',
        type: 'select',
        options: [
          { label: 'Normale', value: 'normal' },
          { label: 'Érythémateuse', value: 'erythematous' },
          { label: 'Atrophique', value: 'atrophic' },
          { label: 'Ulcérée', value: 'ulcerated' }
        ],
        group: 'findings'
      },
      {
        id: 'pylorus',
        label: 'État du Pylore',
        type: 'select',
        options: [
          { label: 'Perméable', value: 'permeable' },
          { label: 'Sténosé', value: 'stenosed' },
          { label: 'Obstrué', value: 'obstructed' }
        ],
        group: 'findings'
      },
      {
        id: 'helicobacter',
        label: 'Test Hélicobacter Pylori',
        type: 'select',
        options: [
          { label: 'Non effectué', value: 'not_done' },
          { label: 'Positif', value: 'positive' },
          { label: 'Négatif', value: 'negative' }
        ],
        group: 'findings'
      }
    ],
    recommendations: [
      'Traitement éradicateur si H. pylori positif',
      'Modifications alimentaires recommandées',
      'Suivi endoscopique à 6-12 semaines'
    ]
  },
  'Coloscopie': {
    name: 'Coloscopie',
    label: 'Coloscopie',
    icon: 'explore',
    color: 'secondary',
    commonFields: COMMON_FIELDS,
    specificFields: [
      {
        id: 'cecumIntubation',
        label: 'Intubation du Cæcum',
        type: 'boolean',
        group: 'findings'
      },
      {
        id: 'polypsFound',
        label: 'Polypes Détectés',
        type: 'boolean',
        group: 'findings'
      },
      {
        id: 'bowelPrepQuality',
        label: 'Qualité de la Préparation',
        type: 'select',
        options: [
          { label: 'Excellente', value: 'excellent' },
          { label: 'Bonne', value: 'good' },
          { label: 'Acceptable', value: 'acceptable' },
          { label: 'Insuffisante', value: 'poor' }
        ],
        group: 'procedure'
      },
      {
        id: 'resectionDone',
        label: 'Résection Effectuée',
        type: 'boolean',
        group: 'procedures'
      }
    ],
    recommendations: [
      'Surveillance annuelle si polypes trouvés',
      'Respecter les délais de surveillance',
      'Pathologie des pièces de résection'
    ]
  },
  'Bronchoscopie': {
    name: 'Bronchoscopie',
    label: 'Bronchoscopie',
    icon: 'air',
    color: 'tertiary',
    commonFields: COMMON_FIELDS,
    specificFields: [
      {
        id: 'airwayClearance',
        label: 'Dégagement des Voies Aériennes',
        type: 'select',
        options: [
          { label: 'Libre', value: 'clear' },
          { label: 'Partiellement obstrué', value: 'partial' },
          { label: 'Complètement obstrué', value: 'obstructed' }
        ],
        group: 'findings'
      },
      {
        id: 'lavageBronchiqueEffectue',
        label: 'Lavage Bronchoalvéolaire Effectué',
        type: 'boolean',
        group: 'procedures'
      },
      {
        id: 'biopsyBronchique',
        label: 'Biopsie Bronchique',
        type: 'boolean',
        group: 'procedures'
      }
    ],
    recommendations: [
      'Suivi des résultats du LBA',
      'Pathologie des biopsies',
      'Arrêt des anticoagulants si nécessaire'
    ]
  },
  'Urétéroscopie': {
    name: 'Urétéroscopie',
    label: 'Urétéroscopie',
    icon: 'opacity',
    color: 'outline',
    commonFields: COMMON_FIELDS,
    specificFields: [
      {
        id: 'uretricStone',
        label: 'Calcul Urétéral',
        type: 'boolean',
        group: 'findings'
      },
      {
        id: 'lithotripsyDone',
        label: 'Lithotritie Effectuée',
        type: 'boolean',
        group: 'procedures'
      },
      {
        id: 'stentPlacement',
        label: 'Placement d\'un Stent',
        type: 'boolean',
        group: 'procedures'
      }
    ],
    recommendations: [
      'Contrôle radiographique recommandé',
      'Suivi des symptômes urinaires',
      'Retrait du stent à J30'
    ]
  },
  'Laparoscopie': {
    name: 'Laparoscopie',
    label: 'Laparoscopie',
    icon: 'surgery',
    color: 'error',
    commonFields: COMMON_FIELDS,
    specificFields: [
      {
        id: 'intraAbdominalFindings',
        label: 'Découvertes Intra-Abdominales',
        type: 'textarea',
        placeholder: 'Description des structures observées',
        group: 'findings'
      },
      {
        id: 'therapeuticAction',
        label: 'Acte Thérapeutique Effectué',
        type: 'text',
        group: 'procedures'
      }
    ],
    recommendations: [
      'Surveillance post-opératoire',
      'Sortie prévue',
      'Suites simples recommandées'
    ]
  },
  'Arthroscopie': {
    name: 'Arthroscopie',
    label: 'Arthroscopie',
    icon: 'accessibility',
    color: 'secondary',
    commonFields: COMMON_FIELDS,
    specificFields: [
      {
        id: 'cartilageQuality',
        label: 'Qualité du Cartilage',
        type: 'select',
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Dégénérescence légère', value: 'mild' },
          { label: 'Dégénérescence modérée', value: 'moderate' },
          { label: 'Dégénérescence sévère', value: 'severe' }
        ],
        group: 'findings'
      },
      {
        id: 'meniscusStatus',
        label: 'État du Ménisque',
        type: 'text',
        group: 'findings'
      },
      {
        id: 'synovialFluid',
        label: 'Quantité de Liquide Synovial',
        type: 'select',
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Augmenté', value: 'increased' },
          { label: 'Diminué', value: 'decreased' }
        ],
        group: 'findings'
      }
    ],
    recommendations: [
      'Immobilisation temporaire',
      'Kinésithérapie progressive',
      'Suivi à 3 mois'
    ]
  },
  'Autre': {
    name: 'Autre',
    label: 'Autre Endoscopie',
    icon: 'visibility',
    color: 'outline',
    commonFields: COMMON_FIELDS,
    specificFields: []
  }
};

/**
 * Récupérer la configuration complète d'un type d'endoscopie
 */
export function getEndoscopyConfig(examType: string): EndoscopyTypeConfig {
  const key = Object.keys(ENDOSCOPY_CONFIGS).find(
    k => k.toLowerCase() === examType.toLowerCase()
  ) as EndoscopyType;
  
  return ENDOSCOPY_CONFIGS[key] || ENDOSCOPY_CONFIGS['Autre'];
}

/**
 * Lister tous les types d'endoscopie disponibles
 */
export function getAvailableEndoscopyTypes(): EndoscopyType[] {
  return Object.keys(ENDOSCOPY_CONFIGS) as EndoscopyType[];
}

/**
 * Combiner les champs communs et spécifiques
 */
export function getAllFields(examType: string): FieldDefinition[] {
  const config = getEndoscopyConfig(examType);
  const all = [...config.commonFields, ...config.specificFields];
  
  // Trier par groupe
  const groups = ['clinique', 'observations', 'diagnostic', 'findings', 'procedures', 'complications', 'followup'];
  return all.sort((a, b) => {
    const groupA = groups.indexOf(a.group || '');
    const groupB = groups.indexOf(b.group || '');
    return groupA - groupB;
  });
}

/**
 * Filtrer les champs pour un groupe spécifique
 */
export function getFieldsByGroup(examType: string, group: string): FieldDefinition[] {
  return getAllFields(examType).filter(field => field.group === group);
}
