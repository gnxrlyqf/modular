import { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Cable } from "./Scene/Scene";
import { audioContext } from "./Scene/Scene";

export type ConnectionMode = "idle" | "selecting-source" | "selecting-target";

interface ConnectionState {
  source: string | null;
  target: string | null;
  id: string | null;
  mode: ConnectionMode;
  selectSource: (id: string, param: string) => void;
  selectTarget: (id: string, param: string) => void;
  isPortConnected: (portId: string) => boolean;
  reset: () => void;
}

const ConnectionContext = createContext<ConnectionState | undefined>(undefined);

export const ConnectionProvider = (props: { children: React.ReactNode; setCables: React.Dispatch<React.SetStateAction<Cable[]>>; cables: Cable[] }) => {
  const [source, setSource] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [mode, setMode] = useState<ConnectionMode>("idle");

  const selectSource = (id: string, param: string) => {
    setId(id);
    setSource(`${id}.${param}`);
    setMode("selecting-source");
  };

  const selectTarget = (id: string, param: string) => {
    setId(id);
    setTarget(`${id}.${param}`);
    setMode("selecting-target");
  };

  const reset = () => {
    setId(null);
    setSource(null);
    setTarget(null);
    setMode("idle");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        reset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (source && target) {
      props.setCables((prev) => {
        const cable = {id: uuidv4(), from: source, to: target};

        if (prev.find(obj => obj.from === cable.from && obj.to === cable.to))
          return prev;

        audioContext.addCable(cable);
        return [...prev, {id: uuidv4(), from: source, to: target}]
      });
      reset();
    }
  }, [source, target]);

  const connectedPorts = new Set(props.cables.flatMap((cable) => [cable.from, cable.to]));
  const isPortConnected = (portId: string) => connectedPorts.has(portId);

  return (
    <ConnectionContext.Provider value={{ source, target, id, mode, selectSource, selectTarget, isPortConnected, reset }}>
      {props.children}
    </ConnectionContext.Provider>
  );
};

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be used within ConnectionProvider");
  return ctx;
}
