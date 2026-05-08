import { useEffect, useRef } from "react";
import type { Camera } from "./useViewport";

interface Props {
  live: { current: Camera };
  target: { current: Camera };
  camera: Camera;           // debounced React state
  displayScale: number;
  containerRef: { current: HTMLElement | null };
}

function fmt(n: number) {
  return n.toFixed(2).padStart(8);
}

export default function ViewportDebug({ live, target, camera, displayScale, containerRef }: Props) {
  const rowsRef = useRef<HTMLPreElement>(null);

  // Own RAF — reads refs every frame, updates DOM directly (no React re-renders)
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (!rowsRef.current) { raf = requestAnimationFrame(tick); return; }

      const l = live.current;
      const t = target.current;
      const transform = containerRef.current?.style.transform ?? "—";
      const origin   = containerRef.current
        ? getComputedStyle(containerRef.current).transformOrigin
        : "—";

      rowsRef.current.textContent = [
        "── live (rendered) ──────────────────────────────────────────────────────",
        `  x        ${fmt(l.x)} px`,
        `  y        ${fmt(l.y)} px`,
        `  scale    ${fmt(l.scale)}   (${Math.round(l.scale * 100)}%)`,
        "",
        "── target (animation goal) ──────────────────────────────────────────────",
        `  x        ${fmt(t.x)} px`,
        `  y        ${fmt(t.y)} px`,
        `  scale    ${fmt(t.scale)}   (${Math.round(t.scale * 100)}%)`,
        "",
        "── camera (React state ~100ms) ──────────────────────────────────────────",
        `  x        ${fmt(camera.x)} px`,
        `  y        ${fmt(camera.y)} px`,
        `  scale    ${fmt(camera.scale)}   (${Math.round(camera.scale * 100)}%)`,
        "",
        "── UI ───────────────────────────────────────────────────────────────────",
        `  displayScale   ${displayScale}%`,
        "",
        "── DOM transform ────────────────────────────────────────────────────────",
        `  ${transform}`,
        "",
        "── transform-origin ─────────────────────────────────────────────────────",
        `  ${origin}`,
        "",
        "── delta (live → target) ────────────────────────────────────────────────",
        `  Δx      ${fmt(t.x - l.x)} px`,
        `  Δy      ${fmt(t.y - l.y)} px`,
        `  Δscale  ${fmt(t.scale - l.scale)}`,
      ].join("\n");

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, target, camera, displayScale, containerRef]);

  return (
    <div
      style={{
        position: "fixed",
        top: 72,
        right: 12,
        zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        padding: "10px 14px",
        pointerEvents: "none",
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={{ color: "#a78bfa", fontSize: 10, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>
        VIEWPORT DEBUG
      </div>
      <pre
        ref={rowsRef}
        style={{
          margin: 0,
          color: "#e2e8f0",
          fontSize: 11,
          lineHeight: 1.6,
          fontFamily: "monospace",
          whiteSpace: "pre",
        }}
      />
    </div>
  );
}
