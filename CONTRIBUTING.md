# Contributing to MosaicStacked

Danke für dein Interesse an MosaicStacked. Beiträge durch Code, Tests, Dokumentation, Sicherheitsverbesserungen, Fehlerberichte und Architektur-Feedback sind willkommen.

MosaicStacked ist eine **backend-first Console** für Chat, GitHub-Workbench und Matrix-gestützte Wissensräume. Das Projekt verfolgt ein einfaches Prinzip: **Die Oberfläche zeigt Absichten und Prüfmöglichkeiten; das Backend ist die maßgebliche Instanz für Berechtigungen, Ausführung und Verifikation.** Beiträge sollen diese Trennung erhalten.

## 1. Bevor du beginnst

- Lies [README.md](./README.md) für Architektur, Funktionsumfang und bekannte Grenzen.
- Lies [AGENTS.md](./AGENTS.md) für die verbindlichen technischen Schutzgrenzen.
- Lies [WORKFLOW.md](./WORKFLOW.md) und die für deinen Beitrag relevanten Dateien in [`docs/`](./docs/) für Ablauf und Verträge.
- Suche zunächst nach einem bestehenden Issue oder Pull Request. Für größere Features, API-Änderungen und Governance-Entscheidungen ist eine vorherige Diskussion in einem Issue sinnvoll.
- Externe Mitwirkende benötigen **keinen Zugriff auf den lokalen Workspace des Maintainers**. Repo-interne Dokumente und überprüfbare Tests sind die Grundlage für öffentliche Beiträge.

## 2. Was du beitragen kannst

Insbesondere hilfreich sind:

- Reproduzierbare Bugfixes und Regressionstests
- Verbesserungen an Bedienbarkeit, Barrierefreiheit und mobilen Ansichten
- Zusätzliche Tests für GitHub-, Matrix- und OpenRouter-Integrationen
- Sicherheitsverbesserungen bei Authentifizierung, Credential-Handhabung, Berechtigungen und Approval-Flows
- Präzisere Dokumentation, Beispiele und Fehlermeldungen
- Performance-Verbesserungen mit nachvollziehbaren Messdaten

Große Refactorings und neue Laufzeitabhängigkeiten sollten vorab in einem Issue begründet und abgegrenzt werden.

## 3. Lokales Entwicklungssetup

Voraussetzung: **Node.js 24**, npm und Git. Die CI verwendet Node.js 24.

```bash
git clone https://github.com/baum777/mosaicStacked.git
cd mosaicStacked
npm ci
cp .env.example .env
```

