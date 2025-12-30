"use client";

import { useEffect, useState } from "react";
import { useChat } from "ai/react";
import type { Message } from "ai";

type UseSessionChatOptions = {
  sessionId: string;
  phase: 1 | 2 | 3 | 4;
};

type ChatHistoryResponse = {
  messages: Message[];
};

export function useSessionChat({ sessionId, phase }: UseSessionChatOptions) {
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<Error | undefined>(undefined);

  const chat = useChat({
    api: "/api/chat",
    body: { sessionId, phase },
  });

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingHistory(true);
    setHistoryError(undefined);

    fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}&phase=${phase}`, {
      method: "GET",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body: any = await response.json().catch(() => null);
          throw new Error(body?.error ?? `Request failed with status ${response.status}`);
        }
        return (await response.json()) as ChatHistoryResponse;
      })
      .then((data) => {
        chat.setMessages(data.messages ?? []);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setHistoryError(error instanceof Error ? error : new Error("Unknown error"));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoadingHistory(false);
      });

    return () => {
      controller.abort();
    };
  }, [sessionId, phase, chat.setMessages]);

  return {
    ...chat,
    isLoadingHistory,
    historyError,
  };
}

