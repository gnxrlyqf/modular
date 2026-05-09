# Lmoussiqar — Visual Style Guide

A living reference for maintaining visual consistency across the platform. Every new component, overlay, or page should follow these rules.

---

## 1. Color Palette

### Background Layers (Dark Sky)

| Token | Value | Usage |
|---|---|---|
| `--sky-deep` | `#020617` | Topmost gradient stop, near-black |
| `--sky-mid` | `#0a0e27` | Mid-sky tone, deep navy |
| `--sky-dark` | `#050816` | Lower gradient merging to black |
| `--sky-black` | `#000000` | Bottom / edges |

**Gradient direction:** `170deg` diagonal, top-left to bottom-right.  
Never use flat solid backgrounds — always layer subtle gradients.

### Primary (Indigo Family)

| Token | Value | Usage |
|---|---|---|
| `indigo-100` | `#e0e7ff` | Body text, primary readable content |
| `indigo-200` | `#c7d2fe` | Headings, nav labels, emphasis text |
| `indigo-300` | `#a5b4fc` | Subtext, descriptions, secondary content |
| `indigo-400` | `#818cf8` | Accent borders, active states, links |
| `indigo-500` | `#6366f1` | Glow color, focus rings, highlights |
| `indigo-300/50` | `rgba(165,180,252,0.5)` | Muted labels, timestamps |

### Neutrals (for glass surfaces)

| Token | Value | Usage |
|---|---|---|
| `white/4` | `rgba(255,255,255,0.04)` | Glass background (resting) |
| `white/8` | `rgba(255,255,255,0.08)` | Glass background (hover) |
| `white/10` | `rgba(255,255,255,0.10)` | Borders, dividers |
| `white/15` | `rgba(255,255,255,0.15)` | Borders (hover), active edges |
| `white/5` | `rgba(255,255,255,0.05)` | Input fields, form backgrounds |

### Accent (for hero text gradients)

Use these as `bg-gradient-to-r` + `bg-clip-text text-transparent`:

```
from-indigo-300 via-blue-200 to-indigo-400     ← primary headline
from-blue-300 via-indigo-200 to-purple-300      ← secondary headline
```

### ❌ Colors to Avoid

- Pure white (`#fff`) for backgrounds or large text — too harsh against the dark sky
- Saturated primaries (`#ff0000`, `#00ff00`, `#0000ff`) — break the muted palette
- Gray tones (`#666`, `#999`) — look muddy; use indigo-tinted neutrals instead
- Any warm tones (orange, yellow, red) unless intentionally signaling errors/warnings

---

## 2. Typography

### Font Stack

| Priority | Font | Usage |
|---|---|---|
| Primary | **Inter** (Google Fonts) | UI text, buttons, inputs, descriptions |
| Secondary | **Lexend** (local TTF) | Logo, accent headings if desired |
| Fallback | `sans-serif` | System fallback |

### Scale

| Element | Size | Weight | Font |
|---|---|---|---|
| Hero heading | `text-5xl` → `text-7xl` (responsive) | `font-bold` (700) | Inter |
| Section heading | `text-3xl` | `font-semibold` (600) | Inter |
| Body / description | `text-lg` → `text-xl` | `font-light` (300) | Inter |
| Nav label / logo | `text-xl` | `font-semibold` (600) | Inter |
| Button text | `text-sm` | `font-medium` (500) | Inter |
| Input placeholder | `text-sm` | `font-normal` (400) | Inter |

### Rules

- Always use `tracking-wide` or `tracking-wider` on small UI labels (buttons, badges)
- Use `-webkit-font-smoothing: antialiased` globally (already set in `index.css`)
- Never use browser-default fonts — always specify the stack
- Hero text uses gradient clipping (`bg-clip-text text-transparent`), never solid colors

---

## 3. Surfaces & Glassmorphism

Every elevated surface (nav bars, cards, modals, overlays) should use the **glass** pattern:

