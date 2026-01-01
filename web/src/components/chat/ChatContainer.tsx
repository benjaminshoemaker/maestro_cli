"use client";

import { useMemo } from "react";
import type { Message } from "ai";

import { ChatInput } from "./ChatInput";
import type { ChatMessage } from "./MessageList";
import { MessageList } from "./MessageList";
import { DoneButton } from "./DoneButton";
import { PhaseIndicator } from "./PhaseIndicator";
import { useSessionChat } from "../../hooks/useSessionChat";
import { ThemeToggle } from "../ThemeToggle";
import { SkeletonMessageList, SkeletonPhaseIndicator } from "../Skeleton";

type ChatContainerProps = {
  sessionId: string;
  phase: 1 | 2 | 3 | 4;
  projectName: string;
  completedPhases: Array<1 | 2 | 3 | 4>;
  callbackPort?: number;
  sessionToken?: string;
  onPhaseComplete?: (nextPhase: number | null) => void;
};

const PHASE_PROMPTS: Record<1 | 2 | 3 | 4, string> = {
  1: "Tell me about the product you want to build. What problem does it solve? Who is it for?",
  2: "Let's discuss the technical architecture. What technologies and patterns should we use?",
  3: "Now let's create an implementation plan. How should we break this down into tasks?",
  4: "Finally, let's generate the AGENTS.md file to guide AI coding assistants working on your project.",
};

export function ChatContainer({
  sessionId,
  phase,
  projectName,
  completedPhases,
  callbackPort,
  sessionToken,
  onPhaseComplete,
}: ChatContainerProps) {
  const chat = useSessionChat({ sessionId, phase });

  function isRenderableMessage(message: Message): message is Message & { role: "user" | "assistant" } {
    return message.role === "user" || message.role === "assistant";
  }

  const messages = useMemo<ChatMessage[]>(() => {
    return (chat.messages ?? [])
      .filter(isRenderableMessage)
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString(), // In real app, this would come from the message
      }));
  }, [chat.messages]);

  const isAssistantTyping = Boolean(chat.isLoading);
  const isSubmitting = Boolean(chat.isLoadingHistory || isAssistantTyping);

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8"
      data-testid="chat-container"
    >
      {/* Header */}
      <header className="flex flex-col gap-4 page-enter">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Session {sessionId.slice(0, 8)}...
            </p>
            <h1
              className="text-balance font-serif text-2xl font-semibold tracking-tight text-primary sm:text-3xl"
              data-testid="chat-header-project-name"
            >
              {projectName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DoneButton
              sessionId={sessionId}
              phase={phase}
              callbackPort={callbackPort}
              sessionToken={sessionToken}
              onComplete={onPhaseComplete}
            />
          </div>
        </div>

        {chat.isLoadingHistory ? (
          <SkeletonPhaseIndicator />
        ) : (
          <PhaseIndicator currentPhase={phase} completedPhases={completedPhases} />
        )}
      </header>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface-secondary/50 p-4 sm:p-6"
        data-testid="chat-message-scroll-area"
      >
        {chat.historyError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-light">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-error"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-primary">Could not load chat history</p>
              <p className="mt-1 text-sm text-secondary">
                Please refresh the page and try again.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary h-10 px-4 text-sm"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        ) : chat.isLoadingHistory && messages.length === 0 ? (
          <SkeletonMessageList />
        ) : messages.length > 0 ? (
          <MessageList messages={messages} isAssistantTyping={isAssistantTyping} />
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-light">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-accent"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="max-w-sm">
              <h2 className="font-serif text-lg font-semibold text-primary">
                Let&apos;s get started
              </h2>
              <p className="mt-2 text-sm text-secondary">
                {PHASE_PROMPTS[phase]}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        className="sticky bottom-0 bg-surface pb-2 pt-4"
        data-testid="chat-input-area"
      >
        <ChatInput
          isSubmitting={isSubmitting}
          onSubmit={(content) => {
            void chat.append({ role: "user", content });
          }}
        />
      </div>
    </main>
  );
}
