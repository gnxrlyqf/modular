import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from "react";

export type XyloNote =
    | "C4" | "D4" | "E4" | "F4" | "G4" | "A4" | "B4"
    | "C5" | "D5" | "E5" | "F5" | "G5" | "A5" | "B5" | "C6";

const NOTE_FREQ: Record<XyloNote, number> = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
    G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
    G5: 783.99, A5: 880.00, B5: 987.77, C6: 1046.50,
};

/* Twinkle Twinkle Little Star — full sequence, loops */
const TWINKLE_NOTES: XyloNote[] = [
    "C4","C4","G4","G4","A4","A4","G4",
    "F4","F4","E4","E4","D4","D4","C4",
    "G4","G4","F4","F4","E4","E4","D4",
    "G4","G4","F4","F4","E4","E4","D4",
    "C4","C4","G4","G4","A4","A4","G4",
    "F4","F4","E4","E4","D4","D4","C4",
];

interface XyloCtx {
    strike: (pos?: { x: number; y: number }) => void;
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

/* ─── Module-level engine instance (shared, so Prefs can mute it) ─── */
const _globalEngine = makeAudioEngine();

export function setGlobalXyloMuted(muted: boolean): void {
    _globalEngine.setMuted(muted);
}

/* ─── Provider: audio + global click/keydown handler ─── */
export function XyloProvider({ children }: { children: React.ReactNode }) {
    const engineRef = useRef(_globalEngine);
    const noteIndexRef = useRef(0);

    function nextFreq(): number {
        const note = TWINKLE_NOTES[noteIndexRef.current % TWINKLE_NOTES.length];
        noteIndexRef.current++;
        return NOTE_FREQ[note];
    }

    const strike = useCallback((_pos?: { x: number; y: number }) => {
        engineRef.current.play(nextFreq());
    }, []);

    /* ─── Global listeners: any button/link click plays next note ─── */
    useEffect(() => {
        function findInteractive(target: EventTarget | null): HTMLElement | null {
            if (!(target instanceof Element)) return null;
            return target.closest<HTMLElement>("button, a, [role='button']");
        }
        function onClick(e: MouseEvent) {
            const el = findInteractive(e.target);
            if (el) strike({ x: e.clientX, y: e.clientY });
        }
        function onKey(e: KeyboardEvent) {
            if (e.key !== "Enter" && e.key !== " ") return;
            const el = document.activeElement;
            if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) {
                engineRef.current.play(nextFreq());
            }
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
        </Ctx.Provider>
    );
}

/* ─── Presentational button / anchor ─── */
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
