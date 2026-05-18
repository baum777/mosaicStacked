# Styles Token & Layer Guide

## Zweck

Dieses Verzeichnis enthält die neue Token-Basis für den stufenweisen UI-Refactor.
Die Migration bleibt Dual-Track: `critical.css` bleibt Startpfad, `deferred.css` lädt die volle Legacy-Fläche nach.

## Dateien

- `tokens/core.css`  
  Rohwerte für Farben, Typografie, Spacing, Radius.
- `tokens/semantic.css`  
  Semantische Ableitungen + Legacy-Bridge (`--ms-*`, `--accent*`, `--bg*`, ...).
- `tokens/workspaces.css`  
  Workspace-Scoping über `data-workspace`.

## Layering-Regel

`web/src/deferred.css` importiert die Legacy-Styles zuerst, Token-Layer danach, damit Tokenvariablen konsistent überschreiben können.

## Dark-Only Canonical

Der kanonische Token-Satz ist dark-only.
Light-Mode-Regeln bleiben vorerst als Legacy-Kompatibilität in den Altdateien und werden in späteren Cleanup-Phasen konsolidiert.

## Migration

1. Neue/überarbeitete Regeln zuerst gegen semantische Tokens bauen (`--color-*`, `--workspace-*`, `--focus-*`).
2. Legacy-Aliasse nur als Übergang nutzen.
3. Aliasse erst entfernen, wenn Test- und Bundle-Gates stabil grün sind.
