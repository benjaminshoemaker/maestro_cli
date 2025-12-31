"use client";

import { useMemo } from "react";
import type { Message } from "ai";

import { ChatInput } from "./ChatInput";
import type { ChatMessage } from "./MessageList";
import { MessageList } from "./MessageList";
import { DoneButton } from "./DoneButton";
import { PhaseIndicator } from "./PhaseIndicator";
import { useSessionChat } from "../../hooks/useSessionChat";

type ChatContainerProps = {
  sessionId: string;
  phase: 1 | 2 | 3 | 4;
  projectName: string;
  completedPhases: Array<1 | 2 | 3 | 4>;
  callbackPort?: number;
  sessionToken?: string;
  onPhaseComplete?: (nextPhase: number | null) => void;
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
      }));
  }, [chat.messages]);

  const isAssistantTyping = Boolean(chat.isLoading);
  const isSubmitting = Boolean(chat.isLoadingHistory || isAssistantTyping);

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-6 py-8"
      data-testid="chat-container"
    >
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Session {sessionId}
            </p>
            <h1
              className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl"
              data-testid="chat-header-project-name"
            >
              {projectName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <DoneButton
              sessionId={sessionId}
              phase={phase}
              callbackPort={callbackPort}
              sessionToken={sessionToken}
              onComplete={onPhaseComplete}
            />
          </div>
        </div>
        <PhaseIndicator currentPhase={phase} completedPhases={completedPhases} />
      </header>

      <div
        className="flex-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4"
        data-testid="chat-message-scroll-area"
      >
        {chat.historyError ? (
          <p className="text-sm text-rose-700">
            Could not load chat history. Refresh the page and try again.
          </p>
        ) : chat.isLoadingHistory && messages.length === 0 ? (
          <p className="text-sm text-neutral-500">Loading messages…</p>
        ) : messages.length ? (
          <MessageList messages={messages} isAssistantTyping={isAssistantTyping} />
        ) : (
          <p className="text-sm text-neutral-500">
            Start by answering the questions. Your responses will be used to generate the document.
          </p>
        )}
      </div>

      <div
        className="sticky bottom-0 bg-white py-4"
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
