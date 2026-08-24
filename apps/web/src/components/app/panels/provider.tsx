import { useState, type ReactNode } from "react";

import {
  PanelVisibilityContext,
  type PanelId,
  type PanelVisibility
} from "@/components/app/panels/context";

export function PanelVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibility] = useState<PanelVisibility>({
    sidebar: true,
    terminal: false,
    views: false
  });

  const togglePanel = (panel: PanelId) => {
    setVisibility((current) => ({ ...current, [panel]: !current[panel] }));
  };

  return (
    <PanelVisibilityContext.Provider value={{ visibility, togglePanel }}>
      {children}
    </PanelVisibilityContext.Provider>
  );
}
