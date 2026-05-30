# MosaicStacked

MosaicStacked ist eine backend-first Console für Chat, Repository-Arbeit und Matrix-gestützte Wissensräume. Die Browseroberfläche zeigt Absicht, Status und Review-Flächen; die Runtime-Wahrheit liegt beim Backend.

Der aktuelle Stand ist kein reines Demo-Frontend: Chat, GitHub-Workbench, Matrix-Workspace, Settings und Performance sind als fünf Console-Flächen verdrahtet. Provider-IDs, GitHub-/Matrix-Credentials und Ausführungswahrheit bleiben serverseitig.

## Ist-Zustand

| Fläche | Stand | Authority |
| --- | --- | --- |
| Chat | Backend-gerouteter OpenRouter-Chat mit non-stream und SSE, `default-free` Alias und optionalen lokalen Profil-Credentials | Backend |
| Workbench | GitHub-App-basierte Repo-Auswahl, Context Reads, Vorschlagspläne, approval-gated Execute, Verify und Datei-/Tree-Reads | Backend |
| Matrix | WhoAmI, Joined Rooms, Scope Resolve/Summary, Provenienz, Topic Analyze, Plan Refresh, approval-gated Topic Execute und Verify | Backend |
| Settings | Integrationsstatus, OpenRouter-Credential-Status, Diagnostics, Journal, Work Mode und Verbindungstests | Backend + Browser-Intent |
| Performance | Lokale Core-Web-Vitals-, Bundle- und Gate-Evidenz ohne Live-CI-/Deploy-Behauptung | Browser + lokale Evidenz |
| Browser Shell | Fünf Tabs, mobile-first Layout, Truth Rail, Keyboard-Navigation, lokale Session-Wiederherstellung als UI-State | Browser |

Wichtig: Matrix Topic Write ist lokal über Routen und Tests vorhanden. Live-E2E gegen einen echten Matrix-Origin, Evidence-Room-Writes und erweiterte Hierarchieflächen bleiben opt-in bzw. begrenzt.

## Architektur

```mermaid
flowchart LR
  User["User"] --> Browser["Browser Console\nReact/Vite"]
  Browser -->|"bounded intent\nmodelAlias, approvals, selections"| Backend["Fastify Backend\nruntime authority"]
  Backend --> Models["OpenRouter\nprovider targets hidden"]
  Backend --> GitHub["GitHub App\ninstallation-scoped repos"]
  Backend --> Matrix["Matrix Homeserver\nserver-side token"]
  Backend --> Journal["Runtime Journal\nsanitized events"]
  Backend --> Browser

  Browser -. "local UI state only" .-> LocalStorage["localStorage\nrestored/stale state"]
```

## Authority-Regeln

- Backend besitzt Provider Calls, SSE-Framing, Modellrouting, GitHub-/Matrix-Credentials, Planung, Ausführung und Verifikation.
- Browser besitzt Rendering, lokale UI-State-Wiederherstellung, Navigation und Approval-Intent.
- Provider-IDs sind keine UI-Wahrheit.
- Matrix-Credentials dürfen nicht im Browser liegen.
- Wiederhergestellter Browserzustand ist nicht backend-frische Wahrheit.
- Malformed SSE, GitHub- oder Matrix-Antworten werden fail-closed behandelt.
- Browser Writes dürfen Backend-Approval-Gates nicht umgehen.

## Console-Flächen

```mermaid
flowchart TB
  Console["/console"] --> Chat["Chat"]
  Console --> Workbench["Workbench"]
  Console --> MatrixWs["Matrix"]
  Console --> Settings["Settings"]
  Console --> Perf["Performance"]

  Chat -->|"POST /chat"| ChatBackend["Chat Router"]
  Workbench -->|"api/github/*"| GitHubBackend["GitHub Routes"]
  MatrixWs -->|"api/matrix/*"| MatrixBackend["Matrix Routes"]
  Settings -->|"diagnostics / status / credentials"| SettingsBackend["Runtime + Integration Routes"]
  Perf -->|"local scripts / docs evidence"| PerfEvidence["Performance Gates"]
```

### Chat

- `POST /chat` akzeptiert bounded intent (`task`, `mode`, `preference`, `modelAlias`) und keine rohen Provider-Ziele.
- Streaming nutzt die Lifecycle-Reihenfolge `start -> route -> token* -> done|error`.
- `GET /models` liefert öffentliche Aliase, Labels, Capabilities und Verfügbarkeit, aber keine Provider-IDs.
- `default-free` wird serverseitig aus Profil-Credentials, Env-Konfiguration oder lokalem Dev-Fallback aufgelöst.
- `user_openrouter_default` nutzt backendseitig gespeicherte lokale Profil-Credentials.

### Workbench / GitHub

- GitHub-Verbindungen laufen über backend-owned Auth-Start/Callback und GitHub-App-Installation.
- Repository-Scope kommt primär aus der GitHub-App-Installationsauswahl; `GITHUB_ALLOWED_REPOS` kann Instance-Mode einschränken.
- Workbench liest Repo-Kontext, erzeugt Vorschlagspläne, zeigt Diffs und führt nur mit expliziter Freigabe aus.
- Execute bleibt zusätzlich durch `GITHUB_AGENT_API_KEY` bzw. `X-MosaicStacked-Admin-Key` geschützt.

