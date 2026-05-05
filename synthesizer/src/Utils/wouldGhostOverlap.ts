import type { Module } from "../Scene/Modules";

const MODULE_GAP = 16;

type ModuleSizeMap = Record<Module["type"], { w: number; h: number }>;

export function wouldGhostOverlap(
  modules: Module[],
  moduleSizes: ModuleSizeMap,
  type: Module["type"],
  x: number,
  y: number
): boolean {
  const ghostSize = moduleSizes[type];

  return modules.some((m) => {
    const moduleSize = moduleSizes[m.type];

    return (
      x < m.x + moduleSize.w + MODULE_GAP &&
      x + ghostSize.w + MODULE_GAP > m.x &&
      y < m.y + moduleSize.h + MODULE_GAP &&
      y + ghostSize.h + MODULE_GAP > m.y
    );
  });
}
