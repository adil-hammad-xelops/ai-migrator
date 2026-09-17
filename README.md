# Xelops AI Migrator

Backend service that migrates a React or Angular frontend application into an
Angular application built on the Xelops component library (`@xelops-ui/angular`).
See [specs/001-create-xelops-migrator](specs/001-create-xelops-migrator/spec.md) for
the full specification, plan, data model and API contracts.

## Requirements

- Node.js `24.15.0` (see `.node-version`; pinned in CI to this exact patch, not floating latest)
- npm `9.x` or later
- Docker (or another OCI-compatible container runtime) for sandboxed validation

## Setup

```sh
npm install
cp .env.example .env   # then fill in MIGRATOR_AUTH_TOKEN and MIGRATOR_STORE_ROOT
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Strict TypeScript compile check (`tsc --noEmit`), no emit |
| `npm run lint` | Typed ESLint across `src/` and `tests/` |
| `npm run build` | Emit backend source to `dist/` via `tsconfig.build.json` |
| `npm start` | Run the compiled server (`dist/index.js`) |
| `npm run dev` | Run the server from source with `tsx watch` |
| `npm test` | Run the full Vitest suite (unit, contract, integration, generated-project) |
| `npm run test:unit` \| `test:contract` \| `test:integration` \| `test:generated-project` | Run one focused suite |

Run a single test file or case directly, e.g.:

```sh
npx vitest run tests/unit/catalog.test.ts
npx vitest run tests/contract/migration-api.test.ts -t "returns 401"
```

## Environment variables

See `.env.example`. All variables are required in production; there is no insecure
default token, store root, host, or port beyond `127.0.0.1:3000`, which is deliberately
loopback-only. Put TLS termination and remote access behind a trusted reverse proxy.

## Private registry access

`@xelops-ui/angular@0.0.5` is published to `https://nexus.xelops.ma/repository/npm_repo`.
Access requires a local `.npmrc` (not committed — see `.gitignore`) with a scoped registry,
`_auth` credential and `always-auth=true`. That registry's TLS certificate is not trusted by
default; `.npmrc` currently sets `strict-ssl=false` to work around it, which disables
certificate validation for all npm registry traffic system-wide for this project. Prefer
narrowing this (e.g. `cafile`/`ca` pointing at nexus's actual CA) once available, rather than
leaving TLS validation off long term.

See `specs/001-create-xelops-migrator/implementation-notes.md` for current task status.
See [PROJECT-TRACKER.md](PROJECT-TRACKER.md) for the current progress and a simple explanation
of each backend module.
