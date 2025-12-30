import { useEffect, useRef } from "react";

import { AssistantMessage } from "./AssistantMessage";
import { LoadingIndicator } from "./LoadingIndicator";
import { UserMessage } from "./UserMessage";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type MessageListProps = {
  messages: ChatMessage[];
  isAssistantTyping?: boolean;
};

export function MessageList({ messages, isAssistantTyping }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = endRef.current;
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "end" });
    }
  }, [messages.length, isAssistantTyping]);

  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => {
        if (message.role === "user") {
          return <UserMessage key={message.id} content={message.content} />;
        }

        return <AssistantMessage key={message.id} content={message.content} />;
      })}
      {isAssistantTyping ? <LoadingIndicator /> : null}
      <div ref={endRef} />
    </div>
  );
}
