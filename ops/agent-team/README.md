---
title: Agent Team — 3-Agent Swarm Governance
page_type: derived
status: proposed
authority: derived
owner: governance
updated: 2026-06-08
tags:
  - "#governance"
  - "#agent-team"
  - "#swarm"
  - "#proposed"
---

# Agent Team — 3-Agent Swarm Governance

Diese Oberfläche ist die repo-lokale Contract-Slice für den 3-Agent-Swarm
nach dem OrchestrAI_Labs-Prinzip. Sie ist **additiv** zur bestehenden
Governance-Schicht und ersetzt weder `AGENTS.md`, `WORKFLOW.md` noch
`00-schema/mspr-spec.md`.

## Architektur

```
User Request
  -> Agent 1: Orchestrator / Scope Governor
  -> Agent 2: Builder / Research / Execution
  -> Agent 3: Reviewer / QA / Memory Auditor
  -> MSPR Logbook + Agent Memory + Team Plan + Review Gate
  -> Final Result / Next Gate
```

## Wichtige Regel

Agenten dürfen nicht direkt unkontrolliert Dateien ändern, Tools ausführen
oder finale Entscheidungen treffen. Jede Aktion muss über Scope, Task-Klasse,
Autonomy Tier, Policy-Check und Review geführt werden.

## Bezug zu bestehender Governance

- `00-schema/mspr-spec.md` ist die kanonische MSPR-Packet-Spec. Diese
  Swarm-Contracts **erweitern** die Semantik, ohne das Packet-Format
  zu duplizieren.
- `03-mspr/packets/` ist die kanonische Ablage für MSPR-Packets. Das
  Swarm-Logbuch (`mspr_logbook.md`) verweist auf diese Ablage.
- `02-wiki/index.md` und `02-wiki/log.md` sind die kanonische Wiki-
  und Log-Schicht. Neue dauerhafte Verweise werden dort eingetragen.

## Dateien

| Datei | Zweck |
| --- | --- |
| `swarm_roles.md` | Rollendefinition Orchestrator / Builder / Reviewer |
| `swarm_policy.md` | Policy-Regeln: blockieren / review-pflichtig / freely allowed |
| `swarm_task_routing.md` | Variable Routing-Logik: Task-Klasse -> Owner + Tier + Review |
| `swarm_review_gate.md` | Review-Gate-Logik: pass / needs_rework / blocked / approval_required |
| `agent_teamplan.md` | Aktive Workstreams, Owner, Tier, Status, Next Action |
| `agent_memory.md` | Working / Repo / Semantic Memory in drei Ebenen |
| `mspr_logbook.md` | MSPR Entry Logbuch (Memory, Scope, Progress, Review) — verweist auf `03-mspr/packets/` |

## Promotion-Pfad

Aktueller Status: `proposed`. Promotion zu `canonical` erfordert:

1. Menschlicher Review (siehe `03-mspr/packets/2026-06-08-swarm-governance-bootstrap.yml`).
2. Bestätigung, dass die Tier-Mappings (0-4) und Policy-Regeln mit
   der repo-lokalen Authority (`AGENTS.md`, `WORKFLOW.md`, `00-schema/`)
   konsistent sind.
3. Eintrag in `02-wiki/log.md` mit ausgeführter Aenderung.

## Nächster Schritt

Kleinster sicherer Implementation-Slice: Verträge finalisieren, dann
einen einzelnen Pilot-Workstream unter `agent_teamplan.md` aufnehmen,
der die Routing-Tabelle gegen einen realen Read-Only-Task validiert.