```css
.glass {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Hover State

```css
.glass-hover:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
}
```

### Guidelines

- **Blur radius:** 16–24px. Lower = more transparent feel. Higher = more frosted.
- **Border:** Always add a subtle `white/8` → `white/15` border. Glass without borders looks like it's floating wrong.
- **Corner radius:** `rounded-2xl` (16px) for large surfaces (nav, cards), `rounded-lg` (8px) for buttons/inputs.
- **Never stack** two glass surfaces directly on top of each other — blur compounds and looks muddy.

---

## 4. Glow & Shadows

### Indigo Glow (interactive elements)

```css
.glow-indigo {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15),
                0 0 40px rgba(99, 102, 241, 0.05);
}
.glow-indigo:hover {
    box-shadow: 0 0 25px rgba(99, 102, 241, 0.25),
                0 0 50px rgba(99, 102, 241, 0.1);
}
```

### Usage Rules

- Every clickable glass surface gets `glow-indigo`
- Glow intensity increases on hover — provides visual feedback
- **Never** use `box-shadow` with black/dark values — always indigo-tinted
- Canvas elements (stars/notes) use `shadowBlur` with `rgba(180, 200, 255, ...)` — a cooler, bluer glow

---

## 5. Animations & Transitions

### Entry Animations (GSAP — AnimatedContent)

| Property | Value | Notes |
|---|---|---|
| `distance` | `30–50px` | How far elements slide in |
| `direction` | `vertical` | Always slide up/down, not sideways |
| `duration` | `0.8–1.2s` | Longer = more cinematic |
| `ease` | `power3.out` | Smooth deceleration — never linear |
| `delay` | `0.1–0.6s` | Stagger elements for cascade feel |

### CSS Transitions (buttons, inputs, hover states)

```
duration-200 ease-out      ← default for interactive elements
duration-100               ← for instant-feel states (active, focus)
```

### Canvas Animations (StarField)

| Property | Value |
|---|---|
| Twinkle speed | `0.3–1.5` (randomized per note) |
| Magnetic radius | `180px` |
| Attract strength | `0.025` |
| Return-to-origin | `0.03` |
| Velocity damping | `0.88` |
| Scale interpolation | `0.08` (toward target), `0.05` (return) |
| Max scale | `3×` base radius |

### Rules

- All transitions use easing — **never** `linear` or `ease-in` (feels sluggish)
- Prefer `ease-out` / `power3.out` — things should arrive smoothly and settle
- Hover scale: `hover:scale-105` max — `110` feels jumpy
- Avoid `transform` + `box-shadow` animations on the same element (GPU compositing conflicts)

---

## 6. Interactive Elements

### Buttons

```
glass glass-hover glow-indigo rounded-lg
text-indigo-300/80 hover:text-white
px-4 py-1.5
text-sm font-medium tracking-wide
duration-200 ease-out hover:scale-105
```

### Inputs

```
bg-white/5 text-indigo-100
border border-white/10
focus:bg-white/10 focus:border-indigo-500/50
placeholder:text-indigo-300/30
rounded-md px-3 py-2
duration-200 ease-in-out
```

### Overlay Containers (modals, panels)

- Use `glass` base with higher blur (24px)
- `rounded-2xl` corners
- Entrance: fade in + slide up (GSAP `AnimatedContent`)
- Always include a close button (top-right)
- Backdrop: semi-transparent black (`bg-black/40 backdrop-blur-sm`)

---

## 7. Spacing & Layout

| Element | Spacing |
|---|---|
| Top bar padding | `px-4 py-3 my-5` |
| Top bar max-width | `max-w-200` (800px) centered |
| Button gap (nav) | `gap-3` |
| Hero → subtext gap | `mt-8` |
| Section padding | `py-16` to `py-24` |
| Card padding | `p-6` |

### Responsive Breakpoints

| Prefix | Min-width | Notes |
|---|---|---|
| (none) | Mobile-first | Base styles |
| `md:` | `768px` | Tablet — scale up type |
| `lg:` | `1024px` | Desktop — full layout |

### Rules

- Always center main content with `mx-auto max-w-{size}`
- Use `min-h-screen` for full-viewport sections
- The star canvas is `position: fixed` z-0 — content sits above at z-1+

---

## 8. Star Field (Canvas) Notes

The music notes in the background are the signature visual element:

- **Count:** ~220 notes — dense enough to feel alive, sparse enough to not distract
- **Base size:** `0.6–2.8px` radius — very small at rest
- **Shape:** Eighth note (♪) — oval head + vertical stem + curved flag
- **Color:** `rgba(220, 230, 255, α)` — cool near-white, blends with sky
- **Glow:** `rgba(180, 200, 255, α)` — blue-white halo via canvas `shadowBlur`
- **Rotation:** Each note has a random rotation (scaled by `0.3`) for organic variety
- **Interaction:** Magnetic pull within 180px of cursor + size scaling up to 3×

### Do

- Keep note shapes simple — detail is lost at small sizes
- Ensure `pointerEvents: none` on the canvas so UI stays clickable
- Use `requestAnimationFrame` — never `setInterval`

### Don't

- Don't render text glyphs (♪ Unicode) — canvas path drawing is faster
- Don't exceed 300 particles — frame drops on low-end devices
- Don't add collision detection between notes — unnecessary overhead

---

## 9. Quick Reference — Class Combos

```
// Glass card
"glass glow-indigo rounded-2xl p-6"

// Glass button
"glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105"

// Text input
"bg-white/5 text-indigo-100 border border-white/10 focus:bg-white/10 focus:border-indigo-500/50 placeholder:text-indigo-300/30 rounded-md px-3 py-2 outline-none duration-200"

// Hero heading (gradient text)
"font-inter text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-300 via-blue-200 to-indigo-400 bg-clip-text text-transparent"

// Muted subtext
"font-inter text-indigo-300/50 text-lg font-light tracking-wide"

// Nav bar
"glass glow-indigo rounded-2xl px-4 py-3 my-5 mx-auto max-w-200 flex items-center"
```
