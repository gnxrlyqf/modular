import { wouldOverlap } from "../Utils/wouldOverlap";

type DragProps = {
  x: number;
  y: number;
  cameraX: number;
  cameraY: number;
};

const GRID_SIZE = 16;

export function useDrag(
    props: DragProps,
    position: { x: number; y: number },
    setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
    moduleRef: React.RefObject<HTMLDivElement | null>) {
  return (e: React.MouseEvent<HTMLDivElement>) => {
    if (!moduleRef || !moduleRef.current) return;

    const start = position ?? { x: props.x, y: props.y };
    const offsetX = e.clientX - props.cameraX - start.x;
    const offsetY = e.clientY - props.cameraY - start.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const worldX = moveEvent.clientX - props.cameraX - offsetX;
      const worldY = moveEvent.clientY - props.cameraY - offsetY;

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