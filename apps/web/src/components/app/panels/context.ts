import { createContext, useContext } from "react";

export type PanelId = "sidebar" | "terminal" | "views";

export type PanelVisibility = Record<PanelId, boolean>;

type PanelVisibilityContextValue = {
  visibility: PanelVisibility;
  togglePanel: (panel: PanelId) => void;
};

export const PanelVisibilityContext = createContext<PanelVisibilityContextValue | null>(null);

export function usePanelVisibility() {
  const context = useContext(PanelVisibilityContext);

  if (!context) {
    throw new Error("usePanelVisibility must be used within a PanelVisibilityProvider");
  }

  return context;
}
