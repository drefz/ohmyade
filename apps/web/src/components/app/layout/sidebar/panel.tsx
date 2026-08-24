import SidebarProjects from "@/components/app/layout/sidebar/projects";
import SidebarSearch from "@/components/app/layout/sidebar/search";
import SidebarSessions from "@/components/app/layout/sidebar/sessions";
import StyledResizablePanel from "@/components/app/panels/styled/panel";

export default function SidebarPanel() {
  return (
    <StyledResizablePanel
      id="sidebar"
      defaultSize="20%"
      className="flex flex-col items-center gap-2"
    >
      <SidebarSearch />
      <SidebarProjects />
      <SidebarSessions />
    </StyledResizablePanel>
  );
}
