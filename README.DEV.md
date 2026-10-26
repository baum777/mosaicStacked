# MosaicStacked – Entwicklung & Betrieb

**Technische Referenz für Mitwirkende, Maintainer und Betreiber.**

Für Produktidee, Funktionsumfang und eine Einführung ohne Entwicklungskenntnisse siehe [README.md](./README.md). Dieses Dokument beschreibt die Implementierung, die wichtigsten Sicherheitsgrenzen, den lokalen Start, Verifikation und Deployment. Es ist keine Behauptung, dass jede externe Integration produktiv end-to-end verifiziert ist.

## 1. Technischer Überblick

MosaicStacked ist ein npm-Workspace-Monorepo mit einer React-/Vite-Oberfläche und einem Fastify-/TypeScript-Backend. Die UI zeigt Arbeitskontext, Status und Freigabeabsichten. Der Server besitzt Credentials, Modellrouting, externe Zugriffe, Ausführungslogik und kanonische Antworten.

~~~mermaid
flowchart LR
  U["Browser: React / Vite"] -->|"begrenzt formulierter Intent"| F["Fastify Backend"]
  F --> O["OpenRouter"]
  F --> GH["GitHub App / OAuth"]
  F --> MX["Matrix Homeserver"]
  F --> J["Runtime Journal"]
  F -->|"Status, Plan, Receipt, Verify"| U
  U -. "lokaler Anzeigezustand" .-> LS["localStorage"]
~~~

**Authority-Vertrag:**

| Ebene | Verantwortung | Nicht zulässig |
| --- | --- | --- |
| Browser | Navigation, Rendering, Sitzungs-/Anzeigezustand, Auswahl, Approval-Intent | Provider-Ziel als vertrauliche Wahrheit behandeln; Backend-Gates umgehen |
| Backend | API-Aufrufe, Credentials, Modellrouting, SSE, Planung, Ausführung, Verifikation | Browser-Daten ungeprüft zu Rechten oder verifiziertem Zustand erheben |
| GitHub / Matrix | Externe Zielzustände | Allein aus einem HTTP-Erfolg einen unverifizierten Zielzustand ableiten |
| Runtime Journal | Bereinigte Ereignisse und Korrelation, soweit vorhanden | Mit einem dauerhaften, unabhängigen Audit-Speicher gleichsetzen |

Ein **Approval-Intent** ist nicht automatisch ein gültiger Grant. Ein **Execution-Receipt** ist nicht automatisch eine **Verification**. Fehlende Autorität oder uneindeutige Antworten müssen blockiert statt stillschweigend korrigiert werden.

## 2. Repository-Struktur

| Pfad | Aufgabe |
| --- | --- |
| `web/` | React-/Vite-Konsole und die neun UI-Workspace-Modi |
| `web/src/App.tsx` | Navigation, UI-Orchestrierung, gemeinsame Workspace-Zustände |
| `web/src/components/` | Chat, Workbench, Review, Community, Models, Evidence, Matrix, Settings, Performance |
| `server/` | Fastify-Anwendung, Authentisierung, Integration und Runtime |
| `server/src/app.ts` | Registriert die Backend-Routen und ihre Abhängigkeiten |
| `server/src/routes/` | Chat-, Modell-, GitHub-, Matrix-, Auth-, Settings-, Diagnostik-Routen |
| `api/[...path].ts` | Vercel-Serverless-Adapter für allgemeine API-Routen |
| `api/matrix/[...path].ts` | Separater Vercel-Adapter für Matrix |
| `config/model-capabilities.yml` | Modellfähigkeiten und öffentlich verwendbare Aliase |
| `config/llm-router.yml` | Routing-/Kompatibilitätskonfiguration |
| `tests/`, `web/test/`, `server/test/`, `cypress/` | Verifikations- und Browser-Testflächen |
| `scripts/`, `ops/` | Smoke-, Performance- und Betriebswerkzeuge |
| `docs/` | Spezifische technische Verträge, UI, Test- und Betriebsdokumentation |
| `02-wiki/` | Governed Index und Arbeitslog |
| `03-mspr/packets/` | Review-Packets für offene Governance-/Authority-Fragen |

**Dokumentationshierarchie:** Für Architektur und aktuelles Verhalten gelten tatsächlich ausgeführter Code, Tests und die jeweiligen repo-lokalen Verträge. Ältere Pläne und Auditberichte sind keine automatische Aussage über den heutigen Runtime-Zustand.

## 3. Lokale Entwicklungsumgebung

**Voraussetzungen:** Node.js 24, npm und ein Terminal. Für echte Integrationstests sind zusätzliche Konten und Zugangsdaten notwendig.

~~~bash
git clone https://github.com/baum777/mosaicStacked.git
cd mosaicStacked
npm ci
cp .env.example .env
~~~

