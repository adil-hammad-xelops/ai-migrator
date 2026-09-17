Tu es un expert en Node.js, TypeScript, Angular, React, architecture frontend, AST, Design Systems, refactoring et migration de code généré par IA.

Je souhaite créer un backend nommé :

`xelops-ai-migrator`

# 1. Objectif principal

Créer un moteur backend en **Node.js + TypeScript** capable de prendre comme input un projet frontend complet généré par une IA, par exemple :

- React
- Angular
- TypeScript
- JavaScript
- HTML/CSS

Le rôle du `Xelops AI Migrator` est de :

```text
Projet généré par IA
        ↓
Analyse du projet
        ↓
Détection du framework et de la structure
        ↓
Normalisation
        ↓
Mapping vers Xelops
        ↓
Reconstruction selon une architecture officielle
        ↓
Génération du projet Angular/React final
        ↓
Validation
        ↓
Rapport de migration
        ↓
Création d'un fichier ZIP
```

Le résultat final doit être un projet complet, propre et téléchargeable au format `.zip`.

---

# 2. Principe architectural

Le migrateur ne doit pas simplement modifier les fichiers existants.

Il doit :

1. analyser le projet source ;
2. comprendre ses pages, composants et dépendances ;
3. identifier la logique métier utile ;
4. détecter les composants UI ;
5. mapper les composants compatibles vers Xelops ;
6. reconstruire le projet dans une architecture cible officielle ;
7. générer les fichiers nécessaires ;
8. valider le résultat ;
9. produire un rapport détaillé ;
10. compresser le projet final dans un ZIP.

Le projet généré doit suivre une structure cible standardisée et non la structure arbitraire du projet généré par IA.

---

# 3. Priorité du MVP

Pour la première version, la cible principale est :

```text
Projet IA React / Angular
        ↓
Xelops AI Migrator
        ↓
Angular standardisé
        +
ng-xelops
```

Le support React cible pourra être ajouté plus tard.

---

# 4. Architecture cible Angular

Le projet Angular final doit suivre une structure figée et standardisée.

Exemple :

```text
src/
└── app/
    ├── core/
    │   ├── api/
    │   ├── guards/
    │   ├── interceptors/
    │   ├── services/
    │   └── models/
    │
    ├── shared/
    │   ├── components/
    │   ├── directives/
    │   ├── pipes/
    │   ├── utils/
    │   └── models/
    │
    ├── features/
    │   └── feature-name/
    │       ├── pages/
    │       ├── components/
    │       ├── services/
    │       ├── models/
    │       └── feature.routes.ts
    │
    ├── layouts/
    │
    ├── app.component.ts
    ├── app.config.ts
    └── app.routes.ts
```

Le migrateur doit systématiquement tendre vers cette architecture.

---

# 5. Mapping Xelops

Le migrateur doit remplacer les composants natifs ou générés par IA par les composants Xelops lorsqu'un équivalent existe.

Exemples :

```text
button      → xlp-button
input       → xlp-input
select      → xlp-select
textarea    → xlp-textarea
checkbox    → xlp-checkbox
radio       → xlp-radio
modal       → xlp-modal
card        → xlp-card
tooltip     → xlp-tooltip
badge       → xlp-badge
```

Le mapping doit préserver autant que possible :

- événements ;
- propriétés ;
- disabled state ;
- loading state ;
- validations ;
- labels ;
- placeholders ;
- accessibilité ;
- logique liée aux formulaires.

Ne jamais effectuer un mapping incompatible uniquement pour forcer l'utilisation de Xelops.

---

# 6. Catalogue Xelops

Le catalogue Xelops est la source de vérité.

Créer :

```text
src/catalog/xelops-components.json
```

Chaque composant doit progressivement pouvoir contenir :

```json
{
  "button": {
    "selector": "xlp-button",
    "importPath": "@xelops-ui/angular/button",
    "description": "Button used to trigger an action",
    "inputs": [
      "variant",
      "size",
      "disabled"
    ],
    "outputs": [
      "clicked"
    ],
    "variants": [],
    "examples": [],
    "dependencies": []
  }
}
```

Le mapper ne doit jamais inventer un composant Xelops absent du catalogue.

---

# 7. Structure du backend

