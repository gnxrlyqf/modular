import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from "react";
import { gsap } from "gsap";
import drumstickImg from "./assets/drumstick.png";

/* ─────────────────────────────────────────────────────────────
 *  Xylophone theme: global drumstick + synthesized xylo tones.
 *  Any element with [data-xylo-note="C4"] (etc.) participates.
 * ───────────────────────────────────────────────────────────── */

export type XyloNote =
    | "C4" | "D4" | "E4" | "F4" | "G4" | "A4" | "B4"
    | "C5" | "D5" | "E5" | "F5" | "G5" | "A5" | "B5" | "C6";

const NOTE_FREQ: Record<XyloNote, number> = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
    G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
    G5: 783.99, A5: 880.00, B5: 987.77, C6: 1046.50,
};

const NOTE_ORDER: XyloNote[] = [
    "C4","D4","E4","F4","G4","A4","B4",
    "C5","D5","E5","F5","G5","A5","B5","C6",
];

interface XyloCtx {
    strike: (el: Element, note?: XyloNote, pos?: { x: number; y: number }) => void;
}
const Ctx = createContext<XyloCtx | null>(null);

export function useXylophone() {
    const c = useContext(Ctx);
    if (!c) throw new Error("useXylophone outside XyloProvider");
    return c;
}

/* ─── Audio engine: one shared AudioContext, synth on demand ─── */
function makeAudioEngine() {
    let ctx: AudioContext | null = null;
    let muted = false;

    function ensure(): AudioContext | null {
        if (muted) return null;
        if (!ctx) {
            const AC = (window.AudioContext ||
                (window as any).webkitAudioContext) as typeof AudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        return ctx;
    }

    function play(freq: number) {
        const ac = ensure();
        if (!ac) return;
        const now = ac.currentTime;

        // Xylophone bar = fundamental + strong odd partial at ~3x + faint 5x.
        // Short bell-like envelope: fast attack, exponential decay.
        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.55, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        gain.connect(ac.destination);

        const partials: Array<[number, number, OscillatorType]> = [
            [1.0, 1.0, "sine"],
            [3.0, 0.35, "sine"],
            [5.4, 0.08, "triangle"],
        ];
        for (const [mult, amp, type] of partials) {
            const osc = ac.createOscillator();
            osc.type = type;
            osc.frequency.value = freq * mult;
            const pg = ac.createGain();
            pg.gain.value = amp;
            osc.connect(pg).connect(gain);
            osc.start(now);
            osc.stop(now + 1.3);
        }
    }

    return {
        play,
        setMuted(m: boolean) { muted = m; },
        isMuted() { return muted; },
    };
}

/* ─── Note inference: map element properties to a pitch ─── */
function inferNote(el: Element): XyloNote {
    const explicit = (el as HTMLElement).dataset?.xyloNote as XyloNote | undefined;
    if (explicit && explicit in NOTE_FREQ) return explicit;

    // Fallback: hash horizontal position → pitch (left = low, right = high).
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, rect.left / Math.max(1, window.innerWidth)));
    const idx = Math.floor(ratio * (NOTE_ORDER.length - 1));
    return NOTE_ORDER[idx];
}

const REST_ROTATION = 0;   // straight at rest
const STRIKE_ROTATION = 25; // clockwise tilt on hit

