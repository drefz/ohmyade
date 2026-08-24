import { Outlet } from "@tanstack/react-router";

import FooterBar from "@/components/app/layout/footer/bar";
import HeaderBar from "@/components/app/layout/header/bar";
import SidebarPanel from "@/components/app/layout/sidebar/panel";
import { usePanelVisibility } from "@/components/app/panels/context";
import StyledResizableHandle from "@/components/app/panels/styled/handle";
import { ResizablePanelGroup } from "@/components/shadcn/ui/resizable";

export default function RootLayout() {
  const { visibility } = usePanelVisibility();

  return (
    <main className="flex h-dvh w-dvw flex-col overflow-hidden px-2">
      <HeaderBar />
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {visibility.sidebar && (
          <>
            <SidebarPanel />
            <StyledResizableHandle orientation="vertical" />
          </>
        )}
        <Outlet />
      </ResizablePanelGroup>
      <FooterBar />
    </main>
  );
}
