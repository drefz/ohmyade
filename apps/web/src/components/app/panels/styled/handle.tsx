import type { ComponentProps } from "react";

import { cn } from "@/components/shadcn/lib/utils";
import { ResizableHandle, ResizablePanelGroup } from "@/components/shadcn/ui/resizable";

type HandleProps = Pick<ComponentProps<typeof ResizablePanelGroup>, "orientation">;

export default function StyledResizableHandle({ orientation }: HandleProps) {
  return (
    <ResizableHandle
      withHandle
      className={cn(
        orientation === "vertical" ? "px-1" : "py-1",
        "active:bg-accent [&>div]:bg-accent rounded-lg bg-transparent"
      )}
    />
  );
}
