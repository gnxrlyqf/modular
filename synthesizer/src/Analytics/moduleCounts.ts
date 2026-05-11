import type { Module, ModuleType } from '../Modules/Modules';
import type { ModuleCountAnalytics } from './types';

/**
 * Maps each module type to its analytics category.
 * Add new module types here when they are introduced — they'll be counted automatically.
 */
const MODULE_CATEGORY: Record<ModuleType, keyof ModuleCountAnalytics> = {
  oscillator: 'oscillators',
  lfo:        'lfos',
  filter:     'filters',
  distortion: 'effects',
  envelope:   'envelopes',
  gain:       'gains',
  output:     'outputs',
  modulator:  'modulators',
  keyboard:   'keyboards',
};

const EMPTY_COUNTS: ModuleCountAnalytics = {
  oscillators: 0,
  filters:     0,
  effects:     0,
  envelopes:   0,
  gains:       0,
  lfos:        0,
  modulators:  0,
  outputs:     0,
  keyboards:   0,
};

/**
 * Compute module counts grouped by category from the current modules array.
 * Called on every modules state change (O(n), negligible cost).
 * Unknown future module types fall back to a bucket keyed by their type string.
 */
export function computeModuleCounts(modules: Module[]): ModuleCountAnalytics {
  const counts: ModuleCountAnalytics = { ...EMPTY_COUNTS };
  for (const m of modules) {
    const key = MODULE_CATEGORY[m.type];
    if (key !== undefined) {
      counts[key] = (counts[key] ?? 0) + 1;
    } else {
      // Extensibility: unknown types get their own bucket rather than being silently dropped
      counts[m.type] = (counts[m.type] ?? 0) + 1;
    }
  }
  return counts;
}