Trage in `.env` nur die für deinen Anwendungsfall erforderlichen Werte ein; verwende die Kommentare in `.env.example` als Referenz. Für Chat wird ein gültiger Modellzugang benötigt. Ohne konfigurierten Provider können Modellaufrufe bewusst fehlschlagen.

Starte Backend und Frontend in **zwei Terminals**:

~~~bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:web
~~~

Vorgesehene lokale Adressen:

- Backend: `http://127.0.0.1:8787`
- Web-Entwicklungsserver: `http://127.0.0.1:5173`
- Konsole: `http://127.0.0.1:5173/console`

`npm run dev` ist **kein** kombinierter Startbefehl; das Script verweist absichtlich auf die beiden getrennten Kommandos.

### Konfiguration und Zugangsdaten

| Bereich | Beispiele | Grundsatz |
| --- | --- | --- |
| OpenRouter | `OPENROUTER_API_KEY`, `OPENROUTER_DEFAULT_MODEL` | Credentials serverseitig |
| Profil-Credentials | `USER_CREDENTIALS_ENCRYPTION_KEY`, `USER_CREDENTIALS_PROFILE_SECRET`, `USER_CREDENTIALS_STORE_MODE` | Schlüssel und Speicherart bewusst wählen |
| Routing | `MODEL_ROUTING_MODE`, `ALLOW_MODEL_FALLBACK`, `MODEL_ROUTING_FAIL_CLOSED` | Unerlaubten Fallback verhindern |
| GitHub App | `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID` | Installation und Repository-Scope begrenzen |
| GitHub OAuth | `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_OAUTH_CALLBACK_URL` | Callback und Tokens backendseitig |
| GitHub-Execute | `GITHUB_AGENT_API_KEY` | Zusätzliche Schutzgrenze für ausführende Aktionen |
| Integration-Auth | `MOSAIC_STACK_SESSION_SECRET`, `INTEGRATION_AUTH_ENCRYPTION_CURRENT_KEY`, `INTEGRATION_AUTH_STORE_MODE` | Sitzung und gespeicherte Integrationsdaten schützen |
| Matrix | `MATRIX_ENABLED`, `MATRIX_BASE_URL`, `MATRIX_ACCESS_TOKEN`, `MATRIX_EXPECTED_USER_ID` | Write-Gates und tatsächliche Berechtigungen beachten |

Dies ist eine Auswahl, keine vollständig gültige Konfigurationsvorlage. `.env.example`, die Env-Validatoren und die jeweiligen Integrationsverträge sind maßgeblich. Keine echten Zugangsdaten committen oder in Tests, Screenshots, Logs und Issues veröffentlichen.

## 4. Funktionsbereiche und Grenzen

Die aktive App-Navigation kennt die Modi `chat`, `workbench`, `review`, `community`, `models`, `evidence`, `matrix`, `settings`, `perf`. Die Landingpage hebt derzeit vier Einstiegsflächen hervor: Chat, Workbench, Matrix und Settings. Beide Beschreibungen sind daher nur mit ihrem jeweiligen Kontext richtig.

| Surface | Implementierungsprinzip | Wichtige Grenze |
| --- | --- | --- |
| Chat | Backend-geroutete OpenRouter-Anfragen, non-stream und SSE | Kein direkter Providerzugriff aus dem Browser; gültiger Modellzugang nötig |
| Workbench | GitHub-App-Auswahl, Repo-Context, Plan/Diff, Execute, Verify | Repo-Scope, Backend-Approval und zusätzlicher Execute-Schutz |
| Matrix | WhoAmI, Rooms, Scope, Provenienz, Analyze, Topic-Plan/Execute/Verify | Live-Origin-E2E nicht pauschal nachgewiesen; Composer-/Hierarchie-Features teils begrenzt |
| Review | Zusammenführung von GitHub-/Matrix-Prüfobjekten | Markierung kann lokal sein; Ausführung bleibt im zuständigen Ursprungsworkflow |
| Community | Kontext-/Raumentdeckung aus Matrix-Session | Lesende Discovery, kein eigener Chat-/Post-Write |
| Models | Öffentliche Modell-Aliase, Fähigkeiten, Verfügbarkeit, Routing | Interne Provider-Ziele nicht an UI ausgeben |
| Evidence | Journal, Diagnostik und daraus abgeleitete Timeline | Kein Nachweis für dauerhaftes externes Auditarchiv |
| Settings | Backend-/Integrationszustand, Credentials- und Verbindungsprüfung | Connection-Status ersetzt keinen Berechtigungs-/Live-Smoke |
| Performance | Lokale Lighthouse-/Bundle-Snapshots und Gates | Keine Live-CI-/Produktions-Telemetrie |