Starte Backend und Web-Konsole in **zwei Terminals**:

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:web
```

Standardmäßig ist das Backend unter `127.0.0.1:8787`, die Web-Konsole unter `127.0.0.1:5173` erreichbar. Konfiguriere nur Integrationen, die du für deinen Beitrag brauchst. Trage niemals echte Zugangsdaten in Issues, Pull Requests oder Tests ein.

Projektstruktur:

| Pfad | Verantwortung |
| --- | --- |
| `server/` | Backend, Authentifizierung, Provider-/Integration-Routing, Ausführung und Verifikation |
| `web/` | React/Vite-Konsole, Darstellung, lokale UI-Zustände und Approval-Intent |
| `api/` | Vercel-API-Adapter |
| `config/` | Routing- und Modellkonfiguration |
| `tests/`, `server/test/`, `web/test/`, `cypress/` | Tests und Integration-Smokes |
| `docs/`, `02-wiki/` | Verträge, Architektur und Entscheidungs-/Arbeitsnachweise |

## 4. Architektur- und Sicherheitsregeln

Diese Regeln gelten auch für experimentelle Beiträge und KI-generierten Code:

1. **Backend Authority:** Provider-Aufrufe, Modellrouting, Zugangsdaten, Ausführung und Verifikationsstatus bleiben serverseitig. Der Browser darf sie nicht als eigene Autorität ersetzen.
2. **Explizite Freigabe:** Schreibende Aktionen gegenüber GitHub oder Matrix dürfen vorhandene Approval-, Scope-, Authentifizierungs- und Berechtigungsprüfungen nicht umgehen.
3. **Keine Secrets im Client:** API-Keys, GitHub-App-Private-Keys, Matrix-Tokens und ähnliche Geheimnisse gehören nicht in Browser-Bundles, Logs, Commits oder Testfixtures.
4. **Fail-closed:** Ungültige, unvollständige oder mehrdeutige SSE-, GitHub- und Matrix-Antworten dürfen nicht stillschweigend als erfolgreich oder verifiziert behandelt werden.
5. **Status ist nachweisbar:** Unterscheide zwischen implementiert, lokal getestet, live verifiziert, nur spezifiziert und noch nicht verfügbar. Ein Receipt allein ist kein Read-back-Nachweis.
6. **Klein und überprüfbar:** Begrenze Änderungen auf einen klaren Zweck. Vermeide beiläufige Änderungen an Governance-Konfiguration, Grants, Deployments oder anderen Repositories.

Änderungen an Authentifizierung, Approval-Gates, Scopes, Routing, Credential-Speicherung oder externen Schreiboperationen benötigen eine nachvollziehbare Risikoanalyse und passende Negativtests. **Ein PR wird nicht allein deshalb freigegeben, weil die UI funktioniert.**

## 5. Änderungen vorbereiten

Erstelle einen Branch von `main`:

```bash
git checkout main
git pull --ff-only
git checkout -b fix/kurze-beschreibung
```

Für substanzielle Änderungen beschreibe kurz:

- **Ziel und Scope:** Was wird geändert und was ausdrücklich nicht?
- **Authority/Contract:** Welche bestehende API, Regel oder Datei ist maßgeblich?
- **Risiko:** Welche Berechtigungen, Daten, Drittanbieter oder Ausführungswege sind betroffen?
- **Nachweis:** Welcher Test oder Read-back kann den gewünschten Zustand bestätigen?

Schreibe nach Möglichkeit zuerst einen Test, der den Fehler oder die neue Anforderung sichtbar macht. Ändere dann nur so viel wie notwendig. Aktualisiere relevante Dokumentation und bei nutzerrelevanten Änderungen den Abschnitt `Unreleased` in [CHANGELOG.md](./CHANGELOG.md).

## 6. Tests und Qualitätsprüfung

Führe vor einem Pull Request mindestens die für deine Änderung relevanten Checks aus. Der reguläre CI-Pfad umfasst:

```bash
npm run typecheck
npm run test
npm run build
```

Für Änderungen an Browser-Interaktionen zusätzlich:

```bash
npm run test:browser
```

Ein umfassender lokaler Durchlauf ist möglich mit:

```bash
npm run smoke:local
```

Live-Integrationstests (`test:matrix-live`, `test:matrix-evidence-live`, `test:integration-auth-rotation-live` usw.) sind **opt-in**. Sie benötigen gültige Zugänge und ggf. explizit freigeschaltete Schreibrechte. Starte sie nicht gegen fremde oder produktive Instanzen ohne Autorisierung.

Wenn ein Check nicht möglich ist, dokumentiere **welcher** Check fehlt, **warum** und **welche Aussage deshalb ungeprüft bleibt**. Bezeichne ungeprüfte Änderungen nicht als verifiziert.

## 7. Issues und Pull Requests

Ein guter Bugreport enthält erwartetes und tatsächliches Verhalten, reproduzierbare Schritte, Versions-/Umgebungskontext und bereinigte Logs oder Screenshots. Entferne darin Tokens, Nutzerinhalte und andere sensible Informationen.

Öffne einen Pull Request gegen `main` und beschreibe:

- **Problem und Lösung:** Was wird behoben oder hinzugefügt?
- **Betroffene Flächen:** Dateipfade, Schnittstellen und relevante Authority-Regeln
- **Risiko und Grenzen:** Sicherheit, Kompatibilität, Migrationen und bekannte offene Punkte
- **Validierung:** Exakte Kommandos mit Ergebnis; falls relevant Screenshots, Testausgaben oder Read-back
- **Verbleibende Arbeit:** Was ist ausdrücklich *nicht* Bestandteil dieses PRs?

### PR-Checkliste

- [ ] Ich habe relevante Repo-Dokumente und bestehende Contracts berücksichtigt.
- [ ] Mein PR ist auf einen überprüfbaren Scope begrenzt.
- [ ] Ich habe benötigte Tests ergänzt oder begründet, warum keine nötig sind.
- [ ] Ich habe `typecheck`, Tests und Build ausgeführt oder Einschränkungen dokumentiert.
- [ ] Ich habe keine Geheimnisse, personenbezogenen Daten oder fremdes urheberrechtlich geschütztes Material ohne passende Rechte eingebracht.
- [ ] Ich habe UI-Zustand, Approval, Ausführung und Verifikation nicht vermischt.
- [ ] Ich habe die Dokumentation bzw. das Changelog bei Bedarf aktualisiert.

Maintainer können Änderungen anfordern oder einen PR bei unklaren Berechtigungen, fehlenden Nachweisen oder Architekturkonflikten zurückstellen. **Ein PR wird erst durch explizites Maintainer-Review und Merge Teil des Projekts.**

## 8. Sicherheitslücken verantwortungsvoll melden

Bitte veröffentliche keine ungepatchten Schwachstellen, Exploit-Schritte, Zugangsdaten oder vertraulichen Logs in öffentlichen Issues oder Pull Requests.

Nutze nach Möglichkeit GitHubs private Vulnerability-Reporting-Funktion im Tab **Security** des Repositories, sofern sie aktiviert ist. Falls kein vertraulicher Meldeweg angeboten wird, kontaktiere den Maintainer zunächst **ohne technische Exploit-Details** und bitte um einen sicheren Kanal. Sicherheitsberichte sollten betroffene Versionen, Auswirkungen und eine möglichst minimal reproduzierbare Beschreibung enthalten.

## 9. Lizenz und Rechte an Beiträgen

MosaicStacked steht unter der [MIT-Lizenz](./LICENSE). Mit dem Einreichen eines Beitrags bestätigst du, dass du berechtigt bist, ihn bereitzustellen, und dass er unter derselben MIT-Lizenz übernommen und weiterverbreitet werden darf. Ein gesondertes Contributor License Agreement (CLA) oder eine Übertragung deines Urheberrechts wird derzeit nicht verlangt; deine Rechte an deinem eigenen Beitrag bleiben bestehen.

Übernimm keine fremden Codepassagen, Grafiken, Icons, Schriften, Prompts oder Datensätze ohne passende Nutzungs- und Weitergaberechte. Prüfe die jeweiligen Drittanbieter-Lizenzen und dokumentiere notwendige Attributionen. Externe Abhängigkeiten und gesondert lizenzierte Inhalte behalten ihre eigenen Lizenzbedingungen.

## 10. Zusammenarbeit

Diskutiere sachlich, beziehe dich auf überprüfbare Beobachtungen und behandle andere Mitwirkende respektvoll. Kritik an Entwürfen und Architekturentscheidungen ist willkommen; persönliche Angriffe, Belästigung und das Veröffentlichen privater Informationen nicht.

Danke, dass du MosaicStacked nachvollziehbarer, sicherer und zugänglicher machst.
