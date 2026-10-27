import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type BottomSheetProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  maxHeight?: "content" | "large";
  closeLabel?: string;
  onDismiss: () => void;
};

export function BottomSheet({ open, title, children, maxHeight = "content", closeLabel, onDismiss }: BottomSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const dismissLabel = closeLabel ?? `Close ${title}`;

  return createPortal(
    <>
      <button
        type="button"
        className="mobile-bottom-sheet-backdrop"
        aria-label={dismissLabel}
        onClick={onDismiss}
      />
      <section
        className={`mobile-bottom-sheet mobile-bottom-sheet-${maxHeight}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="mobile-bottom-sheet-header">
          <span className="mobile-bottom-sheet-handle" aria-hidden="true" />
          <button
            type="button"
            className="ghost-button mobile-bottom-sheet-close"
            aria-label={dismissLabel}
            onClick={onDismiss}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        {children}
      </section>
    </>,
    document.body,
  );
}
