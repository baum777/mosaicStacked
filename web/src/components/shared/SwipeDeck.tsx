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

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = Array.from(track.children).indexOf(entry.target as Element);
            if (idx >= 0 && idx !== activeIndex) {
              setActiveIndex(idx);
              onPanelChange?.(panels[idx]?.id ?? "");
            }
          }
        }
      },
      { root: track, threshold: 0.5 },
    );

    for (const child of Array.from(track.children)) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, [activeIndex, onPanelChange, panels]);

  return (
    <div className={["swipe-deck-root", className].filter(Boolean).join(" ")} aria-label={ariaLabel}>
      <nav className="swipe-deck-tabs" aria-label="Panels" role="tablist">
        {panels.map((panel, idx) => (
          <button
            key={panel.id}
            type="button"
            role="tab"
            aria-selected={idx === activeIndex}
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
        role="tabpanel"
        aria-label={panels[activeIndex]?.label ?? ""}
      >
        {panels.map((panel) => (
          <div key={panel.id} className="swipe-deck-panel" role="region" aria-label={panel.label}>
            {panel.content}
          </div>
        ))}
      </div>
    </div>
  );
}
