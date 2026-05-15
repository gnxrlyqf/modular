import { useEffect, useRef, type ReactNode, type MouseEvent } from 'react';

type OverlayShellProps = {
  kicker: string;
  title: ReactNode;
  headerRight?: ReactNode;
  width?: number;
  maxHeight?: string;
  onClose: () => void;
  children: ReactNode;
  /** Extra class on the inner glass panel */
  className?: string;
};

/**
 * Shared shell for all six overlays.
 * Renders a fixed-position backdrop + centered glass panel with kicker/title header.
 * Backdrop click closes. Esc is handled globally by App.tsx.
 */
export default function OverlayShell({
  kicker,
  title,
  headerRight,
  width = 1020,
  maxHeight = '90vh',
  onClose,
  children,
  className = '',
}: OverlayShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Trap focus inside the shell
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!focusables.length) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    (first ?? panel).focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      className="overlay-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className={`glass-shell overlay-shell overlay-enter ${className}`}
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
        tabIndex={-1}
      >
        {/* ── Header ── */}
        <div className="overlay-header overlay-content">
          <div style={{ minWidth: 0 }}>
            <div className="kicker">{kicker}</div>
            <div className="overlay-title">{title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {headerRight}
            <button
              type="button"
              className="overlay-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div
          className="overlay-content"
          style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
