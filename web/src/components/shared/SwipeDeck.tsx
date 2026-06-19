import React, { useCallback, useEffect, useRef, useState } from "react";

export type SwipeDeckPanel = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type SwipeDeckProps = {
  panels: SwipeDeckPanel[];
  initialPanel?: string;
  className?: string;
  ariaLabel?: string;
  onPanelChange?: (id: string) => void;
};

function toDomId(id: string) {
  return id.replace(/[^A-Za-z0-9_-]/g, "-");
}

export function SwipeDeck({
  panels,
  initialPanel,
  className,
  ariaLabel,
  onPanelChange,
}: SwipeDeckProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    if (!initialPanel) {
      return 0;
    }
    const idx = panels.findIndex((p) => p.id === initialPanel);
    return idx >= 0 ? idx : 0;
  });

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const panelEl = track.children[index] as HTMLElement | undefined;
    panelEl?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }, []);

  const updateActiveFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0 || panels.length === 0) {
      return;
    }

    const nextIndex = Math.max(
      0,
      Math.min(panels.length - 1, Math.round(track.scrollLeft / track.clientWidth)),
    );
    setActiveIndex((currentIndex) => {
      if (nextIndex === currentIndex) {
        return currentIndex;
      }
      onPanelChange?.(panels[nextIndex]?.id ?? "");
      return nextIndex;
    });
  }, [onPanelChange, panels]);

  useEffect(() => {
    if (activeIndex < panels.length) {
      return;
    }

    setActiveIndex(Math.max(0, panels.length - 1));
  }, [activeIndex, panels.length]);

  return (
    <div className={["swipe-deck-root", className].filter(Boolean).join(" ")} aria-label={ariaLabel}>
      <nav className="swipe-deck-tabs" aria-label="Panels" role="tablist">
        {panels.map((panel, idx) => (
          <button
            key={panel.id}
            id={`swipe-deck-tab-${toDomId(panel.id)}`}
            type="button"
            role="tab"
            aria-selected={idx === activeIndex}
            aria-controls={`swipe-deck-panel-${toDomId(panel.id)}`}
            tabIndex={idx === activeIndex ? 0 : -1}
            className={idx === activeIndex ? "swipe-deck-tab swipe-deck-tab-active" : "swipe-deck-tab"}
            onClick={() => {
              setActiveIndex(idx);
              scrollToIndex(idx);
              onPanelChange?.(panel.id);
            }}
          >
            {panel.label}
          </button>
        ))}
      </nav>
      <div
        ref={trackRef}
        className="swipe-deck-track"
        aria-label={panels[activeIndex]?.label ?? ""}
        onScroll={updateActiveFromScroll}
      >
        {panels.map((panel) => (
          <div
            key={panel.id}
            id={`swipe-deck-panel-${toDomId(panel.id)}`}
            className="swipe-deck-panel"
            role="tabpanel"
            aria-label={panel.label}
            aria-labelledby={`swipe-deck-tab-${toDomId(panel.id)}`}
          >
            {panel.content}
          </div>
        ))}
      </div>
    </div>
  );
}