Faire évoluer le backend vers cette structure :

```text
src/
├── analyzer/
│   └── analyzer.ts
│
├── mapper/
│   └── mapper.ts
│
├── generator/
│   └── generator.ts
│
├── validator/
│   └── validator.ts
│
├── reporter/
│   └── reporter.ts
│
├── exporter/
│   └── zip-exporter.ts
│
├── catalog/
│   └── xelops-components.json
│
├── api/
│   ├── migration.routes.ts
│   └── report.routes.ts
│
└── index.ts
```

---

# 8. Analyzer

L'Analyzer doit travailler au niveau du projet entier.

Il doit pouvoir identifier :

```text
Project
├── framework
├── pages
├── components
├── routes
├── layouts
├── forms
├── services
├── API calls
├── state
├── models
├── styles
└── UI elements
```

Le résultat doit être une représentation normalisée du projet.

Exemple :

```ts
interface DetectedComponent {
  id: string;
  type: string;
  originalTag: string;
  sourceFile: string;
  attributes: Record<string, string>;
  classNames: string[];
  content?: string;
}
```

---

# 9. Mapper

Le Mapper doit comparer les éléments détectés avec le catalogue Xelops.

Retour attendu :

```ts
interface MappedComponent {
  id: string;

  sourceType: string;

  sourceFile: string;

  targetSelector?: string;

  importPath?: string;

  status:
    | "mapped"
    | "unmapped"
    | "manual-review";

  confidence?: number;

  reason?: string;
}
```

Trois résultats doivent être possibles :

```text
mapped
unmapped
manual-review
```

Exemple :

```text
button
→ xlp-button
→ mapped
```

```text
custom-calendar
→ aucun équivalent
→ unmapped
```

```text
complex-ui-container
→ correspondance incertaine
→ manual-review
```

---

# 10. Generator

Créer un module `generator`.

Il doit générer le projet cible Angular complet à partir de la représentation normalisée.

Le Generator doit :

- créer la structure Angular officielle ;
- créer les pages ;
- créer les composants ;
- créer les routes ;
- créer les services ;
- créer les modèles ;
- créer les imports ;
- intégrer `ng-xelops` ;
- produire les templates HTML ;
- générer les fichiers TypeScript ;
- générer les styles nécessaires ;
- conserver la logique métier compatible.

Le code généré doit respecter les bonnes pratiques Angular correspondant à la version stable utilisée.

---

# 11. Validator

Créer un module `validator`.

Il doit vérifier le projet généré.

Prévoir progressivement :

```text
npm install
TypeScript check
Angular build
lint
tests
Xelops compliance
```

Le validator doit produire des résultats structurés.

Exemple :

```ts
interface ValidationResult {
  install: boolean;
  typeCheck: boolean;
  build: boolean;
  lint: boolean;
  tests?: boolean;
  errors: string[];
  warnings: string[];
}
```

---

# 12. Rapport de migration

Créer un module dédié :

```text
src/reporter/reporter.ts
```

Le rapport doit permettre de savoir exactement ce qui a été migré.

Le rapport doit contenir au minimum :

```text
Migration Report

Source framework
Target framework
Number of files analyzed
Number of UI elements detected

Mapped components
Unmapped components
Manual review components

Generated pages
Generated components
Generated services

Validation results
Warnings
Errors
```

Pour chaque élément mappé :

```json
{
  "source": "button",
  "sourceFile": "src/pages/login.tsx",
  "target": "xlp-button",
  "status": "mapped"
}
```

Pour chaque élément non mappé :

```json
{
  "source": "custom-calendar",
  "sourceFile": "src/components/calendar.tsx",
  "status": "unmapped",
  "reason": "No compatible Xelops component found"
}
```

Le rapport doit être généré au minimum en :

```text
migration-report.json
```

Prévoir également une version lisible :

```text
migration-report.html
```

ou :

```text
migration-report.md
```

---

# 13. API dédiée au rapport

Créer une API REST dédiée au rapport dans le même backend.

Ne pas créer un microservice séparé.

Exemples :

```text
GET /api/migrations/:migrationId/report
```

Cette route retourne le rapport JSON.

Prévoir également :

```text
GET /api/migrations/:migrationId/report/download
```

