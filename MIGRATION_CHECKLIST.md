# Plan de Migration vers l'Interface Configurable

## 📋 Checklist d'Implémentation

### Phase 1 : Setup (30 min)
- [x] ✅ Configuration centralisée créée (`lib/config/endoscopyTypes.ts`)
- [x] ✅ Hooks de gestion créés (`lib/hooks/useEndoscopyConfig.ts`)
- [x] ✅ Composants réutilisables créés (`components/endoscopy/EndoscopyFormFields.tsx`)
- [x] ✅ Documentation rédigée (`ARCHITECTURE_CONFIGURABLE.md`)
- [x] ✅ Exemple d'intégration fourni (`app/resultat-endoscopie/page.example.tsx`)

**Action requise** : Valider que les fichiers sont présents et sans erreurs

```bash
# Vérifier les imports
grep -r "useEndoscopyConfig" endoscopie-front/
grep -r "EndoscopyFormSection" endoscopie-front/
```

---

### Phase 2 : Intégration Frontend (1-2 heures)

#### Étape 1 : Mettre à jour `resultat-endoscopie/page.tsx`

1. **Ouvrir** : `endoscopie-front/app/resultat-endoscopie/page.tsx`
2. **Remplacer** le contenu par l'exemple de `page.example.tsx`
3. **Adapter** :
   - Vérifier que le contexte `usePatient()` retourne bien `procedure`
   - Ajuster les noms de champs si nécessaire

#### Étape 2 : Tester localement

```bash
cd endoscopie-front
npm run dev

# Ouvrir http://localhost:3000/resultat-endoscopie
# Tester différents types d'endoscopie
```

**Points de vérification** :
- [ ] Les champs communs s'affichent
- [ ] Les champs spécifiques apparaissent selon le type
- [ ] La validation fonctionne
- [ ] Les recommandations s'affichent

---

### Phase 3 : Adaptation Backend (2-4 heures)

#### Étape 1 : Mettre à jour le modèle Prisma

```prisma
// prisma/schema.prisma
model Resultat {
  id            String   @id @default(cuid())
  prescriptionId String  @unique
  patientId     String
  
  examType      String    // Nouveau : type d'endoscopie
  
  // Champs communs groupés
  commonFields  Json      // {indication, reportText, mainDiagnosis, etc.}
  
  // Champs spécifiques groupés
  specificFields Json     // {stomachMucosa, pylorus, etc.}
  
  doctorName    String
  dateCreation  DateTime  @default(now())
  
  @@index([prescriptionId])
  @@index([patientId])
}
```

#### Étape 2 : Migrer la base de données

```bash
npx prisma migrate dev --name add_exam_type_to_resultat
```

#### Étape 3 : Mettre à jour les contrôleurs NestJS

**Fichier** : `endoscopie-back/src/resultat/resultat.service.ts`

```typescript
async createResultat(payload: CreateResultatDto) {
  const { prescriptionId, patientId, examType, commonFields, specificFields, doctorName } = payload;
  
  return this.prisma.resultat.create({
    data: {
      prescriptionId,
      patientId,
      examType,        // Nouveau
      commonFields,    // Nouveau
      specificFields,  // Nouveau
      doctorName,
      dateCreation: new Date()
    }
  });
}

async getResultat(prescriptionId: string) {
  return this.prisma.resultat.findUnique({
    where: { prescriptionId }
  });
}
```

#### Étape 4 : Tester les endpoints API

```bash
# POST /api/resultats avec nouvelle structure
curl -X POST http://localhost:3001/api/resultats \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionId": "123",
    "patientId": "456",
    "examType": "Gastroscopie",
    "commonFields": {"indication": "...", "reportText": "..."},
    "specificFields": {"stomachMucosa": "normal", "pylorus": "permeable"},
    "doctorName": "Dr. X"
  }'
```

**Points de vérification** :
- [ ] Les données sont correctement sauvegardées
- [ ] Les champs `examType` et groupés sont présents
- [ ] La récupération fonctionne
- [ ] Les migrations s'appliquent sans erreur

---

### Phase 4 : Migration des Données Existantes (1-2 heures)

#### Script de migration des résultats existants

```typescript
// endoscopie-back/prisma/migrate-existing-results.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateResults() {
  const results = await prisma.resultat.findMany();
  
  for (const result of results) {
    // Supposer que les anciens résultats sont de type "Autre"
    const commonFields = {
      indication: result.indication || '',
      reportText: result.reportText || '',
      mainDiagnosis: result.mainDiagnosis || '',
      conclusion: result.conclusion || '',
      complication: result.complication || null,
      biopsy: result.biopsy || null,
      followUp: result.followUp || 'consultation'
    };

    await prisma.resultat.update({
      where: { id: result.id },
      data: {
        examType: 'Autre',
        commonFields: commonFields,
        specificFields: {}
      }
    });
  }
  
  console.log(`✅ ${results.length} résultats migrés`);
}

migrateResults().catch(console.error);
```

