import { Search, SquarePen } from "lucide-react";

import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";

export default function SidebarSearch() {
  return (
    <div className="flex w-full items-center justify-between">
      <Button size="icon" variant="ghost" disabled className="text-muted-foreground opacity-100!">
        <Search />
      </Button>
      <Input placeholder="Search" className="border-none! bg-transparent!" />
      <Button size="icon" variant="ghost" className="text-muted-foreground">
        <SquarePen />
      </Button>
    </div>
  );
}