pour télécharger le rapport si nécessaire.

---

# 14. API de migration

Créer une API principale :

```text
POST /api/migrations
```

Elle doit :

1. recevoir le projet source ;
2. créer un identifiant de migration ;
3. exécuter Analyzer ;
4. exécuter Mapper ;
5. exécuter Generator ;
6. exécuter Validator ;
7. créer le rapport ;
8. générer le ZIP final.

Réponse possible :

```json
{
  "migrationId": "mig_12345",
  "status": "completed",
  "mapped": 48,
  "unmapped": 5,
  "manualReview": 2,
  "reportUrl": "/api/migrations/mig_12345/report",
  "downloadUrl": "/api/migrations/mig_12345/download"
}
```

---

# 15. Téléchargement du projet final

Créer une route :

```text
GET /api/migrations/:migrationId/download
```

Cette route doit retourner le projet généré sous forme de fichier :

```text
xelops-migrated-project.zip
```

Le ZIP doit contenir :

```text
xelops-migrated-project/
├── src/
├── package.json
├── angular.json
├── tsconfig.json
├── ...
├── migration-report.json
└── migration-report.md
```

Le ZIP doit être directement exploitable par le développeur.

---

# 16. Export ZIP

Créer :

```text
src/exporter/zip-exporter.ts
```

Ce module doit être uniquement responsable de :

- recevoir le dossier du projet généré ;
- générer le ZIP ;
- retourner son chemin ou son stream ;
- gérer les erreurs de compression.

Ne pas mélanger cette logique avec le Generator.

Une bibliothèque légère comme `archiver` peut être utilisée.

---

# 17. Workflow global

Le workflow complet doit être :

```text
Upload project
      ↓
Analyzer
      ↓
Normalized project
      ↓
Mapper
      ↓
Xelops mappings
      ↓
Generator
      ↓
Angular project
      ↓
Validator
      ↓
Migration Reporter
      ↓
ZIP Exporter
      ↓
Download
```

---

# 18. Résultat visible par le frontend

Le frontend Angular devra pouvoir afficher :

```text
Migration completed

Detected       72
Mapped         61
Unmapped        7
Manual review   4
```

Puis afficher deux listes principales :

```text
Mapped
-------
button
→ xlp-button

input
→ xlp-input

modal
→ xlp-modal
```

et :

```text
Not mapped
----------
advanced-calendar

custom-chart

legacy-grid
```

avec pour chaque élément :

- fichier source ;
- type détecté ;
- raison ;
- statut ;
- éventuelle recommandation.

---

# 19. Bonnes pratiques techniques

Respecter :

- Node.js stable compatible ;
- TypeScript strict ;
- aucune utilisation de `any` ;
- petites fonctions ;
- séparation des responsabilités ;
- pas de logique métier dans les routes ;
- services indépendants ;
- erreurs structurées ;
- logs propres ;
- pas de microservices pour le MVP ;
- pas de duplication ;
- pas d'abstraction prématurée.

---

# 20. Versions et standards

Avant de choisir les dépendances :

- vérifier les dernières versions stables ;
- vérifier la compatibilité Node.js / TypeScript / Angular ;
- privilégier les documentations officielles ;
- ne pas utiliser automatiquement des versions alpha, beta, RC ou expérimentales ;
- ne pas figer une version uniquement sur la base de connaissances anciennes.

Le projet généré doit suivre les pratiques modernes recommandées officiellement par Angular.

---

# 21. Résultat final attendu

Le backend doit être capable de retourner à la fin :

```text
Migration completed
        ↓
Migration report available
        ↓
Project ZIP available
```

Le développeur doit ensuite pouvoir télécharger :

```text
xelops-migrated-project.zip
```

et obtenir un projet Angular standardisé utilisant `ng-xelops`.

Le rapport final doit lui permettre de connaître immédiatement :

```text
ce qui a été détecté
ce qui a été mappé
ce qui n'a pas été mappé
ce qui nécessite une revue manuelle
ce qui a été généré
les erreurs de validation
les warnings
```

L'objectif est que **Xelops AI Migrator ne soit pas une simple conversion de code**, mais un pipeline de migration contrôlé, traçable et reproductible.