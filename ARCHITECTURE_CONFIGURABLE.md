# Architecture Configurable pour l'Interface de Résultats

## Vue d'ensemble

Cette architecture permet à l'interface de résultats unique de s'adapter automatiquement à différents types d'endoscopie sans créer une page séparée pour chaque examen.

## Structure des fichiers

```
lib/
├── config/
│   └── endoscopyTypes.ts          # Configuration centralisée des types
├── hooks/
│   └── useEndoscopyConfig.ts      # Hooks de gestion de configuration
└── api.ts

components/
└── endoscopy/
    └── EndoscopyFormFields.tsx    # Composants réutilisables pour les champs

app/
└── resultat-endoscopie/
    └── page.tsx                    # Interface de résultats unique (adapter)
```

## Fonctionnement

### 1. Configuration des types d'endoscopie

Chaque type d'endoscopie possède :
- **Champs communs** : Indication, Compte rendu, Diagnostic, Conclusion, Suivi
- **Champs spécifiques** : Détails particuliers au type (ex: état muqueuse pour gastroscopie)
- **Icône** : Pour identification visuelle
- **Couleur** : Pour différenciation UI
- **Recommandations** : Suggestions de suivi spécifiques

### 2. Types supportés

- **Gastroscopie** : Examen de l'estomac et œsophage
- **Coloscopie** : Examen du côlon
- **Bronchoscopie** : Examen des voies respiratoires
- **Urétéroscopie** : Examen des uretères
- **Laparoscopie** : Examen abdominal
- **Arthroscopie** : Examen articulaire
- **Autre** : Type générique

## Intégration à l'interface existante

### Exemple d'adaptation du composant resultat-endoscopie

```tsx
"use client";

import { useEndoscopyConfig, useEndoscopyFormValidation } from "@/lib/hooks/useEndoscopyConfig";
import { EndoscopyFormSection } from "@/components/endoscopy/EndoscopyFormFields";
import { usePatient } from "@/contexts/PatientContext";
import { useState } from "react";

export default function RapportResultat() {
  const { procedure } = usePatient(); // Récupère le type d'endoscopie
  const { config, fieldsByGroup } = useEndoscopyConfig(procedure);
  const { validateForm, hasErrors } = useEndoscopyFormValidation(procedure);
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Gérer la mise à jour d'un champ
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  // Valider et soumettre
  const handleSubmit = async () => {
    const validationErrors = validateForm(formData);
    
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    // Soumettre les données au serveur
    await submitResult(formData);
  };

  if (!config) {
    return <div>Type d'endoscopie non trouvé</div>;
  }

  return (
    <div>
      {/* En-tête avec infos du type */}
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary text-2xl">
          {config.icon}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{config.label}</h1>
          <p className="text-sm text-gray-600">Résultat d'examen</p>
        </div>
      </div>

      {/* Formulaire dynamique */}
      <EndoscopyFormSection
        examType={procedure}
        formData={formData}
        errors={errors}
        onChange={handleFieldChange}
      />

      {/* Bouton de validation */}
      <button onClick={handleSubmit} className="mt-6 px-6 py-3 bg-primary text-white rounded-lg">
        Valider le résultat
      </button>

      {/* Recommandations spécifiques */}
      {config.recommendations && config.recommendations.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold mb-2">Recommandations</h3>
          <ul className="list-disc list-inside text-sm">
            {config.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Avantages de cette architecture

✅ **Évolutivité** : Ajouter un nouveau type d'endoscopie = modifier un fichier de config
✅ **Pas de duplication** : Un seul composant de résultat pour tous les types
✅ **Maintenabilité** : Changements centralisés et testables
✅ **Flexibilité** : Champs personnalisables par type
✅ **Scalabilité** : Supporte 10+ types sans ralentissement
✅ **UX cohérente** : Interface uniforme, contenus adaptés

## Gestion des données

### Structure de sauvegarde

Les résultats sont stockés avec cette structure :

```json
{
  "prescriptionId": "uuid",
  "patientId": "uuid",
  "examType": "Gastroscopie",
  "commonFields": {
    "indication": "...",
    "reportText": "...",
    "mainDiagnosis": "...",
    "conclusion": "...",
    "complication": "...",
    "biopsy": "...",
    "followUp": "..."
  },
  "specificFields": {
    "stomachMucosa": "erythematous",
    "pylorus": "permeable",
    "helicobacter": "negative"
  },
  "doctorName": "Dr. X",
  "dateCreation": "2024-06-16T10:30:00Z"
}
```

### API Backend - Ajustements recommandés

L'endpoint `/api/resultats` doit retourner/accepter :

```typescript
POST /api/resultats
{
  prescriptionId: string,
  patientId: string,
  examType: string,           // Nouveau : type d'endoscopie
  commonFields: Record<string, any>,  // Nouveau : grouper les champs courants
  specificFields: Record<string, any> // Nouveau : champs spécifiques
  doctorName: string,
  dateCreation?: string
}
```

## Prochaines étapes recommandées

1. **Phase 1** : Adapter `resultat-endoscopie/page.tsx` pour utiliser `EndoscopyFormSection`
2. **Phase 2** : Mettre à jour l'API backend pour stocker `examType` et grouper les champs
3. **Phase 3** : Enrichir les configurations avec les retours des médecins
4. **Phase 4** : Ajouter validation métier (ex: H. pylori + gastrite => traitement)

## Tester localement

```tsx
// Dans une page de test
import { useEndoscopyConfig } from "@/lib/hooks/useEndoscopyConfig";
import { getAvailableEndoscopyTypes } from "@/lib/config/endoscopyTypes";

export function TestEndoscopy() {
  const types = getAvailableEndoscopyTypes();
  
  return (
    <div>
      {types.map(type => {
        const { config, fieldsByGroup } = useEndoscopyConfig(type);
        return (
          <div key={type}>
            <h2>{config?.label}</h2>
            <p>Champs spécifiques: {config?.specificFields.length}</p>
          </div>
        );
      })}
    </div>
  );
}
```

## Support et évolution

Pour ajouter un nouveau type d'endoscopie :

1. Ouvrir `lib/config/endoscopyTypes.ts`
2. Ajouter la configuration dans `ENDOSCOPY_CONFIGS`
3. Les champs apparaîtront automatiquement dans l'interface

Aucun changement nécessaire ailleurs !