### Matrix

- Read-Flächen: `whoami`, `joined-rooms`, Scope Resolve, Scope Summary, Room Provenance und Topic Access.
- Action-Flächen: Analyze, Plan Fetch/Refresh, approval-gated Execute und Verify für unterstützte Topic-Änderungen.
- Scope- und Planzustand ist backend-owned und TTL-/staleness-gebunden.
- Browser Composer- und Queue-Aktionen bleiben fail-closed, wenn kein passender backendseitiger Write-Contract aktiv ist.

### Settings

- Zeigt Backend Health, Modellstatus, GitHub-/Matrix-Verbindung, Rate Limits, Action Store, Journal und Routingstatus.
- Speichert OpenRouter-Credentials backendseitig pro lokalem Profil.
- Integration Connect/Reconnect/Disconnect/Reverify wird als backend-owned Intent gestartet.

### Performance

- Zeigt lokale Performance- und Qualitätsgates wie `npm run perf:bundle:web`, `npm run perf:lighthouse:tti`, Web-Typecheck, Web-Tests und Browser-Suite.
- Behandelt Lighthouse-/Bundle-Werte als lokale Evidenz, nicht als Live-CI-, Scheduler-, Deployment- oder Produktions-Telemetrie.
- Bleibt browserseitige Review-/Workflow-Fläche und führt keine GitHub-, Matrix- oder Provider-Writes aus.

## Approval-Flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant S as Backend
  participant G as GitHub/Matrix

  B->>S: Read context / resolve scope
  S-->>B: Sanitized context + authority metadata
  B->>S: Propose / analyze intent
  S-->>B: Plan ID + diff + requiresApproval
  B->>S: Explicit approval intent
  S->>G: Execute with server-side credentials
  G-->>S: Receipt / upstream state
  S-->>B: Execution result
  B->>S: Verify
  S->>G: Read back canonical state
  S-->>B: Verified / pending / failed