### Generischer kontrollierter Ablauf

~~~text
Read context
  → Propose / Analyze
  → Plan + diff + scope
  → Human approval intent
  → Backend checks authorization, freshness and policy
  → Execute if permitted
  → Receipt
  → Independent readback / Verify
~~~

Dieses Schema beschreibt das Sicherheitsprinzip, nicht die Garantie einer universellen, vollständig implementierten Aktions-Engine für jede Surface.

### Chat und SSE

- `POST /chat` akzeptiert begrenzten Intent und öffentliche Modell-Aliase, keine frei eingebbaren internen Provider-Ziele.
- `GET /models` liefert eine UI-taugliche öffentliche Registry.
- Der Stream folgt `start → route → token* → done|error`; es darf genau ein terminales Ereignis geben.
- Fehlerhafte Streams und inkonsistente Responses werden sichtbar als Fehler behandelt; nicht still reparieren.
- Der Alias `default-free` wird backendseitig aufgelöst; das ist keine Garantie auf kostenfreien oder stets erreichbaren Providerzugang.

### GitHub

- Authentisierung und Repository-Scope orientieren sich an der GitHub-App-Installation und der serverseitigen Integrationskonfiguration.
- Repo-Auswahl, Context/Tree/File Reads und Vorschlagspläne sind vom aktiven Execute-Gate getrennt.
- Änderungen dürfen nur mit gültigem, nicht veraltetem Plan, passender Autorität und notwendigen Freigaben ausgeführt werden.
- Ein als „genehmigt“ dargestellter UI-Zustand allein reicht nicht als Backend-Autorisierung.

### Matrix

- Backend-Routen stellen lesende Scope-/Room-Informationen und für unterstützte Topic-Aktionen Plan/Execute/Verify bereit.
- Live-E2E gegen einen echten Matrix-Origin gehört zu den **opt-in**-Prüfungen und darf nicht aus lokalen Tests abgeleitet werden.
- Der Matrix-Composer bleibt bei fehlendem Write-Contract blockiert; Community ist getrennt als Discovery-Ansicht zu verstehen.
- Die Hierarchievorschau ist nicht mit verifizierter Backend-Autorität gleichzusetzen. Siehe [Matrix-Raumtaxonomie](./docs/matrix-room-taxonomy.md).

## 5. API-Übersicht

Maßgeblich sind `server/src/app.ts`, `server/src/routes/` und die zugehörigen Route-Tests.

| Bereich | Ausgewählte Routen |
| --- | --- |
| Runtime/Modelle | `GET /health`, `GET /models`, `POST /models/openrouter` |
| Chat | `POST /chat` |
| OpenRouter-Settings | `GET /settings/openrouter/status`, `POST /settings/openrouter/credentials`, `POST /settings/openrouter/test` |
| Diagnostics | `GET /diagnostics`, `GET /journal/recent` |
| Auth/Integrationen | `/api/auth/*`, `/api/integrations/status` |
| GitHub | `/api/github/capabilities`, `/api/github/repos`, `/api/github/context`, `/api/github/actions/*` |
| Matrix | `/api/matrix/whoami`, `/api/matrix/joined-rooms`, `/api/matrix/scope/*` und die implementierten Topic-Action-Routen |

Nicht jede Route ist ohne aktive Integration, Berechtigung oder Flag benutzbar. Fehlende Konfiguration ist ein eigener Betriebszustand und darf nicht durch Mock-Erfolg maskiert werden.

## 6. Tests und lokale Verifikation

~~~bash
# Schneller Standard für Codeänderungen
npm run typecheck
npm test
npm run build

# Browser-Suite zusätzlich
npm run test:browser

# Sammel-Gates
npm run smoke:local
npm run smoke:ci
~~~

Gezielte Tests:

~~~bash
npm run typecheck:server
npm run typecheck:web
npm run test:server
npm run test:web
npm run cypress:run
npm run perf:bundle:web
npm run perf:lighthouse:tti
~~~

**CI-Abgrenzung:** `.github/workflows/ci.yml` führt aktuell `npm ci`, `npm run typecheck`, `npm run test` und `npm run build` aus. Das Script `npm run smoke:ci` enthält zusätzlich die Browser-Suite; es ist nicht identisch mit den tatsächlich im CI-Workflow konfigurierten Schritten.

Opt-in Live-Prüfungen sind u. a.:

~~~bash
npm run test:matrix-live
npm run test:matrix-evidence-live
npm run test:integration-auth-rotation-live
npm run test:integration-auth-rotation-live:matrix
npm run test:integration-auth-rotation-live:both
~~~

Live-Smokes nur mit absichtlich eingerichteten Testkonten, geeignetem Scope und bekannten Auswirkungen ausführen. Die Existenz eines Testkommandos beweist nicht, dass es in der aktuellen Umgebung erfolgreich gelaufen ist.

