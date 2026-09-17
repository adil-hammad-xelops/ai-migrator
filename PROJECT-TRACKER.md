# Xelops AI Migrator — Project Tracker

Repository: `https://github.com/adil-hammad-xelops/ai-migrator.git`

Current branch: `main`

## Current status

The project is in the foundation phase. The Node.js/TypeScript setup, strict compiler
rules, catalog loading, storage primitives, archive intake, sandbox runner, initial report
generation and foundation tests are prepared. Tasks T001–T018 are marked complete in
`specs/001-create-xelops-migrator/tasks.md`.

The next work is the real migration flow: analyze a React or Angular project, map its UI,
generate Angular, validate it, report the result and export a ZIP.

Progress: **19 / 68 tasks complete**.

## Each part in simple words

| Part | Simple role |
| --- | --- |
| `src/analyzer` | Reads the uploaded project and finds pages, routes, components, forms, services, models, state, styles and UI elements. It only analyzes; it does not change the source. |
| `src/catalog` | Loads the official `xelops-components.json`. This is the list of components the system is allowed to use. |
| `src/mapper` | Compares detected UI elements with the catalog. It returns `mapped`, `unmapped` or `manual-review`; it never guesses a component. |
| `src/generator` | Creates the standardized Angular project with the approved Xelops architecture and transfers safe business behavior. |
| `src/validator` | Runs the six required checks: install, TypeScript, Angular build, lint, tests and Xelops compliance. |
| `src/reporter` | Explains what happened in `migration-report.json` and `migration-report.md`, including warnings, errors and remaining work. |
| `src/exporter` | Creates and verifies the final ZIP, or a clearly labeled diagnostic ZIP for a failed partial migration. |
| `src/api` | Receives uploads, starts jobs, returns status/reports and serves the available ZIP. |
| `src/index.ts` | Starts the backend and connects all modules together. |
| `tests` | Checks each part separately and tests the full migration with React and Angular fixtures. |
| `profiles/angular20` | Defines the exact Angular/Xelops versions and the checks required before that profile can be used. |
| `specs/001-create-xelops-migrator` | Contains the agreed requirements, design, API contract and implementation tasks. |

## How one migration works

```text
ZIP upload
   ↓
Analyzer → Mapper → Generator → Validator → Reporter → ZIP Exporter
   ↓          ↓         ↓           ↓          ↓            ↓
inventory  decisions  Angular    six gates  JSON/MD      verified ZIP
```

1. The API stores the ZIP safely and gives it an ID.
2. The Analyzer understands the source project.
3. The Mapper checks every UI element against the catalog.
4. The Generator creates the fixed Angular structure.
5. The Validator checks that the generated project really works.
6. The Reporter explains every decision.
7. The Exporter publishes a final ZIP only after all required checks pass.

## Next milestones

- [ ] T019–T045: complete source analysis, mapping, Angular generation and validation.
- [ ] T046–T050: complete JSON/Markdown reporting and report API.
- [ ] T051–T056: complete verified final ZIP delivery.
- [ ] T057–T063: complete failure recovery and diagnostic ZIP delivery.
- [ ] T064–T067: run end-to-end, security, performance and CI checks.
- [ ] T068: commit the verified implementation and push it to `origin`.

## How to use this tracker

Work in task order. Read the selected task in `tasks.md`, implement only that task, run
its acceptance checks, then mark its checkbox only when the checks pass. If a dependency
or external package is unavailable, leave the task unchecked and record the blocker in
`specs/001-create-xelops-migrator/implementation-notes.md`.
