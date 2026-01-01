type UserMessageProps = {
  content: string;
  timestamp?: string;
};

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function UserMessage({ content, timestamp }: UserMessageProps) {
  return (
    <div className="flex flex-col items-end gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className="message-user"
        data-testid="user-message"
      >
        {content}
      </div>
      {timestamp ? (
        <span className="px-1 text-[10px] text-muted">{formatTime(timestamp)}</span>
      ) : null}
    </div>
  );
}
