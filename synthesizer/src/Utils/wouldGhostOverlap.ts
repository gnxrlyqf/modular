import type { Module } from "../Scene/Modules";

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
      x < m.x + moduleSize.w &&
      x + ghostSize.w > m.x &&
      y < m.y + moduleSize.h &&
      y + ghostSize.h > m.y
    );
  });
}
