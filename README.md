# MosaicStacked

**Eine gemeinsame Arbeitsoberfläche für KI-Chat, Softwareprojekte und Wissensräume – mit Kontrolle über Änderungen.**

MosaicStacked verbindet Gespräche mit KI-Modellen, die Arbeit an GitHub-Repositories und die Organisation von Wissen über Matrix. Statt zwischen unverbundenen Werkzeugen zu wechseln, können Nutzer Kontext aufnehmen, Vorschläge prüfen und – soweit die jeweilige Integration dafür eingerichtet ist – kontrolliert umsetzen.

> **Projektstatus:** MosaicStacked befindet sich in aktiver Entwicklung. Die Oberfläche enthält funktionierende Bereiche sowie Funktionen, die von eingerichteten Zugängen, Berechtigungen oder weiteren Tests abhängen. Eine sichtbare Schaltfläche ist keine Garantie, dass die zugehörige Aktion bereits verfügbar ist.

**Du möchtest entwickeln oder eine eigene Instanz betreiben?** Zur [technischen Dokumentation (README.DEV.md)](./README.DEV.md).

## Wofür ist MosaicStacked gedacht?

Ein Beispiel: Du arbeitest an einem Softwareprojekt. Du möchtest eine Änderung verstehen, sie mit einer KI besprechen, einen Vorschlag vorbereiten und gegebenenfalls in deinem Repository umsetzen. Später sollen die Entscheidung und ihr Ergebnis nachvollziehbar sein.

MosaicStacked bündelt dafür drei zentrale Arbeitsformen:

- **Mit KI arbeiten:** Fragen stellen, Ideen ausarbeiten, Code und Entscheidungen erklären lassen.
- **Am Projekt arbeiten:** Ein GitHub-Repository auswählen, Dateien und Änderungsvorschläge prüfen, freigabepflichtige Aktionen anstoßen.
- **Wissen organisieren:** Matrix-Räume erkunden, Inhalte einordnen und geplante Aktualisierungen von Raumthemen kontrolliert behandeln.

Der verbindende Gedanke: **Ein Vorschlag ist noch keine Freigabe. Eine ausgeführte Aktion ist noch keine bestätigte Prüfung ihres Ergebnisses.**

## Wie ist MosaicStacked aufgebaut?

Die Anwendung hat eine Browseroberfläche und einen dahinterliegenden Dienst (Backend). Im Browser siehst du deine Arbeit, wählst Bereiche aus und entscheidest, was du freigeben möchtest. Der Hintergrunddienst prüft Zugänge, führt erlaubte Anfragen aus und liefert Zustände zurück.

~~~mermaid
flowchart LR
    M["Du"] --> B["MosaicStacked-Oberfläche"]
    B --> S["MosaicStacked-Backend"]
    S --> K["KI-Modelle"]
    S --> G["GitHub-Repositories"]
    S --> X["Matrix-Wissensräume"]
    S --> P["Status & Prüfprotokoll"]
~~~

Dadurch muss die Oberfläche keine privaten Schlüssel für GitHub, Matrix oder den KI-Anbieter selbst verwalten.

## Die Arbeitsbereiche

Die Anwendung kennt aktuell neun Ansichten. Vier davon bilden die besonders sichtbaren Einstiegspunkte; weitere Ansichten ergänzen die Arbeit.

| Bereich | Was du dort tun kannst |
| --- | --- |
| **Chat** | Mit einem verbundenen KI-Modell sprechen, Aufgaben klären und Antworten für die weitere Arbeit nutzen. |
| **Workbench** | GitHub-Repositories und Dateien einsehen, Änderungsvorschläge und Unterschiede prüfen sowie berechtigte Aktionen zur Freigabe vorbereiten. |
| **Matrix** | Verbundene Räume erkunden, ausgewählte Inhalte zusammenfassen und – sofern unterstützt und freigegeben – Aktualisierungen von Raumthemen planen und überprüfen. |
| **Settings** | Modellzugang und Verbindungen zu GitHub und Matrix einrichten oder prüfen; den Systemstatus einsehen. |
| **Review** | Offene und zurückliegende Prüfungen gesammelt ansehen. Eine Markierung in dieser Ansicht allein führt noch keine Aktion aus. |
| **Community** | Matrix-Räume und vorhandenen Kontext entdecken; diese Ansicht ist derzeit auf das Lesen ausgerichtet. |
| **Modelle** | Verfügbare Modelloptionen, Fähigkeiten und Routingstatus ansehen. |
| **Evidence** | Vorhandene Entscheidungen, Prüfungen, Fehler und Journal-Einträge nachvollziehen. Die Anzeige ist nicht automatisch ein dauerhaftes externes Auditarchiv. |
| **Performance** | Lokale Mess- und Qualitätsnachweise einsehen, soweit solche Daten vorliegen; keine Live-Produktionsüberwachung. |

**Wichtig:** Die Verfügbarkeit einzelner Funktionen hängt von der Instanz und ihrem Konfigurationsstand ab. Besonders das Schreiben in Matrix, die Raumhierarchie und bestimmte GitHub-Aktionen haben zusätzliche Grenzen.

## Dein erster Arbeitsablauf

Du benötigst Zugang zu einer laufenden MosaicStacked-Instanz. Für GitHub- und Matrix-Funktionen brauchst du außerdem einen entsprechend freigeschalteten Zugang zum jeweiligen Dienst.

