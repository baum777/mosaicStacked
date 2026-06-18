---
title: Swarm Review Gate
page_type: derived
status: proposed
authority: derived
owner: governance
updated: 2026-06-08
tags:
  - "#governance"
  - "#swarm"
  - "#review"
  - "#proposed"
---

# Swarm Review Gate

Das Review-Gate ist der letzte kontrollierte Schritt, bevor ein Agenten-
Output als gültig akzeptiert oder verworfen wird.

## Eingang

- `SwarmTaskEnvelope` (vom Orchestrator erstellt, vom Builder konsumiert)
- MSPR-Entries aus `mspr_logbook.md`
- Diff, Test-Output, Lint-Output, Typecheck-Output, Build-Output

## Ausgang

- `SwarmReviewResult` mit `status` und Scorecard
- Nächster Gate-Hinweis (`nextGate`)

## Entscheidungs-Status

| Status | Bedeutung | Folge |
| --- | --- | --- |
| `pass` | Alle Kriterien erfüllt | Nächster kleiner Schritt |
| `needs_rework` | Konkrete Mängel, aber korrigierbar | Zurück an Builder mit Liste |
| `blocked` | Authority, Quelle oder Validierung fehlt | MSPR-Packet, menschlicher Review |
| `approval_required` | Risiko oder Policy-Trigger | Human Approval, sonst Stop |

## Scorecard

Pro Slice wird eine Scorecard im MSPR-Entry festgehalten:

```yaml
review:
  status: pass | needs_rework | blocked | approval_required
  risks: [string, ...]
  scorecard:
    outcomeQuality: 0..5
    scopeDiscipline: 0..5
    safety: 0..5
    evidenceQuality: 0..5
    sideEffects: 0..5
  nextGate: string
```

## Kriterien-Mapping

- `outcomeQuality >= 4` und `scopeDiscipline >= 4` und `safety >= 4`
  und `evidenceQuality >= 3` und keine Side-Effect-Risiken: `pass`.
- Ein einzelner Score `0..2`: `needs_rework` mit Begründung.
- `safety == 0` oder Side-Effect betrifft Secrets/Prod/Destruction:
  `blocked` oder `approval_required`.

## SwarmReviewResult-Schema (TS-Style, optional)

```ts
export type SwarmReviewResult = {
  envelopeId: string;
  status: "pass" | "needs_rework" | "blocked" | "approval_required";
  scopeViolations: string[];
  policyViolations: string[];
  validationEvidence: string[];
  memoryUpdates: string[];
  nextGate: string;
};
```

> **Hinweis:** Die TS-Typen sind **konzeptionell**. Solange das Repo
> keinen Runtime-Swarm-Adapter hat, ist das Schema nur Vertrags-Spec
> und wird im Logbuch als YAML abgebildet.

## Bezug zu mosaicStack-Realität

- `npm test` (Vitest) und `npx playwright test` (oder
  `cypress run`) sind die Test-Validierungen.
- `npx tsc --noEmit` ist die Typecheck-Validierung.
- `npm run build` ist die Build-Validierung.
- `git diff` und `git status --porcelain` sind die Diff-Validierungen.
- `npm run lint` (sofern konfiguriert) ist die Lint-Validierung.
- `03-mspr/packets/` enthält die bestehenden Risk- und Block-Packets
  als zusätzliche Evidenz.

Diese Befehle sind die **kleinsten verfügbaren Checks** in diesem Repo
und werden im MSPR-Entry unter `validationResults` referenziert.

## Failure-Mode

- Wenn ein Check nicht ausführbar ist (z. B. fehlende Origin für
  Live-Smoke): Reviewer markiert `blocked` und benennt die Lücke
  konkret (gemäß mehrerer bestehender MSPR-Packets, z. B.
  `2026-05-11-live-smoke-github-openrouter-blocked.yml`).
- Builder schreibt **keinen** Workaround, der Origin-Bypässe
  implementiert oder Live-Secrets in Repo-Material überführt.
