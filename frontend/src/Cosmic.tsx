import React, { useMemo } from "react";

const cosmicPalette = {
  bg0: "#05060f",
  bg1: "#0b0e23",
  accent: "#a78bfa",
  accent2: "#7dd3fc",
  accent3: "#f0abfc",
  nebulaA: "rgba(167,139,250,0.25)",
  nebulaB: "rgba(125,211,252,0.18)",
  nebulaC: "rgba(240,171,252,0.12)",
};

const cosmicFonts = {
  display: '"Fraunces", Georgia, serif',
  ui: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

const cosmicShared = {
  text: "#e8ecff",
  sub: "#8a92b8",
  panel: "rgba(18, 22, 48, 0.55)",
  panelEdge: "rgba(140, 160, 220, 0.12)",
};

const v = cosmicPalette;

export function CosmicNebula() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <div
        className="cos-neb-a"
        style={{
          position: "absolute",
          left: "12%",
          top: "8%",
          width: 620,
          height: 620,
          background: `radial-gradient(circle, ${v.nebulaA}, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        className="cos-neb-b"
        style={{
          position: "absolute",
          right: "4%",
          top: "40%",
          width: 720,
          height: 720,
          background: `radial-gradient(circle, ${v.nebulaB}, transparent 60%)`,
          filter: "blur(50px)",
        }}
      />
      <div
        className="cos-neb-c"
        style={{
          position: "absolute",
          left: "38%",
          bottom: "8%",
          width: 460,
          height: 460,
          background: `radial-gradient(circle, ${v.nebulaC}, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}

function GlassPanel({
  children,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        background: cosmicShared.panel,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${cosmicShared.panelEdge}`,
        borderRadius: 18,
        boxShadow:
          "0 12px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Knob({
  value = 0.4,
  size = 44,
  color,
}: {
  value?: number;
  size?: number;
  color: string;
}) {
  const angle = -135 + value * 270;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, #2a2f55, #0c0f24)",
        border: `1px solid ${cosmicShared.panelEdge}`,
        position: "relative",
        boxShadow:
          "inset 0 -2px 4px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 2,
          height: size * 0.35,
          background: color,
          borderRadius: 1,
          transform: `translate(-50%, -100%) rotate(${angle}deg)`,
          transformOrigin: "50% 100%",
          boxShadow: `0 0 6px ${color}`,
        }}
      />
    </div>
  );
}

function CosmicHero({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        textAlign: "center",
        padding: "110px 24px 64px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 100,
          background: `${v.accent}14`,
          border: `1px solid ${v.accent}30`,
          color: v.accent,
          fontFamily: cosmicFonts.mono,
          fontSize: 12,
          marginBottom: 32,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: v.accent2,
            boxShadow: `0 0 8px ${v.accent2}`,
          }}
        />
        v0.4 · open beta · 24 modules live
      </div>
      <h1
        style={{
          fontFamily: cosmicFonts.display,
          fontSize: "clamp(48px, 9vw, 92px)",
          fontWeight: 400,
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          margin: "0 0 24px",
          color: cosmicShared.text,
        }}
      >
        Your modular synth,
        <br />
        <em
          style={{
            fontStyle: "italic",
            background: `linear-gradient(135deg, ${v.accent} 0%, ${v.accent3} 50%, ${v.accent2} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          built in the browser.
        </em>
      </h1>
      <p
        style={{
          fontFamily: cosmicFonts.ui,
          fontSize: 18,
          color: cosmicShared.sub,
          maxWidth: 540,
          margin: "0 auto 40px",
          lineHeight: 1.55,
        }}
      >
        Patch oscillators, filters and effects on an infinite canvas. Learn
        how sound works, make music, share with the world.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onGetStarted}
          style={{
            padding: "14px 28px",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            background: cosmicShared.text,
            color: "#05060f",
            fontFamily: cosmicFonts.ui,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Open the rack
        </button>
        <button
          type="button"
          style={{
            padding: "14px 28px",
            borderRadius: 14,
            cursor: "pointer",
            background: "transparent",
            color: cosmicShared.text,
            border: `1px solid ${cosmicShared.panelEdge}`,
            fontFamily: cosmicFonts.ui,
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          ▶ Watch demo
        </button>
      </div>
    </div>
  );
}

function CosmicSynthPreview() {
  const modules = [
    { name: "OSC.A", tag: "SAWTOOTH", accent: v.accent2, knobs: [0.6, 0.3, 0.8] },
    { name: "FILTER", tag: "LOW PASS · 24", accent: v.accent, knobs: [0.5, 0.7, 0.4] },
    { name: "DELAY", tag: "1/4 · STEREO", accent: v.accent3, knobs: [0.3, 0.6, 0.5] },
  ];
  const bars = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        x: i * 7.5,
        h: 4 + Math.abs(Math.sin(i * 0.5) * 14 + Math.sin(i * 0.13) * 10),
        active: i < 30,
      })),
    []
  );
  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 24px 80px",
      }}
    >
      <GlassPanel style={{ padding: 24, borderRadius: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {modules.map((m) => (
            <div
              key={m.name}
              style={{
                background:
                  "linear-gradient(180deg, rgba(20,24,55,0.6), rgba(8,10,28,0.6))",
                border: `1px solid ${cosmicShared.panelEdge}`,
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: cosmicFonts.mono,
                    fontSize: 11,
                    color: m.accent,
                    letterSpacing: "0.1em",
                  }}
                >
                  {m.name}
                </span>
                <span
                  style={{
                    fontFamily: cosmicFonts.mono,
                    fontSize: 9,
                    color: cosmicShared.sub,
                    letterSpacing: "0.08em",
                  }}
                >
                  {m.tag}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginBottom: 12,
                }}
              >
                {m.knobs.map((kv, j) => (
                  <Knob key={j} value={kv} color={m.accent} />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: `1px dashed ${cosmicShared.panelEdge}`,
                }}
              >
                {[0, 1, 2, 3].map((k) => (
                  <div
                    key={k}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      background:
                        k < 2
                          ? `radial-gradient(circle, ${m.accent}, ${m.accent}40)`
                          : "rgba(255,255,255,0.06)",
                      boxShadow: k < 2 ? `0 0 8px ${m.accent}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            padding: "14px 18px",
            background: "rgba(5,7,20,0.6)",
            borderRadius: 12,
            border: `1px solid ${cosmicShared.panelEdge}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${v.accent}, ${v.accent3})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0b0820",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ▶
          </div>
          <svg
            width="100%"
            height="40"
            viewBox="0 0 600 40"
            preserveAspectRatio="none"
            style={{ flex: 1 }}
          >
            {bars.map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={20 - b.h / 2}
                width={4}
                height={b.h}
                rx={2}
                fill={b.active ? v.accent2 : "rgba(255,255,255,0.15)"}
              />
            ))}
          </svg>
          <span
            style={{
              fontFamily: cosmicFonts.mono,
              fontSize: 11,
              color: cosmicShared.sub,
              flexShrink: 0,
            }}
          >
            0:42 / 1:58
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}

function CosmicModuleCatalog() {
  const cats = [
    { type: "OSC", count: 6, color: v.accent2, items: ["Saw", "Square", "Sine", "Wavetable", "FM", "Noise"] },
    { type: "FILTER", count: 4, color: v.accent, items: ["LP24", "HP12", "BP", "Comb"] },
    { type: "MOD", count: 5, color: v.accent3, items: ["LFO", "ADSR", "AR", "S&H", "Random"] },
    { type: "FX", count: 6, color: v.accent2, items: ["Delay", "Reverb", "Chorus", "Drive", "Bitcrush", "Comp"] },
    { type: "UTIL", count: 3, color: v.accent, items: ["Mixer", "VCA", "Scope"] },
  ];
  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        maxWidth: 1180,
        margin: "0 auto",
        padding: "40px 24px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: cosmicFonts.mono,
              fontSize: 11,
              color: v.accent,
              letterSpacing: "0.2em",
              marginBottom: 8,
            }}
          >
            ── 01 / THE RACK
          </div>
          <h2
            style={{
              fontFamily: cosmicFonts.display,
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 400,
              color: cosmicShared.text,
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            Twenty-four modules,{" "}
            <em style={{ color: v.accent }}>infinite cables.</em>
          </h2>
        </div>
        <div
          style={{
            fontFamily: cosmicFonts.ui,
            fontSize: 13,
            color: cosmicShared.sub,
          }}
        >
          Browse all →
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {cats.map((c) => (
          <GlassPanel key={c.type} style={{ padding: 18, borderRadius: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: cosmicFonts.mono,
                  fontSize: 11,
                  color: c.color,
                  letterSpacing: "0.15em",
                }}
              >
                {c.type}
              </span>
              <span
                style={{
                  fontFamily: cosmicFonts.display,
                  fontSize: 28,
                  color: cosmicShared.text,
                  fontStyle: "italic",
                }}
              >
                {c.count}
              </span>
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {c.items.map((it) => (
                <li
                  key={it}
                  style={{
                    fontFamily: cosmicFonts.ui,
                    fontSize: 12,
                    color: cosmicShared.sub,
                  }}
                >
                  · {it}
                </li>
              ))}
            </ul>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

function CosmicPatchOfTheWeek() {
  const points: Array<[number, number]> = [
    [60, 80], [140, 60], [220, 110], [300, 70], [340, 160],
    [260, 200], [180, 220], [100, 180], [60, 80],
  ];
  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        maxWidth: 1180,
        margin: "0 auto",
        padding: "0 24px 80px",
      }}
    >
      <GlassPanel style={{ padding: 0, borderRadius: 24, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
            minHeight: 320,
          }}
        >
          <div
            style={{
              padding: 36,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: cosmicFonts.mono,
                  fontSize: 11,
                  color: v.accent3,
                  letterSpacing: "0.2em",
                  marginBottom: 16,
                }}
              >
                ── 02 / PATCH OF THE WEEK
              </div>
              <h3
                style={{
                  fontFamily: cosmicFonts.display,
                  fontSize: 40,
                  fontWeight: 400,
                  color: cosmicShared.text,
                  margin: "0 0 12px",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                }}
              >
                <em style={{ fontStyle: "italic" }}>Submarine Bells</em>
              </h3>
              <div
                style={{
                  fontFamily: cosmicFonts.ui,
                  fontSize: 14,
                  color: cosmicShared.sub,
                }}
              >
                by{" "}
                <span style={{ color: cosmicShared.text }}>@kira_oss</span> ·
                12 modules · 4 LFOs
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              <button
                type="button"
                style={{
                  padding: "10px 20px",
                  borderRadius: 100,
                  border: "none",
                  cursor: "pointer",
                  background: v.accent,
                  color: "#05060f",
                  fontFamily: cosmicFonts.ui,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ▶ Play
              </button>
              <button
                type="button"
                style={{
                  padding: "10px 20px",
                  borderRadius: 100,
                  cursor: "pointer",
                  background: "transparent",
                  color: cosmicShared.text,
                  border: `1px solid ${cosmicShared.panelEdge}`,
                  fontFamily: cosmicFonts.ui,
                  fontSize: 13,
                }}
              >
                Open patch
              </button>
            </div>
          </div>
          <div
            style={{
              background: `radial-gradient(ellipse at center, ${v.nebulaA}, transparent 70%), radial-gradient(ellipse at 80% 80%, ${v.nebulaB}, transparent 60%)`,
              borderLeft: `1px solid ${cosmicShared.panelEdge}`,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 400 280" style={{ width: "100%", height: "100%" }}>
              {points.map(([cx, cy], i) => (
                <React.Fragment key={i}>
                  {i < points.length - 1 && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={points[i + 1][0]}
                      y2={points[i + 1][1]}
                      stroke={v.accent2}
                      strokeOpacity="0.5"
                      strokeWidth="1"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill={v.accent2}
                    style={{ filter: `drop-shadow(0 0 6px ${v.accent2})` }}
                  />
                </React.Fragment>
              ))}
            </svg>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

function CosmicLeaderboard() {
  const rows = [
    { rank: 1, user: "@nebular", patch: "Voidcaller", plays: "12.4k", delta: "+2" },
    { rank: 2, user: "@kira_oss", patch: "Submarine Bells", plays: "9.8k", delta: "—" },
    { rank: 3, user: "@plinko", patch: "Saw In Half", plays: "7.1k", delta: "+5" },
    { rank: 4, user: "@dustmote", patch: "Long Decay", plays: "6.4k", delta: "-1" },
    { rank: 5, user: "@hexcoil", patch: "Bitter Bloom", plays: "5.2k", delta: "+1" },
  ];
  const cols = "60px 1fr 1.2fr 100px 80px";
  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        maxWidth: 1180,
        margin: "0 auto",
        padding: "0 24px 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: cosmicFonts.mono,
              fontSize: 11,
              color: v.accent2,
              letterSpacing: "0.2em",
              marginBottom: 8,
            }}
          >
            ── 03 / LEADERBOARD
          </div>
          <h2
            style={{
              fontFamily: cosmicFonts.display,
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 400,
              color: cosmicShared.text,
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            This week&apos;s{" "}
            <em style={{ color: v.accent2 }}>signal.</em>
          </h2>
        </div>
        <div
          style={{
            fontFamily: cosmicFonts.mono,
            fontSize: 12,
            color: cosmicShared.sub,
          }}
        >
          updated 2m ago
        </div>
      </div>
      <GlassPanel style={{ padding: 0, borderRadius: 18, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "14px 24px",
            borderBottom: `1px solid ${cosmicShared.panelEdge}`,
            fontFamily: cosmicFonts.mono,
            fontSize: 10,
            color: cosmicShared.sub,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          <span>Rank</span>
          <span>Patch</span>
          <span>Author</span>
          <span style={{ textAlign: "right" }}>Plays</span>
          <span style={{ textAlign: "right" }}>Δ</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.rank}
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              padding: "16px 24px",
              borderBottom:
                i < rows.length - 1
                  ? `1px solid ${cosmicShared.panelEdge}`
                  : "none",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: cosmicFonts.display,
                fontSize: 22,
                color: r.rank === 1 ? v.accent3 : cosmicShared.text,
                fontStyle: "italic",
              }}
            >
              {String(r.rank).padStart(2, "0")}
            </span>
            <span
              style={{
                fontFamily: cosmicFonts.ui,
                fontSize: 15,
                color: cosmicShared.text,
              }}
            >
              {r.patch}
            </span>
            <span
              style={{
                fontFamily: cosmicFonts.mono,
                fontSize: 13,
                color: cosmicShared.sub,
              }}
            >
              {r.user}
            </span>
            <span
              style={{
                fontFamily: cosmicFonts.mono,
                fontSize: 13,
                color: cosmicShared.text,
                textAlign: "right",
              }}
            >
              {r.plays}
            </span>
            <span
              style={{
                fontFamily: cosmicFonts.mono,
                fontSize: 12,
                textAlign: "right",
                color: r.delta.startsWith("+")
                  ? v.accent
                  : r.delta.startsWith("-")
                  ? "#f87171"
                  : cosmicShared.sub,
              }}
            >
              {r.delta}
            </span>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

function CosmicFooter() {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        borderTop: `1px solid ${cosmicShared.panelEdge}`,
        padding: "40px 24px",
        maxWidth: 1180,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: cosmicShared.text,
            fontFamily: cosmicFonts.display,
            fontSize: 18,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 6,
              background: `conic-gradient(from 90deg, ${v.accent}, ${v.accent2}, ${v.accent3}, ${v.accent})`,
            }}
          />
          trandandan
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            fontFamily: cosmicFonts.mono,
            fontSize: 11,
            color: cosmicShared.sub,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>github</span>
          <span>discord</span>
          <span>twitter</span>
          <span>credits</span>
        </div>
        <div
          style={{
            fontFamily: cosmicFonts.mono,
            fontSize: 10,
            color: cosmicShared.sub,
            letterSpacing: "0.12em",
          }}
        >
          MIT · 2026 · MADE BY HUMANS
        </div>
      </div>
    </div>
  );
}

export default function CosmicLanding({
  onGetStarted,
}: {
  onGetStarted?: () => void;
}) {
  return (
    <div style={{ fontFamily: cosmicFonts.ui }}>
      <CosmicHero onGetStarted={onGetStarted} />
      <CosmicSynthPreview />
      <CosmicModuleCatalog />
      <CosmicPatchOfTheWeek />
      <CosmicLeaderboard />
      <CosmicFooter />
    </div>
  );
}
