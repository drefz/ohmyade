import { PanelBottom, PanelLeft, PanelRight } from "lucide-react";

import HeaderBreadcrumbs from "@/components/app/layout/header/breadcrumbs";
import HeaderButtonGroup from "@/components/app/layout/header/button-group";
import { HeaderNavigation } from "@/components/app/layout/header/navigation";
import WindowControls from "@/components/app/layout/header/window-controls";
import { usePanelVisibility } from "@/components/app/panels/context";
import type { HeaderBarButton } from "@/types";

export default function HeaderBar() {
  const { visibility, togglePanel } = usePanelVisibility();
  const buttonGroups = {
    leading: [
      {
        label: "Toggle sidebar panel",
        icon: PanelLeft,
        pressed: visibility.sidebar,
        onClick: () => togglePanel("sidebar")
      }
    ],
    trailing: [
      {
        label: "Toggle terminal panel",
        icon: PanelBottom,
        pressed: visibility.terminal,
        onClick: () => togglePanel("terminal")
      },
      {
        label: "Toggle views panel",
        icon: PanelRight,
        pressed: visibility.views,
        onClick: () => togglePanel("views")
      }
    ]
  } satisfies Record<string, HeaderBarButton[]>;

  return (
    <header className="text-muted-foreground relative flex h-9 shrink-0 items-center justify-between">
      <div className="absolute inset-0" data-tauri-drag-region aria-hidden="true" />
      <div className="relative z-10 flex min-w-0 items-center gap-2">
        <div className="flex items-center">
          <WindowControls placement="leading" />
          <HeaderButtonGroup buttons={buttonGroups.leading} />
          <HeaderNavigation />
        </div>
        <HeaderBreadcrumbs />
      </div>
      <div className="relative z-10 flex h-full items-center">
        <HeaderButtonGroup buttons={buttonGroups.trailing} />
        <WindowControls placement="trailing" />
      </div>
    </header>
  );
}
