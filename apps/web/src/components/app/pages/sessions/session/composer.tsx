import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";

import { Card, CardContent } from "@/components/shadcn/ui/card";

function onError(error: Error) {
  console.error(error);
}

export default function SessionComposer() {
  const initialConfig = {
    namespace: "session-composer",
    onError
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Card className="focus-within:ring-ring/30 transition-shadow focus-within:ring-2">
        <CardContent>
          <div className="relative">
            <PlainTextPlugin
              contentEditable={
                <ContentEditable
                  aria-placeholder="Ask anything..."
                  className="max-h-48 min-h-20 scrollbar-none overflow-y-auto text-sm wrap-break-word whitespace-pre-wrap outline-none"
                  placeholder={
                    <div className="text-muted-foreground pointer-events-none absolute top-0 left-0 text-sm">
                      Ask anything...
                    </div>
                  }
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </CardContent>
      </Card>
      <HistoryPlugin />
      <AutoFocusPlugin />
    </LexicalComposer>
  );
}
