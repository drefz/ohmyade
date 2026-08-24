import SessionPanel from "@/components/app/pages/sessions/session/panel";
import TerminalPanel from "@/components/app/pages/sessions/terminal/panel";
import ViewsPanel from "@/components/app/pages/sessions/views/panel";
import { usePanelVisibility } from "@/components/app/panels/context";
import StyledResizableHandle from "@/components/app/panels/styled/handle";
import { ResizablePanel, ResizablePanelGroup } from "@/components/shadcn/ui/resizable";

export default function RouteComponent() {
  const { visibility } = usePanelVisibility();

  return (
    <>
      <ResizablePanel id="content" defaultSize="80%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel id="workspace">
            <ResizablePanelGroup orientation="horizontal">
              <SessionPanel />
              {visibility.views && (
                <>
                  <StyledResizableHandle orientation="vertical" />
                  <ViewsPanel />
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
          {visibility.terminal && (
            <>
              <StyledResizableHandle orientation="horizontal" />
              <TerminalPanel />
            </>
          )}
        </ResizablePanelGroup>
      </ResizablePanel>
    </>
  );
}
