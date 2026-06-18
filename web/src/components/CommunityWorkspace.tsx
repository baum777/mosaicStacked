import React, { useMemo, useState } from "react";
import { SectionLabel, ShellCard, StatusBadge } from "./ShellPrimitives.js";
import { StatusPanel } from "./StatusPanel.js";
import type { Locale, WorkspaceMode } from "../lib/localization.js";
import type { WorkMode } from "../lib/work-mode.js";
import type { MatrixSession } from "../lib/workspace-state.js";

export type CommunityRoomCard = {
  id: string;
  title: string;
  description: string;
  category: "active" | "selected" | "space" | "evidence" | "topic" | "landing";
  recentActivity: string;
};

type CommunityWorkspaceProps = {
  matrixSession: MatrixSession | null;
  matrixReadAvailable: boolean;
  workMode: WorkMode;
  expertMode: boolean;
  locale: Locale;
  onTelemetry?: (kind: "info" | "warning" | "error", label: string, detail?: string) => void;
  onQueueChatDraft: (content: string) => void;
  landingRoomId: string | null;
  onNavigateToWorkspace?: (mode: WorkspaceMode) => void;
};

function copy(locale: Locale) {
  return locale === "de"
    ? {
        title: "Gemeinschaft",
        status: "Read-only Matrix Discovery",
        intro: "Matrix-Räume, Fragen und Wissen werden hier entdeckt. Live-Kommunikation bleibt im Matrix Workspace.",
        available: "Lesen verfügbar",
        unavailable: "Lesen blockiert",
        rooms: "Räume",
        ask: "Ask Community",
        askPlaceholder: "Frage zur aktuellen Arbeit formulieren",
        queueDraft: "Als Chat-Entwurf übernehmen",
        openMatrix: "Matrix öffnen",
        openEvidence: "Evidence öffnen",
        search: "Räume filtern",
        empty: "Keine Matrix-Räume aus der aktuellen Session ableitbar.",
        selected: "Ausgewählter Raum",
        active: "Aktiver Raum",
        space: "Space",
        evidence: "Evidence",
        topic: "Topic",
        landing: "Landing",
        recent: "Aktuelle Session",
      }
    : {
        title: "Community",
        status: "Read-only Matrix discovery",
        intro: "Discover Matrix rooms, questions, and knowledge here. Live messaging stays in the Matrix workspace.",
        available: "Read available",
        unavailable: "Read blocked",
        rooms: "Rooms",
        ask: "Ask Community",
        askPlaceholder: "Ask a question about the current work",
        queueDraft: "Queue as Chat draft",
        openMatrix: "Open Matrix",
        openEvidence: "Open Evidence",
        search: "Filter rooms",
        empty: "No Matrix rooms can be derived from the current session.",
        selected: "Selected room",
        active: "Active room",
        space: "Space",
        evidence: "Evidence",
        topic: "Topic",
        landing: "Landing",
        recent: "Current session",
      };
}

function roomTitle(roomId: string, fallback: string | null | undefined) {
  return fallback?.trim() || roomId;
}

function addRoom(cards: CommunityRoomCard[], next: CommunityRoomCard) {
  if (!cards.some((card) => card.id === next.id)) {
    cards.push(next);
  }
}

export function buildCommunityRoomCards({
  matrixSession,
  landingRoomId,
}: {
  matrixSession: MatrixSession | null;
  landingRoomId: string | null;
}): CommunityRoomCard[] {
  const metadata = matrixSession?.metadata ?? null;
  const cards: CommunityRoomCard[] = [];

  if (metadata?.roomId) {
    addRoom(cards, {
      id: metadata.roomId,
      title: roomTitle(metadata.roomId, metadata.roomName),
      description: "Active Matrix room for the current workspace session.",
      category: "active",
      recentActivity: metadata.lastActionResult ?? "Current session",
    });
  }

  for (const roomId of metadata?.selectedRoomIds ?? []) {
    addRoom(cards, {
      id: roomId,
      title: roomId,
      description: "Selected room included in the current Matrix scope.",
      category: "selected",
      recentActivity: "Selected scope",
    });
  }

  for (const spaceId of metadata?.selectedSpaceIds ?? []) {
    addRoom(cards, {
      id: spaceId,
      title: spaceId,
      description: "Selected Matrix space used for room discovery.",
      category: "space",
      recentActivity: "Selected scope",
    });
  }

  if (metadata?.topicRoomId) {
    addRoom(cards, {
      id: metadata.topicRoomId,
      title: metadata.topicRoomId,
      description: "Room linked to topic analysis and review planning.",
      category: "topic",
      recentActivity: "Topic workflow",
    });
  }

  if (metadata?.provenanceRoomId) {
    addRoom(cards, {
      id: metadata.provenanceRoomId,
      title: metadata.provenanceRoomId,
      description: "Room used for provenance and evidence reads.",
      category: "evidence",
      recentActivity: "Evidence lookup",
    });
  }

  if (landingRoomId) {
    addRoom(cards, {
      id: landingRoomId,
      title: landingRoomId,
      description: "Configured landing room from the backend integration status.",
      category: "landing",
      recentActivity: "Integration status",
    });
  }

  return cards;
}

