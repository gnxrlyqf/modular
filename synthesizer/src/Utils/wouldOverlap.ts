import type { ModuleProps } from "../Modules/Modules";

export function wouldOverlap(nextX: number, nextY: number, self: HTMLDivElement) {
  const width = self.offsetWidth;
  const height = self.offsetHeight;
  const modules = document.querySelectorAll<HTMLDivElement>('[data-patch-module="true"]');

  for (const other of modules) {
    if (other === self) {
      continue;
    }

    const otherLeft = Number.parseFloat(other.style.left || "0") || other.offsetLeft;
    const otherTop = Number.parseFloat(other.style.top || "0") || other.offsetTop;
    const otherRight = otherLeft + other.offsetWidth;
    const otherBottom = otherTop + other.offsetHeight;

    // Use real bounds here; snapping already keeps modules on the grid.
    const intersects =
      nextX < otherRight &&
      nextX + width > otherLeft &&
      nextY < otherBottom &&
      nextY + height > otherTop;

    if (intersects) {
      return true;
    }
  }

  return false;
}

export function moveModule(
  props: ModuleProps,
  ref: React.RefObject<HTMLDivElement | null>,
  position: {x: number; y: number} | null,
  setPosition: React.Dispatch<React.SetStateAction<{x: number; y: number} | null>>,
  e: React.MouseEvent<HTMLDivElement>
  ) {
    if (!ref.current)
      return;

    const start = position ?? { x: props.x, y: props.y };
    const offsetX = e.clientX - props.cameraX - start.x;
    const offsetY = e.clientY - props.cameraY - start.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const worldX = moveEvent.clientX - props.cameraX - offsetX;
      const worldY = moveEvent.clientY - props.cameraY - offsetY;
      const snappedX = Math.round(worldX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(worldY / GRID_SIZE) * GRID_SIZE;

      setPosition((prev) => {
        if (!ref.current || wouldOverlap(snappedX, snappedY, ref.current)) {
          return prev ?? start;
        }

        return {
          x: snappedX,
          y: snappedY,
        };
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
}