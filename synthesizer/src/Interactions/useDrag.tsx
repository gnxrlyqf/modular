import type { Dispatch, SetStateAction, RefObject, MouseEvent as RMouseEvent } from "react";
import { useLiveCamera } from "../Viewport/CameraContext";
import { wouldOverlap } from "../Utils/wouldOverlap";

type DragProps = {
  x: number;
  y: number;
};

const GRID_SIZE = 16;

export function useDrag(
  props: DragProps,
  position: { x: number; y: number },
  setPosition: Dispatch<SetStateAction<{ x: number; y: number }>>,
  moduleRef: RefObject<HTMLDivElement | null>
) {
  const camera = useLiveCamera();

  return (e: RMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // left-click only

    const { x: camX, y: camY, scale } = camera;
    const start = position ?? { x: props.x, y: props.y };

    // Convert screen drag-start to world space
    const offsetX = (e.clientX - camX) / scale - start.x;
    const offsetY = (e.clientY - camY) / scale - start.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Camera ref is live — always current even if user zoomed between mousedown and move
      const { x: cx, y: cy, scale: sc } = camera;
      const worldX = (moveEvent.clientX - cx) / sc - offsetX;
      const worldY = (moveEvent.clientY - cy) / sc - offsetY;

      const snappedX = Math.round(worldX / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(worldY / GRID_SIZE) * GRID_SIZE;

      setPosition((prev) => {
        if (!moduleRef.current || wouldOverlap(snappedX, snappedY, moduleRef.current)) {
          return prev ?? start;
        }
        return { x: snappedX, y: snappedY };
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  };
}