export function CommunityWorkspace({
  matrixSession,
  matrixReadAvailable,
  workMode: _workMode,
  expertMode,
  locale,
  onTelemetry,
  onQueueChatDraft,
  landingRoomId,
  onNavigateToWorkspace,
}: CommunityWorkspaceProps) {
  const labels = copy(locale);
  const [query, setQuery] = useState("");
  const [question, setQuestion] = useState("");
  const rooms = useMemo(
    () => buildCommunityRoomCards({ matrixSession, landingRoomId }),
    [landingRoomId, matrixSession],
  );
  const filteredRooms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return rooms;
    }
    return rooms.filter((room) =>
      `${room.title} ${room.description} ${room.category}`.toLowerCase().includes(normalized),
    );
  }, [query, rooms]);

  function queueQuestion() {
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }
    onQueueChatDraft(trimmed);
    onTelemetry?.("info", "community-question-queued", trimmed.slice(0, 80));
    setQuestion("");
  }

  return (
    <section className="workspace-panel community-workspace" data-testid="community-workspace">
      <section className="workspace-hero">
        <div>
          <p className={matrixReadAvailable ? "status-pill status-ready" : "status-pill status-error"}>{labels.status}</p>
          <h1>{labels.title}</h1>
          <p className="hero-copy">{labels.intro}</p>
        </div>
      </section>

      <StatusPanel
        title={labels.status}
        headline={matrixReadAvailable ? labels.available : labels.unavailable}
        badge={matrixReadAvailable ? labels.available : labels.unavailable}
        badgeTone={matrixReadAvailable ? "ready" : "error"}
        rows={[
          { label: labels.rooms, value: String(rooms.length) },
          { label: labels.active, value: matrixSession?.metadata.roomName ?? matrixSession?.metadata.roomId ?? "n/a" },
          { label: labels.landing, value: landingRoomId ?? "n/a" },
        ]}
        safetyTitle={labels.status}
        safetyText={labels.intro}
        expertMode={expertMode}
        expertRows={rooms.map((room) => ({ label: room.category, value: room.id }))}
      />

      <div className="workspace-grid community-grid">
        <ShellCard variant="base" className="workspace-card community-discovery-card">
          <header className="card-header">
            <div>
              <SectionLabel>{labels.rooms}</SectionLabel>
              <strong>{labels.status}</strong>
            </div>
          </header>
          <label className="field-label">
            <span>{labels.search}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} />
          </label>
          <div className="review-queue-list">
            {filteredRooms.length === 0 ? <p className="shell-muted-copy">{labels.empty}</p> : null}
            {filteredRooms.map((room) => (
              <article key={room.id} className="review-queue-item">
                <div className="review-queue-item-header">
                  <div>
                    <span>{room.category}</span>
                    <strong>{room.title}</strong>
                  </div>
                  <StatusBadge tone={matrixReadAvailable ? "ready" : "error"}>{room.recentActivity || labels.recent}</StatusBadge>
                </div>
                <p>{room.description}</p>
                <div className="action-row">
                  <button type="button" className="secondary-button" onClick={() => onNavigateToWorkspace?.("matrix")}>
                    {labels.openMatrix}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => onNavigateToWorkspace?.("evidence")}>
                    {labels.openEvidence}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </ShellCard>

        <ShellCard variant="muted" className="workspace-card community-ask-card">
          <header className="card-header">
            <div>
              <SectionLabel>{labels.ask}</SectionLabel>
              <strong>{labels.ask}</strong>
            </div>
          </header>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={labels.askPlaceholder}
            rows={5}
          />
          <div className="action-row">
            <button type="button" onClick={queueQuestion} disabled={question.trim().length === 0}>
              {labels.queueDraft}
            </button>
            <button type="button" className="secondary-button" onClick={() => onNavigateToWorkspace?.("matrix")}>
              {labels.openMatrix}
            </button>
          </div>
        </ShellCard>
      </div>
    </section>
  );
}
