import React, { useMemo, useState, useEffect } from "react";
import { t, useLanguage } from "./i18n";
import { usePrefs } from "./Prefs";

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

type CosmicShared = {
  text: string;
  sub: string;
  panel: string;
  panelEdge: string;
  panelBlur: boolean;
  panelShadow: string;
  moduleCard: string;
  waveformBg: string;
  knobBg: string;
  knobShadow: string;
  portInactive: string;
  barInactive: string;
};

const SHARED_DARK: CosmicShared = {
  text: "#e8ecff",
  sub: "#8a92b8",
  panel: "rgba(18, 22, 48, 0.55)",
  panelEdge: "rgba(140, 160, 220, 0.12)",
  panelBlur: true,
  panelShadow: "0 12px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  moduleCard: "linear-gradient(180deg, rgba(20,24,55,0.6), rgba(8,10,28,0.6))",
  waveformBg: "rgba(5,7,20,0.6)",
  knobBg: "radial-gradient(circle at 30% 30%, #2a2f55, #0c0f24)",
  knobShadow: "inset 0 -2px 4px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4)",
  portInactive: "rgba(255,255,255,0.06)",
  barInactive: "rgba(255,255,255,0.15)",
};

const SHARED_LIGHT: CosmicShared = {
  text: "#1e1b4b",
  sub: "rgba(30, 27, 75, 0.55)",
  panel: "#ffffff",
  panelEdge: "rgba(99, 102, 241, 0.15)",
  panelBlur: false,
  panelShadow: "0 4px 24px rgba(99, 102, 241, 0.10), 0 1px 4px rgba(0,0,0,0.05)",
  moduleCard: "rgba(99, 102, 241, 0.04)",
  waveformBg: "rgba(99, 102, 241, 0.04)",
  knobBg: "radial-gradient(circle at 30% 30%, #dde6ff, #c7d2fe)",
  knobShadow: "inset 0 -1px 3px rgba(99,102,241,0.15), 0 1px 4px rgba(0,0,0,0.08)",
  portInactive: "rgba(99, 102, 241, 0.10)",
  barInactive: "rgba(30, 27, 75, 0.14)",
};

