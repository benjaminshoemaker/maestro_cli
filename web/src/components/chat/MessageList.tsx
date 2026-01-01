import { useEffect, useRef } from "react";

import { AssistantMessage } from "./AssistantMessage";
import { LoadingIndicator } from "./LoadingIndicator";
import { UserMessage } from "./UserMessage";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

type MessageListProps = {
  messages: ChatMessage[];
  isAssistantTyping?: boolean;
};

type MessageGroup = {
  role: "user" | "assistant";
  messages: ChatMessage[];
};

function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.role === message.role) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        role: message.role,
        messages: [message],
      });
    }
  }

  return groups;
}

export function MessageList({ messages, isAssistantTyping }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = endRef.current;
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [messages.length, isAssistantTyping]);

  const groups = groupMessages(messages);

  return (
    <div className="flex flex-col gap-6" role="log" aria-label="Chat messages">
      {groups.map((group, groupIndex) => (
        <div
          key={`group-${groupIndex}`}
          className={`flex flex-col gap-2 ${
            group.role === "user" ? "items-end" : "items-start"
          }`}
        >
          {group.messages.map((message, messageIndex) => {
            // Only show timestamp on the last message in a group
            const showTimestamp = messageIndex === group.messages.length - 1;

            if (message.role === "user") {
              return (
                <UserMessage
                  key={message.id}
                  content={message.content}
                  timestamp={showTimestamp ? message.timestamp : undefined}
                />
              );
            }

            return (
              <AssistantMessage
                key={message.id}
                content={message.content}
                timestamp={showTimestamp ? message.timestamp : undefined}
              />
            );
          })}
        </div>
      ))}

      {isAssistantTyping ? <LoadingIndicator /> : null}

      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
