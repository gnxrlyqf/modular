import { createContext, useContext } from "react";
import type { RefObject, ReactNode } from "react";
import type { Camera } from "./useViewport";

const CameraContext = createContext<RefObject<Camera>>(
  { current: { x: 0, y: 0, scale: 1 } }
);

export function CameraProvider({
  liveRef,
  children,
}: {
  liveRef: RefObject<Camera>;
  children: ReactNode;
}) {
  return (
    <CameraContext.Provider value={liveRef}>
      {children}
    </CameraContext.Provider>
  );
}

export function useLiveCamera(): Camera {
  return useContext(CameraContext).current;
}
