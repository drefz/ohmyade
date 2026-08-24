import type { ComponentProps } from "react";

import { cn } from "@/components/shadcn/lib/utils";
import { ResizablePanel } from "@/components/shadcn/ui/resizable";

type PanelProps = ComponentProps<typeof ResizablePanel>;

export default function StyledResizablePanel({ className, children, ...props }: PanelProps) {
  return (
    <ResizablePanel className={cn("rounded-lg border p-4", className)} {...props}>
      {children}
    </ResizablePanel>
  );
}
