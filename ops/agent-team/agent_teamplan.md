---
title: Agent Team Plan
page_type: derived
status: proposed
authority: derived
owner: governance
updated: 2026-06-08
tags:
  - "#governance"
  - "#swarm"
  - "#teamplan"
  - "#proposed"
---

# Agent Team Plan

Aktive Workstreams des 3-Agent-Swarms. Jeder Workstream hat einen Owner-
Agent, eine Task-Klasse, einen Scope, einen Autonomy Tier, einen Status,
eine Next Action und Review-Pflicht.

## Active Workstreams

| ID | Title | Owner | Task Type | Scope | Tier | Status | Next Action | Review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WS-001 | Swarm-Governance Bootstrap | Orchestrator | `governance_change` | `ops/agent-team/**` | Tier 2 | active | Routen- und Policy-Tabelle gegen einen Pilot-Task validieren | optional |
| WS-002 | MSPR-Packet für Bootstrap | Orchestrator | `governance_change` | `03-mspr/packets/2026-06-08-swarm-governance-bootstrap.yml` | Tier 2 | active | MSPR-Packet für Bootstrap anlegen | ja (menschlich) |

## Pilot-Validierung (geplant)

Geplant: ein einzelner Read-Only-Audit auf einem klar umrissenen Pfad,
um die Routing-Tabelle aus `swarm_task_routing.md` mit einem realen
Orchestrator-Lauf zu testen, bevor weitere Workstreams aufgenommen werden.

## Role Assignments

- **Orchestrator**: Scope, Routing, Policy, Task Envelope.
- **Builder**: Bounded Execution, Docs/Code/Tests, MSPR-Progress.
- **Reviewer**: QA, Memory, Scorecard, Approval Gates.

## Current Blockers

- **WS-001**: keine.
- **WS-002**: keine.
- Repo-weit: keine Swarm-bezogenen Blocker. Bestehende MSPR-Packets
  bleiben unangetastet (siehe `03-mspr/packets/`).

## Approval Matrix (Kurzfassung)

- Matrix-Schreib-Pfade: Tier 0 / Human Approval, bis Origin verifiziert.
- Tier 0 Tasks: Human Approval zwingend.
- Tier 3 Tasks: Reviewer-Pass zwingend, Human Approval optional.
- Tier 1 / Tier 2: Review optional.
- Governance- und Policy-Änderungen: Tier 3 + menschlicher Review
  (gemäß `WORKFLOW.md` und `00-schema/AGENTS.md`).

## Next Gate

Kleinster sicherer Schritt: einen Read-Only-Audit-Workstream (`WS-003`)
anlegen, der die Routing-Tabelle gegen `audit/` (read-only) prüft
und das Ergebnis in `mspr_logbook.md` einträgt. Daraus kann die
Scorecard-Praxis vor jedem Tier-3-Rollout gehärtet werden.