**Exécuter** :
```bash
cd endoscopie-back
npx ts-node prisma/migrate-existing-results.ts
```

---

### Phase 5 : Enrichissement des Types (1-3 heures)

Une fois la base stable, enrichir progressivement chaque type d'endoscopie avec les retours des médecins.

#### Ajouter une nouvelle configuration

**Fichier** : `lib/config/endoscopyTypes.ts`

```typescript
// Ajouter dans ENDOSCOPY_CONFIGS
'Esophagoscopie': {
  name: 'Esophagoscopie',
  label: 'Esophagoscopie',
  icon: 'visibility',
  color: 'secondary',
  commonFields: COMMON_FIELDS,
  specificFields: [
    // Champs spécifiques à définir avec les médecins
  ],
  recommendations: [
    // À remplir
  ]
}
```

Les champs apparaîtront automatiquement !

---

## 📊 Timeline Estimée

| Phase | Tâches | Durée | Qui |
|-------|--------|-------|-----|
| 1 | Setup | 30 min | Développeur |
| 2 | Frontend | 1-2 h | Développeur Frontend |
| 3 | Backend | 2-4 h | Développeur Backend |
| 4 | Migration | 1-2 h | DBA / DevOps |
| 5 | Enrichissement | 1-3 h | Équipe + Médecins |

**Total estimé** : 6-12 heures de développement

---

## 🎯 Bénéfices Attendus

✅ **Interface unique** : Un seul composant pour tous les types
✅ **Évolutivité** : Ajouter un type = 50 lignes de config
✅ **Maintenabilité** : Changements centralisés
✅ **UX cohérente** : Interface familière pour les utilisateurs
✅ **Pas de duplication** : DRY principle respecté

---

## ⚠️ Points d'Attention

### Rétrocompatibilité

Les résultats existants doivent rester accessibles. Solution :
- Migrer les données existantes vers structure groupée
- Assumer type `Autre` pour les résultats legacy

### Performance

Avec de nombreux types :
- La config reste en mémoire (< 50KB)
- Les validations sont rapides (<1ms)
- Aucun impact sur la performance

### Évolutivité

Pour ajouter rapidement des champs :
1. Modifier `ENDOSCOPY_CONFIGS` dans `endoscopyTypes.ts`
2. Redéployer le frontend
3. **Pas besoin de toucher le backend** (JSON flexible)

---

## 🔄 Processus de Validation

Avant de déployer en production :

1. **Tests unitaires** : Valider chaque configuration
   ```bash
   npm test -- endoscopyTypes.test.ts
   ```

2. **Tests d'intégration** : End-to-end depuis le formulaire
   ```bash
   npm run test:e2e -- resultat-endoscopie
   ```

3. **Tests avec médecins** : Feedback sur les champs
   ```
   Checklist : Chaque médecin teste son type
   ```

4. **Données de test** : Créer des cas pour chaque type
   ```
   - Gastroscopie normale
   - Coloscopie avec polypes
   - Bronchoscopie avec LBA
   - etc.
   ```

---

## 📞 Support et Questions

### FAQ

**Q: Comment ajouter un champ rapidement?**
R: Modifier `ENDOSCOPY_CONFIGS` dans `lib/config/endoscopyTypes.ts` et redéployer le frontend.

**Q: Peut-on utiliser d'anciens résultats?**
R: Oui, via migration. Ils apparaissent comme type `Autre`.

**Q: Les validations sont-elles personnalisables?**
R: Oui, via `useEndoscopyFormValidation` ou en ajoutant du code custom.

**Q: Comment intégrer avec un autre système?**
R: L'API accepte JSON flexible pour `commonFields` et `specificFields`.

---

## 📚 Ressources

- **Architecture** : [ARCHITECTURE_CONFIGURABLE.md](./ARCHITECTURE_CONFIGURABLE.md)
- **Types** : [lib/config/endoscopyTypes.ts](./lib/config/endoscopyTypes.ts)
- **Hooks** : [lib/hooks/useEndoscopyConfig.ts](./lib/hooks/useEndoscopyConfig.ts)
- **Composants** : [components/endoscopy/EndoscopyFormFields.tsx](./components/endoscopy/EndoscopyFormFields.tsx)
- **Exemple** : [app/resultat-endoscopie/page.example.tsx](./app/resultat-endoscopie/page.example.tsx)

---

**Bon développement ! 🚀**
