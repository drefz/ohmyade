import RootLayout from "@/components/app/pages/root/layout";
import { PanelVisibilityProvider } from "@/components/app/panels/provider";
import { ThemeProvider } from "@/components/app/theme/provider";
import { TooltipProvider } from "@/components/shadcn/ui/tooltip";

export default function RouteComponent() {
  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <PanelVisibilityProvider>
            <RootLayout />
          </PanelVisibilityProvider>
        </TooltipProvider>
      </ThemeProvider>
      {/*<TanStackRouterDevtools  />*/}
    </>
  );
}
