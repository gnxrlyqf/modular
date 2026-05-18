import { useState, useEffect, useCallback } from "react";

export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    // Listen for clicks and our custom "global close" signal
    window.addEventListener("mousedown", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("closeAllModuleMenus", close);

    return () => {
      window.addEventListener("mousedown", close);
      window.addEventListener("contextmenu", close);
      window.removeEventListener("closeAllModuleMenus", close);
    };
  }, [close]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Force all other modules to close their menus
    window.dispatchEvent(new CustomEvent("closeAllModuleMenus"));

    // 2. Wait for the next tick to open this specific menu.
    // This prevents the current module from closing its own menu 
    // immediately after opening it.
    // Use viewport coordinates so menus can render in a top-level portal.
    const x = e.clientX;
    const y = e.clientY;
    requestAnimationFrame(() => {
      setMenu({ x, y });
    });
  };

  return { menu, handleContextMenu };
}