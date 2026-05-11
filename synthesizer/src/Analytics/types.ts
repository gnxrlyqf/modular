/** Analytics data persisted per project in the backend analytics JSONField */

export interface SessionAnalytics {
  /** ISO timestamp when the project was opened */
  opened_at: string;
  /** ISO timestamp when the user left; null while session is active */
  closed_at: string | null;
  /** Total time from open to close in seconds */
  session_duration: number;
  /** Seconds spent inactive (no mouse/keyboard/patch input) during the session */
  idle_time: number;
}

export interface ModuleCountAnalytics {
  oscillators: number;
  filters: number;
  /** Distortion modules */
  effects: number;
  envelopes: number;
  gains: number;
  lfos: number;
  modulators: number;
  outputs: number;
  keyboards: number;
  /** Index signature — catches any future module type not yet in the map */
  [key: string]: number;
}

export interface SharingAnalytics {
  /** Total number of times the project has been shared */
  share_count: number;
  /** ISO date strings (YYYY-MM-DD) on which the project was shared; no duplicates */
  shared_days: string[];
}

export interface ProjectAnalytics {
  session: SessionAnalytics;
  modules: ModuleCountAnalytics;
  sharing: SharingAnalytics;
}

/** Safe defaults used when no analytics data exists yet */
export const DEFAULT_ANALYTICS: ProjectAnalytics = {
  session: {
    opened_at: new Date().toISOString(),
    closed_at: null,
    session_duration: 0,
    idle_time: 0,
  },
  modules: {
    oscillators: 0,
    filters: 0,
    effects: 0,
    envelopes: 0,
    gains: 0,
    lfos: 0,
    modulators: 0,
    outputs: 0,
    keyboards: 0,
  },
  sharing: {
    share_count: 0,
    shared_days: [],
  },
};
