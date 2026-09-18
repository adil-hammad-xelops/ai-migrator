# Xelops AI Migrator — Documentation et suivi

## 1. Projet

Xelops AI Migrator est un backend Node.js/TypeScript qui reçoit un projet React ou Angular,
l’analyse, le transforme en projet Angular standardisé avec `ng-xelops`, le valide et fournit
des rapports ainsi qu’un ZIP téléchargeable.

Dépôt : `https://github.com/adil-hammad-xelops/ai-migrator.git`
Branche : `main`
Progression : **58 / 68 tâches terminées**

Catalogue officiel unique :
`C:/Users/EL MAGICO/Desktop/DS/angular-xelops-ui/xelops-components.json`

Le catalogue est la seule autorité. Aucun composant, sélecteur, événement, propriété ou token
Xelops ne doit être inventé.

## 2. Parcours d’une migration

```text
ZIP → API → Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter
```

1. L’API reçoit le ZIP et crée un identifiant.
2. L’Analyzer comprend le projet sans exécuter son code.
3. Le Mapper classe chaque élément en `mapped`, `unmapped` ou `manual-review`.
4. Le Generator crée l’application Angular standardisée.
5. Le Validator exécute les six contrôles obligatoires.
6. Le Reporter crée les rapports JSON et Markdown.
7. L’Exporter produit le ZIP final ou un ZIP diagnostic en cas d’échec.

## 3. Rôle de chaque partie

| Partie | Rôle simple |
| --- | --- |
| `src/analyzer` | Détecte framework, pages, routes, composants, formulaires, services, modèles, état, UI et styles. |
| `src/catalog` | Charge et vérifie le fichier officiel `xelops-components.json`. |
| `src/mapper` | Compare chaque élément UI au catalogue et refuse toute supposition. |
| `src/generator` | Produit le projet Angular cible et conserve le comportement transférable. |
| `src/validator` | Vérifie installation, TypeScript, build Angular, lint, tests et conformité Xelops. |
| `src/reporter` | Explique décisions, erreurs, avertissements et éléments à revoir. |
| `src/exporter` | Crée, contrôle et expose les ZIP final et diagnostic. |
| `src/api` | Gère upload, statut, rapports et téléchargements. |
| `src/index.ts` | Assemble les modules et démarre le serveur. |
| `tests` | Vérifie chaque module et le parcours complet React/Angular. |
| `profiles/angular20` | Définit versions Angular/Xelops et conditions d’activation. |
| `specs/001-create-xelops-migrator` | Contient spécification, architecture, contrats, recherche et tâches. |

## 4. Architecture Angular générée

```text
src/app/
├── core/{api,guards,interceptors,services,models}
├── shared/{components,directives,pipes,utils,models}
├── features/<feature>/{pages,components,services,models,feature.routes.ts}
├── layouts/
└── app.component.ts, app.config.ts, app.routes.ts
```

L’Analyzer conserve les preuves source. Le Mapper n’utilise qu’un composant et une API
catalogués. Une correspondance certaine devient `mapped`, une incompatibilité devient
`unmapped`, et une ambiguïté devient `manual-review`. Le Generator traduit uniquement les
comportements prouvés et conserve les styles sûrs.

## 5. Validation, rapports et ZIP

Les six gates sont obligatoires : installation avec lockfile, TypeScript strict, build Angular
de production, lint, tests de l’application générée et conformité Xelops. Une gate échouée ou
ignorée empêche `completed`.

Le Reporter produit `migration-report.json` et `migration-report.md` depuis le même modèle.
L’Exporter exclut `node_modules`, builds, caches, logs, VCS, fichiers temporaires et secrets.
Une migration échouée peut recevoir un ZIP diagnostic marqué comme incomplet, jamais un ZIP final
validé.

## 6. API

- `POST /api/migrations` : démarrer une migration ;
- `GET /api/migrations/:id` : consulter le statut ;
- `GET /api/migrations/:id/report` : obtenir JSON ou Markdown ;
- `GET /api/migrations/:id/download` : télécharger le ZIP final ;
- `GET /api/migrations/:id/diagnostic-download` : télécharger le ZIP diagnostic.

Les migrations sont persistées sur disque, publiées atomiquement et protégées par token bearer.

## 7. État actuel

- [x] `npm run typecheck`
- [x] `npm run build`
- [ ] `npm run lint` : configuration typed ESLint à adapter pour `scripts/verify-artifact.mjs`.
- [ ] Tests Docker réels : Docker Desktop doit être démarré.
- [ ] Validation complète d’un projet Angular/Xelops généré.

## 8. Suivi des tâches

- [x] T001–T018 : fondations, modèles, stockage, sécurité et archive intake ;
- [x] T019–T033 : analyse, catalogue, mapper et architecture Angular ;
- [x] T034–T045 : transforms, génération, profil, conformité, validation et orchestration ;
- [x] T046–T050 : rapports et API de rapport ;
- [x] T051–T056 : ZIP final et téléchargement ;
- [x] T057–T058 : tests de récupération et contrat du ZIP diagnostic ;
- [ ] T059–T063 : ZIP diagnostic complet, reprise après erreur et rétention ;
- [ ] T064–T067 : end-to-end, limites, CI et documentation finale ;
- [ ] T068 : commit final, push vers `origin` et compte rendu.

## 9. Prochaines actions

1. Corriger la configuration ESLint.
2. Démarrer Docker Desktop et exécuter les tests d’isolation.
3. Terminer T059–T063.
4. Exécuter les tests end-to-end et la validation Angular/Xelops réelle.
5. Pousser uniquement les changements vérifiés vers le dépôt officiel.

Pour continuer, choisir la prochaine tâche non cochée dans
`specs/001-create-xelops-migrator/tasks.md`, lire ses contrats, implémenter son périmètre,
exécuter ses validations et documenter tout blocage dans
`specs/001-create-xelops-migrator/implementation-notes.md`.

