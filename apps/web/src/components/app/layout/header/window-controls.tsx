import { Minus, Square, X } from "lucide-react";

import { Button } from "@/components/shadcn/ui/button";
import {
  closeDesktopWindow,
  hasDesktopWindowControls,
  minimizeDesktopWindow,
  toggleDesktopWindowMaximized
} from "@/lib/desktop/window";

type WindowControlsProps = {
  placement: "leading" | "trailing";
};

export default function WindowControls({ placement }: WindowControlsProps) {
  if (!hasDesktopWindowControls()) return null;

  const usesMacControls = navigator.userAgent.includes("Mac");
  if (usesMacControls !== (placement === "leading")) return null;

  // macOS supplies native traffic lights in the overlaid title bar. This inset
  // keeps application actions clear of those controls without duplicating them.
  if (usesMacControls) {
    return <div className="flex h-full w-20" aria-hidden="true" />;
  }

  const runWindowAction = (action: () => Promise<void>) => {
    void action().catch((error: unknown) => {
      console.error("Desktop window action failed", error);
    });
  };

  return (
    <div className="flex h-full items-center" role="group" aria-label="Window controls">
      <Button
        variant="ghost"
        size="icon"
        className="h-full rounded-none"
        aria-label="Minimize window"
        title="Minimize"
        onClick={() => runWindowAction(minimizeDesktopWindow)}
      >
        <Minus />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-full rounded-none"
        aria-label="Toggle window size"
        title="Maximize or restore"
        onClick={() => runWindowAction(toggleDesktopWindowMaximized)}
      >
        <Square className="size-3!" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-destructive dark:hover:bg-destructive h-full rounded-none hover:text-white"
        aria-label="Close window"
        title="Close"
        onClick={() => runWindowAction(closeDesktopWindow)}
      >
        <X />
      </Button>
    </div>
  );
}