function useCosmicShared(): CosmicShared {
  const { prefs } = usePrefs();
  return prefs.theme === "light" ? SHARED_LIGHT : SHARED_DARK;
}

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
  const shared = useCosmicShared();
  return (
    <div
      {...rest}
      style={{
        background: shared.panel,
        backdropFilter: shared.panelBlur ? "blur(24px)" : "none",
        WebkitBackdropFilter: shared.panelBlur ? "blur(24px)" : "none",
        border: `1px solid ${shared.panelEdge}`,
        borderRadius: 18,
        boxShadow: shared.panelShadow,
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
  const shared = useCosmicShared();
  const angle = -135 + value * 270;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: shared.knobBg,
        border: `1px solid ${shared.panelEdge}`,
        position: "relative",
        boxShadow: shared.knobShadow,
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

function CosmicHero({
  onGetStarted,
  isLoggedIn,
  onNewProject,
  onTryIt,
}: {
  onGetStarted?: () => void;
  isLoggedIn?: boolean;
  onNewProject?: () => void;
  onTryIt?: () => void;
}) {
  const shared = useCosmicShared();
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
        {t('cosmic.beta_badge')}
      </div>
      <h1
        style={{
          fontFamily: cosmicFonts.display,
          fontSize: "clamp(48px, 9vw, 92px)",
          fontWeight: 400,
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          margin: "0 0 24px",
          color: shared.text,
        }}
      >
        {t('home.hero.title1')}
        <br />
        <em
          style={{
            fontStyle: "italic",
            background: `linear-gradient(135deg, ${v.accent} 0%, ${v.accent3} 50%, ${v.accent2} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t('home.hero.title2')}
        </em>
      </h1>
      <p
        style={{
          fontFamily: cosmicFonts.ui,
          fontSize: 18,
          color: shared.sub,
          maxWidth: 540,
          margin: "0 auto 40px",
          lineHeight: 1.55,
        }}
      >
        {t('home.hero.desc')}
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {isLoggedIn ? (
          <>
            <button
              type="button"
              onClick={onNewProject}
              style={{
                padding: "16px 36px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: `linear-gradient(135deg, ${v.accent}, ${v.accent3})`,
                color: "#05060f",
                fontFamily: cosmicFonts.ui,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                boxShadow: `0 0 32px ${v.accent}50`,
              }}
            >
              {t('cosmic.new_project')}
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              style={{
                padding: "16px 28px",
                borderRadius: 14,
                cursor: "pointer",
                background: "transparent",
                color: shared.text,
                border: `1px solid ${shared.panelEdge}`,
                fontFamily: cosmicFonts.ui,
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {t('home.cta_open')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onTryIt}
              style={{
                padding: "14px 28px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: `linear-gradient(135deg, ${v.accent}, ${v.accent3})`,
                color: "#05060f",
                fontFamily: cosmicFonts.ui,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {t('cosmic.try_it')}
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              style={{
                padding: "14px 28px",
                borderRadius: 14,
                cursor: "pointer",
                background: "transparent",
                color: shared.text,
                border: `1px solid ${shared.panelEdge}`,
                fontFamily: cosmicFonts.ui,
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {t('cosmic.get_started')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CosmicSynthPreview() {
  const shared = useCosmicShared();
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
                background: shared.moduleCard,
                border: `1px solid ${shared.panelEdge}`,
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
                    color: shared.sub,
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
                  borderTop: `1px dashed ${shared.panelEdge}`,
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
                          : shared.portInactive,
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
            background: shared.waveformBg,
            borderRadius: 12,
            border: `1px solid ${shared.panelEdge}`,
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
                fill={b.active ? v.accent2 : shared.barInactive}
              />
            ))}
          </svg>
          <span
            style={{
              fontFamily: cosmicFonts.mono,
              fontSize: 11,
              color: shared.sub,
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
  const shared = useCosmicShared();
  const cats = [
    { type: "OSC",   count: 5, color: v.accent2, items: ["Sine", "Square", "Saw", "Triangle", "Noise"] },
    { type: "LFO",   count: 2, color: v.accent,  items: ["Free", "Sync"] },
    { type: "ENV",   count: 4, color: v.accent3, items: ["Attack", "Decay", "Sustain", "Release"] },
    { type: "MOD",   count: 4, color: v.accent2, items: ["FM", "AM", "RM", "PM"] },
    { type: "DIST",  count: 4, color: v.accent,  items: ["Sinoid", "Soft Clip", "Hard Clip", "Bitcrush"] },
    { type: "FILTER",count: 4, color: v.accent3, items: ["HP", "LP", "Notch", "Bandpass"] },
    { type: "SEQ",   count: 4, color: v.accent2, items: ["4 steps", "8 steps", "16 steps", "32 steps"] },
    { type: "KBD",   count: 1, color: v.accent,  items: ["8 octaves"] },
    { type: "UTIL",  count: 3, color: v.accent3, items: ["Gain", "Mixer", "Splitter"] },
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
            {t('cosmic.the_rack_section')}
          </div>
          <h2
            style={{
              fontFamily: cosmicFonts.display,
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 400,
              color: shared.text,
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            {t('cosmic.rack_title')}{" "}
            <em style={{ color: v.accent }}>{t('cosmic.rack_title_em')}</em>
          </h2>
        </div>
        <div
          style={{
            fontFamily: cosmicFonts.ui,
            fontSize: 13,
            color: shared.sub,
          }}
        >
          {t('cosmic.browse_all')}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
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
                  color: shared.text,
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
                    color: shared.sub,
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
  const shared = useCosmicShared();
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
                {t('cosmic.patch_section')}
              </div>
              <h3
                style={{
                  fontFamily: cosmicFonts.display,
                  fontSize: 40,
                  fontWeight: 400,
                  color: shared.text,
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
                  color: shared.sub,
                }}
              >
                by{" "}
                <span style={{ color: shared.text }}>@kira_oss</span> ·
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
                {t('cosmic.play')}
              </button>
              <button
                type="button"
                style={{
                  padding: "10px 20px",
                  borderRadius: 100,
                  cursor: "pointer",
                  background: "transparent",
                  color: shared.text,
                  border: `1px solid ${shared.panelEdge}`,
                  fontFamily: cosmicFonts.ui,
                  fontSize: 13,
                }}
              >
                {t('cosmic.open_patch')}
              </button>
            </div>
          </div>
          <div
            style={{
              background: `radial-gradient(ellipse at center, ${v.nebulaA}, transparent 70%), radial-gradient(ellipse at 80% 80%, ${v.nebulaB}, transparent 60%)`,
              borderLeft: `1px solid ${shared.panelEdge}`,
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

type LeaderboardRow = { id: string; name: string; username: string; weekly_upvotes: number };

function CosmicLeaderboard({ onOpen }: { onOpen?: () => void }) {
  const shared = useCosmicShared();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community/weekly/')
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: LeaderboardRow[]) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const cols = "60px 1fr 1.2fr 100px";
  return (
    <div
      id="leaderboard"
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
            {t('cosmic.leaderboard_section')}
          </div>
          <h2
            style={{
              fontFamily: cosmicFonts.display,
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 400,
              color: shared.text,
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            {t('cosmic.leaderboard_title')}&apos;{" "}
            <em style={{ color: v.accent2 }}>{t('cosmic.leaderboard_title_em')}</em>
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpen}
          style={{
            fontFamily: cosmicFonts.mono,
            fontSize: 12,
            color: shared.sub,
            background: "none",
            border: "none",
            cursor: onOpen ? "pointer" : "default",
            padding: 0,
          }}
        >
          {t('cosmic.view_all')}
        </button>
      </div>
      <GlassPanel style={{ padding: 0, borderRadius: 18, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "14px 24px",
            borderBottom: `1px solid ${shared.panelEdge}`,
            fontFamily: cosmicFonts.mono,
            fontSize: 10,
            color: shared.sub,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          <span>{t('cosmic.leaderboard.rank')}</span>
          <span>{t('cosmic.leaderboard.patch')}</span>
          <span>{t('cosmic.leaderboard.author')}</span>
          <span style={{ textAlign: "right" }}>{t('cosmic.leaderboard.upvotes')}</span>
        </div>
        {loading && (
          <div style={{ padding: "32px 24px", fontFamily: cosmicFonts.mono, fontSize: 12, color: shared.sub, textAlign: "center" }}>
            {t('cosmic.leaderboard.loading')}
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div style={{ padding: "32px 24px", fontFamily: cosmicFonts.mono, fontSize: 12, color: shared.sub, textAlign: "center" }}>
            {t('cosmic.leaderboard.empty')}
          </div>
        )}
        {!loading && rows.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              padding: "16px 24px",
              borderBottom: i < rows.length - 1 ? `1px solid ${shared.panelEdge}` : "none",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: cosmicFonts.display,
                fontSize: 22,
                color: i === 0 ? v.accent3 : shared.text,
                fontStyle: "italic",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: cosmicFonts.ui, fontSize: 15, color: shared.text }}>
              {r.name}
            </span>
            <span style={{ fontFamily: cosmicFonts.mono, fontSize: 13, color: shared.sub }}>
              @{r.username}
            </span>
            <span style={{ fontFamily: cosmicFonts.mono, fontSize: 13, color: v.accent, textAlign: "right" }}>
              ↑{r.weekly_upvotes}
            </span>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}

function CosmicFooter() {
  const shared = useCosmicShared();
  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        borderTop: `1px solid ${shared.panelEdge}`,
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
            color: shared.text,
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
            letterSpacing: "0.05em",
          }}
        >
          {[
            { href: "https://github.com/gnxrlyqf/modular", label: "GitHub" },
            { href: "https://google.com",      label: "Google" },
            { href: "https://youtube.com",     label: "YouTube" },
            { href: "https://soundcloud.com",  label: "SoundCloud" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: shared.sub, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = shared.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = shared.sub)}
            >
              {label}
            </a>
          ))}
        </div>
        <div
          style={{
            fontFamily: cosmicFonts.mono,
            fontSize: 10,
            color: shared.sub,
            letterSpacing: "0.12em",
          }}
        >
          {t('cosmic.footer.mit')}
        </div>
      </div>
    </div>
  );
}

export default function CosmicLanding({
  onGetStarted,
  isLoggedIn,
  onNewProject,
  onTryIt,
  onOpenLeaderboard,
}: {
  onGetStarted?: () => void;
  isLoggedIn?: boolean;
  onNewProject?: () => void;
  onTryIt?: () => void;
  onOpenLeaderboard?: () => void;
}) {
  useLanguage();
  return (
    <div style={{ fontFamily: cosmicFonts.ui }}>
      <CosmicHero onGetStarted={onGetStarted} isLoggedIn={isLoggedIn} onNewProject={onNewProject} onTryIt={onTryIt} />
      <CosmicSynthPreview />
      <CosmicModuleCatalog />
      <CosmicPatchOfTheWeek />
      <CosmicLeaderboard onOpen={onOpenLeaderboard} />
      <CosmicFooter />
    </div>
  );
}
