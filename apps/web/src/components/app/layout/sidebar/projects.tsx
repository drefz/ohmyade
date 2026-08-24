import { Folder, FolderPlus } from "lucide-react";

import { Button } from "@/components/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/shadcn/ui/select";

const items = [{ label: "All projects", value: null }];

export default function SidebarProjects() {
  return (
    <div className="flex w-full items-center justify-between">
      <Button size="icon" variant="ghost" disabled className="text-muted-foreground opacity-100!">
        <Folder />
      </Button>
      <Select items={items}>
        <SelectTrigger className="w-full border-none! bg-transparent!">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" className="text-muted-foreground">
        <FolderPlus />
      </Button>
    </div>
  );
}