```

## Repository Map

| Pfad | Rolle |
| --- | --- |
| `web/` | Vite + React Console, UI-State, mobile Shell, Chat/Workbench/Matrix/Settings/Performance |
| `server/` | Fastify Authority Layer für Chat, GitHub, Matrix, Auth, Diagnostics und Journal |
| `api/[...path].ts` | Vercel Serverless Adapter für allgemeine Backend-Routen |
| `api/matrix/[...path].ts` | Separater Vercel Adapter für Matrix-Routen |
| `config/model-capabilities.yml` | Runtime-geladener Modellfähigkeits-Contract |
| `config/llm-router.yml` | Legacy-/Kompatibilitäts-Routing-Konfiguration |
| `docs/` | Vertiefende Contracts, Routing-, Deployment-, Test- und UX-Dokumente |
| `02-wiki/` | Governance Index und Append-only Log |
| `03-mspr/packets/` | Review-Packets für Risiken, Blocker und Authority-Lücken |

## Backend-Routen

| Bereich | Routen |
| --- | --- |
| Health/Models | `GET /health`, `GET /models`, `POST /models/openrouter` |
| Chat | `POST /chat` |
| Settings/OpenRouter | `GET /settings/openrouter/status`, `POST /settings/openrouter/credentials`, `POST /settings/openrouter/test` |
| Diagnostics/Journal | `GET /diagnostics`, `GET /journal/recent` |
| Local Auth | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Integrations | `GET /api/integrations/status`, `GET/POST /api/auth/{github,matrix}/*` |
| GitHub | `GET /api/github/capabilities`, `GET /api/github/repos`, `POST /api/github/context`, `POST /api/github/actions/propose`, `GET/POST /api/github/actions/:planId/*`, repo tree/file reads |
| Matrix | `GET /api/matrix/whoami`, `GET /api/matrix/joined-rooms`, `POST /api/matrix/scope/resolve`, `POST /api/matrix/analyze`, scope summary, provenance, topic access, action fetch/execute/verify |

## Lokal starten

```bash
npm install
cp .env.example .env
npm run dev:server
npm run dev:web
```

Standard-Ports:

- Backend: `127.0.0.1:8787`
- Vite Web: `127.0.0.1:5173`

Die Browser-App liest nur browserseitige Overrides. Secrets gehören in die repo-root `.env` und bleiben backendseitig.

## Wichtige Env-Flächen

| Zweck | Variablen |
| --- | --- |
| OpenRouter Profil-Credentials | `USER_CREDENTIALS_ENCRYPTION_KEY`, `USER_CREDENTIALS_PROFILE_SECRET`, `USER_CREDENTIALS_STORE_MODE` |
| Default-Free Routing | `OPENROUTER_API_KEY`, `OPENROUTER_DEFAULT_MODEL`, `OPENROUTER_DEFAULT_LABEL` |
| Routing Policy | `MODEL_ROUTING_MODE`, `ALLOW_MODEL_FALLBACK`, `MODEL_ROUTING_FAIL_CLOSED` |
| GitHub App | `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_SLUG`, `GITHUB_APP_INSTALLATION_ID` |
| GitHub OAuth Install/Auth | `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_OAUTH_CALLBACK_URL` |
| Approval-Gated GitHub Execute | `GITHUB_AGENT_API_KEY` |
| Integration Auth Store | `MOSAIC_STACK_SESSION_SECRET`, `INTEGRATION_AUTH_ENCRYPTION_CURRENT_KEY`, `INTEGRATION_AUTH_STORE_MODE` |
| Matrix | `MATRIX_ENABLED`, `MATRIX_BASE_URL`, `MATRIX_SSO_CALLBACK_URL`, `MATRIX_ACCESS_TOKEN`, `MATRIX_EXPECTED_USER_ID` |
| Matrix Evidence Writes | `MATRIX_EVIDENCE_WRITES_ENABLED`, `MATRIX_EVIDENCE_*_ROOM_ID` |

## Deployment

```mermaid
flowchart LR
  Repo["Repo Root"] --> Build["npm run build"]
  Build --> WebDist["web/dist"]
  Build --> ServerTs["server TypeScript build"]
  Vercel["Vercel"] --> WebDist
  Vercel --> ApiMain["api/[...path].ts"]
  Vercel --> ApiMatrix["api/matrix/[...path].ts"]
  ApiMain --> App["server/src/app.ts"]
  ApiMatrix --> App
```

Vercel-Shape:

- Project root: Repo root
- Build command: `npm run build`
- Output directory: `web/dist`
- API entrypoints: `api/[...path].ts` und `api/matrix/[...path].ts`
- Secrets: ausschließlich serverseitige Vercel Environment Variables

## Verifikation

Empfohlener lokaler Gate:

```bash
npm run typecheck
npm test
npm run build
```

Fokussierte Checks:

```bash
npm run typecheck:server
npm run test:server
npm run typecheck:web
npm run test:web
npm run test:browser
```

Opt-in Live-Smokes:

```bash
npm run test:matrix-live
npm run test:matrix-evidence-live
npm run test:integration-auth-rotation-live
npm run test:integration-auth-rotation-live:matrix
npm run test:integration-auth-rotation-live:both
```

## Aktuelle Grenzen

- Live Matrix E2E gegen einen echten Origin ist opt-in und nicht Teil des Standard-Gates.
- Evidence-Room-Writes sind konfigurierbar, aber standardmäßig deaktiviert.
- Matrix-Hierarchie ist als Browser-/Contract-Fläche getrennt zu behandeln, solange kein vollständiger Server-Contract verifiziert ist.
- Undo, Cross-device Sync, Bulk Review Queue, langlebige serverless Action Stores und erweiterte Observability bleiben nachgelagert.
- Lokale `memory`-/`file`-Stores sind Entwicklungs- und Preview-Hilfen, keine dauerhafte Produktionspersistenz.

<!-- workspace-root-sync:readme:start -->
## Workspace Integration

This repository lives under `/home/baum/Schreibtisch/workspace/main_projects`. Its local `README.md`, `AGENTS.md`, `docs/`, manifests, contracts, validators, tests, and workflow files remain the authority for repo-specific product, runtime, archive, and implementation truth.

The workspace root is a routing and orientation layer. It points agents and humans to the correct authority surface; it must not be treated as a replacement for this repository's local truth.

### Workspace Work Path

```text
frontdoor -> authority check -> scope check -> reusable-surface check -> smallest safe work -> verification -> evidence / next gate
```

When work enters from the workspace root:

1. Read root `README.md` and root `AGENTS.md`.
2. Read this repository's `README.md`, `AGENTS.md`, and relevant local docs or contracts.
3. Identify the owning authority, scope, next gate, expected write targets, and validation path.
4. Check whether existing repo-local or shared-core assets already cover the task.
5. Make the smallest safe change and verify it locally.
6. Close with evidence, unresolved gaps, and the next re-entry pointer.

### Cross-Repo And Reusable Work

- Use portfolio surfaces for workspace inventory, cross-repo coordination, intake, disposition, daily notes, commit evidence, and re-entry tracking.
- Use `model-agnostic-workflow-system/` for reusable skills, contracts, templates, validators, provider exports, and workflow routing patterns.
- Do not duplicate root, portfolio, shared-core, or chat-room governance here unless this repository deliberately adopts a local copy.
- If this repository is `model-agnostic-workflow-system`, its own `AGENTS.md` and `WORKFLOW.md` are the local shared-core authority before reusable behavior is exported elsewhere.

### Evidence And Closure

Close meaningful work with:

- `Observed` facts from exact paths or commands;
- `Inferred` conclusions clearly labelled;
- `Applied` changes with exact paths;
- `Verified` checks or read-backs;
- `BLOCKED` items where authority, source, scope, validation, or permissions are insufficient;
- the next gate or re-entry pointer.

Do not treat summaries, imports, chat notes, MSPR packets, loose docs, archives, or derived knowledge as canonical truth until the owning surface has reviewed and promoted them.
<!-- workspace-root-sync:readme:end -->
