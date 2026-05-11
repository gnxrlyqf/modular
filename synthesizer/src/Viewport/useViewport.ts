import { useCallback, useEffect, useRef, useState } from "react";

export type Camera = { x: number; y: number; scale: number };

const MIN_SCALE = 0.2;
const MAX_SCALE = 3.0;
const LERP = 0.15;
const POS_EPSILON = 0.08;
const SCALE_EPSILON = 0.0001;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

interface ViewportRefs {
  containerRef: { current: HTMLElement | null };
  bgRef: { current: HTMLCanvasElement | null };
}

export function useViewport(
  refs: ViewportRefs,
  initialCamera: Camera = { x: 0, y: 0, scale: 1 }
) {
  // live: actual rendered camera (interpolated each RAF frame)
  const live = useRef<Camera>({ ...initialCamera });
  // target: where we want to be (updated instantly on input)
  const target = useRef<Camera>({ ...initialCamera });
  // true while live hasn't reached target — blocks new zoom input
  const isAnimating = useRef(false);

  const panState = useRef<{
    sx: number; sy: number; cx: number; cy: number; button: number;
  } | null>(null);
  const spaceHeld = useRef(false);
  const shiftHeld = useRef(false);

  // Debounced React state — for autosave and coordinate conversions in React handlers
  const [camera, setCamera] = useState<Camera>({ ...initialCamera });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [displayScale, setDisplayScale] = useState(
    Math.round(initialCamera.scale * 100)
  );

  // Load persisted camera (called after project fetch)
  const loadCamera = useCallback((cam: { x: number; y: number; scale?: number }) => {
    const full: Camera = { x: cam.x ?? 0, y: cam.y ?? 0, scale: cam.scale ?? 1 };
    live.current = { ...full };
    target.current = { ...full };
    setCamera({ ...full });
    setDisplayScale(Math.round(full.scale * 100));
  }, []);

  // Coordinate helpers — always read from live ref, safe in any event handler
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const { x, y, scale } = live.current;
    return { x: (sx - x) / scale, y: (sy - y) / scale };
  }, []);

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const { x, y, scale } = live.current;
    return { x: wx * scale + x, y: wy * scale + y };
  }, []);

  // Zoom anchored at a screen-space point.
  // Core zoom primitive — no animation guard here so wheel/scroll always works.
  // Only guards against no-op scale changes to prevent position drift.
  const zoomAt = useCallback((cx: number, cy: number, newScale: number) => {
    const clamped = clamp(newScale, MIN_SCALE, MAX_SCALE);
    const { x, y, scale } = target.current;
    if (clamped === scale) return;
    const ratio = clamped / scale;
    target.current = {
      x: cx - (cx - x) * ratio,
      y: cy - (cy - y) * ratio,
      scale: clamped,
    };
  }, []);

  // Button handlers: block while animating so rapid clicks don't drift
  const zoomIn = useCallback(() => {
    if (isAnimating.current) return;
    const oldScale = target.current.scale;
    const newScale = clamp(oldScale * 1.2, MIN_SCALE, MAX_SCALE);
    if (newScale === oldScale) return;
    zoomAt(window.innerWidth / 2, window.innerHeight / 2, newScale);
    setDisplayScale(Math.round(newScale * 100));
  }, [zoomAt]);

  const zoomOut = useCallback(() => {
    if (isAnimating.current) return;
    const oldScale = target.current.scale;
    const newScale = clamp(oldScale / 1.2, MIN_SCALE, MAX_SCALE);
    if (newScale === oldScale) return;
    zoomAt(window.innerWidth / 2, window.innerHeight / 2, newScale);
    setDisplayScale(Math.round(newScale * 100));
  }, [zoomAt]);

  const resetZoom = useCallback(() => {
    target.current = { x: 0, y: 0, scale: 1 };
    setDisplayScale(100);
  }, []);

  // Fit all modules in view
  const fitToContent = useCallback(
    (
      modules: Array<{ x: number; y: number; type: string }>,
      moduleDims: Record<string, { w: number; h: number }>
    ) => {
      if (modules.length === 0) { resetZoom(); return; }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const m of modules) {
        const dims = moduleDims[m.type] ?? { w: 200, h: 300 };
        minX = Math.min(minX, m.x);
        minY = Math.min(minY, m.y);
        maxX = Math.max(maxX, m.x + dims.w + 32);
        maxY = Math.max(maxY, m.y + dims.h + 32);
      }

      const PAD = 80;
      const contentW = maxX - minX + PAD * 2;
      const contentH = maxY - minY + PAD * 2;
      const newScale = clamp(
        Math.min(window.innerWidth / contentW, window.innerHeight / contentH),
        MIN_SCALE, MAX_SCALE
      );
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      target.current = {
        x: window.innerWidth / 2 - centerX * newScale,
        y: window.innerHeight / 2 - centerY * newScale,
        scale: newScale,
      };
    },
    [resetZoom]
  );

  // RAF loop: smooth animation applied directly to DOM (zero React overhead)
  useEffect(() => {
    let rafId: number;
    let frame = 0;

    const applyDOM = (cam: Camera) => {
      const { x, y, scale } = cam;
      if (refs.containerRef.current) {
        refs.containerRef.current.style.transform =
          `translate3d(${x}px,${y}px,0) scale(${scale})`;
      }
      if (refs.bgRef.current) {
        const gs = 32 * scale;
        refs.bgRef.current.style.backgroundSize = `${gs}px ${gs}px`;
        refs.bgRef.current.style.backgroundPosition = `${x}px ${y}px`;
        refs.bgRef.current.style.opacity = String(
          Math.min(1, Math.max(0.15, (scale - 0.15) / 0.6))
        );
      }
    };

    const tick = () => {
      const l = live.current;
      const t = target.current;
      const dx = t.x - l.x;
      const dy = t.y - l.y;
      const ds = t.scale - l.scale;

      const settled =
        Math.abs(dx) < POS_EPSILON &&
        Math.abs(dy) < POS_EPSILON &&
        Math.abs(ds) < SCALE_EPSILON;

      isAnimating.current = !settled;

      if (settled) {
        live.current = { ...t };
        applyDOM(t);
      } else {
        live.current = {
          x: l.x + dx * LERP,
          y: l.y + dy * LERP,
          scale: l.scale + ds * LERP,
        };
        applyDOM(live.current);
      }

      // Throttle React state sync to every ~6 frames (~100ms) — debounce would
      // never fire because the RAF loop resets it every 16ms
      frame++;
      if (frame % 6 === 0) {
        const c = live.current;
        setCamera({ x: c.x, y: c.y, scale: c.scale });
        setDisplayScale(Math.round(c.scale * 100));
      }

      rafId = requestAnimationFrame(tick);
    };

    applyDOM(live.current);
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Normalize WheelEvent delta to pixels regardless of deltaMode
  // (deltaMode 1 = lines ~16px each, deltaMode 2 = pages ~400px)
  function normalizeWheel(e: WheelEvent): number {
    const LINE = 16;
    const PAGE = 400;
    let dy = e.deltaY;
    let dx = e.deltaX;
    if (e.deltaMode === 1) { dy *= LINE; dx *= LINE; }
    if (e.deltaMode === 2) { dy *= PAGE; dx *= PAGE; }
    // When Shift is held, Windows Chrome routes the scroll through deltaX
    // with an inverted sign (wheel-up = scroll-right = +deltaX, but we
    // need a negative value to produce factor > 1 = zoom in).
    if (dy !== 0) return dy;
    return -dx; // negate: positive deltaX (right) → negative → zoom in
  }

  // Wheel event handler — attached with { passive: false } by Scene.tsx
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const tgt = e.target as HTMLElement;
    if (
      tgt.closest('[data-patch-module="true"]') ||
      tgt.closest('[data-hud-header="true"]') ||
      tgt.closest('[data-matrix="true"]')
    ) return;
    // Use ref-tracked shift state — more reliable than e.shiftKey on
    // some Chrome/Windows builds where WheelEvent.shiftKey is false.
    const wantZoom = e.ctrlKey || e.metaKey || shiftHeld.current;
    if (wantZoom) {
      const delta = normalizeWheel(e);
      const factor = Math.exp(-delta * 0.003);
      const newScale = clamp(target.current.scale * factor, MIN_SCALE, MAX_SCALE);
      zoomAt(e.clientX, e.clientY, newScale);
      setDisplayScale(Math.round(newScale * 100));
    } else {
      // Two-finger trackpad scroll → pan
      target.current = {
        ...target.current,
        x: target.current.x - e.deltaX,
        y: target.current.y - e.deltaY,
      };
    }
  }, [zoomAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Key tracking: Space (pan) + Shift (zoom modifier)
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        shiftHeld.current = true;
      }
      if (e.code !== "Space" || e.repeat) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      spaceHeld.current = true;
      setIsSpaceHeld(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        shiftHeld.current = false;
      }
      if (e.code !== "Space") return;
      spaceHeld.current = false;
      setIsSpaceHeld(false);
      if (panState.current?.button === 0) {
        panState.current = null;
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Global mouse move/up for pan
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!panState.current) return;
      target.current = {
        ...target.current,
        x: panState.current.cx + (e.clientX - panState.current.sx),
        y: panState.current.cy + (e.clientY - panState.current.sy),
      };
    };
    const onUp = (e: MouseEvent) => {
      if (!panState.current) return;
      if (e.button === panState.current.button) {
        panState.current = null;
        setIsPanning(false);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Called from Scene's onMouseDown — returns true if pan was started
  const tryStartPan = useCallback((e: {
    button: number; clientX: number; clientY: number; preventDefault(): void;
  }): boolean => {
    const isMiddle = e.button === 1;
    const isSpaceLeft = e.button === 0 && spaceHeld.current;
    const isRight = e.button === 2;
    if (!isMiddle && !isSpaceLeft && !isRight) return false;
    if (isMiddle) e.preventDefault();
    panState.current = {
      sx: e.clientX,
      sy: e.clientY,
      cx: target.current.x,
      cy: target.current.y,
      button: e.button,
    };
    setIsPanning(true);
    return true;
  }, []);

  // Double-click on empty space: zoom in (or out with Shift)
  const handleDoubleClick = useCallback((e: {
    target: EventTarget | null; clientX: number; clientY: number; shiftKey: boolean;
  }) => {
    const tgt = e.target as HTMLElement;
    if (
      tgt.closest("[data-patch-module='true']") ||
      tgt.closest('[data-hud-header="true"]') ||
      tgt.closest('[data-matrix="true"]')
    ) return;
    const newScale = e.shiftKey
      ? target.current.scale / 1.3
      : target.current.scale * 1.3;
    zoomAt(e.clientX, e.clientY, newScale);
  }, [zoomAt]);

  return {
    camera,
    live,
    target,
    isPanning,
    isSpaceHeld,
    displayScale,
    loadCamera,
    screenToWorld,
    worldToScreen,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContent,
    tryStartPan,
    handleDoubleClick,
    onWheel,
    spaceHeld,
  };
}
