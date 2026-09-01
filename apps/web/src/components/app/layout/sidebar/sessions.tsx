import { Link } from "@tanstack/react-router";

import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/shadcn/ui/item";
import { MessageScrollerItem } from "@/components/shadcn/ui/message-scroller";
const demoSession = {
  project: "Demo-Project/",
  age: "56m",
  title: "Demo Session",
  id: "4324123-234234-2342342"
};

const demoSessions = Array.from({ length: 20 }, () => ({ ...demoSession }));

export default function SidebarSessions() {
  return demoSessions.map((session, index) => {
    const messageId = `${session.id}-${index}`;

    return (
      <MessageScrollerItem key={messageId} messageId={messageId}>
        <Link to="/$session" params={{ session: session.id }}>
          <Item className="hover:border-accent cursor-pointer" variant="outline">
            <ItemContent>
              <ItemTitle className="text-muted-foreground w-full">
                <p className="flex w-full justify-between">
                  <span>{session.project}</span>
                  <span>{session.age}</span>
                </p>
              </ItemTitle>
              <ItemDescription className="text-foreground text-sm">{session.title}</ItemDescription>
            </ItemContent>
          </Item>
        </Link>
      </MessageScrollerItem>
    );
  });
}
