/**
 * Shared building blocks for the six overlay redesign.
 * All components are theme-aware via CSS custom properties.
 * All use logical CSS for RTL safety.
 */

import { useId, type ReactNode, type CSSProperties } from 'react';
import defaultProfileImg from './assets/default_profile.png';

// ─── StatusPill ───────────────────────────────────────────────────────────────
// color: CSS color value (e.g. var(--success), var(--accent))
type StatusPillProps = {
  color: string;
  text: string;
  icon?: ReactNode;
  className?: string;
};

export function StatusPill({ color, text, icon, className = '' }: StatusPillProps) {
  return (
    <span
      className={`status-pill ${className}`}
      style={{
        background: `color-mix(in oklch, ${color} 18%, transparent)`,
        color,
        border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
      }}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {text}
    </span>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
};

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  const id = useId();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <label
        htmlFor={id}
        className="toggle-track"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        style={{ opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        tabIndex={0}
        onKeyDown={(e) => { if (!disabled && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); onChange(!checked); } }}
      >
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          aria-label={label}
        />
        <div className="toggle-knob" />
      </label>
    </div>
  );
}

// ─── AvatarRing ───────────────────────────────────────────────────────────────
type AvatarRingProps = {
  src?: string | null;
  alt: string;
  size?: number;
  /** If true, don't animate (for dense lists like conversation rows) */
  static?: boolean;
};

export function AvatarRing({ src, alt, size = 64, static: isStatic }: AvatarRingProps) {
  const imgSrc = src || defaultProfileImg;
  const ringPad = Math.max(2, Math.round(size * 0.03));
  const imgSize = size - ringPad * 2;

  if (isStatic) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, var(--accent), var(--accent-2), var(--accent-3), var(--accent))',
          padding: ringPad,
          flexShrink: 0,
        }}
      >
        <img
          src={imgSrc}
          alt={alt}
          style={{ width: imgSize, height: imgSize, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      className="avatar-ring-conic"
      style={{ width: size, height: size, padding: ringPad, flexShrink: 0 }}
      aria-hidden="false"
    >
      <img
        src={imgSrc}
        alt={alt}
        style={{ width: imgSize, height: imgSize, objectFit: 'cover' }}
      />
    </div>
  );
}

// ─── PillButton ───────────────────────────────────────────────────────────────
type PillButtonVariant = 'solid' | 'outline' | 'icon' | 'danger';

type PillButtonProps = {
  variant?: PillButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  'aria-label'?: string;
  children: ReactNode;
  className?: string;
};

export function PillButton({
  variant = 'outline',
  onClick,
  disabled,
  type = 'button',
  'aria-label': ariaLabel,
  children,
  className = '',
}: PillButtonProps) {
  return (
    <button
      type={type}
      className={`pill-btn pill-btn--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={disabled ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
    >
      {children}
    </button>
  );
}

// ─── GlassCard ────────────────────────────────────────────────────────────────
type GlassCardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
};

export function GlassCard({ children, className = '', onClick, style }: GlassCardProps) {
  return (
    <div
      className={`glass-card ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined, ...style }}
    >
      {children}
    </div>
  );
}

// ─── Kicker ───────────────────────────────────────────────────────────────────
export function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`kicker ${className}`}>{children}</div>;
}

// ─── ConstellationThumb ───────────────────────────────────────────────────────
// Generates a deterministic SVG constellation from a project ID seed.
// Pure visual — no network calls.

function seededRng(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return () => {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
}

const ACCENT_CYCLES = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)'];

type ConstellationThumbProps = {
  projectId: string;
  width?: number;
  height?: number;
  accentIndex?: number;
};

export function ConstellationThumb({
  projectId,
  width = 320,
  height = 180,
  accentIndex = 0,
}: ConstellationThumbProps) {
  const rng = seededRng(projectId);
  const accent = ACCENT_CYCLES[accentIndex % ACCENT_CYCLES.length];
  const nodeCount = 6 + Math.floor(rng() * 4); // 6–9 nodes

  const nodes = Array.from({ length: nodeCount }, () => ({
    x: 16 + rng() * (width - 32),
    y: 16 + rng() * (height - 32),
  }));

  // edges: each node → next + one random extra
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push([i, i + 1]);
  }
  for (let i = 0; i < nodes.length; i++) {
    const target = Math.floor(rng() * nodes.length);
    if (target !== i) edges.push([i, target]);
  }

  // Sine waveform underlay
  const wavePoints = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * width;
    const y = height - 20 - Math.sin((i / 39) * Math.PI * 3 + rng() * 2) * 18;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`bg-${projectId}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* background */}
      <rect width={width} height={height} fill="var(--panel-inner)" rx="var(--radius-md)" />
      <rect width={width} height={height} fill={`url(#bg-${projectId})`} />

      {/* waveform underlay */}
      <polyline
        points={wavePoints}
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* edges */}
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke={accent}
          strokeWidth="1"
          opacity="0.35"
        />
      ))}

      {/* nodes */}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="3" fill={accent} opacity="0.85" />
      ))}
    </svg>
  );
}

// ─── TimestampMono ────────────────────────────────────────────────────────────
export function TimestampMono({ iso }: { iso: string }) {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  let label: string;
  if (s < 60) label = `${s}s`;
  else if (s < 3600) label = `${Math.floor(s / 60)}m`;
  else if (s < 86400) label = `${Math.floor(s / 3600)}h`;
  else {
    const date = new Date(iso);
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    label = days[date.getDay()];
  }
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--sub-dim)',
        letterSpacing: '0.05em',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ─── SectionKicker ────────────────────────────────────────────────────────────
export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <div className="section-kicker">
      {children}
    </div>
  );
}
