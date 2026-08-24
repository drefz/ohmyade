import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import GitHubBlack from "@/assets/GitHub_Black.svg";
import GitHubWhite from "@/assets/GitHub_White.svg";
import { ThemeToggle } from "@/components/app/theme/toggle";
import { Button } from "@/components/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/ui/tooltip";

function GitHubIcon() {
  return (
    <a href="https://github.com/drefz/ohmyade" target="_blank">
      <img alt="" className="size-4 dark:hidden" src={GitHubBlack} />
      <img alt="" className="hidden size-4 dark:block" src={GitHubWhite} />
    </a>
  );
}

export default function FooterBar() {
  return (
    <div className="text-muted-foreground flex h-9 items-center justify-between">
      <div>
        <Tooltip>
          <TooltipTrigger>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open settings</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon">
              <ThemeToggle />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Set theme</TooltipContent>
        </Tooltip>
      </div>
      <div>
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon">
              <GitHubIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View source code</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