## 7. Deployment (Vercel)

Die Konfiguration in `vercel.json` definiert:

- Frontend-Build: `npm run build:web`
- Statisches Ergebnis: `web/dist`
- Serverless-Routen: `api/[...path].ts` und `api/matrix/[...path].ts`
- API-Rewrites u. a. für `/health`, `/models`, `/chat`, `/api/github/*`, `/api/matrix/*`
- Runtime-Konfigurationsdateien, die für die Funktionen gebündelt werden

**Wichtig:** Der Root-Befehl `npm run build` baut lokal Web und Server. Er ist **nicht** der in `vercel.json` eingestellte Frontend-Build-Befehl.

Der Workflow `.github/workflows/vercel-deploy.yml` reagiert auf Pushes zu `main` und kann ein Produktionsdeployment ausführen. Fehlen Vercel-Credentials, wird der Deploy-Schritt laut Workflow **übersprungen**. Aus einer Workflow-Datei allein lässt sich kein erfolgreicher aktueller Produktionsdeploy ableiten. Referenz: [Vercel-Deployment](./docs/vercel-deployment.md).

Lokale Datei-/Memory-Stores, Vercel-Serverless-Prozesse und browserseitige Wiederherstellung sind nicht automatisch langlebige, geräteübergreifende Zustandsverwaltung. Für produktive Nutzung Persistenz und Betriebsgrenzen separat prüfen.

## 8. Beiträge, Änderungen und Governance

Vor größeren Änderungen lesen:

1. [AGENTS.md](./AGENTS.md) – Authority- und Sicherheitsvertrag;
2. [WORKFLOW.md](./WORKFLOW.md) – repo-lokale Entry-/Review-/Log-Sequenz;
3. [02-wiki/index.md](./02-wiki/index.md) – kanonische und abgeleitete Dokumente;
4. [CHANGELOG.md](./CHANGELOG.md) – nachvollziehbare Produktänderungen.

Kleine, prüfbare Pull Requests bevorzugen. Für jeden bedeutenden Eingriff Ziel, Owner/Scope, betroffene Verträge, kleinstes Gate, Änderungen, Evidenz und verbleibende Risiken festhalten. Neue persistente Dokumentationsflächen gemäß `WORKFLOW.md` auch im Wiki-Index registrieren.

**Stop-/Review-Kriterien:** Bei unklarer Autorität, widersprüchlichen Quellen, nicht überprüfbaren Annahmen, fehlenden Berechtigungen oder Gefahr für fremde Arbeit blockieren und menschliches Review anfordern. Governance-Befunde können als MSPR-Packet unter `03-mspr/packets/` dokumentiert werden.

**Security:** Niemals echte `.env`-Dateien, API-Keys, private Schlüssel, Token oder sensible Matrix-/GitHub-Daten ins Repository aufnehmen. Schwachstellen nicht als öffentlich reproduzierbare Exploit-Anleitungen melden; private Kontaktaufnahme mit den Maintainers bevorzugen.

**Lizenz/Beiträge:** Die rechtlichen Nutzungsrechte richten sich nach einer tatsächlich veröffentlichten `LICENSE`-Datei. Eine erst entworfene, noch nicht eingecheckte Lizenz verleiht noch keine Rechte. Falls `CONTRIBUTING.md` veröffentlicht ist, gilt es ergänzend zu den repo-lokalen Authority-Verträgen.

## 9. Referenzdokumente

- [README.md](./README.md) – Anwenderbeschreibung
- [docs/model-routing.md](./docs/model-routing.md) – Modellrouting
- [docs/vercel-deployment.md](./docs/vercel-deployment.md) – Serverless-Topologie und Deployment
- [docs/test-matrix.md](./docs/test-matrix.md) – Testmatrix
- [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) – Performance-Gates
- [docs/ui-spec.md](./docs/ui-spec.md) – UI-Spezifikation und historische/aktuelle Evidenz
- [docs/matrix-evidence-room-write-contract.md](./docs/matrix-evidence-room-write-contract.md) – Matrix-Evidence-Write-Vertrag
- [AUDIT_REPORT.md](./AUDIT_REPORT.md) – datierter Audit-Snapshot; nicht als zeitlos aktueller Status lesen

### Workspace-Root-Kontext

MosaicStacked kann in einem übergeordneten Workspace liegen. Dessen Root-Dokumente dienen Routing und Orientierung, **nicht** der Ersetzung repo-lokaler Implementierungs- und Laufzeitwahrheit. Der dafür geltende Arbeitsvertrag steht in [AGENTS.md](./AGENTS.md). Bei Konflikten oder nicht belegbarem Status keine automatische Promotion; Review oder `BLOCKED` dokumentieren.
