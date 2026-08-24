import { CheckCircle2Icon, FileCodeIcon, FileSearchIcon, SearchIcon } from "lucide-react";
import type { FormEvent } from "react";

import SessionComposer from "@/components/app/pages/sessions/session/composer";
import StyledResizablePanel from "@/components/app/panels/styled/panel";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle
} from "@/components/shadcn/ui/attachment";
import { Bubble, BubbleContent } from "@/components/shadcn/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/shadcn/ui/marker";
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader
} from "@/components/shadcn/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport
} from "@/components/shadcn/ui/message-scroller";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle
} from "@/components/shadcn/ui/questionnaire";

const clarificationItems = [
  {
    choices: [{ value: "session" }, { value: "composer" }, { value: "workspace" }],
    name: "scope",
    required: true
  },
  {
    choices: [{ value: "balanced" }, { value: "desktop" }, { value: "mobile" }],
    name: "priority",
    required: true
  }
] as const;

function handleClarificationSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

export default function SessionPanel() {
  return (
    <StyledResizablePanel
      id="session"
      defaultSize="50%"
      className="flex min-h-0 flex-col gap-3 overflow-hidden"
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageScrollerProvider defaultScrollPosition="end">
          <MessageScroller>
            <MessageScrollerViewport className="scroll-fade-y! scrollbar-none! [--scroll-fade-mask:var(--scroll-fade-block)]!">
              <MessageScrollerContent className="px-1 py-3">
                <MessageScrollerItem messageId="today">
                  <Marker variant="separator">
                    <MarkerContent>Today</MarkerContent>
                  </Marker>
                </MessageScrollerItem>

                <MessageScrollerItem messageId="request" scrollAnchor>
                  <Message align="end">
                    <MessageContent>
                      <MessageHeader>You</MessageHeader>
                      <Bubble align="end">
                        <BubbleContent>
                          Turn the session panel into a convincing coding-agent workspace. Show what
                          the agent inspected, summarize the approach, and pause when product
                          direction is ambiguous.
                        </BubbleContent>
                      </Bubble>
                      <Attachment state="done" size="sm">
                        <AttachmentMedia variant="icon">
                          <FileCodeIcon />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>session-panel-notes.md</AttachmentTitle>
                          <AttachmentDescription>Markdown · 2.1 KB</AttachmentDescription>
                        </AttachmentContent>
                      </Attachment>
                      <MessageFooter>Sent just now</MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>

                <MessageScrollerItem messageId="workspace-search">
                  <Marker>
                    <MarkerIcon>
                      <SearchIcon />
                    </MarkerIcon>
                    <MarkerContent>Explored the web workspace and session route</MarkerContent>
                  </Marker>
                </MessageScrollerItem>

                <MessageScrollerItem messageId="files-read">
                  <Marker>
                    <MarkerIcon>
                      <FileSearchIcon />
                    </MarkerIcon>
                    <MarkerContent>
                      Read panel.tsx, composer.tsx, architecture.md, and the recent session commit
                    </MarkerContent>
                  </Marker>
                </MessageScrollerItem>

                <MessageScrollerItem messageId="investigation">
                  <Message>
                    <MessageContent>
                      <MessageHeader>Agent</MessageHeader>
                      <Bubble variant="ghost">
                        <BubbleContent className="flex flex-col gap-2">
                          <p>
                            I found a fixed-height resizable workspace with a working Lexical
                            composer, but the session panel is still a placeholder. The safest path
                            is to keep the composer pinned below a dedicated transcript scroller and
                            build the showcase entirely from the chat primitives.
                          </p>
                          <p>
                            One product choice remains: the request could mean polishing only this
                            transcript, extending the composer controls, or treating the full
                            workspace as part of the pass.
                          </p>
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>

                <MessageScrollerItem messageId="investigation-complete">
                  <Marker>
                    <MarkerIcon>
                      <CheckCircle2Icon />
                    </MarkerIcon>
                    <MarkerContent>Investigation complete · clarification needed</MarkerContent>
                  </Marker>
                </MessageScrollerItem>

                <MessageScrollerItem messageId="clarification">
                  <Message>
                    <MessageContent>
                      <MessageHeader>Agent</MessageHeader>
                      <Bubble variant="outline" className="mx-auto w-full max-w-xl">
                        <BubbleContent className="w-full p-3">
                          <Questionnaire
                            defaultItem="scope"
                            items={clarificationItems}
                            shortcuts="letters"
                            onSubmit={handleClarificationSubmit}
                          >
                            <QuestionnaireProgress />
                            <QuestionnaireItem name="scope" required>
                              <QuestionnaireTitle>
                                How broad should this pass be?
                              </QuestionnaireTitle>
                              <QuestionnaireDescription>
                                I can keep the change focused or carry the visual treatment into
                                adjacent surfaces.
                              </QuestionnaireDescription>
                              <QuestionnaireChoices>
                                <QuestionnaireChoice value="session">
                                  <span className="font-medium">Session transcript only</span>
                                  <QuestionnaireChoiceDescription>
                                    Preserve the composer and surrounding workspace as-is.
                                  </QuestionnaireChoiceDescription>
                                </QuestionnaireChoice>
                                <QuestionnaireChoice value="composer">
                                  <span className="font-medium">Transcript and composer</span>
                                  <QuestionnaireChoiceDescription>
                                    Add model, attachment, and send controls to the prompt surface.
                                  </QuestionnaireChoiceDescription>
                                </QuestionnaireChoice>
                                <QuestionnaireChoice value="workspace">
                                  <span className="font-medium">Full workspace pass</span>
                                  <QuestionnaireChoiceDescription>
                                    Coordinate the session, views, and terminal panels.
                                  </QuestionnaireChoiceDescription>
                                </QuestionnaireChoice>
                              </QuestionnaireChoices>
                              <QuestionnaireError />
                            </QuestionnaireItem>
                            <QuestionnaireItem name="priority" required>
                              <QuestionnaireTitle>
                                Which viewport should lead the design?
                              </QuestionnaireTitle>
                              <QuestionnaireDescription>
                                The layout will remain responsive, but one target can drive density
                                and hierarchy.
                              </QuestionnaireDescription>
                              <QuestionnaireChoices>
                                <QuestionnaireChoice value="balanced">
                                  <span className="font-medium">Balanced responsive</span>
                                  <QuestionnaireChoiceDescription>
                                    Optimize for the resizable desktop layout without crowding
                                    mobile.
                                  </QuestionnaireChoiceDescription>
                                </QuestionnaireChoice>
                                <QuestionnaireChoice value="desktop">
                                  <span className="font-medium">Desktop density</span>
                                  <QuestionnaireChoiceDescription>
                                    Favor more visible context and compact controls.
                                  </QuestionnaireChoiceDescription>
                                </QuestionnaireChoice>
                                <QuestionnaireChoice value="mobile">
                                  <span className="font-medium">Mobile clarity</span>
                                  <QuestionnaireChoiceDescription>
                                    Favor larger targets and a simpler information hierarchy.
                                  </QuestionnaireChoiceDescription>
                                </QuestionnaireChoice>
                              </QuestionnaireChoices>
                              <QuestionnaireError />
                            </QuestionnaireItem>
                            <QuestionnaireActions>
                              <QuestionnairePrevious />
                              <QuestionnaireNext />
                              <QuestionnaireSubmit>Continue</QuestionnaireSubmit>
                            </QuestionnaireActions>
                          </Questionnaire>
                        </BubbleContent>
                      </Bubble>
                      <MessageFooter>Waiting for your answer</MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      <div className="shrink-0">
        <SessionComposer />
      </div>
    </StyledResizablePanel>
  );
}
