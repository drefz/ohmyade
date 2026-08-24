import { Button } from "@/components/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/ui/tooltip";
import type { HeaderBarButton } from "@/types";

export default function HeaderButtonGroup({ buttons }: { buttons: HeaderBarButton[] }) {
  return (
    <div className="flex items-center">
      {buttons.map(({ label, icon: Icon, pressed, onClick }) => (
        <Tooltip key={label}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={label}
                aria-pressed={pressed}
                onClick={onClick}
              />
            }
          >
            <Icon />
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
