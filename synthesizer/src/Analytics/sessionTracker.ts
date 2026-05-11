import type { SessionAnalytics } from './types';

/** Gap with no user input counted as idle (30 s) */
const IDLE_THRESHOLD_MS = 30_000;

/** Browser events treated as "user is active" */
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'wheel',
  'touchstart',
] as const;

interface StoredSession {
  opened_at: string;
  /** Idle seconds committed so far (not counting the current idle gap) */
  idle_seconds: number;
}

/**
 * Tracks how long a user has had a project open and how much of that time was idle.
 *
 * Persists to sessionStorage so a page refresh within the same tab doesn't reset
 * the session start time — opened_at stays stable across reloads.
 *
 * Idle detection: whenever there's a gap > IDLE_THRESHOLD_MS between activity events,
 * the excess (gap - threshold) is accumulated as idle time. This means short pauses
 * (< 30 s) aren't penalised — only extended inactivity is counted.
 */
export class SessionTracker {
  private readonly openedAt: string;
  private idleSeconds: number;
  private lastActiveAt: number = Date.now();
  private readonly storageKey: string;
  private persistIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(projectId: string) {
    this.storageKey = `synth_session_${projectId}`;
    const stored = this._load();

    if (stored) {
      // Same browser tab was refreshed — keep the original open time
      this.openedAt = stored.opened_at;
      this.idleSeconds = stored.idle_seconds;
    } else {
      this.openedAt = new Date().toISOString();
      this.idleSeconds = 0;
    }

    this._save();
    this._attach();

    // Flush idle accumulation to sessionStorage every 10 s so a crash still
    // preserves a recent snapshot of idle time
    this.persistIntervalId = setInterval(() => this._save(), 10_000);
  }

  /**
   * Current snapshot while the session is still active.
   * closed_at is null — call finalize() on page unload for the terminal snapshot.
   */
  getSnapshot(): SessionAnalytics {
    const now = Date.now();
    return {
      opened_at: this.openedAt,
      closed_at: null,
      session_duration: this._elapsedSeconds(now),
      idle_time: this.idleSeconds + this._pendingIdleSeconds(now),
    };
  }

  /**
   * Produces the final analytics snapshot with closed_at set.
   * Call from beforeunload / pagehide before the page tears down.
   */
  finalize(): SessionAnalytics {
    const now = Date.now();
    return {
      opened_at: this.openedAt,
      closed_at: new Date(now).toISOString(),
      session_duration: this._elapsedSeconds(now),
      idle_time: this.idleSeconds + this._pendingIdleSeconds(now),
    };
  }

  /**
   * Remove listeners and sessionStorage key.
   * Call when the component unmounts via a clean navigation (not a crash/refresh).
   */
  destroy() {
    this._detach();
    if (this.persistIntervalId) clearInterval(this.persistIntervalId);
    sessionStorage.removeItem(this.storageKey);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /** Idle seconds that have accrued in the current gap but haven't been committed yet */
  private _pendingIdleSeconds(now: number): number {
    const gap = now - this.lastActiveAt;
    return gap > IDLE_THRESHOLD_MS ? Math.floor((gap - IDLE_THRESHOLD_MS) / 1000) : 0;
  }

  private _elapsedSeconds(now: number): number {
    return Math.floor((now - new Date(this.openedAt).getTime()) / 1000);
  }

  private readonly _onActivity = () => {
    const now = Date.now();
    const gap = now - this.lastActiveAt;
    // Commit idle time from this gap before resetting the clock
    if (gap > IDLE_THRESHOLD_MS) {
      this.idleSeconds += Math.floor((gap - IDLE_THRESHOLD_MS) / 1000);
      this._save();
    }
    this.lastActiveAt = now;
  };

  private _attach() {
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, this._onActivity, { passive: true });
    }
  }

  private _detach() {
    for (const ev of ACTIVITY_EVENTS) {
      window.removeEventListener(ev, this._onActivity);
    }
  }

  private _load(): StoredSession | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }

  private _save() {
    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify({ opened_at: this.openedAt, idle_seconds: this.idleSeconds }),
    );
  }
}