1. **Konsole öffnen.** Auf der Instanz findest du die Arbeitsoberfläche unter `/console`. Je nach Erststart wird davor eine kurze Einstiegsseite angezeigt.
2. **Verbindungen prüfen.** Öffne *Settings*. Prüfe, ob das Backend erreichbar ist, ein KI-Modell bereitsteht und die gewünschten Integrationen verbunden sind.
3. **Mit Chat beginnen.** Stelle eine Frage, zum Beispiel: „Erkläre mir die Struktur dieses Projekts und schlage einen kleinen nächsten Schritt vor.“
4. **Projektkontext auswählen.** Wechsle zur *Workbench*, wähle ein verfügbares GitHub-Repository und öffne die benötigten Dateien oder einen Änderungsvorschlag.
5. **Vorschläge prüfen.** Lies zuerst die Zusammenfassung und bei Bedarf die konkreten Änderungen. Gib nur Aktionen frei, deren Folgen du verstehst.
6. **Ergebnis überprüfen.** Nach einer unterstützten Ausführung ist eine separate Überprüfung des tatsächlichen Zustands sinnvoll. *Review* und *Evidence* helfen beim Nachvollziehen vorhandener Informationen.

Du musst nicht alle Integrationen sofort verbinden. Für den Einstieg genügt ein funktionierender Modellzugang.

## Was bedeutet „kontrollierte Ausführung“?

Der typische Ablauf lautet:

~~~text
Kontext ansehen → Vorschlag erhalten → Änderung prüfen → freigeben
                → (sofern erlaubt) ausführen → Ergebnis überprüfen
~~~

- **Lesen** verändert dein Repository oder deinen Matrix-Raum nicht.
- **Vorschlagen** zeigt eine mögliche Änderung; sie ist noch nicht ausgeführt.
- **Freigeben** bedeutet, dass du einer konkreten Änderung zustimmst. Weitere Prüfungen und Berechtigungen können erforderlich sein.
- **Ausführen** geschieht, wenn die Integration und der Hintergrunddienst die Aktion erlauben.
- **Überprüfen** stellt fest, ob der gewünschte Zustand tatsächlich eingetreten ist.

MosaicStacked soll diese Schritte unterscheidbar machen, nicht sie in einer undurchsichtigen Automatik verstecken.

## Sprache, Bedienung und Unterstützung

Die Konsole bietet Deutsch und Englisch, eine mobile Darstellung und einen vereinfachten sowie einen Expertenmodus. Der vereinfachte Modus konzentriert sich auf Aufgaben, Zustände und nächste Schritte. Im Expertenmodus sind zusätzliche technische Details sichtbar.

Ein integrierter Hilfe-Companion kann Fragen zur Bedienung beantworten und bestimmte vorbereitende Navigationsschritte unterstützen. Er ist kein Freibrief für selbstständige Änderungen an verbundenen Systemen.

## Was ist derzeit noch eingeschränkt?

- **Keine universelle Vollautomatisierung:** Externe Schreibaktionen benötigen passende Berechtigungen und gegebenenfalls eine ausdrückliche Freigabe.
- **Matrix:** Einige Topic-Änderungsabläufe sind lokal implementiert; ein vollständiger Live-End-to-End-Nachweis für jede reale Matrix-Umgebung liegt nicht vor. Composer-/Community-Funktionen sind teilweise auf Entwürfe oder Lesen begrenzt.
- **Wiederherstellung:** Lokal gemerkte Sitzungen und Bildschirmzustände sind keine Garantie für eine dauerhafte, geräteübergreifende Speicherung.
- **Beobachtbarkeit:** *Evidence* und *Performance* zeigen verfügbare Protokolle bzw. lokale Messungen, nicht automatisch vollständige Echtzeit- oder Produktionsdaten.
- **Betrieb:** MosaicStacked ist nicht allein durch das öffentliche Repository sofort als fertiger Hosted-Service nutzbar; eine funktionierende Instanz benötigt Konfiguration und Integrationszugänge.

## Datenschutz und Sicherheit

Verbinde nur Repositories und Matrix-Räume, für die du berechtigt bist. Trage API-Schlüssel und andere Geheimnisse ausschließlich in dafür vorgesehene Konfigurations- oder Einstellungswege ein – **nicht in Chatnachrichten, Issues oder Pull Requests**.

Eine Freigabe in der Oberfläche ersetzt weder die technische Berechtigungsprüfung noch die anschließende Ergebniskontrolle.

## Mehr erfahren und mitarbeiten

- [README.DEV.md](./README.DEV.md) – technische Architektur, eigene Instanz, Tests und Entwicklung
- [CHANGELOG.md](./CHANGELOG.md) – Änderungen im Projekt
- [AGENTS.md](./AGENTS.md) – Entwicklungs- und Sicherheitsregeln für Agenten
- [WORKFLOW.md](./WORKFLOW.md) – nachvollziehbarer Arbeitsablauf bei Änderungen
- [GitHub Issues](https://github.com/baum777/mosaicStacked/issues) – Fragen, Fehler und Verbesserungsvorschläge

**Lizenzhinweis:** Ob und unter welchen Bedingungen der Code wiederverwendet werden darf, bestimmt die tatsächlich im Repository veröffentlichte Lizenzdatei. Ein öffentlich sichtbares Repository bedeutet für sich genommen noch keine Open-Source-Lizenz.
