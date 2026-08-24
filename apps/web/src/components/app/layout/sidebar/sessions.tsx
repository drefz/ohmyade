import { Link } from "@tanstack/react-router";

import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/shadcn/ui/item";
const demoSession = {
  project: "Demo-Project/",
  age: "56m",
  title: "Demo Session",
  id: "4324123-234234-2342342"
};

const demoSessions = Array.from({ length: 20 }, () => ({ ...demoSession }));

export default function SidebarSessions() {
  return (
    <div className="scroll-fade-y flex h-full w-full scrollbar-none flex-col gap-2 overflow-auto">
      {demoSessions.map((session, i) => {
        return (
          <Link key={i} to="/$session" params={{ session: session.id }}>
            <Item className="hover:border-accent cursor-pointer" variant="outline">
              <ItemContent>
                <ItemTitle className="text-muted-foreground w-full">
                  <p className="flex w-full justify-between">
                    <span>{session.project}</span>
                    <span>{session.age}</span>
                  </p>
                </ItemTitle>
                <ItemDescription className="text-foreground text-sm">
                  {session.title}
                </ItemDescription>
              </ItemContent>
            </Item>
          </Link>
        );
      })}
    </div>
  );
}
