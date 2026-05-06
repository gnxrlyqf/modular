import type { Module } from "../Scene/Modules";

type PortPoint = { x: number; y: number };
type ModulePorts = Partial<Record<string, PortPoint>>;
const EDGE_INSET = 3;

function getAnchorPointFromRect(
  rect: DOMRect,
  side: string | null,
  moduleRect?: DOMRect
): PortPoint {
  if (side === "left") {
    return {
      x: moduleRect ? moduleRect.left + EDGE_INSET : rect.left,
      y: rect.top + rect.height / 2,
    };
  }

  if (side === "right") {
    return {
      x: moduleRect ? moduleRect.right - EDGE_INSET : rect.right,
      y: rect.top + rect.height / 2,
    };
  }

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function getModulePortViewportCoordinates(
  module: Module,
  camera: { x: number; y: number },
  portOffsets: Record<Module["type"], ModulePorts>
) {
  const modulePorts = portOffsets[module.type] ?? {};
  const moduleElement =
    typeof document !== "undefined"
      ? document.querySelector<HTMLElement>(`[data-module-id="${module.id}"]`)
      : null;
  const moduleRect = moduleElement?.getBoundingClientRect();

  const moduleOrigin = moduleElement
    ? {
        x: moduleRect ? moduleRect.left : moduleElement.getBoundingClientRect().left,
        y: moduleRect ? moduleRect.top : moduleElement.getBoundingClientRect().top,
      }
    : {
        x: module.x + camera.x,
        y: module.y + camera.y,
      };

  const ports = Object.entries(modulePorts).reduce<Record<string, PortPoint>>((acc, [port, offset]) => {
    if (!offset) {
      return acc;
    }

    const portElement =
      typeof document !== "undefined"
        ? document.querySelector<HTMLElement>(`[data-port-id="${module.id}.${port}"]`)
        : null;

    if (portElement) {
      const rect = portElement.getBoundingClientRect();
      const side = portElement.getAttribute("data-port-side");
      acc[port] = getAnchorPointFromRect(rect, side, moduleRect);
      return acc;
    }

    acc[port] = {
      x: moduleOrigin.x + offset.x,
      y: moduleOrigin.y + offset.y,
    };

    return acc;
  }, {});

  return {
    moduleId: module.id,
    type: module.type,
    ports,
  };
}

function getAllPortViewportCoordinates(
  modules: Module[],
  camera: { x: number; y: number },
  portOffsets: Record<Module["type"], ModulePorts>
) {
  return modules.map((module) => getModulePortViewportCoordinates(module, camera, portOffsets));
}

export type { PortPoint, ModulePorts };
export { getModulePortViewportCoordinates, getAllPortViewportCoordinates };