/* ─── Provider: drumstick + audio + global click/keydown handler ─── */
export function XyloProvider({ children }: { children: React.ReactNode }) {
    const stickRef = useRef<HTMLImageElement | null>(null);
    const engineRef = useRef(makeAudioEngine());
    const busyRef = useRef(false);
    const mouseYRef = useRef<number>(window.innerHeight * 0.5);

    function restX(): number {
        const stick = stickRef.current;
        const w = stick?.offsetWidth ?? 220;
        return window.innerWidth - w;
    }

    // Y offset: shift stick up by height/2 so visual strike point aligns with cursor.
    function yOffset(): number {
        const stick = stickRef.current;
        return -((stick?.offsetHeight ?? 0) / 2);
    }

    // Initial rest pose — pinned to right edge, vertically centered, straight.
    useEffect(() => {
        const stick = stickRef.current;
        if (!stick) return;
        const apply = () => gsap.set(stick, {
            x: restX(),
            y: mouseYRef.current + yOffset(),
            rotation: REST_ROTATION,
        });
        if (stick.complete) apply();
        else stick.addEventListener("load", apply, { once: true });
        function onResize() {
            if (busyRef.current || !stickRef.current) return;
            gsap.set(stickRef.current, { x: restX() });
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const strike = useCallback((el: Element, note?: XyloNote, pos?: { x: number; y: number }) => {
        const stick = stickRef.current;
        const n = note ?? inferNote(el);
        const freq = NOTE_FREQ[n];
        if (!stick || busyRef.current) {
            engineRef.current.play(freq);
            return;
        }
        busyRef.current = true;

        // Prefer exact mouse position; fallback to element center (keyboard path).
        let hitX: number, hitY: number;
        if (pos) {
            hitX = pos.x;
            hitY = pos.y;
        } else {
            const r = el.getBoundingClientRect();
            hitX = r.left + r.width / 2;
            hitY = r.top + r.height / 2;
        }

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reduced) {
            engineRef.current.play(freq);
            gsap.fromTo(
                el,
                { filter: "brightness(1.6)" },
                { filter: "brightness(1)", duration: 0.35, ease: "power2.out" }
            );
            busyRef.current = false;
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => { busyRef.current = false; },
        });

        const flashKeyframes = {
            keyframes: [
                { scale: 0.96, filter: "brightness(1.8)", duration: 0.05 },
                { scale: 1.04, filter: "brightness(1.3)", duration: 0.08 },
                { scale: 1, filter: "brightness(1)", duration: 0.18 },
            ],
            ease: "power2.out",
        };

        // 1. corner straight → mouse tilted (approach; no sound yet).
        tl.to(stick, {
            x: hitX,
            y: hitY + yOffset(),
            rotation: STRIKE_ROTATION,
            duration: 0.18,
            ease: "power2.out",
        })
        // 2. mouse tilted → mouse straight.
        .to(stick, {
            rotation: REST_ROTATION,
            duration: 0.1,
            ease: "power2.out",
        })
        // 3. mouse straight → mouse tilted: actual strike, play sound + flash.
        .to(stick, {
            rotation: STRIKE_ROTATION,
            duration: 0.08,
            ease: "power3.in",
            onStart: () => engineRef.current.play(freq),
        })
        .to(el, flashKeyframes, "<")
        // 4. mouse tilted → corner straight.
        .to(stick, {
            x: () => restX(),
            y: () => mouseYRef.current + yOffset(),
            rotation: REST_ROTATION,
            duration: 0.35,
            ease: "power2.inOut",
        });
    }, []);

    /* ─── Mouse-follow: stick tracks cursor Y only; X stays at right edge. ─── */
    useEffect(() => {
        function onMove(e: MouseEvent) {
            mouseYRef.current = e.clientY;
            if (busyRef.current || !stickRef.current) return;
            gsap.to(stickRef.current, {
                y: e.clientY + yOffset(),
                duration: 0.35,
                ease: "power2.out",
                overwrite: "auto",
            });
        }
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    /* ─── Global listeners: click + keyboard activation ─── */
    useEffect(() => {
        function findNoteEl(target: EventTarget | null): HTMLElement | null {
            if (!(target instanceof Element)) return null;
            return target.closest<HTMLElement>("[data-xylo-note]");
        }
        function onClick(e: MouseEvent) {
            const el = findNoteEl(e.target);
            if (el) strike(el, undefined, { x: e.clientX, y: e.clientY });
        }
        function onKey(e: KeyboardEvent) {
            if (e.key !== "Enter" && e.key !== " ") return;
            const el = findNoteEl(document.activeElement);
            if (el) strike(el);
        }
        document.addEventListener("click", onClick, true);
        document.addEventListener("keydown", onKey, true);
        return () => {
            document.removeEventListener("click", onClick, true);
            document.removeEventListener("keydown", onKey, true);
        };
    }, [strike]);

    return (
        <Ctx.Provider value={{ strike }}>
            {children}
            <img
                ref={stickRef}
                src={drumstickImg}
                alt=""
                aria-hidden="true"
                className="xylo-drumstick"
                draggable={false}
            />
        </Ctx.Provider>
    );
}

/* ─── Presentational: xylophone-bar styled button / anchor ─── */
interface NoteProps {
    note?: XyloNote;
    children?: React.ReactNode;
    onClick?: () => void;
    className?: string;
    href?: string;
    type?: "button" | "submit";
    ariaLabel?: string;
}

export function XyloButton(props: NoteProps) {
    const note = props.note ?? "C4";
    return (
        <button
            type={props.type ?? "button"}
            onClick={props.onClick}
            aria-label={props.ariaLabel}
            data-xylo-note={note}
            className={`xylo-note xylo-note--${note.toLowerCase()} ${props.className ?? ""}`}
        >
            {props.children}
        </button>
    );
}

export function XyloAnchor(props: NoteProps) {
    const note = props.note ?? "C4";
    return (
        <a
            href={props.href}
            onClick={props.onClick}
            aria-label={props.ariaLabel}
            data-xylo-note={note}
            tabIndex={0}
            className={`xylo-note xylo-note--${note.toLowerCase()} ${props.className ?? ""}`}
        >
            {props.children}
        </a>
    );
}
