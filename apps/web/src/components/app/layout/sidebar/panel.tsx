import SidebarProjects from "@/components/app/layout/sidebar/projects";
import SidebarSearch from "@/components/app/layout/sidebar/search";
import SidebarSessions from "@/components/app/layout/sidebar/sessions";
import StyledResizablePanel from "@/components/app/panels/styled/panel";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport
} from "@/components/shadcn/ui/message-scroller";

export default function SidebarPanel() {
  return (
    <StyledResizablePanel
      id="sidebar"
      defaultSize="20%"
      className="flex min-h-0 flex-col items-center gap-2 overflow-hidden"
    >
      <SidebarSearch />
      <SidebarProjects />
      <div className="min-h-0 w-full flex-1 overflow-hidden">
        <MessageScrollerProvider defaultScrollPosition="start">
          <MessageScroller>
            <MessageScrollerViewport className="scroll-fade-y! scrollbar-none! [--scroll-fade-mask:var(--scroll-fade-block)]!">
              <MessageScrollerContent className="gap-2">
                <SidebarSessions />
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>
    </StyledResizablePanel>
  );
}
